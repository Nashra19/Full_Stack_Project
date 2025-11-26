// backend/routes/donations.js
const express = require("express");
const Donation = require("../models/donation");
const User = require("../models/user");
const { sendEmail } = require("../utils/email");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const router = express.Router();

// ✅ Middleware to verify token
const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ✅ Create a donation
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { type, items, pickupAddress, contact, category, foodType } = req.body;

    const donation = new Donation({
      donor: req.userId,
      type,
      items,
      pickupAddress,
      contact,
      category: category || 'other',
      foodType: foodType || 'veg',
    });

    await donation.save();
    res.status(201).json(donation);
  } catch (err) {
    console.error("Donation save error:", err);
    res.status(500).json({ error: "Failed to save donation" });
  }
});

// ✅ Get all donations (with filtering)
router.get("/", async (req, res) => {
  try {
    const { city, type } = req.query;
    const filter = {};

    // ✅ FIX: Add type to the filter if it's provided in the query
    if (type) {
      filter.type = type;
    }

    // ✅ FIX: Add city to the filter if it's provided, searching within pickupAddress
    if (city) {
      // Use a case-insensitive regex to find matches for the city name
      filter.pickupAddress = new RegExp(city, 'i');
    }

    const donations = await Donation.find(filter) // Apply the filter object here
      .populate("donor", "name email")
      .populate("claimedBy", "name email phone location")
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch donations" });
  }
});

// Note: Do NOT place dynamic routes like "/:id" above specific routes

// ✅ Delete donation
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid donation id" });
    }
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ error: "Donation not found" });

    if (donation.donor.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await donation.deleteOne();
    res.json({ message: "Donation deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete donation" });
  }
});

// ✅ NEW: Route for an NGO to claim a donation
router.post("/:id/claim", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid donation id" });
    }
    // Atomic conditional update to prevent race conditions
    const updated = await Donation.findOneAndUpdate(
      { _id: req.params.id, $or: [{ status: 'Available' }, { status: { $exists: false } }, { status: null }] },
      { $set: { status: 'Claimed', claimedBy: req.userId, claimedAt: new Date(), confirmationStatus: 'Pending' } },
      { new: true }
    ).populate("donor", "name email");

    if (!updated) {
      return res.status(400).json({ error: "This donation has already been claimed." });
    }

    // Notify donor via email
    try {
      if (updated?.donor?.email) {
        const receiver = await User.findById(req.userId).select("name email phone");
        const emailText = `Hello ${updated.donor.name},\n\nYour donation has been claimed by ${receiver?.name || 'a receiver'}.\nDonation ID: ${updated._id}\nType: ${updated.type}\nItems: ${JSON.stringify(updated.items)}\n\nPlease confirm the claim and choose pickup or delivery in your dashboard.`;
        await sendEmail(updated.donor.email, "Your donation was claimed", emailText);
      }
    } catch (e) {
      // Log and continue
      console.error("Failed to send donor claim email:", e);
    }

    return res.json(updated);
  } catch (err) {
    console.error("Claim donation error:", err);
    return res.status(500).json({ error: "Server error while claiming donation" });
  }
});

// ✅ Donor confirms or rejects claim and selects fulfillment method
router.post("/:id/confirm", authMiddleware, async (req, res) => {
  try {
    const { decision, method } = req.body; // decision: 'Confirmed' | 'Rejected'; method: 'pickup' | 'delivery'
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid donation id" });
    }
    const donation = await Donation.findById(req.params.id).populate("donor", "_id name email");
    if (!donation) return res.status(404).json({ error: "Donation not found" });

    // Only donor can confirm/reject
    if (donation.donor._id.toString() !== req.userId) {
      return res.status(403).json({ error: "Only the donor can confirm or reject this claim" });
    }

    if (!['Confirmed', 'Rejected'].includes(decision)) {
      return res.status(400).json({ error: "Invalid decision" });
    }

    const update = {
      confirmationStatus: decision,
      confirmedAt: new Date(),
    };

    if (decision === 'Confirmed') {
      if (!['pickup', 'delivery'].includes(method)) {
        return res.status(400).json({ error: "Invalid fulfillment method" });
      }
      update.fulfillmentMethod = method;
    } else {
      // Re-open donation if rejected
      update.status = 'Available';
      update.claimedBy = null;
      update.claimedAt = null;
      update.fulfillmentMethod = null;
    }

    const updated = await Donation.findByIdAndUpdate(req.params.id, { $set: update }, { new: true })
      .populate("donor", "name email")
      .populate("claimedBy", "name email");

    // Notify receiver and, if delivery, notify volunteer coordinator
    try {
      if (updated?.claimedBy) {
        const receiver = await User.findById(updated.claimedBy).select("name email");
        if (receiver?.email) {
          const text = decision === 'Confirmed'
            ? `Hello ${receiver.name},\n\nThe donor has confirmed your claim for donation ${updated._id}.\nFulfillment: ${updated.fulfillmentMethod}. The donor will reach out or expect your pickup.\n\nPickup Address: ${updated.pickupAddress}`
            : `Hello ${receiver.name},\n\nThe donor has rejected your claim for donation ${updated._id}. The donation is available again.`;
          await sendEmail(receiver.email, `Donation ${decision.toLowerCase()}`, text);
        }
      }

      if (decision === 'Confirmed' && update.fulfillmentMethod === 'delivery') {
        const volunteerEmail = process.env.VOLUNTEER_COORDINATOR_EMAIL;
        if (volunteerEmail) {
          const donorName = updated?.donor?.name || 'Donor';
          const receiver = await User.findById(updated.claimedBy).select("name email phone");
          const text = `Delivery needed for donation ${updated._id}.\nDonor: ${donorName}\nReceiver: ${receiver?.name} (${receiver?.email})\nPickup Address: ${updated.pickupAddress}`;
          await sendEmail(volunteerEmail, "Delivery request: donation", text);
        }
      }
    } catch (e) {
      console.error("Post-confirmation email error:", e);
    }

    return res.json(updated);
  } catch (err) {
    console.error("Confirm donation error:", err);
    return res.status(500).json({ error: "Server error while confirming donation" });
  }
});

// ✅ Mark donation as collected (by donor or receiver)
router.post("/:id/collected", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid donation id" });
    }
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ error: "Donation not found" });

    // Allow donor or the receiver who claimed it
    const isDonor = donation.donor.toString() === req.userId;
    const isReceiver = donation.claimedBy && donation.claimedBy.toString() === req.userId;
    if (!isDonor && !isReceiver) {
      return res.status(403).json({ error: "Not authorized to mark as collected" });
    }

    donation.status = 'Collected';
    donation.completedAt = new Date();
    await donation.save();

    return res.json(donation);
  } catch (err) {
    console.error("Mark collected error:", err);
    return res.status(500).json({ error: "Server error while marking collected" });
  }
});

// ✅ List claims for current authenticated user
router.get("/my-claims", authMiddleware, async (req, res) => {
  try {
    const claims = await Donation.find({ claimedBy: req.userId })
      .populate("donor", "name email")
      .sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) {
    console.error("Fetch my-claims error:", err);
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});

// The following routes expose aggregate stats and leaderboards
 
// ✅ Donor stats for the authenticated donor
router.get("/me/stats", authMiddleware, async (req, res) => {
  try {
    // Basic counts
    const [totalDonations, collectedDonations, pendingDonations] = await Promise.all([
      Donation.countDocuments({ donor: req.userId }),
      Donation.countDocuments({ donor: req.userId, status: 'Collected' }),
      Donation.countDocuments({ donor: req.userId, status: { $in: ['Available', 'Claimed'] } })
    ]);

    // Recent activity (last 5 donations by this donor)
    const recent = await Donation.find({ donor: req.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id type status createdAt confirmedAt completedAt confirmationStatus fulfillmentMethod');

    // Streaks or last donation date
    const lastDonation = await Donation.findOne({ donor: req.userId }).sort({ createdAt: -1 }).select('createdAt');

    return res.json({
      totalDonations,
      collectedDonations,
      pendingDonations,
      lastDonationAt: lastDonation?.createdAt || null,
      recent
    });
  } catch (err) {
    console.error('Donor stats error:', err);
    return res.status(500).json({ error: 'Failed to compute donor stats' });
  }
});

// ✅ Global leaderboard: top donors by collected donations
router.get("/leaderboard", async (_req, res) => {
  try {
    const top = await Donation.aggregate([
      { $match: { status: 'Collected' } },
      { $group: { _id: "$donor", collectedCount: { $sum: 1 } } },
      { $sort: { collectedCount: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 0, donorId: '$user._id', name: '$user.name', avatar: '$user.avatar', collectedCount: 1 } }
    ]);

    return res.json(top);
  } catch (err) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ✅ Recent collected donations (activity feed)
router.get("/activity/recent", async (_req, res) => {
  try {
    const recent = await Donation.find({ status: 'Collected' })
      .sort({ completedAt: -1 })
      .limit(10)
      .populate('donor', 'name avatar')
      .select('_id type completedAt donor');
    return res.json(recent);
  } catch (err) {
    console.error('Recent activity error:', err);
    return res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// ✅ Get donation by ID (kept last to avoid capturing other routes)
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid donation id" });
    }
    const donation = await Donation.findById(req.params.id)
      .populate("donor", "name email")
      .populate("claimedBy", "name email phone location");
    if (!donation) return res.status(404).json({ error: "Donation not found" });

    res.json(donation);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch donation" });
  }
});

module.exports = router;