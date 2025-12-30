import { useState } from 'react';
import './Signup.css';
import { NavLink, useNavigate } from 'react-router';

export default function Signup() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:4000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Account created! You can now log in.');
        setFormData({ email: '', password: '' });
        navigate("/login")
      } else {
        setErrors({ general: data.message || 'Sign up failed.' });
      }
    } catch (err) {
      setErrors({ general: 'Network error.' });
      console.error(err)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2 className="signup-title">Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="signup-label">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`signup-input${errors.email ? ' error' : ''}`}
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <p className="signup-error">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="signup-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className={`signup-input${errors.password ? ' error' : ''}`}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <p className="signup-error">{errors.password}</p>}
          </div>
          {errors.general && <div className="signup-error" style={{ textAlign: 'center' }}>{errors.general}</div>}
          {success && <div className="signup-success">{success}</div>}
          <button
            type="submit"
            disabled={isLoading}
            className="signup-button"
          >
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <div className="signup-footer">
          <span className="signup-footer-text">Already have an account? </span>
          <NavLink to="/login">
            <button className="signup-footer-link">Log in</button>
          </NavLink>
        </div>
      </div>
    </div>
  );
}