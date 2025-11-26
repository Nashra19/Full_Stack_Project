import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DonationFeed from './DonationFeed';
import './ReceiverDashboard.css';
import { City, State } from 'country-state-city';

const ReceiverDashboard = () => {
  // All hooks must be at the top of the component
  const { user, logout, loading } = useAuth();
  const [cityQuery, setCityQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Preload Indian states and cities list lazily
  const indianStates = useMemo(() => State.getStatesOfCountry('IN') || [], []);
  const indianCities = useMemo(() => {
    const all = indianStates.flatMap(st => City.getCitiesOfState('IN', st.isoCode) || []);
    const seen = new Set();
    const unique = [];
    for (const c of all) {
      const key = `${c.name}|${c.stateCode}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    }
    return unique;
  }, [indianStates]);

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return indianCities.slice(0, 50);
    return indianCities.filter(c => c.name.toLowerCase().includes(q)).slice(0, 50);
  }, [cityQuery, indianCities]);
  
  // Now place conditional logic after all hooks
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleCitySelect = (name) => {
    setCityQuery(name);
    setSelectedCity(name);
  };
  
  return (
    <div className="receiver-dashboard">
      <header className="dashboard-header">
        <div className="greeting">
          <h1>Welcome, {user.name}!</h1>
          <p>Here are the currently available donations you can claim.</p>
        </div>
        <div className="profile-actions">
          {/* <div className="city-search" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              placeholder="Select city"
              value={cityQuery}
              onChange={(e) => {
                const val = e.target.value;
                setCityQuery(val);
              }}
              list="indian-cities"
              style={{ padding: '8px 10px' }}
            />
            <datalist id="indian-cities">
              {filteredCities.map((c) => (
                <option key={`${c.name}-${c.stateCode}`} value={c.name}>{c.name}, {c.stateCode}</option>
              ))}
            </datalist>
            <button
              onClick={() => {
                setIsSearching(true);
                handleCitySelect(cityQuery);
                setTimeout(() => setIsSearching(false), 500);
              }}
              className="profile-btn"
              disabled={isSearching}
              aria-busy={isSearching}
            >{isSearching ? 'Searching...' : 'Search'}</button>
            {selectedCity && (
              <span style={{ fontSize: 12, color: '#555' }}>Applied: {selectedCity}</span>
            )}
          </div> */}
          {/* <div className="type-filter" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="typeSelect" style={{ fontSize: 14 }}>Category:</label>
            <select
              id="typeSelect"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="profile-btn"
              style={{ padding: '8px 10px' }}
            >
              <option value="all">All</option>
              <option value="cooked">Cooked Food</option>
              <option value="grocery">Grocery Food</option>
            </select>
          </div> */}
           <button onClick={() => navigate('/profile')} className="profile-btn">Profile</button>
           <button onClick={() => {
             logout();
             navigate('/login');
           }} className="logout-btn">Logout</button>
        </div>
      </header>
      
      <main className="dashboard-content">
        <DonationFeed selectedCity={selectedCity} selectedType={selectedType} />
      </main>
    </div>
  );
};

export default ReceiverDashboard;