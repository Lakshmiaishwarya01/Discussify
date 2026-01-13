import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../../styles/profileHome.css';

const IMG_BASE_URL = 'http://localhost:5000/';

const ProfileHome = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    
    const [communities, setCommunities] = useState([]);
    const [discussions, setDiscussions] = useState([]);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (user) {
        fetchData();
      }
      // eslint-disable-next-line
    }, [user]);

    const fetchData = async () => {
      try {
        // 1. Fetch All Communities
        const commsRes = await API.get('/communities');
        const allCommunities = commsRes.data.data.communities;

        // 2. Filter: Get only communities where current user is a member
        let myCommunities = allCommunities.filter(comm => 
          comm.members.some(m => {
              const memberId = m.user?._id || m.user;
              return memberId?.toString() === user._id?.toString();
          })
        );
        
        // 3. SORT BY LATEST ACTIVITY (Ensuring active communities appear first)
        myCommunities.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        setCommunities(myCommunities);

        // 4. Feed Logic: Fetch content from the top 5 most active communities
        const feedCommunities = myCommunities.slice(0, 5);
        
        const discPromises = feedCommunities.map(c => API.get(`/communities/${c._id}/discussions`));
        const resPromises = feedCommunities.map(c => API.get(`/communities/${c._id}/resources`));

        const [discResults, resResults] = await Promise.all([
            Promise.allSettled(discPromises),
            Promise.allSettled(resPromises)
        ]);

        // 5. Aggregate Discussions
        let feedDiscussions = [];
        discResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const commDiscussions = result.value.data.data.discussions.map(d => ({
                    ...d,
                    communityName: feedCommunities[index].name,
                    communityId: feedCommunities[index]._id
                }));
                feedDiscussions = [...feedDiscussions, ...commDiscussions];
            }
        });

        // 6. Aggregate Resources
        let feedResources = [];
        resResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const commResources = result.value.data.data.resources.map(r => ({
                    ...r,
                    communityName: feedCommunities[index].name,
                    communityId: feedCommunities[index]._id
                }));
                feedResources = [...feedResources, ...commResources];
            }
        });

        // 7. Sort and Limit to 5
        setDiscussions(feedDiscussions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
        setResources(feedResources.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));

        setLoading(false);

      } catch (error) {
        console.error('Error fetching feed:', error);
        toast.error("Could not load your feed");
        setLoading(false);
      }
    };

    // Helper for Images (using global constant IMG_BASE_URL)
    const getImgSrc = (path, type = 'community') => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${IMG_BASE_URL}img/${type === 'user' ? 'users' : 'communities'}/${path}`;
    };

    // Helper for Resource Links
    const getResourceLink = (filename) => {
        return `${IMG_BASE_URL}resources/${filename}`;
    };

    if (loading) {
      return (
        <div className="profile-home-container d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <div className="spinner-border text-info" role="status"></div>
        </div>
      );
    }
    if (!user) {
        navigate('/login');
        return null;
    }


    return (
      <div className="profile-home-container">
        <div className="container-fluid">
          <div className="row">
            
            {/* Sidebar (Quick Access & My Communities) */}
            <div className="col-lg-3 col-md-4 sidebar">
              <div className="sidebar-content"> {/* Glass Sidebar Container */}
                <div className="sidebar-section">
                  <h6 className="sidebar-title">Quick Actions</h6>
                  <ul className="sidebar-menu">
                    <li>
                      <button className="sidebar-link" onClick={() => navigate('/create-community')}>
                        <i className="bi bi-plus-circle me-2"></i>Create Community
                      </button>
                    </li>
                    <li>
                      <button className="sidebar-link" onClick={() => navigate('/communities')}>
                        <i className="bi bi-search me-2"></i>Explore Communities
                      </button>
                    </li>
                    <li>
                      <button className="sidebar-link" onClick={() => navigate('/profile-settings')}>
                        <i className="bi bi-gear me-2"></i>Settings
                      </button>
                    </li>
                    <li>
                      <button className="sidebar-link" onClick={() => navigate('/notifications')}>
                        <i className="bi bi-bell me-2"></i>Notifications
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="sidebar-section mt-4">
                  <h6 className="sidebar-title">My Communities</h6>
                  <div className="community-list">
                    {communities.length > 0 ? (
                      communities.slice(0, 5).map(community => (
                        <div 
                          key={community._id} 
                          className="community-item"
                          onClick={() => navigate(`/communities/${community._id}`)}
                        >
                          <div className="community-icon">
                              {community.icon ? (
                                <img 
                                    src={getImgSrc(community.icon, 'community')} 
                                    alt={community.name} 
                                    style={{width: '100%', height: '100%', borderRadius: '8px'}} 
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <i className="bi bi-people-fill"></i>
                              )}
                          </div>
                          <div className="community-info">
                            <strong>{community.name}</strong>
                            <small className="text-muted d-block">
                              {community.members.length} members
                            </small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted small text-center mt-3">
                        <i className="bi bi-inbox me-1"></i> No joined communities
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main Content (Welcome Banner & Feeds) */}
            <div className="col-lg-9 col-md-8 main-content">
              
              {/* Welcome Banner (Now a Glass Card) */}
              <div className="welcome-glass-card mb-4">
                <h2>Welcome back, {user?.username}!</h2>
                <p className="text-muted">Here's what's happening in your communities</p>
              </div>

              {/* Joined Community Cards (Top 3) */}
              <div className="section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4>Your Top Communities</h4>
                  <button 
                    className="btn btn-primary btn-sm rounded-pill"
                    onClick={() => navigate('/communities?filter=joined')}
                  >
                    View All
                  </button>
                </div>
                <div className="row g-4">
                  {communities.length > 0 ? (
                    communities.slice(0, 3).map(community => (
                      <div key={community._id} className="col-md-6 col-lg-4">
                        <div 
                          className="community-card"
                          onClick={() => navigate(`/communities/${community._id}`)}
                        >
                          <div className="community-card-header">
                            <div className="community-card-icon">
                              {community.icon ? (<img src={getImgSrc(community.icon, 'community')} alt={community.name} />) : (<i className="bi bi-people-fill"></i>)}
                            </div>
                            <span className={`badge ${community.isPrivate ? 'bg-warning text-dark' : 'bg-success'}`}>
                              {community.isPrivate ? 'Private' : 'Public'}
                            </span>
                          </div>
                          <div className="community-card-body">
                            <h5 className="text-truncate">{community.name}</h5>
                            <p className="text-muted small text-truncate">{community.description}</p>
                            <div className="community-stats">
                              <span><i className="bi bi-people me-1"></i>{community.members.length} members</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12">
                      <div className="empty-state">
                        <i className="bi bi-inbox"></i>
                        <p className="text-muted mt-3">You haven't joined any communities yet</p>
                        <button className="btn btn-primary" onClick={() => navigate('/communities')}>
                          Explore Communities
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Discussions Feed */}
              <div className="section mb-4">
                <h4 className="mb-3">Recent Discussions</h4>
                {discussions.length > 0 ? (
                  <div className="discussion-list">
                    {discussions.map(discussion => (
                      <div key={discussion._id} className="discussion-item" onClick={() => navigate(`/discussion/${discussion._id}`)}>
                        <div className="discussion-content w-100">
                          <div className="d-flex justify-content-between">
                            <h6 className="mb-1">{discussion.title}</h6>
                            <small className="text-muted">{new Date(discussion.createdAt).toLocaleDateString()}</small>
                          </div>
                          <p className="text-muted small mb-2 text-truncate">{discussion.content}</p>
                          <div className="discussion-meta">
                            <span className="text-primary small fw-bold">
                              <i className="bi bi-people-fill me-1"></i>
                              {discussion.communityName}
                            </span>
                            <span className="text-muted small ms-3">
                              <i className="bi bi-heart-fill text-danger me-1"></i>
                              {discussion.likes?.length || 0} likes
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No recent discussions in your top communities.</p>
                )}
              </div>

              {/* Recent Resources Feed */}
              <div className="section">
                <h4 className="mb-3">Recent Resources</h4>
                {resources.length > 0 ? (
                  <div className="resource-list">
                    {resources.map(resource => (
                      <div key={resource._id} className="resource-item" onClick={() => window.open(getResourceLink(resource.fileUrl), '_blank')}>
                        <div className="resource-icon me-3 fs-3">
                          <i className="bi bi-file-earmark-arrow-down"></i>
                        </div>
                        <div className="resource-content flex-grow-1">
                          <h6 className="mb-0">
                            {resource.title}
                          </h6>
                          <p className="text-muted small mb-0">
                            Shared in <strong className="text-primary">{resource.communityName}</strong>
                          </p>
                        </div>
                        <a href={getResourceLink(resource.fileUrl)} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-download"></i>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No recent resources shared.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default ProfileHome;