import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import API from '../../services/api';
import { toast } from 'react-toastify';
import '../../styles/login.css'; // Shared Auth Styles

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  
  const [formData, setFormData] = useState({
    password: '',
    passwordConfirm: ''
  });

  const [errors, setErrors] = useState({
    password: '',
    passwordConfirm: ''
  });

  const [valid, setValid] = useState({
    password: false,
    passwordConfirm: false,
    isButtonActive: false
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
        ...formData,
        [name]: value
    });
    validateField(name, value);
  };

  const validateField = (fieldName, fieldValue) => {
    let newErrors = { ...errors };
    let newValid = { ...valid };

    switch (fieldName) {
        case "password":
            // Enforce minimum security (e.g. 8 chars)
            if (fieldValue === "") {
                newErrors.password = "Field is Required";
                newValid.password = false;
            } else if (fieldValue.length < 8) {
                newErrors.password = "Password must be at least 8 characters";
                newValid.password = false;
            } else {
                newErrors.password = "";
                newValid.password = true;

                // Re-validate match if confirm field is already filled
                if (formData.passwordConfirm) {
                    if (formData.passwordConfirm !== fieldValue) {
                        newErrors.passwordConfirm = "Passwords do not match";
                        newValid.passwordConfirm = false;
                    } else {
                        newErrors.passwordConfirm = "";
                        newValid.passwordConfirm = true;
                    }
                }
            }
            break;

        case "passwordConfirm":
            if (fieldValue === "") {
                newErrors.passwordConfirm = "Field is Required";
                newValid.passwordConfirm = false;
            } else if (fieldValue !== formData.password) {
                newErrors.passwordConfirm = "Passwords do not match";
                newValid.passwordConfirm = false;
            } else {
                newErrors.passwordConfirm = "";
                newValid.passwordConfirm = true;
            }
            break;
            
        default:
            break;
    }

    newValid.isButtonActive = newValid.password && newValid.passwordConfirm;
    
    setErrors(newErrors);
    setValid(newValid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!valid.isButtonActive) return;

    setLoading(true);

    try {
      await API.patch(`/users/resetPassword/${token}`, {
        password: formData.password,
        passwordConfirm: formData.passwordConfirm
      });

      toast.success('Password updated successfully! Please login.');
      
      setTimeout(() => {
          navigate('/login');
      }, 1500);

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Token is invalid or has expired';
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
            <h2>Reset Password</h2>
            <p>Enter your new password below.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
            <div className="mb-3">
                <label className="form-label" htmlFor="password">New Password</label>
                <div className="glass-input-group">
                    <i className="bi bi-lock"></i>
                    <input 
                        type="password" 
                        className="glass-input" 
                        id="password" 
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required 
                    />
                </div>
                {errors.password && <div className='text-danger small mt-1 ms-2'>{errors.password}</div>}
            </div>

            <div className="mb-4">
                <label className="form-label" htmlFor="passwordConfirm">Confirm New Password</label>
                <div className="glass-input-group">
                    <i className="bi bi-check-all"></i>
                    <input 
                        type="password" 
                        className="glass-input" 
                        id="passwordConfirm" 
                        name="passwordConfirm"
                        placeholder="••••••••"
                        value={formData.passwordConfirm}
                        onChange={handleChange}
                        required 
                    />
                </div>
                {errors.passwordConfirm && <div className='text-danger small mt-1 ms-2'>{errors.passwordConfirm}</div>}
            </div>

            <button 
                type="submit" 
                className="btn-auth-submit" 
                disabled={!valid.isButtonActive || loading}
            >
                {loading ? (
                    <span><span className="spinner-border spinner-border-sm me-2"></span>Updating...</span>
                ) : (
                    'Set New Password'
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

export default ResetPassword;