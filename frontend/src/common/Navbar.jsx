import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import '../styles/navbar.css';

const IMG_URL = 'http://localhost:5000/img/users/';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, logout } = useContext(AuthContext);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  // NEW: State for scroll effect
  const [isScrolled, setIsScrolled] = useState(false);
  // NEW: Search state
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef(null);

  // 1. Scroll Listener for "Glassy/Compact" effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20); // Trigger after 20px of scroll
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ... (Keep existing useEffects for clickOutside and notifications) ...
  useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowDropdown(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  
    useEffect(() => {
      if (isLoggedIn) {
        fetchUnreadCount();
      }
    }, [isLoggedIn, location.pathname]);

    const fetchUnreadCount = async () => {
      try {
        const res = await API.get('/notifications');
        setUnreadCount(res.data.data.unreadCount);
      } catch (error) {
        console.error("Silent fail fetching notifications");
      }
    };
  
    const handleLogout = () => {
      logout();
      setShowDropdown(false);
      navigate('/');
    };

  const getProfileSrc = () => {
    if (user?.photo) {
        if (user.photo.startsWith('http')) return user.photo;
        return `${IMG_URL}${user.photo}`;
    }
    return `https://ui-avatars.com/api/?background=random&name=${user?.username || 'User'}`; 
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleSearch = (e) => {
    e.preventDefault();
    if(searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`); // Assuming you will build a search page later
    }
  };

  return (
    // Updated Class: Adds 'scrolled' class conditionally
    <nav className={`navbar navbar-expand-lg custom-navbar sticky-top ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container-fluid px-4">
        
        {/* Brand */}
        <div className="navbar-brand d-flex align-items-center brand-metallic" onClick={() => navigate('/')}>
          <div className="brand-icon">
             <i className="bi bi-chat-dots-fill"></i>
          </div>
          <span className="brand-text">Discussify</span>
        </div>
        
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon" style={{filter: 'invert(1)'}}></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          
          {/* NEW: Central Search Bar (Visible only when logged in usually, or always) */}
          <form className="d-flex mx-auto my-2 my-lg-0 search-container" onSubmit={handleSearch}>
             <div className="input-group">
                <span className="input-group-text search-icon">
                  <i className="bi bi-search"></i>
                </span>
                <input 
                  className="form-control search-input" 
                  type="search" 
                  placeholder="Search communities..." 
                  aria-label="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </form>

          <ul className="navbar-nav ms-auto align-items-center gap-2">
            {isLoggedIn ? (
              <>
                <li className="nav-item">
                  <button className={`nav-link btn-nav-metallic ${isActive('/home')}`} onClick={() => navigate('/home')}>
                    Home
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link btn-nav-metallic ${isActive('/communities')}`} onClick={() => navigate('/communities')}>
                    Communities
                  </button>
                </li>

                <div className="vr mx-2 d-none d-lg-block" style={{color: 'rgba(255,255,255,0.3)'}}></div>

                <li className="nav-item position-relative mx-1">
                  <button className={`btn btn-icon-metallic ${isActive('/notifications')}`} onClick={() => navigate('/notifications')}>
                    <i className="bi bi-bell-fill"></i>
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                  </button>
                </li>
                
                <li className="nav-item position-relative ms-1" ref={dropdownRef}>
                  <button className="btn user-profile-btn" onClick={() => setShowDropdown(!showDropdown)}>
                    <img src={getProfileSrc()} alt="Profile" className="user-avatar" onError={(e) => { e.target.src = `https://ui-avatars.com/api/?background=random&name=${user?.username || 'User'}` }}/>
                  </button>
                  {showDropdown && (
                    <div className="dropdown-menu-metallic show">
                      <div className="dropdown-header-metallic">
                        <strong className="d-block text-truncate">{user?.username}</strong>
                        <small>{user?.email}</small>
                      </div>
                      <div className="dropdown-divider-metallic"></div>
                      {user?.role === 'admin' && (
                        <button className="dropdown-item-metallic" style={{color: '#4F46E5'}} onClick={() => { navigate('/admin'); setShowDropdown(false); }}>
                          <i className="bi bi-shield-lock-fill me-2"></i>Admin Dashboard
                        </button>
                      )}
                      <button className="dropdown-item-metallic" onClick={() => { navigate('/profile-settings'); setShowDropdown(false); }}>
                        <i className="bi bi-gear-fill me-2"></i>Settings
                      </button>
                      <div className="dropdown-divider-metallic"></div>
                      <button className="dropdown-item-metallic" style={{color: '#EF4444'}} onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </div>
                  )}
                </li>
              </>
            ) : (
              <div className="d-flex align-items-center gap-3 ms-lg-3">
                <li className="nav-item list-unstyled">
                  <button className="btn btn-outline-light btn-sm px-4 rounded-pill" onClick={() => navigate('/login')} style={{ fontWeight: 500, borderWidth: '1px' }}>Log In</button>
                </li>
                <li className="nav-item list-unstyled">
                  <button className="btn btn-primary btn-sm px-4 rounded-pill" onClick={() => navigate('/register')}>Sign Up</button>
                </li>
              </div>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;