import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../../styles/superAdminDashboard.css'

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      if (user.role !== 'admin') {
        toast.error("Access Denied: Super Admin only");
        navigate('/');
        return;
      }
      fetchStats();
      fetchUsers(); 
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await API.get('/admin/stats');
      setStats(res.data.data.stats);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data.data.users);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const res = await API.get('/communities');
      setCommunities(res.data.data.communities);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'users') fetchUsers();
    if (tab === 'communities') fetchCommunities();
  };

  const handleBanUser = async (userId, currentStatus) => {
    const action = currentStatus ? 'ban' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      await API.patch(`/admin/users/${userId}/ban`, { 
          active: !currentStatus 
      });
      
      toast.success(`User ${action}ed successfully`);
      
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, active: !u.active } : u
      ));
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleForceDelete = async (communityId) => {
    const confirmName = window.prompt("Type 'DELETE' to confirm forced deletion of this community:");
    if (confirmName !== 'DELETE') return;

    try {
      await API.delete(`/admin/communities/${communityId}`);
      toast.success("Community deleted by Admin");
      setCommunities(prev => prev.filter(c => c._id !== communityId));
    } catch (error) {
      toast.error("Failed to delete community");
    }
  };

  // --- NEW HELPER: Logic for Profile Image vs Avatar Fallback ---
  const getUserImgSrc = (u) => {
    if (u.photo) {
        // Use custom photo (Backend URL or External URL)
        return u.photo.startsWith('http') 
            ? u.photo 
            : `http://localhost:5000/img/users/${u.photo}`;
    }
    // Fallback: Generate Avatar from Username
    return `https://ui-avatars.com/api/?background=random&name=${u.username}`;
  };

  if (!stats) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="super-admin-dashboard container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark">
            <i className="bi bi-shield-lock-fill text-primary me-2"></i>
            Admin Dashboard
        </h2>
        <span className="badge bg-dark">Super Admin Mode</span>
      </div>

      {/* KPI CARDS */}
      <div className="row mb-5">
        <div className="col-md-3">
            <div className="card bg-primary text-white shadow-sm border-0">
                <div className="card-body text-center">
                    <h3>{stats.users}</h3>
                    <div>Total Users</div>
                </div>
            </div>
        </div>
        <div className="col-md-3">
            <div className="card bg-success text-white shadow-sm border-0">
                <div className="card-body text-center">
                    <h3>{stats.communities}</h3>
                    <div>Communities</div>
                </div>
            </div>
        </div>
        <div className="col-md-3">
            <div className="card bg-info text-white shadow-sm border-0">
                <div className="card-body text-center">
                    <h3>{stats.discussions}</h3>
                    <div>Discussions</div>
                </div>
            </div>
        </div>
        <div className="col-md-3">
            <div className="card bg-warning text-dark shadow-sm border-0">
                <div className="card-body text-center">
                    <h3>{stats.resources}</h3>
                    <div>Resources</div>
                </div>
            </div>
        </div>
      </div>

      {/* TABS */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
            <button 
                className={`nav-link ${activeTab === 'users' ? 'active fw-bold' : ''}`}
                onClick={() => handleTabChange('users')}
            >
                User Management
            </button>
        </li>
        <li className="nav-item">
            <button 
                className={`nav-link ${activeTab === 'communities' ? 'active fw-bold' : ''}`}
                onClick={() => handleTabChange('communities')}
            >
                Community Oversight
            </button>
        </li>
      </ul>

      {/* CONTENT TABLE */}
      <div className="card shadow-sm border-0">
        <div className="card-body">
            {loading ? (
                <div className="text-center py-4"><div className="spinner-border text-secondary"></div></div>
            ) : (
                activeTab === 'users' ? (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id} className={!u.active ? 'table-danger' : ''}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                {/* --- UPDATED IMAGE LOGIC --- */}
                                                <img 
                                                    src={getUserImgSrc(u)} 
                                                    className="rounded-circle me-2 border" 
                                                    width="35" 
                                                    height="35" 
                                                    style={{objectFit: 'cover'}}
                                                    alt=""
                                                    // Safety fallback if backend image fails to load
                                                    onError={(e) => {
                                                        e.target.src = `https://ui-avatars.com/api/?background=random&name=${u.username}`;
                                                    }}
                                                />
                                                <div className="d-flex flex-column">
                                                    <span className="fw-bold">{u.username}</span>
                                                    <small className="text-muted">{u.email}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className={`badge ${u.role === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>{u.role}</span></td>
                                        <td>
                                            {u.active 
                                                ? <span className="badge bg-success">Active</span> 
                                                : <span className="badge bg-danger">Banned</span>
                                            }
                                        </td>
                                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="text-end">
                                            {u.role !== 'admin' && (
                                                <button 
                                                    className={`btn btn-sm ${u.active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                                    onClick={() => handleBanUser(u._id, u.active)}
                                                >
                                                    {u.active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Community</th>
                                    <th>Creator</th>
                                    <th>Members</th>
                                    <th>Privacy</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {communities.map(c => (
                                    <tr key={c._id}>
                                        <td>
                                            <span className="fw-bold">{c.name}</span>
                                        </td>
                                        <td>{c.creator?.username || 'Unknown'}</td>
                                        <td>{c.members.length}</td>
                                        <td>
                                            {c.isPrivate ? <i className="bi bi-lock-fill text-warning"></i> : <i className="bi bi-globe text-success"></i>}
                                        </td>
                                        <td className="text-end">
                                            <button 
                                                className="btn btn-sm btn-outline-dark me-2"
                                                onClick={() => navigate(`/communities/${c._id}`)}
                                            >
                                                View
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleForceDelete(c._id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;