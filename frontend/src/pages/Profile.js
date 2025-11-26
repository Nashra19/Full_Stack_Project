import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

const avatars = [
  "/avatars/avatar1.jpg",
  "/avatars/avatar2.jpg",
  "/avatars/avatar3.jpg",
  "/avatars/avatar4.jpg",
  "/avatars/avatar5.jpg",
  "/avatars/avatar6.jpg",
];

const cities = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", 
  "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow"
];

const ProfileSetup = () => {
  const { user } = useAuth();
  const currentUser = JSON.parse(localStorage.getItem("user"));
  
  const [name, setName] = useState(currentUser?.name || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || avatars[0]);
  const [email] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [location, setLocation] = useState(currentUser?.location || "");
  const [gender, setGender] = useState(currentUser?.gender || "");
  const [dob, setDob] = useState(currentUser?.dob ? new Date(currentUser.dob).toISOString().split('T')[0] : "");
  // const [interests, setInterests] = useState(currentUser?.interests || "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // ✅ Updated handler for Indian phone number validation
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');

    // Allow the user to clear the input field
    if (value === '') {
      setPhone('');
      return;
    }

    // Check if the number starts with 6, 7, 8, or 9 and is not longer than 10 digits.
    // The regex /^[6-9]/ checks if the string starts with one of those digits.
    if (/^[6-9]/.test(value) && value.length <= 10) {
      setPhone(value);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Add a check to ensure the phone number is exactly 10 digits before saving
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    
    const token = localStorage.getItem("token");
    if (!token || !currentUser?.id) {
      setError("You are not authenticated. Please log in again.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        name,
        bio,
        avatar: selectedAvatar,
        phone,
        location,
        gender,
        dob,
        // interests,
      };

      const res = await fetch(`http://localhost:5000/api/auth/profile/${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update profile");
      }
      
      const updatedUser = await res.json();
      localStorage.setItem("user", JSON.stringify({ ...currentUser, ...updatedUser }));
      
      if (user?.role === 'RECEIVER') {
        navigate("/receiver-dashboard");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="profile-page">
      <h1>Complete Your Profile</h1>
      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      
      <form onSubmit={handleSave} className="profile-form">
        <div className="form-section">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" required />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} readOnly placeholder="Your email address" />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={handlePhoneChange} 
              placeholder="Enter 10-digit mobile number" 
              required
            />
          </div>
          
          <div className="form-group">
            <label>Location</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)} required >
              <option value="">Select City</option>
              {cities.map((city) => (<option key={city} value={city}>{city}</option>))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} >
              <option value="">Select Gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label>Short Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Something about you..." required />
          </div>
          
          {/* <div className="form-group">
            <label>Interests</label>
            <input type="text" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="E.g. Coding, Music, Sports" />
          </div> */}

          <div className="avatar-selection">
            <h2>Choose Your Avatar</h2>
            <div className="avatar-grid">
              {avatars.map((avatar, index) => (
                <img key={index} src={avatar} alt={`avatar ${index + 1}`} className={`avatar-option ${selectedAvatar === avatar ? "selected" : ""}`} onClick={() => setSelectedAvatar(avatar)} />
              ))}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={submitting}>
            {submitting ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default ProfileSetup;