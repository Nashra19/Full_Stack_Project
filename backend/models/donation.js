const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["cooked", "grocery"],
    required: true,
  },
  items: {
    type: Object,
    required: true,
  },
  category: {
    type: String,
    enum: ["fruits", "vegetables", "grains", "dairy", "meat", "baked", "prepared", "other"],
    required: true,
  },
  foodType: {
    type: String,
    enum: ["veg", "non-veg", "vegan"],
    required: true,
  },
  // Optional image for the donation (e.g., cooked food photo)
  image: {
    type: String, // store DataURL or URL
    default: null,
  },
  pickupAddress: {
    type: String,
    required: true,
  },
  // Geolocation for pickup (lat/lng)
  pickupCoords: {
    type: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    default: undefined,
  },
  contact: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // ✅ NEW: Fields for the donation claiming system
  status: {
    type: String,
    enum: ['Available', 'Claimed', 'Collected'],
    default: 'Available'
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // This will store the ID of the NGO that claimed the donation
    default: null
  },
  claimedAt: {
    type: Date,
    default: null
  },
  confirmationStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Rejected'],
    default: 'Pending'
  },
  fulfillmentMethod: {
    type: String,
    enum: ['pickup', 'delivery'],
    default: null
  },
  confirmedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model("Donation", donationSchema);