import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./BrowseRequest.css";

const BrowseRequests = () => {
  const { user } = useAuth();
  // Mock requests (later you can fetch from API)
  const requests = [
    {
      id: 1,
      title: "Fresh Vegetables Needed",
      ngo: "Helping Hands NGO",
      location: "Mumbai",
      quantity: "20 kg",
      urgency: "High",
    },
    {
      id: 2,
      title: "Bread & Milk for Orphanage",
      ngo: "Sunrise Orphanage",
      location: "Delhi",
      quantity: "15 kg",
      urgency: "Medium",
    },
    {
      id: 3,
      title: "Cooked Meals for Night Shelter",
      ngo: "Safe Haven Shelter",
      location: "Bengaluru",
      quantity: "50 meals",
      urgency: "High",
    },
    {
      id: 4,
      title: "Rice & Dal for Community Kitchen",
      ngo: "Food for All",
      location: "Hyderabad",
      quantity: "30 kg",
      urgency: "Low",
    },
  ];

  const [city, setCity] = useState("");

  // filter requests by city if selected
  const filteredRequests = city
    ? requests.filter((r) => r.location === city)
    : requests;

  return (
    <div className="browse-container">
      <div className="browse-header">
        <h1>Browse Food Requests</h1>
        <p>Find requests from NGOs, shelters, and communities in need.</p>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <label htmlFor="city">Filter by City:</label>
        <select
          id="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          <option value="">All Cities</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Delhi">Delhi</option>
          <option value="Bengaluru">Bengaluru</option>
          <option value="Hyderabad">Hyderabad</option>
        </select>
      </div>

      {/* Requests Grid */}
      <div className="requests-grid">
        {filteredRequests.map((req) => (
          <div key={req.id} className="request-card">
            <h3>{req.title}</h3>
            <p><strong>NGO:</strong> {req.ngo}</p>
            <p><strong>Location:</strong> {req.location}</p>
            <p><strong>Quantity:</strong> {req.quantity}</p>
            <p className={`urgency ${req.urgency.toLowerCase()}`}>
              <strong>Urgency:</strong> {req.urgency}
            </p>
            <button className="donate-btn">Donate Now</button>
          </div>
        ))}
      </div>

      {/* Back Button */}
      <div className="back-btn">
        <Link to={user?.role === 'RECEIVER' ? "/receiver-dashboard" : "/dashboard"}>
          ⬅ Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default BrowseRequests;
