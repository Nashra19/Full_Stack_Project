// src/register.js

import React, { useState } from 'react';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { useNavigate, Link } from 'react-router-dom';
import './register.css';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DONOR', // Default role
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const password = form.password;

    // ✅ Regex: at least 1 uppercase, 1 number, 1 special char, 6–32 chars
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,32}$/;

    if (!passwordRegex.test(password)) {
      setError(
        'Password must be 6–32 chars long, include at least one uppercase letter, one number, and one special character.'
      );
      setLoading(false);
      return;
    }

    try {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await fetch(`${base}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess('Registration successful! Please log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Create Account</h2>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <input
          type="text"
          name="name"
          placeholder="Full Name or Organization Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password (6–32 chars, 1 uppercase, 1 number, 1 special)"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            maxLength={32}
          />
          <span
            role="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="icon-btn"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <MdVisibility /> : <MdVisibilityOff />}
          </span>
        </div>

        <div className="role-selector">
          <h4>I am a:</h4>
          <label>
            <input
              type="radio"
              name="role"
              value="DONOR"
              checked={form.role === 'DONOR'}
              onChange={handleChange}
            />
            Donor (Individual/Restaurant)
          </label>
          <label>
            <input
              type="radio"
              name="role"
              value="RECEIVER"
              checked={form.role === 'RECEIVER'}
              onChange={handleChange}
            />
            Receiver (NGO/Shelter)
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
