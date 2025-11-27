// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; 
import ProtectedRoute from './context/ProtectedRoute'; 

// Imports from the 'pages' folder
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/register';
import Dashboard from './pages/DonarDashboard';
import ReceiverDashboard from './pages/ReceiverDashboard';
import Donate from './pages/Donate';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProfileSetup from './pages/Profile';
import MyDonations from './pages/MyDonations';
import BrowseRequests from './pages/BrowseRequest';
import DonationFeed from './pages/DonationFeed';
import HowItWorks from './pages/HowItWorks';
import MyClaims from './pages/MyClaims';

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Route components need to be inside AuthProvider to access useAuth */}
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

// Separate component for routes that can use useAuth
function AppRoutes() {
  // Route component for DONOR role only
  const DonorRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    const role = typeof user.role === 'string' ? user.role.toUpperCase() : '';
    if (role === 'DONOR') {
      return children;
    }
    
    // If user is RECEIVER, redirect to their dashboard
    return <Navigate to="/receiver-dashboard" replace />;
  };

  // Route component for RECEIVER role only
  const ReceiverRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    const role = typeof user.role === 'string' ? user.role.toUpperCase() : '';
    if (role === 'RECEIVER') {
      return children;
    }
    
    // If user is DONOR, redirect to their dashboard
    return <Navigate to="/dashboard" replace />;
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/howitworks" element={<HowItWorks />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Role-based Dashboard Routes */}
      <Route path="/dashboard" element={<DonorRoute><Dashboard /></DonorRoute>} />
      <Route path="/donor-dashboard" element={<DonorRoute><Dashboard /></DonorRoute>} />
      <Route path="/receiver-dashboard" element={<ReceiverRoute><ReceiverDashboard /></ReceiverRoute>} />
      
      {/* Other protected routes */}
      <Route path="/donate" element={<ProtectedRoute><Donate /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
      <Route path="/my-donations" element={<ProtectedRoute><MyDonations /></ProtectedRoute>} />
      <Route path="/my-claims" element={<ProtectedRoute><MyClaims /></ProtectedRoute>} />
      <Route path="/browserequest" element={<ProtectedRoute><BrowseRequests /></ProtectedRoute>} />

      {/* Receiver-Only Route */}
      <Route path="/donation-feed" element={<ReceiverRoute><DonationFeed /></ReceiverRoute>} />
      
      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;