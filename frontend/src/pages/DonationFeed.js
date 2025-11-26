import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DontaionFeed.css';

const DonationFeed = ({ selectedCity, selectedType = 'all' }) => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimingId, setClaimingId] = useState(null);
  const navigate = useNavigate();
  
  // Get the current user from localStorage to check their role
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  // Fetch donations based on city and type filters
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setLoading(true);
        const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        
        const res = await axios.get(`${base}/api/donations`, {
          params: {
            city: selectedCity,
            type: selectedType === 'all' ? undefined : selectedType,
          },
        });
        setDonations(res.data);
      } catch (err) {
        setError('Failed to fetch donations.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, [selectedCity, selectedType]);

  const handleClaim = async (donationId) => {
    if (!token) {
      alert("Please log in to claim a donation.");
      return;
    }

    try {
      setClaimingId(donationId);
      await axios.post(
        `http://localhost:5000/api/donations/${donationId}/claim`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setDonations(donations.map(d => 
        d._id === donationId ? { ...d, status: 'Claimed', claimedBy: user.id } : d
      ));
      alert("Donation claimed successfully!");
      navigate('/my-claims');

    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to claim donation. It may have already been taken.";
      setError(errorMessage);
      console.error(err);
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) return <p>Loading donations...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  let visibleDonations = donations;

  return (
    <div className="donation-feed-container">
      <h2>Available Donations</h2>
      {visibleDonations.length === 0 ? (
        <p>No donations available at the moment.</p>
      ) : (
        <div className="donations-list">
          {visibleDonations.map((donation) => (
            <div key={donation._id} className="donation-card">
              {/* ✅ FIX: Show image if it exists, regardless of donation type */}
              {donation.items?.image && (
                <div className="donation-image-wrap">
                  <img 
                    src={donation.items.image} 
                    alt={donation.type === 'cooked' ? donation.items.dishName : donation.items.itemName || 'Donation image'} 
                    className="donation-image" 
                  />
                </div>
              )}
              <h3>{donation.type === 'cooked' ? donation.items.dishName : donation.items.itemName}</h3>
              <p><strong>Pickup Address:</strong> {donation.pickupAddress}</p>
              <p><strong>Status:</strong> <span className={`status-${donation.status}`}>{donation.status}</span></p>
              <p><strong>Donated by:</strong> {donation.donor?.name || 'Anonymous'}</p>
              
              {(user?.role === 'RECEIVER' || user?.role === 'recipient') && donation.status === 'Available' && (
                <button 
                  className="claim-btn"
                  disabled={claimingId === donation._id}
                  onClick={() => handleClaim(donation._id)}
                >
                  {claimingId === donation._id ? 'Claiming...' : 'Claim Donation'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonationFeed;