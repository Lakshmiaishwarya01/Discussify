import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../../styles/communities.css';

const Communities = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { user } = useContext(AuthContext);
  
  const [communities, setCommunities] = useState([]);
  const [filteredCommunities, setFilteredCommunities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(null);
  
  const [filter, setFilter] = useState('all'); 

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filter');
    if (filterParam) setFilter(filterParam);
  }, [location.search]);

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      filterCommunities();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filter, communities, user]);

  const fetchCommunities = async () => {
    try {
      const res = await API.get('/communities');
      setCommunities(res.data.data.communities);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching communities:', error);
      setLoading(false);
    }
  };

  const filterCommunities = () => {
    if (!communities) return;
    let filtered = [...communities];
    const currentUserId = user?._id || user?.id;

    if (filter === 'public') filtered = filtered.filter(c => !c.isPrivate);
    else if (filter === 'private') filtered = filtered.filter(c => c.isPrivate);
    else if (filter === 'joined' && currentUserId) {
      filtered = filtered.filter(c => 
        c.members && c.members.some(m => {
            const memberId = m.user?._id || m.user;
            return memberId?.toString() === currentUserId.toString();
        })
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredCommunities(filtered);
  };

  const handleJoinCommunity = async (e, communityId) => {
    e.stopPropagation(); // Prevent card click
    if (!user) {
      navigate('/login');
      return;
    }

    setJoinLoading(communityId);
    try {
      const res = await API.post(`/communities/${communityId}/join`);
      const msg = res.data.message;
      if(msg.includes("Waiting") || msg.includes("Request")) toast.info(msg);
      else toast.success(msg || "Joined!");
      
      fetchCommunities(); 
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join.');
    } finally {
        setJoinLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="communities-page d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="communities-page">
      <div className="comm-orb-1"></div>
      <div className="comm-orb-2"></div>

      <div className="container position-relative z-1">
        
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
          <div>
            <h2 className="page-title">Explore Communities</h2>
            <p className="text-white-50 m-0">Find your tribe and start the conversation</p>
          </div>
          <button
            className="btn-create-glass mt-3 mt-md-0"
            onClick={() => navigate('/create-community')}
          >
            <i className="bi bi-plus-lg me-2"></i>Create New
          </button>
        </div>

        {/* Toolbar */}
        <div className="glass-toolbar mb-5">
          <div className="row g-3 align-items-center">
            <div className="col-md-8">
              <div className="glass-search-wrapper">
                <i className="bi bi-search search-icon"></i>
                <input
                  type="text"
                  className="glass-search-input"
                  placeholder="Search communities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select
                className="glass-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Communities</option>
                <option value="public">Public Only</option>
                <option value="private">Private Only</option>
                {user && <option value="joined">My Communities</option>}
              </select>
            </div>
          </div>
        </div>

        {/* Grid */}
        {filteredCommunities.length > 0 ? (
          <div className="row g-4">
            {filteredCommunities.map(community => {
              const currentUserId = user?._id || user?.id;
              
              const userMemberRecord = community.members?.find(m => {
                  const memberId = m.user?._id || m.user;
                  return memberId?.toString() === currentUserId?.toString();
              });

              const isMember = !!userMemberRecord;
              const userRole = userMemberRecord?.role; 
              const creatorId = community.creator?._id || community.creator;
              const isCreator = creatorId?.toString() === currentUserId?.toString();
              const isPending = community.pendingInvites && community.pendingInvites.some(
                  id => id?.toString() === currentUserId?.toString()
              );

              return (
                <div key={community._id} className="col-lg-4 col-md-6">
                  <div className="community-card-glass h-100">
                    <div className="card-body p-4 d-flex flex-column h-100">
                      
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="community-icon-box">
                          {community.icon ? (
                            <img 
                              src={community.icon.startsWith('http') ? community.icon : `http://localhost:5000/img/communities/${community.icon}`} 
                              alt={community.name} 
                              className="community-icon-img"
                              onError={(e) => {
                                e.target.style.display = 'none'; 
                                e.target.parentElement.innerHTML = '<i class="bi bi-people-fill"></i>';
                              }}
                            />
                          ) : (
                            <i className="bi bi-people-fill"></i>
                          )}
                        </div>
                        <span className={`status-badge ${community.isPrivate ? 'badge-private' : 'badge-public'}`}>
                          {community.isPrivate ? 'Private' : 'Public'}
                        </span>
                      </div>
                      
                      {/* Name */}
                      <h5 
                        className="card-title text-truncate"
                        onClick={() => navigate(`/communities/${community._id}`)}
                      >
                        {community.name}
                      </h5>
                      
                      <p className="card-desc text-truncate-3">
                        {community.description}
                      </p>
                      
                      <div className="mt-auto">
                        <div className="d-flex align-items-center text-white-50 small mb-3">
                          <i className="bi bi-people me-2"></i>
                          {community.members ? community.members.length : 0} members
                        </div>
                        
                        <div className="d-flex gap-2">
                          <button
                            className="btn-glass-outline flex-grow-1"
                            onClick={() => navigate(`/communities/${community._id}`)}
                          >
                            View
                          </button>
                          
                          {/* --- STATUS BUTTON LOGIC --- */}
                          {isCreator ? (
                              <button className="btn-status btn-status-creator" disabled>
                                <i className="bi bi-star-fill me-2"></i>Creator
                              </button>
                          ) : userRole === 'moderator' ? (
                              <button className="btn-status btn-status-mod" disabled>
                                <i className="bi bi-shield-fill me-2"></i>Mod
                              </button>
                          ) : isMember ? (
                              <button className="btn-status btn-status-joined" disabled>
                                <i className="bi bi-check-circle-fill me-2"></i>Joined
                              </button>
                          ) : isPending ? (
                              <button className="btn-status btn-status-pending" disabled>
                                <i className="bi bi-clock me-2"></i>Pending
                              </button>
                          ) : (
                              <button
                              className="btn-glass-primary px-4"
                              onClick={(e) => handleJoinCommunity(e, community._id)}
                              disabled={joinLoading === community._id}
                            >
                              {joinLoading === community._id ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                              ) : "Join"}
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state-glass text-center py-5">
            <i className="bi bi-inbox text-white-50 mb-3 d-block" style={{ fontSize: '3rem' }}></i>
            <h5 className="text-white">No communities found</h5>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communities;