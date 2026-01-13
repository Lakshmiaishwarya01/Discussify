import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../../styles/notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  // Track processing for buttons
  const [processingIds, setProcessingIds] = useState(new Set());
  
  const [prefs, setPrefs] = useState({
      newDiscussion: user?.notificationPreferences?.newDiscussion ?? true,
      newResource: user?.notificationPreferences?.newResource ?? true,
      replies: true
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleMarkRead = async (id, link) => {
    try {
      await API.patch(`/notifications/mark-read/${id}`);
      
      setNotifications(prev => prev.map(n => 
        (n._id === id || id === 'all') ? { ...n, isRead: true } : n
      ));
      
      if (id === 'all') setUnreadCount(0);
      else setUnreadCount(prev => Math.max(0, prev - 1));

      if (link) navigate(link);

    } catch (error) {
      console.error(error);
    }
  };

  const handleSavePreferences = async () => {
      try {
          const res = await API.patch('/notifications/preferences', prefs);
          login(res.data.data.user, localStorage.getItem('token'));
          toast.success("Preferences updated");
          setShowSettings(false);
      } catch (error) {
          toast.error("Failed to save settings");
      }
  };

  const handleInviteResponse = async (notification, status) => {
      setProcessingIds(prev => new Set(prev).add(notification._id));

      try {
          await API.post(`/communities/${notification.community._id}/respond-invite`, { status });
          
          // Mark as read in backend
          await API.patch(`/notifications/mark-read/${notification._id}`);

          toast.success(status === 'accept' ? "You joined the community!" : "Invite declined.");
          
          // UPDATE LOCAL STATE:
          // We mark it as read locally. The 'visibleNotifications' filter below will automatically hide it.
          setNotifications(prev => prev.map(n => 
              n._id === notification._id ? { ...n, isRead: true } : n
          ));
          setUnreadCount(prev => Math.max(0, prev - 1));

      } catch (error) {
          if (error.response && (error.response.status === 404 || error.response.status === 400)) {
              // If backend says it's already done, just remove it from view
              setNotifications(prev => prev.map(n => 
                  n._id === notification._id ? { ...n, isRead: true } : n
              ));
              setUnreadCount(prev => Math.max(0, prev - 1));
          } else {
              toast.error(error.response?.data?.message || "Action failed");
              setProcessingIds(prev => {
                  const next = new Set(prev);
                  next.delete(notification._id);
                  return next;
              });
          }
      }
  };

  // --- FILTER LOGIC ---
  // If type is invite: show only if UNREAD.
  // If type is anything else: show always.
  const visibleNotifications = notifications.filter(n => 
      n.type !== 'community_invite' || !n.isRead
  );

  if (loading) return <div className="d-flex justify-content-center p-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="notifications-page container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Notifications {unreadCount > 0 && <span className="badge bg-danger fs-6 align-middle">{unreadCount}</span>}</h2>
            <div>
                <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => setShowSettings(!showSettings)}>
                    <i className="bi bi-sliders"></i> Settings
                </button>
                <button className="btn btn-outline-primary btn-sm" onClick={() => handleMarkRead('all')}>
                    Mark all read
                </button>
            </div>
          </div>

          {showSettings && (
              <div className="card mb-4 shadow-sm bg-light">
                  <div className="card-body">
                      <h5 className="card-title mb-3">Notification Settings</h5>
                      <div className="form-check form-switch mb-2">
                          <input className="form-check-input" type="checkbox" checked={prefs.newDiscussion} onChange={e => setPrefs({...prefs, newDiscussion: e.target.checked})} />
                          <label className="form-check-label">New Discussions</label>
                      </div>
                      <div className="form-check form-switch mb-2">
                          <input className="form-check-input" type="checkbox" checked={prefs.newResource} onChange={e => setPrefs({...prefs, newResource: e.target.checked})} />
                          <label className="form-check-label">New Resources</label>
                      </div>
                      <div className="d-flex justify-content-end">
                          <button className="btn btn-primary btn-sm" onClick={handleSavePreferences}>Save</button>
                      </div>
                  </div>
              </div>
          )}

          <div className="list-group shadow-sm">
            {/* USE visibleNotifications INSTEAD OF notifications */}
            {visibleNotifications.length > 0 ? (
                visibleNotifications.map(notif => (
                    <div 
                        key={notif._id}
                        className={`list-group-item d-flex align-items-start p-3 ${!notif.isRead ? 'bg-blue-50' : ''}`}
                        style={{ cursor: notif.type === 'community_invite' ? 'default' : 'pointer' }}
                        onClick={() => notif.type !== 'community_invite' && handleMarkRead(notif._id, notif.link)}
                    >
                        <img 
                            src={notif.sender.photo && notif.sender.photo !== 'default.jpg' 
                                ? `http://localhost:5000/img/users/${notif.sender.photo}` 
                                : 'https://ui-avatars.com/api/?background=random&name=' + notif.sender.username} 
                            alt="" 
                            className="rounded-circle me-3 mt-1"
                            style={{width: 40, height: 40}}
                        />
                        
                        <div className="flex-grow-1">
                            <div className="d-flex justify-content-between">
                                <span className="fw-bold small">{notif.sender.username}</span>
                                <small className="text-muted">{new Date(notif.createdAt).toLocaleDateString()}</small>
                            </div>
                            
                            <p className="mb-1 text-dark" style={{fontSize: '0.95rem'}}>
                                {notif.message}
                            </p>

                            {notif.type === 'community_invite' ? (
                                <div className="mt-2">
                                    {processingIds.has(notif._id) ? (
                                        <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                    ) : (
                                        <>
                                            <button 
                                                className="btn btn-success btn-sm me-2"
                                                onClick={(e) => { e.stopPropagation(); handleInviteResponse(notif, 'accept'); }}
                                            >
                                                Accept
                                            </button>
                                            <button 
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={(e) => { e.stopPropagation(); handleInviteResponse(notif, 'decline'); }}
                                            >
                                                Decline
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <small className="text-muted">
                                    <i className="bi bi-people-fill me-1"></i> {notif.community?.name || 'Unknown Community'}
                                </small>
                            )}
                        </div>
                        
                        {!notif.isRead && <span className="position-absolute top-50 end-0 translate-middle p-1 bg-primary border border-light rounded-circle me-2"></span>}
                    </div>
                ))
            ) : (
                <div className="text-center py-5">
                    <i className="bi bi-bell-slash text-muted" style={{fontSize: '3rem'}}></i>
                    <p className="text-muted mt-3">No notifications yet.</p>
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Notifications;