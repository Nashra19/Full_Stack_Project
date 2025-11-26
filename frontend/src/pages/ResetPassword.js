import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './login.css';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password'); // Redirect if no email
    }
  }, [email, navigate]);

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage('❌ Passwords do not match');
      return;
    }

    // ✅ Strong password regex (fix applied)
    const strongPasswordRegex =
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@#$!_^%?&])[A-Za-z\d@#$!_^%*?&]{6,}$/;

    if (!strongPasswordRegex.test(newPassword)) {
      setMessage(
        '❌ Password must be at least 6 characters long and include a letter, number, and special character.'
      );
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      setMessage(data.message || data.error);

      if (res.ok) {
        setTimeout(() => navigate('/login'), 2000); // redirect after success
      }
    } catch (err) {
      console.error('Reset error:', err);
      setMessage('⚠️ Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleReset}>
        <h2>Reset Password</h2>
        {message && (
          <p className={message.startsWith('❌') || message.startsWith('⚠️') ? 'error' : 'success'}>
            {message}
          </p>
        )}

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Enter New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={6}
          maxLength={32}
          required
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={6}
          maxLength={32}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
