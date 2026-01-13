import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../../styles/communityAdmin.css'; // New Stylesheet for Admin Page

const IMG_URL_COMMUNITY = 'http://localhost:5000/img/communities/';
const IMG_URL_USER = 'http://localhost:5000/img/users/';

const CommunityAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [community, setCommunity] = useState(null);
  const [activeTab, setActiveTab] = useState('members'); // Default to members
  
  // Settings Form State
  const [formData, setFormData] = useState({ name: '', description: '', isPrivate: false });
  const [iconFile, setIconFile] = useState(null);     
  const [iconPreview, setIconPreview] = useState(null);
  
  // Invite Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  // 1. Initial Data Fetch
  useEffect(() => {
    fetchCommunityData();
    // eslint-disable-next-line
  }, [id]);

  // 2. Live Search Effect (Debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
        if (searchTerm.trim()) {
            setSearching(true);
            try {
                const res = await API.get(`/users/search?search=${encodeURIComponent(searchTerm)}`);
                setSearchResults(res.data.data.users);
            } catch (error) {
                console.error(error);
            } finally {
                setSearching(false);
            }
        } else {
            setSearchResults([]);
        }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchCommunityData = async () => {
    try {
      const res = await API.get(`/communities/${id}`);
      const data = res.data.data.community;
      
      const memberRec = data.members.find(m => (m.user._id || m.user) === user?._id);
      const role = memberRec?.role;

      // SECURITY CHECK: Unauthorized access redirect
      if (role !== 'admin' && role !== 'moderator') {
          toast.error("Unauthorized access");
          navigate(`/communities/${id}`);
          return;
      }

      setCurrentUserRole(role);
      
      // If Admin, default to settings. If Mod, default to members.
      if (role === 'admin' && activeTab === 'members') setActiveTab('settings');

      setCommunity(data);
      setFormData({ name: data.name, description: data.description, isPrivate: data.isPrivate });

      if(data.icon) {
          const src = data.icon.startsWith('http') ? data.icon : `${IMG_URL_COMMUNITY}${data.icon}`;
          setIconPreview(src);
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      navigate('/communities');
    }
  };

  // --- HANDLERS ---

  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if(file) {
          if(file.size > 5 * 1024 * 1024) { toast.error("Image too large (max 5MB)"); return; }
          setIconFile(file);
          const reader = new FileReader();
          reader.onloadend = () => setIconPreview(reader.result);
          reader.readAsDataURL(file);
      }
  };

  const handleUpdate = async (e) => {
      e.preventDefault();
      try {
          // Uses FormData because backend expects multipart/form-data for image upload
          const data = new FormData();
          data.append('name', formData.name);
          data.append('description', formData.description);
          data.append('isPrivate', formData.isPrivate);
          if(iconFile) data.append('icon', iconFile); // Field name must be 'icon'

          const res = await API.patch(`/communities/${id}`, data, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          setCommunity(res.data.data.community); 
          toast.success("Community updated!");
      } catch (error) { toast.error("Update failed"); }
  };

  const handleKick = async (userId) => {
      if (!window.confirm("Kick this user?")) return;
      try {
          await API.patch(`/communities/${id}/kick`, { userId });
          toast.success("User kicked");
          fetchCommunityData(); 
      } catch (error) { toast.error(error.response?.data?.message || "Failed to kick user"); }
  };

  const handleRoleUpdate = async (userId, currentRole) => {
      const newRole = currentRole === 'member' ? 'moderator' : 'member';
      const action = currentRole === 'member' ? 'Promote to Moderator' : 'Demote to Member';
      if (!window.confirm(`Are you sure you want to ${action}?`)) return;

      try {
          await API.patch(`/communities/${id}/role`, { userId, role: newRole });
          toast.success("Role updated");
          fetchCommunityData(); 
      } catch (error) { toast.error("Failed to update role"); }
  };

  const handleRequest = async (userId, status) => {
      try {
          await API.patch(`/communities/${id}/requests`, { userId, status });
          toast.success(`Request ${status}`);
          fetchCommunityData(); 
      } catch (error) { toast.error("Action failed"); }
  };

  const handleDeleteCommunity = async () => {
      if (!window.confirm("WARNING: Delete Community? This cannot be undone and requires zero active discussions!")) return;
      try {
          await API.delete(`/communities/${id}`);
          toast.success("Community deleted");
          navigate('/communities');
      } catch (error) { toast.error(error.response?.data?.message || "Failed to delete"); }
  };

  const handleInviteUser = async (userId) => {
      try {
          await API.post(`/communities/${id}/invite`, { userId });
          toast.success("Invite sent!");
          setSearchResults(prev => prev.filter(u => u._id !== userId));
      } catch (error) {
          toast.error(error.response?.data?.message || "Failed to invite");
      }
  };

  if (loading || !community) return <div className="admin-page text-center pt-5"><div className="spinner-border text-info"></div></div>;

  return (
    <div className="admin-page">
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 admin-header">
                <h2 className="admin-title">
                    Manage: <span className="text-info">{community.name}</span>
                    {currentUserRole === 'moderator' && <span className="badge-mod-view ms-2">Mod View</span>}
                </h2>
                <button className="btn-secondary-action" onClick={() => navigate(`/communities/${id}`)}>
                    <i className="bi bi-arrow-left me-2"></i> View Community
                </button>
            </div>

            <div className="row g-4">
                {/* SIDEBAR (3 Columns) */}
                <div className="col-md-3">
                    <div className="admin-sidebar-nav">
                        
                        {/* 1. Admin/Settings Tab (Admin Only) */}
                        {currentUserRole === 'admin' && (
                            <button className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                                <i className="bi bi-gear-fill me-2"></i>Settings
                            </button>
                        )}
                        
                        {/* 2. Members Tab */}
                        <button className={`sidebar-nav-item ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
                            <i className="bi bi-people-fill me-2"></i>Members 
                            <span className="badge-count ms-2">{community.members.length}</span>
                        </button>
                        
                        {/* 3. Requests Tab (Admin/Mod) */}
                        <button className={`sidebar-nav-item ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
                            <i className="bi bi-person-plus-fill me-2"></i>Requests 
                            {community.pendingInvites?.length > 0 && <span className="badge-request ms-2">{community.pendingInvites.length}</span>}
                        </button>
                        
                        {/* 4. Invite Tab (Admin/Mod) */}
                        <button className={`sidebar-nav-item ${activeTab === 'invite' ? 'active' : ''}`} onClick={() => setActiveTab('invite')}>
                            <i className="bi bi-envelope-plus-fill me-2"></i>Invite Members
                        </button>
                    </div>
                </div>

                {/* MAIN CONTENT AREA (9 Columns) */}
                <div className="col-md-9">
                    <div className="admin-card-main">
                        
                        {/* --- TAB 1: SETTINGS (Admin Only) --- */}
                        {activeTab === 'settings' && currentUserRole === 'admin' && (
                            <form onSubmit={handleUpdate}>
                                <h4 className="card-title-main text-white mb-4">Community Settings</h4>
                                
                                <div className="d-flex flex-column align-items-center mb-4">
                                    <div className="community-icon-upload-area">
                                        <img 
                                            src={iconPreview || 'https://via.placeholder.com/100'} 
                                            className="community-icon-preview" 
                                            alt="Icon Preview"
                                        />
                                        <label htmlFor="icon-file" className="icon-upload-label">
                                            <i className="bi bi-camera-fill"></i>
                                        </label>
                                        <input type="file" id="icon-file" name="icon" className="d-none" onChange={handleFileChange} accept="image/*" />
                                    </div>
                                    <p className="text-white-50 small mt-2">Max 5MB (Image only)</p>
                                </div>
                                
                                {/* Form Inputs */}
                                <div className="mb-3">
                                    <label className="glass-label">Community Name</label>
                                    <input className="glass-form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Name" required />
                                </div>
                                
                                <div className="mb-4">
                                    <label className="glass-label">Description</label>
                                    <textarea className="glass-form-input" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Description" required />
                                </div>
                                
                                {/* Privacy Toggle */}
                                <div className="mb-4">
                                    <div className="glass-toggle-container">
                                        <div>
                                            <span className="text-white fw-bold d-block">Private Community</span>
                                            <span className="text-white-50 small">Requires invitations to join.</span>
                                        </div>
                                        <div className="form-check form-switch m-0">
                                            <input className="form-check-input custom-switch" type="checkbox" checked={formData.isPrivate} onChange={e => setFormData({...formData, isPrivate: e.target.checked})} />
                                        </div>
                                    </div>
                                </div>
                                
                                <button className="btn-glow-primary w-100 mb-3">Save Changes</button>
                                
                                {/* Danger Zone */}
                                <div className="danger-zone-card">
                                    <h5 className="text-danger fw-bold">Danger Zone</h5>
                                    <button type="button" className="btn-delete-community" onClick={handleDeleteCommunity}>
                                        Delete Community
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* --- TAB 2: MEMBERS --- */}
                        {activeTab === 'members' && (
                            <div>
                                <h4 className="card-title-main text-white mb-4">
                                    Members ({community.members.length})
                                </h4>
                                
                                <ul className="member-list-group">
                                    {community.members.map((member) => (
                                        <li key={member._id} className="member-list-item">
                                            <div className="d-flex align-items-center">
                                                <img 
                                                    src={member.user.photo && member.user.photo !== 'default.jpg' ? `${IMG_URL_USER}${member.user.photo}` : `https://ui-avatars.com/api/?name=${member.user.username}&background=random`} 
                                                    className="member-avatar" 
                                                    alt={member.user.username}
                                                />
                                                <div>
                                                    <h6 className="member-username">{member.user.username}</h6>
                                                    <span className={`member-role role-${member.role}`}>{member.role}</span>
                                                </div>
                                            </div>
                                            
                                            {/* Actions: Promote/Demote/Kick */}
                                            {member.user._id !== user._id && (
                                                <div className="member-actions-group">
                                                    
                                                    {/* 1. Promote/Demote (Admin Only) */}
                                                    {currentUserRole === 'admin' && member.role !== 'admin' && (
                                                        <button 
                                                            className="btn-admin-action btn-sm btn-demote me-2" 
                                                            onClick={() => handleRoleUpdate(member.user._id, member.role)}
                                                        >
                                                            {member.role === 'member' ? 'Promote' : 'Demote'}
                                                        </button>
                                                    )}
                                                    
                                                    {/* 2. Kick (Admin or Mod kicking Member) */}
                                                    {(currentUserRole === 'admin' || (currentUserRole === 'moderator' && member.role === 'member')) && (
                                                        <button className="btn-admin-action btn-kick" onClick={() => handleKick(member.user._id)}>
                                                            <i className="bi bi-person-x-fill"></i> Kick
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* --- TAB 3: REQUESTS --- */}
                        {activeTab === 'requests' && (
                            <div>
                                <h4 className="card-title-main text-white mb-4">
                                    Join Requests ({community.pendingInvites?.length || 0})
                                </h4>
                                
                                {(!community.pendingInvites || community.pendingInvites.length === 0) ? 
                                    <p className="text-white-50 text-center py-5">No pending requests.</p> : 
                                    (
                                    <ul className="member-list-group">
                                        {community.pendingInvites.map((invite) => (
                                            <li key={invite._id} className="member-list-item">
                                                <span className="member-username">{invite.username || 'Unknown'}</span>
                                                <div className="member-actions-group">
                                                    <button className="btn-success-action me-2" onClick={() => handleRequest(invite._id, 'approved')}>
                                                        Approve
                                                    </button>
                                                    <button className="btn-kick" onClick={() => handleRequest(invite._id, 'rejected')}>
                                                        Reject
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* --- TAB 4: INVITE --- */}
                        {activeTab === 'invite' && (
                            <div>
                                <h4 className="card-title-main text-white mb-4">Invite Members</h4>
                                
                                <div className="glass-search-wrapper mb-4">
                                    <i className="bi bi-search search-icon"></i>
                                    <input 
                                        type="text" className="glass-form-input" placeholder="Search users by name or email..." 
                                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    {searching && (
                                        <div className-="spinner-wrapper"><div className="spinner-border spinner-border-sm text-info"></div></div>
                                    )}
                                </div>
                                
                                <ul className="list-group invite-results-list">
                                    {searchResults.length > 0 ? searchResults.map(u => (
                                        <li key={u._id} className="member-list-item">
                                            <div className="d-flex align-items-center">
                                                <img 
                                                    src={u.photo && u.photo !== 'default.jpg' ? `${IMG_URL_USER}${u.photo}` : `https://ui-avatars.com/api/?name=${u.username}&background=random`} 
                                                    className="member-avatar" 
                                                    alt={u.username}
                                                />
                                                <span className="member-username">{u.username}</span>
                                            </div>
                                            <button className="btn-success-action" onClick={() => handleInviteUser(u._id)}>
                                                Invite
                                            </button>
                                        </li>
                                    )) : searchTerm.trim() && !searching ? (
                                        <p className="text-white-50 text-center py-3">No users found matching "{searchTerm}".</p>
                                    ) : (
                                        <p className="text-white-50 text-center py-3">Start typing to search and invite users.</p>
                                    )}
                                </ul>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CommunityAdmin;