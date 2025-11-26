import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false); // ✅ track success vs error
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setIsError(false); // ✅ success
        console.log("OTP sent, navigating to reset-password");

        // delay navigation a little so user sees success msg
        setTimeout(() => {
          navigate('/reset-password', { state: { email } });
        }, 1000);
      } else {
        setMessage(data.error || 'Failed to send OTP');
        setIsError(true); // ❌ error
      }
    } catch (err) {
      setMessage('⚠️ Server error, please try again');
      setIsError(true);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSendOtp}>
        <h2>Forgot Password</h2>

        {message && (
          <p className={isError ? "error" : "success"}>{message}</p>
        )}

        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send OTP</button>
      </form>
    </div>
  );
};

export default ForgotPassword;
