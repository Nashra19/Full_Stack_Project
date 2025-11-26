import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MyDonations.css";

const MyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingId, setSubmittingId] = useState("");

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${base}/api/donations`);
        
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.id) {
          setError("User not found. Please log in again.");
          setLoading(false);
          return;
        }

        let userDonations = res.data.filter(
          (donation) => donation.donor && donation.donor._id === user.id
        );

        const needPopulate = userDonations.filter(d => d.claimedBy && !d.claimedBy.name);
        if (needPopulate.length > 0) {
          try {
            const details = await Promise.all(
              needPopulate.map(d => axios.get(`${base}/api/donations/${d._id}`))
            );
            const byId = new Map(details.map(r => [r.data._id, r.data]));
            userDonations = userDonations.map(d => byId.has(d._id) ? byId.get(d._id) : d);
          } catch (e) {
            // ignore enrichment errors; show what we have
          }
        }

        setDonations(userDonations);
      } catch (err) {
        console.error("❌ Error fetching donations", err);
        setError("Failed to fetch donations.");
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, []);

  const renderDonationItems = (donation) => {
    if (donation.type === "cooked") {
      return (
        <>
          {donation.items?.image && (
            <li style={{ listStyle: 'none', marginBottom: 8 }}>
              <img src={donation.items.image} alt={donation.items.dishName || 'Food image'} style={{ maxHeight: 120, borderRadius: 8 }} />
            </li>
          )}
          <li>
            {donation.items.dishName} - {donation.items.servings} servings
          </li>
        </>
      );
    }
    if (donation.type === "grocery") {
      return (
        // ✅ FIX: Added image rendering for grocery items
        <>
          {donation.items?.image && (
            <li style={{ listStyle: 'none', marginBottom: 8 }}>
              <img src={donation.items.image} alt={donation.items.itemName || 'Grocery image'} style={{ maxHeight: 120, borderRadius: 8 }} />
            </li>
          )}
          <li>
            {donation.items.itemName} - {donation.items.quantity} {donation.items.unit}
          </li>
        </>
      );
    }
    return null;
  };

  const handleDecision = async (donationId, decision, method) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in again.");
      return;
    }
    try {
      setSubmittingId(donationId + ":decision");
      await axios.post(
        `http://localhost:5000/api/donations/${donationId}/confirm`,
        { decision, method },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDonations((prev) =>
        prev.map((d) =>
          d._id === donationId
            ? {
                ...d,
                confirmationStatus: decision,
                fulfillmentMethod: decision === "Confirmed" ? method : null,
                status: decision === "Rejected" ? "Available" : d.status,
                claimedBy: decision === "Rejected" ? null : d.claimedBy,
              }
            : d
        )
      );
    } catch (e) {
      const msg = e.response?.data?.error || "Failed to update decision.";
      setError(msg);
    } finally {
      setSubmittingId("");
    }
  };

  const handleMarkCollected = async (donationId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in again.");
      return;
    }
    try {
      setSubmittingId(donationId + ":collected");
      await axios.post(
        `http://localhost:5000/api/donations/${donationId}/collected`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDonations((prev) =>
        prev.map((d) => (d._id === donationId ? { ...d, status: "Collected" } : d))
      );
    } catch (e) {
      const msg = e.response?.data?.error || "Failed to mark as collected.";
      setError(msg);
    } finally {
      setSubmittingId("");
    }
  };

  if (loading) {
    return <div className="my-donations-container"><p>Loading your donations...</p></div>;
  }

  if (error) {
    return <div className="my-donations-container"><p className="my-donations-empty">{error}</p></div>;
  }

  return (
    <div className="my-donations-container">
      <h2 className="my-donations-title">📦 My Donations</h2>

      {donations.length === 0 ? (
        <p className="my-donations-empty">You haven't made any donations yet.</p>
      ) : (
        <ul className="my-donations-list">
          {donations.map((donation) => (
            <li key={donation._id} className="donation-card">
              <p><strong>Type:</strong> <span style={{textTransform: 'capitalize'}}>{donation.type}</span></p>
              <p><strong>Pickup:</strong> {donation.pickupAddress}</p>
              {donation.status && (
                <p><strong>Status:</strong> {donation.status}</p>
              )}
              {donation.claimedBy && (
                <div style={{ marginTop: 8 }}>
                  <p><strong>Claimed By:</strong> {donation.claimedBy?.name || 'Receiver'}</p>
                  {donation.claimedBy?.email && (
                    <p><strong>Email:</strong> {donation.claimedBy.email}</p>
                  )}
                  {donation.claimedBy?.phone && (
                    <p><strong>Phone:</strong> {donation.claimedBy.phone}</p>
                  )}
                  {donation.claimedBy?.location && (
                    <p><strong>Location:</strong> {donation.claimedBy.location}</p>
                  )}
                </div>
              )}
              {donation.confirmationStatus && (
                <p><strong>Confirmation:</strong> {donation.confirmationStatus}</p>
              )}
              {donation.fulfillmentMethod && (
                <p><strong>Method:</strong> {donation.fulfillmentMethod}</p>
              )}
              
              <p><strong>Items:</strong></p>
              <ul className="donation-items">
                {renderDonationItems(donation)}
              </ul>

              <p className="donation-date">
                Donated on: {new Date(donation.createdAt).toLocaleString()}
              </p>

              {donation.status === "Claimed" && donation.confirmationStatus === "Pending" && (
                <div className="actions-row">
                  <button className="btn primary"
                    disabled={submittingId === donation._id + ":decision"}
                    onClick={() => handleDecision(donation._id, "Confirmed", "pickup")}
                  >
                    Confirm - Pickup
                  </button>
                  <button className="btn primary"
                    disabled={submittingId === donation._id + ":decision"}
                    onClick={() => handleDecision(donation._id, "Confirmed", "delivery")}
                  >
                    Confirm - Delivery
                  </button>
                  <button className="btn ghost"
                    disabled={submittingId === donation._id + ":decision"}
                    onClick={() => handleDecision(donation._id, "Rejected")}
                  >
                    Reject Claim
                  </button>
                </div>
              )}

              {donation.status !== "Collected" && donation.confirmationStatus === "Confirmed" && (
                <button className="btn primary"
                  disabled={submittingId === donation._id + ":collected"}
                  onClick={() => handleMarkCollected(donation._id)}
                >
                  Mark as Collected
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyDonations;