import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api'; 
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify'; 
import '../../styles/profileSettings.css';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext); 
  const [activeTab, setActiveTab] = useState('edit');
  
  // Form State
  const [formData, setFormData] = useState({
    username: '',
    bio: ''
  });

  const [photoFile, setPhotoFile] = useState(null); 
  const [photoPreview, setPhotoPreview] = useState(null); 
  const [loading, setLoading] = useState(false);

  // Activity State
  const [activities, setActivities] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // 1. SYNC DATA: Populate form when 'user' context is ready
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        bio: user.bio || ''
      });

      // Handle initial photo preview
      if (user.photo) {
         const imgUrl = user.photo.startsWith('http') 
            ? user.photo 
            : `http://localhost:5000/img/users/${user.photo}`;
         setPhotoPreview(imgUrl);
      }
    }
  }, [user]);

  // 2. FETCH ACTIVITY: When tab changes
  useEffect(() => {
    if (activeTab === 'activity') {
        fetchUserActivity();
    }
  }, [activeTab]);

  const fetchUserActivity = async () => {
    setLoadingActivity(true);
    try {
        const res = await API.get('/users/activity');
        setActivities(res.data.data.activity);
    } catch (error) {
        console.error(error);
        // Don't toast error on 404 (empty), just log it
    } finally {
        setLoadingActivity(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should not exceed 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      setPhotoFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('username', formData.username);
      data.append('bio', formData.bio);
      
      if (photoFile) {
        data.append('photo', photoFile);
      }

      const res = await API.patch('/users/profile', data);

      // Update Frontend Context
      const updatedUser = res.data.data.user;
      login(updatedUser, localStorage.getItem('token'));

      toast.success('Profile updated successfully!');
      
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to update profile.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-settings-container">
      <div className="container py-4">
        <div className="row">
          {/* SIDEBAR */}
          <div className="col-lg-3">
            <div className="settings-sidebar bg-white p-3 rounded shadow-sm mb-4">
              <h4 className="mb-4 ps-2">Settings</h4>
              <ul className="settings-menu list-unstyled">
                <li>
                  <button
                    className={`btn w-100 text-start mb-2 ${activeTab === 'edit' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setActiveTab('edit')}
                  >
                    <i className="bi bi-person me-2"></i>Edit Profile
                  </button>
                </li>
                <li>
                  <button
                    className={`btn w-100 text-start ${activeTab === 'activity' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setActiveTab('activity')}
                  >
                    <i className="bi bi-clock-history me-2"></i>View Activity
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="col-lg-9">
            <div className="settings-content">
              {activeTab === 'edit' ? (
                /* --- EDIT PROFILE TAB --- */
                <div className="settings-card bg-white p-4 rounded shadow-sm">
                  <h3 className="mb-4">Edit Profile</h3>
                  <form onSubmit={handleSubmit}>
                    
                    {/* PHOTO UPLOAD */}
                    <div className="mb-4 text-center">
                      <div className="position-relative d-inline-block">
                        <img
                          src={photoPreview || `https://ui-avatars.com/api/?background=random&name=${user?.username || 'User'}`}
                          alt="Profile"
                          className="rounded-circle mb-3 border"
                          style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                        />
                        <label 
                            htmlFor="photo" 
                            className="position-absolute bottom-0 end-0 btn btn-sm btn-primary rounded-circle"
                            style={{width: '35px', height: '35px', padding: '6px', cursor: 'pointer'}}
                            title="Change Photo"
                        >
                          <i className="bi bi-camera-fill"></i>
                        </label>
                      </div>
                      
                      <input
                        type="file"
                        id="photo"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="email" className="form-label fw-bold">Email</label>
                      <input
                        type="email"
                        className="form-control bg-light"
                        id="email"
                        value={user?.email || ''}
                        disabled
                        readOnly
                      />
                      <small className="text-muted">Email cannot be changed</small>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="username" className="form-label fw-bold">Username</label>
                      <input
                        type="text"
                        className="form-control"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        minLength={4}
                        maxLength={20}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="bio" className="form-label fw-bold">Bio</label>
                      <textarea
                        className="form-control"
                        id="bio"
                        name="bio"
                        rows="4"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div className="d-flex gap-2 mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary px-4"
                        disabled={loading}
                      >
                        {loading ? (
                             <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Saving...
                             </>
                        ) : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary px-4"
                        onClick={() => navigate('/')}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* --- ACTIVITY TAB --- */
                <div className="settings-card bg-white p-4 rounded shadow-sm">
                    <h3 className="mb-4">Your Activity</h3>
                    
                    {loadingActivity ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                        </div>
                    ) : activities.length > 0 ? (
                        <div className="activity-feed">
                            {activities.map((item, index) => (
                                <div key={index} className="d-flex mb-4 pb-3 border-bottom">
                                    <div className="me-3">
                                        {/* Dynamic Icons based on Type */}
                                        {item.type === 'created_community' && <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: 40, height: 40}}><i className="bi bi-house-add"></i></div>}
                                        {item.type === 'joined_community' && <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: 40, height: 40}}><i className="bi bi-person-check"></i></div>}
                                        {item.type === 'left_community' && <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: 40, height: 40}}><i className="bi bi-box-arrow-right"></i></div>}
                                        {item.type === 'discussion' && <div className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: 40, height: 40}}><i className="bi bi-chat-dots"></i></div>}
                                        {item.type === 'comment' && <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: 40, height: 40}}><i className="bi bi-reply"></i></div>}
                                        {item.type === 'resource' && (
                                            <div className="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center" style={{width: 40, height: 40}}>
                                                <i className="bi bi-file-earmark-arrow-up"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="mb-1">
                                            {item.type === 'created_community' && <span>Created the community <strong>{item.title}</strong></span>}
                                            {item.type === 'joined_community' && <span>Joined the community <strong>{item.title}</strong></span>}
                                            {item.type === 'left_community' && <span>Left the community <strong>{item.title}</strong></span>}
                                            {item.type === 'discussion' && <span>Started a discussion <strong>{item.title}</strong> in {item.communityName}</span>}
                                            {item.type === 'comment' && <span>Commented on <strong>{item.title}</strong> in {item.communityName}</span>}
                                            {item.type === 'resource' && (
                                                <span>Shared a resource <strong>{item.title}</strong> in {item.communityName}</span>
                                            )}
                                        </p>
                                        <small className="text-muted">
                                            {new Date(item.date).toLocaleDateString(undefined, {
                                                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <i className="bi bi-clock-history text-muted" style={{fontSize: '3rem'}}></i>
                            <p className="text-muted mt-3">No activity found yet.</p>
                        </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;