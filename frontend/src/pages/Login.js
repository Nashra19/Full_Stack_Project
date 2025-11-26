// src/pages/Login.js
import React, { useState } from 'react';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { useNavigate, Link } from 'react-router-dom';
// ✅ CORRECTED PATH: Was './context/AuthContext', now it's '../context/AuthContext'
import { useAuth } from '../context/AuthContext';
import './login.css'; // Assuming login.css is in the pages folder too

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', form.email);
      
      const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();
      console.log('Login response:', data);

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      console.log('Login successful, user role:', data.user.role);
      login(data.user, data.token);
      
      // Redirect based on user role
      if (data.user.role === 'RECEIVER') {
        console.log('Redirecting to receiver dashboard');
        navigate('/receiver-dashboard');
      } else {
        console.log('Redirecting to donor dashboard');
        navigate('/dashboard');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>

        {error && <div className="error">{error}</div>}

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
            placeholder="Password" 
            value={form.password} 
            onChange={handleChange} 
            required 
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

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
        <p>
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;