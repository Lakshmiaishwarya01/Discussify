import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/footer.css'; 

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-container">
      <div className="container">
        
        {/* MAIN CONTENT GRID - Now 3 Columns */}
        <div className="footer-content">
          
          {/* 1. BRAND & SOCIALS */}
          <div className="footer-col-brand">
            <div className="footer-brand-title">
              <div className="brand-icon-box">
                <i className="bi bi-chat-square-quote-fill"></i>
              </div>
              <span className="ms-2">Discussify</span>
            </div>
            <p className="footer-brand-desc">
              A modern community platform combining the best of forums and real-time chat. 
              Connect, share resources, and grow together.
            </p>
            <div className="footer-socials">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-icon"><i className="bi bi-twitter-x"></i></a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="social-icon"><i className="bi bi-github"></i></a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-icon"><i className="bi bi-linkedin"></i></a>
              <a href="https://discord.com" target="_blank" rel="noreferrer" className="social-icon"><i className="bi bi-discord"></i></a>
            </div>
          </div>

          {/* 2. QUICK LINKS */}
          <div className="footer-col">
            <h6 className="footer-heading">Explore</h6>
            <ul className="footer-links">
              <li><span className="footer-link-item" onClick={() => navigate('/')}>Home</span></li>
              <li><span className="footer-link-item" onClick={() => navigate('/communities')}>Communities</span></li>
              <li><span className="footer-link-item" onClick={() => navigate('/communities?filter=public')}>Public Groups</span></li>
              <li><span className="footer-link-item" onClick={() => navigate('/create-community')}>Start a Community</span></li>
            </ul>
          </div>

          {/* 3. CONTACT (Moved to fill the space) */}
          <div className="footer-col">
            <h6 className="footer-heading">Contact Us</h6>
            <div className="footer-contact-item">
              <i className="bi bi-geo-alt-fill footer-contact-icon"></i>
              <span>Tech Park Plaza,<br />Kochi, India 682021</span>
            </div>
            <div className="footer-contact-item">
              <i className="bi bi-envelope-fill footer-contact-icon"></i>
              <span>support@discussify.com</span>
            </div>
            <div className="footer-contact-item">
              <i className="bi bi-telephone-fill footer-contact-icon"></i>
              <span>+91 98765 43210</span>
            </div>
          </div>

        </div>

        {/* COPYRIGHT BAR */}
        <div className="footer-bottom">
          <span>&copy; {currentYear} Discussify Inc. All rights reserved.</span>
          <span>Made with <i className="bi bi-heart-fill text-danger mx-1"></i> by Team Discussify</span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;