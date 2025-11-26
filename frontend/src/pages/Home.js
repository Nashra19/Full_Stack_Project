// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import './Home.css'; // Assuming Home.css is in the pages folder too
import { useNavigate } from 'react-router-dom';
// ✅ CORRECTED PATH: Was './context/AuthContext', now it's '../context/AuthContext'
import { useAuth } from '../context/AuthContext'; 

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [navSolid, setNavSolid] = useState(false);

  const [volunteerForm, setVolunteerForm] = useState({ name: '', email: '', message: '' });
  const [volunteerErrors, setVolunteerErrors] = useState({});
  const [volunteerSuccess, setVolunteerSuccess] = useState('');

  useEffect(() => {
    const handleScroll = () => setNavSolid(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleDonateFoodClick = () => {
    if (isAuthenticated) {
      navigate('/donate');
    } else {
      navigate('/login');
    }
  };

  const handleFindFoodClick = () => {
    if (isAuthenticated) {
      if (user?.role === 'RECEIVER') {
        navigate('/donation-feed'); 
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
  };
  
  const handleVolunteerChange = (e) => {
    const { name, value } = e.target;
    setVolunteerForm({ ...volunteerForm, [name]: value });
  };

  const handleVolunteerSubmit = async (e) => {
    e.preventDefault();
    let errors = {};
    if (!volunteerForm.name.trim()) errors.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(volunteerForm.email)) errors.email = 'A valid email is required';
    if (!volunteerForm.message.trim()) errors.message = 'Please add a short message';
    
    setVolunteerErrors(errors);

    if (Object.keys(errors).length !== 0) {
      setVolunteerSuccess('');
      return;
    }

    try {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await fetch(`${base}/api/volunteer/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(volunteerForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setVolunteerErrors({ form: data.error || 'Failed to submit. Please try again.' });
        setVolunteerSuccess('');
        return;
      }
      setVolunteerSuccess('Thank you for your interest! We will be in touch soon.');
      setVolunteerForm({ name: '', email: '', message: '' });
      setVolunteerErrors({});
    } catch (err) {
      setVolunteerErrors({ form: 'Network error. Please try again later.' });
      setVolunteerSuccess('');
    }
  };

  return (
    <div className="Home">
      <header className="hero">
        <nav className={`navbar ${navSolid ? 'solid' : ''}`}>
          <div className="logo">Food Rescue Hub</div>
          <div className="nav-actions">
            <button className="btn-nav" onClick={() => navigate('/howitworks')}>How It Works</button>
            <button className="btn-nav" onClick={() => scrollToSection('impact-section')}>Our Impact</button>
            <button className="btn-nav" onClick={() => scrollToSection('volunteer-section')}>Volunteer</button>
            {isAuthenticated ? (
              <>
                <button className="btn-nav" onClick={() => {
                  if (user?.role === 'RECEIVER') {
                    navigate('/receiver-dashboard');
                  } else {
                    navigate('/dashboard');
                  }
                }}>Dashboard</button>
                <button className="btn-nav register" onClick={() => {
                  logout();
                  navigate('/login');
                }}>Logout</button>
              </>
            ) : (
              <>
                <button className="btn-nav login" onClick={() => navigate('/login')}>Login</button>
                <button className="btn-nav register" onClick={() => navigate('/register')}>Register</button>
              </>
            )}
          </div>
        </nav>
        <div className="hero-content">
          <h1 className="headline">Don't Waste It, Donate It.</h1>
          <p className="subtext">Connect with local NGOs to share surplus food and fight hunger in your neighborhood.</p>
          <div className="buttons">
            <button className="btn primary" onClick={handleDonateFoodClick}>Donate Food</button>
            <button className="btn secondary" onClick={handleFindFoodClick}>Find Food</button>
          </div>
        </div>
      </header>
      
      <section className="how-it-works">
        <h2>A Simple Path to Zero Waste</h2>
        <div className="steps">
          <div className="step">
            <div className="step-icon"></div>
            <h3>1. Register</h3>
            <p>Sign up in seconds as a food donor or a recipient NGO.</p>
          </div>
          <div className="step">
            <div className="step-icon"></div>
            <h3>2. List or Find</h3>
            <p>Donors list surplus food. NGOs browse available donations in real-time.</p>
          </div>
          <div className="step">
            <div className="step-icon"></div>
            <h3>3. Connect & Collect</h3>
            <p>NGOs claim donations and coordinate pickup, ensuring food reaches those in need.</p>
          </div>
        </div>
      </section>
      
      <section id="impact-section" className="impact-section">
        <div className="impact-container">
          <h2>Our Collective Impact</h2>
          <p className="section-subtitle">Numbers that tell the story of our community's effort.</p>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon"></div>
              <div className="stat-number">5,000+</div>
              <div className="stat-label">Meals Served</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"></div>
              <div className="stat-number">1,200+ kg</div>
              <div className="stat-label">Food Rescued</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"></div>
              <div className="stat-number">20+</div>
              <div className="stat-label">Partner NGOs</div>
            </div>
          </div>
        </div>
      </section>

      <section id="volunteer-section" className="volunteer-section">
        <div className="volunteer-content">
          <h2>Join Our Cause</h2>
          <p>Become a vital part of our mission. Whether you can help with pickups, deliveries, or events, your time makes a real difference. Sign up to be a food rescue hero today!</p>
        </div>
        <div className="volunteer-form-container">
          {volunteerSuccess && <div className="success-message">{volunteerSuccess}</div>}
          {volunteerErrors.form && <span className="error-message">{volunteerErrors.form}</span>}
          <form onSubmit={handleVolunteerSubmit} noValidate>
            <input type="text" name="name" placeholder="Your Name" value={volunteerForm.name} onChange={handleVolunteerChange} />
            {volunteerErrors.name && <span className="error-message">{volunteerErrors.name}</span>}
            
            <input type="email" name="email" placeholder="Your Email" value={volunteerForm.email} onChange={handleVolunteerChange} />
            {volunteerErrors.email && <span className="error-message">{volunteerErrors.email}</span>}

            <textarea name="message" placeholder="A short message about why you want to help..." value={volunteerForm.message} onChange={handleVolunteerChange}></textarea>
            {volunteerErrors.message && <span className="error-message">{volunteerErrors.message}</span>}

            <button type="submit" className="btn primary">I'm Ready to Help</button>
          </form>
        </div>
      </section>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Food Rescue Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;