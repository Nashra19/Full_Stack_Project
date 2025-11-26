import React, { useState } from 'react';
import './Volunteer.css';

const Volunteer = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'name':
        if (!value.trim()) error = 'Name is required';
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email';
        break;
      case 'phone':
        if (value && !/^\d{10}$/.test(value)) error = 'Enter 10-digit number';
        break;
      case 'message':
        if (!value.trim()) error = 'Please tell us why you want to volunteer';
        break;
      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Restrict phone input to digits only and max 10
    if (name === 'phone') {
      const onlyNums = value.replace(/\D/g, '');
      if (onlyNums.length > 10) return;
      setForm({ ...form, [name]: onlyNums });
      setErrors({ ...errors, [name]: validateField(name, onlyNums) });
    } else {
      setForm({ ...form, [name]: value });
      setErrors({ ...errors, [name]: validateField(name, value) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    Object.keys(form).forEach((field) => {
      const error = validateField(field, form[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length !== 0) {
      setSuccess('');
      return;
    }

    try {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await fetch(`${base}/api/volunteer/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors({ ...newErrors, form: data.error || 'Failed to submit. Please try again.' });
        setSuccess('');
        return;
      }

      setSuccess('Thank you for volunteering! We’ll reach out soon.');
      setErrors({});
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setErrors({ ...newErrors, form: 'Network error. Please try again later.' });
      setSuccess('');
    }
  };

  return (
<div
  className="volunteer-container"
  style={{
    minHeight: "100vh",
    width: "100vw",
    backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${process.env.PUBLIC_URL}/volunteer.jpg)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
    textAlign: "center",
  }}
>

      <h2>Become a Volunteer</h2>
      <p>Join our mission to reduce food waste and feed those in need. Every hour you contribute makes a big difference!</p>

      {success && <div className="success">{success}</div>}
      {errors.form && <div className="error">{errors.form}</div>}

      <form className="volunteer-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
        />
        {errors.name && <span className="error">{errors.name}</span>}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        {errors.email && <span className="error">{errors.email}</span>}

        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
        />
        {errors.phone && <span className="error">{errors.phone}</span>}

        <textarea
          name="message"
          placeholder="Why do you want to volunteer?"
          value={form.message}
          onChange={handleChange}
        ></textarea>
        {errors.message && <span className="error">{errors.message}</span>}

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default Volunteer;
