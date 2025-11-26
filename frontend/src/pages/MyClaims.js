import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DontaionFeed.css';

const MyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingId, setSubmittingId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const fetchClaims = async () => {
      try {
        const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${base}/api/donations/my-claims`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClaims(res.data || []);
      } catch (err) {
        const msg = err.response?.data?.error || 'Failed to load your claims.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, [navigate]);

  if (loading) return <p>Loading your claims...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="donation-feed-container">
      <h2>My Claims</h2>
      {claims.length === 0 ? (
        <p>You haven't claimed any items yet.</p>
      ) : (
        <div className="donations-list">
          {claims.map((claim) => (
            <div key={claim._id} className="donation-card">
              {claim.type === 'cooked' && claim.items?.image && (
                <div className="donation-image-wrap">
                  <img src={claim.items.image} alt={claim.items?.dishName || 'Food image'} className="donation-image" />
                </div>
              )}
              <h3>{claim.type === 'cooked' ? claim.items?.dishName : claim.items?.itemName}</h3>
              <p><strong>Pickup Address:</strong> {claim.pickupAddress}</p>
              <p><strong>Status:</strong> <span className={`status-${claim.status}`}>{claim.status}</span></p>
              <p><strong>Donor:</strong> {claim.donor?.name}</p>
              {claim.confirmationStatus && (
                <p><strong>Confirmation:</strong> {claim.confirmationStatus}</p>
              )}
              {claim.fulfillmentMethod && (
                <p><strong>Method:</strong> {claim.fulfillmentMethod}</p>
              )}

              {/* Receiver can mark collected */}
              {claim.status !== 'Collected' && claim.confirmationStatus === 'Confirmed' && (
                <button
                  disabled={submittingId === claim._id}
                  onClick={async () => {
                    try {
                      setSubmittingId(claim._id);
                      const token = localStorage.getItem('token');
                      await axios.post(
                        `http://localhost:5000/api/donations/${claim._id}/collected`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      setClaims((prev) => prev.map((c) => c._id === claim._id ? { ...c, status: 'Collected' } : c));
                    } catch (e) {
                      const msg = e.response?.data?.error || 'Failed to mark as collected.';
                      setError(msg);
                    } finally {
                      setSubmittingId('');
                    }
                  }}
                >
                  Mark as Collected
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClaims;