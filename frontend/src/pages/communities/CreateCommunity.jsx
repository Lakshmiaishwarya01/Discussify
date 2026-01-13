import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api'; 
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../../styles/createCommunity.css';

const CreateCommunity = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  
  const [errors, setErrors] = useState({
    name: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);

  const validateField = (name, value) => {
    let errorMsg = '';

    switch (name) {
      case 'name':
        if (!value.trim()) {
          errorMsg = 'Community name is required';
        } else if (value.length < 3) {
          errorMsg = 'Community name must be at least 3 characters';
        } else if (value.length > 50) {
          errorMsg = 'Community name must not exceed 50 characters';
        }
        break;

      case 'description':
        if (!value.trim()) {
          errorMsg = 'Description is required';
        } else if (value.length < 10) {
          errorMsg = 'Description must be at least 10 characters';
        } else if (value.length > 500) {
            errorMsg = 'Description must not exceed 500 characters';
        }
        break;
        
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [name]: errorMsg
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData({
      ...formData,
      [name]: newValue
    });

    if (type !== 'checkbox') {
        validateField(name, newValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    const nameError = !formData.name.trim() || formData.name.length < 3;
    const descError = !formData.description.trim() || formData.description.length < 10;

    if (nameError || descError) {
        validateField('name', formData.name);
        validateField('description', formData.description);
        return;
    }

    setLoading(true);

    try {
      const res = await API.post('/communities', formData);

      toast.success('Community created successfully!');
      
      const newCommunityId = res.data.data.community._id;

      setTimeout(() => {
        navigate(`/communities/${newCommunityId}`); 
      }, 1000);

    } catch (error) {
      console.error('Error creating community:', error);
      const msg = error.response?.data?.message || 'Failed to create community.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = 
    formData.name.length >= 3 && 
    formData.name.length <= 50 &&
    formData.description.length >= 10 &&
    !errors.name && 
    !errors.description;

  if (!user) {
    return (
      <div className="create-page d-flex justify-content-center align-items-center text-center">
        <div>
            <h3 className="text-white mb-4">Please login to create a community</h3>
            <button className="btn-glow-primary px-5" onClick={() => navigate('/login')}>
            Login
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-page">
      {/* Background Ambience */}
      <div className="create-orb-1"></div>
      <div className="create-orb-2"></div>

      {/* REMOVED: Bootstrap container/row/col wrappers.
         The .create-page flexbox will now perfectly center this card. 
      */}
      <div className="glass-form-card">
        <div className="text-center mb-4">
          <h2 className="form-title">Create Community</h2>
          <p className="text-white-50 small m-0">Build a space for your passion</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Name Input */}
          <div className="mb-3">
            <label htmlFor="name" className="glass-label">
              Name <span className="text-pink">*</span>
            </label>
            <div className="glass-input-wrapper">
              <input
                type="text"
                className={`glass-form-input no-icon ${errors.name ? 'is-invalid' : ''}`}
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={(e) => validateField('name', e.target.value)}
                placeholder="e.g. React Developers"
                autoComplete="off"
                required
              />
            </div>
            {errors.name && <div className="text-danger small mt-1 ms-1">{errors.name}</div>}
          </div>

          {/* Description Input */}
          <div className="mb-3">
            <label htmlFor="description" className="glass-label">
              Description <span className="text-pink">*</span>
            </label>
            <div className="glass-input-wrapper">
              <i className="bi bi-card-text input-icon" style={{top: '1rem', transform: 'none'}}></i>
              <textarea
                  className={`glass-form-input ${errors.description ? 'is-invalid' : ''}`}
                  id="description"
                  name="description"
                  rows="3" 
                  value={formData.description}
                  onChange={handleChange}
                  onBlur={(e) => validateField('description', e.target.value)}
                  placeholder="What is this community about?"
                  style={{paddingTop: '0.6rem', paddingLeft: '2.5rem', resize: 'none'}}
                  required
              />
            </div>
            <div className="d-flex justify-content-between mt-1 ms-1">
              {errors.description ? (
                  <span className="text-danger small">{errors.description}</span>
              ) : <span></span>}
              <small className="text-white-50" style={{fontSize: '0.75rem'}}>
                  {formData.description.length}/500
              </small>
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="mb-4">
            <div className="glass-toggle-container">
              <div>
                <span className="text-white fw-bold d-block" style={{fontSize: '0.9rem'}}>Private Community</span>
                <span className="text-white-50" style={{fontSize: '0.75rem'}}>
                    {formData.isPrivate ? "Invite only." : "Open to everyone."}
                </span>
              </div>
              <div className="form-check form-switch m-0">
                  <input
                  className="form-check-input custom-switch"
                  type="checkbox"
                  id="isPrivate"
                  name="isPrivate"
                  checked={formData.isPrivate}
                  onChange={handleChange}
                  style={{margin: 0}}
                  />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn-glass-secondary flex-grow-1"
              onClick={() => navigate('/communities')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-glow-primary flex-grow-1"
              disabled={loading || !isFormValid}
            >
              {loading ? (
                  <span><span className="spinner-border spinner-border-sm me-2"></span>Creating...</span>
              ) : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCommunity;