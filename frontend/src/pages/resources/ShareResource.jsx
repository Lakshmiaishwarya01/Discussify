import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api'; 
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../../styles/shareResource.css';

const ShareResource = () => {
  const navigate = useNavigate();
  const { id: communityId } = useParams();
  const { user } = useContext(AuthContext);
  
  const [community, setCommunity] = useState(null);
  
  // 1. Updated State for File Upload
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [file, setFile] = useState(null);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCommunity();
    // eslint-disable-next-line
  }, [communityId]);

  const fetchCommunity = async () => {
    try {
      // 2. Real API Call
      const res = await API.get(`/communities/${communityId}`);
      const foundCommunity = res.data.data.community;
      setCommunity(foundCommunity);

      // Check Membership
      const currentUserId = user?._id || user?.id;
      const isMember = foundCommunity.members.some(m => 
        (m.user._id || m.user) === currentUserId
      );
      
      if (!isMember) {
        toast.error('You must join to share resources');
        navigate(`/communities/${communityId}`);
      }
    } catch (error) {
      console.error('Error fetching community:', error);
      toast.error('Community not found');
      navigate('/communities');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 3. File Handler
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        if (selectedFile.size > 5 * 1024 * 1024) { // 5MB Limit
            toast.error("File size must be less than 5MB");
            return;
        }
        setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) { navigate('/login'); return; }

    if (!formData.title.trim() || !file) {
      toast.error("Title and File are required");
      return;
    }

    setLoading(true);

    try {
      // 4. Create FormData for File Upload
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('resource', file); // Key must match backend upload.single('resource')

      // POST /communities/:id/resources
      await API.post(`/communities/${communityId}/resources`, data);

      toast.success('Resource shared successfully!');
      
      setTimeout(() => {
        navigate(`/communities/${communityId}`);
      }, 1000);

    } catch (error) {
      console.error('Error sharing resource:', error);
      const msg = error.response?.data?.message || 'Failed to share resource.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!community) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="share-resource-container">
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="share-resource-card p-4 border rounded shadow-sm bg-white">
              <div className="mb-3">
                <button
                  className="btn btn-link text-decoration-none ps-0"
                  onClick={() => navigate(`/communities/${communityId}`)}
                >
                  <i className="bi bi-arrow-left me-2"></i>Back to {community.name}
                </button>
              </div>
              
              <h2 className="mb-4 text-primary">Share a Resource</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="title" className="form-label fw-bold">
                    Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. React Cheatsheet 2025"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="description" className="form-label fw-bold">
                    Description
                  </label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Briefly describe this resource..."
                  />
                </div>

                {/* 5. File Input Field */}
                <div className="mb-4">
                  <label htmlFor="file" className="form-label fw-bold">
                    Upload File <span className="text-danger">*</span>
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="file"
                    onChange={handleFileChange}
                    required
                  />
                  <div className="form-text">
                    Max size: 5MB. Supported: PDF, Images, Zip, Docx.
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={loading}
                  >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Uploading...
                        </>
                    ) : 'Share Resource'}
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

export default ShareResource;