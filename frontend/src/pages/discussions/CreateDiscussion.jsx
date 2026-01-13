import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify'; // 1. Import Toast
import '../../styles/createDiscussion.css';

const CreateDiscussion = () => {
  const navigate = useNavigate();
  const { id: communityId } = useParams();
  const { user } = useContext(AuthContext);
  
  const [community, setCommunity] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  
  const [errors, setErrors] = useState({
    title: '',
    content: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (communityId) {
      fetchCommunity();
    }
    // eslint-disable-next-line
  }, [communityId, user]);

  const fetchCommunity = async () => {
    try {
      const res = await API.get(`/communities/${communityId}`);
      const foundCommunity = res.data.data.community;
      setCommunity(foundCommunity);

      // --- ROBUST MEMBERSHIP CHECK ---
      const currentUserId = user?._id || user?.id;
      
      const isMember = foundCommunity.members.some(m => {
        const memberId = m.user?._id || m.user;
        return memberId?.toString() === currentUserId?.toString();
      });
      
      // If not a member, kick them out nicely
      if (!isMember) {
        toast.error('You must join this community to post discussions.');
        navigate(`/communities/${communityId}`);
      }
    } catch (error) {
      console.error('Error fetching community:', error);
      toast.error("Community not found");
      navigate('/communities');
    }
  };

  // 1. Dynamic Validation Helper
  const validateField = (name, value) => {
    let errorMsg = '';
    
    switch (name) {
        case 'title':
            if (!value.trim()) errorMsg = 'Title is required';
            else if (value.length < 5) errorMsg = 'Title must be at least 5 characters';
            else if (value.length > 100) errorMsg = 'Title must not exceed 100 characters';
            break;
        case 'content':
            if (!value.trim()) errorMsg = 'Content is required';
            else if (value.length < 10) errorMsg = 'Content must be at least 10 characters';
            break;
        default:
            break;
    }

    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Run validation immediately
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    // Final safety check
    if (!formData.title.trim() || !formData.content.trim() || errors.title || errors.content) {
        validateField('title', formData.title);
        validateField('content', formData.content);
        return;
    }

    setLoading(true);

    try {
      // POST /communities/:id/discussions
      const res = await API.post(`/communities/${communityId}/discussions`, formData);

      toast.success('Discussion created successfully!');
      
      // 2. Smart Redirect: Go to the NEW discussion to see it immediately
      const newDiscussionId = res.data.data.discussion._id;
      
      setTimeout(() => {
        navigate(`/discussion/${newDiscussionId}`);
      }, 1000);

    } catch (error) {
      console.error('Error creating discussion:', error);
      const msg = error.response?.data?.message || 'Failed to create discussion.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = 
    formData.title.length >= 5 && 
    formData.content.length >= 10 && 
    !errors.title && 
    !errors.content;

  if (!community) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="create-discussion-container">
      <div className="container py-2">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="create-discussion-card p-4 border rounded shadow-sm bg-white">
              <div className="mb-3">
                <button
                  className="btn btn-link text-decoration-none ps-0"
                  onClick={() => navigate(`/communities/${communityId}`)}
                >
                  <i className="bi bi-arrow-left me-2"></i>Back to Community
                </button>
              </div>
              
              <h2 className="mb-4 text-primary">Start a New Discussion</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="title" className="form-label fw-bold">
                    Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.title ? 'is-invalid' : ''} ${!errors.title && formData.title.length >= 5 ? 'is-valid' : ''}`}
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    onBlur={(e) => validateField('title', e.target.value)}
                    placeholder="e.g., What are the best practices for React Hooks?"
                    required
                  />
                  {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                </div>

                <div className="mb-3">
                  <label htmlFor="content" className="form-label fw-bold">
                    Content <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className={`form-control ${errors.content ? 'is-invalid' : ''} ${!errors.content && formData.content.length >= 10 ? 'is-valid' : ''}`}
                    id="content"
                    name="content"
                    rows="8"
                    value={formData.content}
                    onChange={handleChange}
                    onBlur={(e) => validateField('content', e.target.value)}
                    placeholder="Share your thoughts, ask questions, or provide details..."
                    required
                  />
                  {errors.content && (
                    <div className="invalid-feedback">{errors.content}</div>
                  )}

                </div>

                <div className="d-flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={loading || !isFormValid}
                  >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Publishing...
                        </>
                    ) : 'Publish Discussion'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={() => navigate(`/communities/${communityId}`)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDiscussion;