import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../services/api';
import { toast } from 'react-toastify';
import '../../styles/login.css'; // Reusing the shared Auth styles

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please provide your email address');
      return;
    }

    setLoading(true);

    try {
      // POST to the route we created
      await API.post('/users/forgotPassword', { email });
      
      // Success Message
      toast.success('Reset link sent! Check your email (or server console).');
      
      // Redirect back to login after a delay
      setTimeout(() => {
          navigate('/login');
      }, 3000);

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Error sending email';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background Orbs */}
      <div className="auth-orb orb-1"></div>
      <div className="auth-orb orb-2"></div>

      <div className="auth-card">
        <div className="auth-header text-center mb-4">
          <h2>Forgot Password?</h2>
          <p>Don't worry. Enter your email and we'll help you reset it.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="mb-4">
            <label htmlFor="email" className="form-label">Email Address</label>
            <div className="glass-input-group">
                <i className="bi bi-envelope"></i>
                <input 
                  type="email" 
                  className="glass-input" 
                  id="email" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-auth-submit" 
            disabled={loading}
          >
            {loading ? (
                <span><span className="spinner-border spinner-border-sm me-2"></span>Sending...</span>
            ) : (
                'Send Reset Link'
            )}
          </button>
        </form>

        <div className="auth-footer">
            <Link to="/login" className="auth-link">
                <i className="bi bi-arrow-left me-1"></i> Back to Login
            </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;