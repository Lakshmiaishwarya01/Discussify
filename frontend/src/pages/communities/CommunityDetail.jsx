import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify'; 
import '../../styles/communityDetail.css';

// Base URL for serving uploaded resources
const RESOURCE_BASE_URL = 'http://localhost:5000/resources/';

const CommunityDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  
  const [community, setCommunity] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [resources, setResources] = useState([]);
  
  const [activeTab, setActiveTab] = useState('discussions');
  const [loading, setLoading] = useState(true);

  const currentUserId = user?._id || user?.id;

  // --- MEMBER STATUS CALCULATION (Must be inside render to use 'community') ---
  const userMemberRecord = community?.members?.find(m => {
    const memberId = m.user?._id || m.user;
    return memberId?.toString() === currentUserId?.toString();
  });

  const isMember = !!userMemberRecord;
  const userRole = userMemberRecord?.role; // 'admin', 'moderator', 'member'
  const isCreator = community?.creator?.toString() === currentUserId?.toString(); // Added Creator Check

  const isPending = community?.pendingInvites?.some(
    inviteId => inviteId?.toString() === currentUserId?.toString()
  );
  // --- END MEMBER STATUS CALCULATION ---

  useEffect(() => {
    fetchCommunityData();
  }, [id, user]); 

  const fetchCommunityData = async () => {
    try {
      const commRes = await API.get(`/communities/${id}`);
      setCommunity(commRes.data.data.community);

      // Fetch content only if it's public OR the user is logged in (content controllers handle final gate)
      const [discRes, resRes] = await Promise.allSettled([
          API.get(`/communities/${id}/discussions`),
          API.get(`/communities/${id}/resources`)
      ]);

      if (discRes.status === 'fulfilled') {
          setDiscussions(discRes.value.data.data.discussions);
      } else {
          setDiscussions([]);
      }

      if (resRes.status === 'fulfilled') {
          setResources(resRes.value.data.data.resources);
      } else {
          setResources([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      if (error.response?.status === 404) {
          toast.error("Community not found");
          navigate('/communities');
      }
      // If 401/403 (Private Community Block), we still render the component to show the lock message
    }
  };

  const handleJoinCommunity = async () => {
    if (!user) { navigate('/login'); return; }

    try {
      const res = await API.post(`/communities/${id}/join`);
      const msg = res.data.message;

      if (community.isPrivate || msg.includes("Waiting")) {
          toast.info("Request sent! Waiting for admin approval.");
          setCommunity(prev => (prev ? {
              ...prev,
              pendingInvites: [...(prev.pendingInvites || []), currentUserId]
          } : prev));
      } else {
          toast.success("Welcome to the community!");
          setCommunity(prev => (prev ? {
              ...prev,
              members: [...(prev.members || []), { user: currentUserId, role: 'member' }]
          } : prev));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join.');
    }
  };

  const handleLeaveCommunity = async () => {
      if(!window.confirm("Are you sure you want to leave this community?")) return;
      try {
          await API.post(`/communities/${id}/leave`);
          toast.info("You have left the community.");
          setCommunity(prev => (prev ? {
              ...prev,
              members: (prev.members || []).filter(m => (m.user?._id || m.user)?.toString() !== currentUserId?.toString())
          } : prev));
      } catch (error) {
          toast.error(error.response?.data?.message || "Failed to leave.");
      }
  }

  // Helper for Resource Icons
  const getFileIcon = (fileType) => {
      if (!fileType) return 'bi-file-earmark-text';
      if (fileType.includes('pdf')) return 'bi-file-earmark-pdf text-danger';
      if (fileType.includes('image')) return 'bi-file-earmark-image text-primary';
      if (fileType.includes('zip') || fileType.includes('compressed')) return 'bi-file-earmark-zip text-warning';
      if (fileType.includes('word') || fileType.includes('document')) return 'bi-file-earmark-word text-primary';
      return 'bi-file-earmark-text text-secondary';
  };

  const getFileUrl = (filename) => {
      return `${RESOURCE_BASE_URL}${filename}`;
  };

  // -- STRONG CLIENT GUARD: Ensure only members can download/view resources --
  const handleDownload = (e, fileUrl) => {
      e.preventDefault();

      if (!user) {
          toast.info("Please login to download resources!");
          navigate('/login');
          return;
      }

      if (!isMember) {
          // UX-first: don't allow non-members to download or view resources
          toast.info("You must be a member of this community to view or download resources.");
          return;
      }

      // Since the user is logged in and is a member, proceed to download/view
      window.open(fileUrl, '_blank');
  };
  // -- end download guard --

  if (loading) {
    return (
      <div className="community-detail-container d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-info" role="status"></div>
      </div>
    );
  }

  if (!community) return null;

  // --- Render based on Status ---
  const isProtected = community.isPrivate && !isMember;

  return (
    <div className="community-detail-container">
      {/* HEADER SECTION (Banner) */}
      <div className="community-glass-header">
        <div className="header-backdrop"></div>
        <div className="container position-relative z-2">
          <div className="row align-items-center">
            
            <div className="col-md-8">
              <div className="d-flex align-items-center mb-2">
                <h1 className="header-title mb-0 me-3">{community.name}</h1>
                <span className={`badge rounded-pill ${community.isPrivate ? 'status-badge-admin' : 'status-badge-member'}`}>
                   {community.isPrivate ? 'Private' : 'Public'}
                </span>
              </div>
              <p className="header-lead">{community.description}</p>
              
              <div className="d-flex gap-4 header-stats mt-3">
                <span><i className="bi bi-people-fill me-2"></i>{community.members?.length || 0} Members</span>
                <span><i className="bi bi-chat-text-fill me-2"></i>{discussions?.length || 0} Discussions</span>
                <span><i className="bi bi-folder-fill me-2"></i>{resources?.length || 0} Resources</span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="col-md-4 d-flex align-items-center justify-content-md-end mt-4 mt-md-0">
              {/* Not Member */}
              {!isMember ? (
                isPending ? (
                    <button className="btn-secondary-action" disabled><i className="bi bi-hourglass-split me-2"></i>Requested</button>
                ) : (
                    <button className="btn-primary-action" onClick={handleJoinCommunity}>
                        {community.isPrivate ? 'Request to Join' : 'Join Community'}
                    </button>
                )
              ) : (
                /* Member Actions (Dropdowns are cleaner for multiple options) */
                <div className="dropdown">
                  <button className="btn-secondary-action dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i className={`bi bi-${userRole === 'admin' ? 'star' : userRole === 'moderator' ? 'shield' : 'check'}-circle-fill me-2`} 
                       style={{color: userRole === 'admin' ? '#38bdf8' : userRole === 'moderator' ? '#c084fc' : '#4ade80'}}>
                    </i>
                    {userRole?.toUpperCase() || 'MEMBER'}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    
                    {/* Admin/Moderator Button */}
                    {(userRole === 'admin' || userRole === 'moderator') && (
                        <li>
                          <button className="dropdown-item" onClick={() => navigate(`/communities/${id}/admin`)}>
                            <i className="bi bi-gear-fill me-2"></i> Admin Settings
                          </button>
                        </li>
                    )}
                    
                    {/* Leave Button */}
                    {userRole !== 'admin' && ( // Creator (admin) cannot leave, must delete
                        <li>
                          <button className="dropdown-item text-danger" onClick={handleLeaveCommunity}>
                            <i className="bi bi-box-arrow-right me-2"></i> Leave Community
                          </button>
                        </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* TABS */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'discussions' ? 'active' : ''}`} onClick={() => setActiveTab('discussions')}>
              Discussions
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')}>
              Resources
            </button>
          </li>
          {/* Add Members Tab here if needed: <button className={`nav-link`}>Members</button> */}
        </ul>

        {/* TOOLBAR (New Discussion/Resource) */}
        {isMember && (
          <div className="d-flex gap-2 mb-4">
            {activeTab === 'discussions' ? (
                <button className="btn-primary-action btn-sm" onClick={() => navigate(`/communities/${id}/create-discussion`)}>
                    <i className="bi bi-plus-lg me-2"></i>New Discussion
                </button>
            ) : (
                <button className="btn-primary-action btn-sm" onClick={() => navigate(`/communities/${id}/share-resource`)}>
                    <i className="bi bi-upload me-2"></i>Share Resource
                </button>
            )}
          </div>
        )}

        {/* CONTENT AREA */}
        {isProtected ? (
              <div className="private-lock-card text-center">
                <i className="bi bi-lock-fill" style={{fontSize: '3rem'}}></i>
                <h4 className="mt-3 text-warning">This community is private</h4>
                <p className="text-white-50">You must be a member to view content.</p>
              </div>
        ) : (
            activeTab === 'discussions' ? (
                <div className="row">
                    {discussions.length > 0 ? (
                        discussions.map(discussion => (
                            <div key={discussion._id} className="col-12">
                                <div className="discussion-glass-card p-4" onClick={() => navigate(`/discussion/${discussion._id}`)}>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h5 className="card-title-discussion mb-0">{discussion.title}</h5>
                                        {discussion.isPinned && <span className="badge bg-secondary-action text-white border"><i className="bi bi-pin-angle-fill me-1"></i>Pinned</span>}
                                    </div>
                                    <p className="card-text-muted text-truncate-2 mb-3">{discussion.content}</p>
                                    <div className="d-flex align-items-center text-white-50 small mt-3">
                                        <div className="d-flex align-items-center me-4">
                                            <i className="bi bi-person-circle me-2"></i>
                                            {discussion.author?.username || 'Unknown User'}
                                        </div>
                                        <div>
                                            <i className="bi bi-calendar3 me-2"></i>
                                            {new Date(discussion.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="private-lock-card text-center">
                            <i className="bi bi-chat-square-text text-white-50" style={{fontSize: '3rem'}}></i>
                            <p className="text-white-50 mt-3">No discussions yet. Start one!</p>
                        </div>
                    )}
                </div>
            ) : (
                // RESOURCES TAB: show resources only to members. Non-members get a clear CTA to join.
                <div className="row g-4">
                    {!isMember ? (
                      <div className="col-12">
                        <div className="private-lock-card text-center">
                          <i className="bi bi-folder2-open text-white-50" style={{fontSize: '3rem'}}></i>
                          <h4 className="mt-3 text-light">Resources are for members only</h4>
                          <p className="text-white-50 mt-2">Join this community to view and download shared resources.</p>
                          <div className="mt-3 d-flex justify-content-center gap-2">
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Member view: actual resources listing with active download buttons
                      resources.length > 0 ? (
                        resources.map(resource => (
                            <div key={resource._id} className="col-lg-6">
                                <div className="resource-glass-card p-4 h-100">
                                    <div className="d-flex align-items-start">
                                        <div className="resource-icon-box me-3">
                                            <i className={`bi ${getFileIcon(resource.fileType)}`}></i>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h5 className="mb-1">{resource.title}</h5>
                                            {resource.description && <p className="text-white-50 small mb-2">{resource.description}</p>}
                                            <div className="d-flex align-items-center text-white-50 small mb-3">
                                                <span className="me-3"><i className="bi bi-person me-1"></i>{resource.author?.username}</span>
                                                <span><i className="bi bi-clock me-1"></i>{new Date(resource.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <button 
                                                onClick={(e) => handleDownload(e, getFileUrl(resource.fileUrl))}
                                                className={`btn btn-sm btn-primary-action`}
                                            >
                                                <i className="bi bi-download me-2"></i> Download / View
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                      ) : (
                         <div className="col-12">
                           <div className="private-lock-card text-center">
                              <i className="bi bi-folder2-open text-white-50" style={{fontSize: '3rem'}}></i>
                              <p className="text-white-50 mt-3">No resources shared yet.</p>
                           </div>
                         </div>
                      )
                    )}
                </div>
            )
        )}
      </div>
    </div>
  );
};

export default CommunityDetail;
