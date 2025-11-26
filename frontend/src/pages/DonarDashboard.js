import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import "./DonarDashboard.css"; // We will reuse the existing CSS

const DonorDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ totalDonations: 0, collectedDonations: 0, pendingDonations: 0, lastDonationAt: null, recent: [] });
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        console.log('API Base:', apiBase);
        console.log('User:', user);
        console.log('Token:', token ? 'Present' : 'Missing');

        const headers = token ? { 
          'Authorization': `Bearer ${token}`, 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        } : { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        };

        console.log('Fetching stats from:', `${apiBase}/api/donations/me/stats`);
        console.log('Fetching leaderboard from:', `${apiBase}/api/donations/leaderboard`);

        const [statsRes, lbRes] = await Promise.all([
          fetch(`${apiBase}/api/donations/me/stats`, { 
            method: 'GET',
            headers: headers
          }),
          fetch(`${apiBase}/api/donations/leaderboard`, { 
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
          })
        ]);

        console.log('Stats response status:', statsRes.status);
        console.log('Leaderboard response status:', lbRes.status);

        if (!statsRes.ok) {
          const text = await statsRes.text();
          console.error('Stats fetch failed', statsRes.status, text);
          throw new Error(`Failed to load stats (${statsRes.status})`);
        }
        if (!lbRes.ok) {
          const text = await lbRes.text();
          console.error('Leaderboard fetch failed', lbRes.status, text);
          throw new Error(`Failed to load leaderboard (${lbRes.status})`);
        }

        const statsJson = await statsRes.json();
        const lbJson = await lbRes.json();

        console.log('Stats data:', statsJson);
        console.log('Leaderboard data:', lbJson);

        if (isMounted) {
          setStats(statsJson);
          setLeaderboard(lbJson);
        }
      } catch (e) {
        console.error('Fetch error:', e);
        if (isMounted) setError(e.message || 'Something went wrong');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
    return () => { isMounted = false; };
  }, [user, token]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="greeting">
          <h1>Welcome, {user?.name || 'Donor'}!</h1>
          <p>Thank you for making a difference. What would you like to do today?</p>
        </div>
        <div className="profile-container">
            <button onClick={() => navigate('/profile')} className="profile-btn-donor">Profile</button>
            <button onClick={() => {
              logout();
              navigate('/login');
            }} className="logout-btn-donor">Logout</button>
        </div>
      </header>

      {/* KPIs */}
      <section className="stats" aria-label="donor-stats">
        <div className="stat">
          <h3>Total Donations</h3>
          <div>{loading ? '…' : stats.totalDonations}</div>
        </div>
        <div className="stat">
          <h3>Collected</h3>
          <div>{loading ? '…' : stats.collectedDonations}</div>
        </div>
        <div className="stat">
          <h3>Active</h3>
          <div>{loading ? '…' : stats.pendingDonations}</div>
        </div>
        <div className="stat">
          <h3>Last Donation</h3>
          <div>{loading ? '…' : (stats.lastDonationAt ? new Date(stats.lastDonationAt).toLocaleDateString() : '—')}</div>
        </div>
      </section>
      
      {/* Action Cards specific to Donors */}
      <section className="action-cards">
        <div className="card donate">
          <h4>🍲 Make a New Donation</h4>
          <p>List surplus food to share with those in need.</p>
          <button onClick={() => navigate("/donate")}>Donate Food</button>
        </div>
        <div className="card my-donations">
          <h4>📦 My Donations</h4>
          <p>Track your past and ongoing donations.</p>
          <button onClick={() => navigate("/my-donations")}>View Donations</button>
        </div>
        <div className="card volunteer">
          <h4>🚗 Volunteer</h4>
          <p>Help collect and deliver donations.</p>
          <button onClick={() => navigate('/#volunteer-section')}>Sign Up</button>
        </div>
      </section>

      {/* Recent Activity (Your donations) */}
      <section className="recent-activity">
        <h3>Recent Activity</h3>
        {error && <div style={{ color: '#d32f2f' }}>{error}</div>}
        {loading ? (
          <div>Loading…</div>
        ) : (
          <ul>
            {stats.recent?.length ? stats.recent.map((d) => (
              <li key={d._id}>
                <span>{d.type} • {d.status}</span>
                <span>{new Date(d.createdAt).toLocaleString()}</span>
              </li>
            )) : <li>No recent activity</li>}
          </ul>
        )}
      </section>

      {/* Leaderboard */}
      <section className="leaderboard">
        <h3>Top Donors</h3>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <ol>
            {leaderboard?.length ? leaderboard.map((entry, idx) => (
              <li key={entry.donorId} className="leaderboard-item">
                <div className="lb-left">
                  <div className={`lb-avatar-wrap${idx === 0 ? ' top' : ''}`}>
                    <img src={entry.avatar || '/avatars/avatar1.jpg'} alt={entry.name} className="lb-avatar" />
                    {idx === 0 && <span className="lb-crown" aria-label="Top donor">👑</span>}
                  </div>
                  <span className="lb-name">{entry.name}</span>
                </div>
                <span className="lb-score">{entry.collectedCount}</span>
              </li>
            )) : <li>No donors yet</li>}
          </ol>
        )}
      </section>
    </div>
  );
};

export default DonorDashboard;
