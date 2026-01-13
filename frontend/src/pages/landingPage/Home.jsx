import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import Footer from "../../common/Footer";
import "../../styles/home.css";

const IMG_URL = 'http://localhost:5000/img/communities/';

const Home = () => {
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { isLoggedIn } = useContext(AuthContext);

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const response = await API.get('/communities');
                setCommunities(response.data.data.communities.slice(0, 3));
            } catch (error) {
                console.error('Error fetching communities:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCommunities();
    }, []);

    const handleGetStarted = () => {
        if (isLoggedIn) {
            navigate('/home'); 
        } else {
            navigate('/register');
        }
    };

    return (
        <div className="landing-page">
            <div className="ambient-orb orb-primary"></div>
            <div className="ambient-orb orb-secondary"></div>

            {/* Hero Section */}
            <div className="hero-section text-center">
                <div className="container">
                    <div className="hero-badge">
                        <i className="bi bi-stars me-2"></i> The Future of Conversations
                    </div>
                    
                    <h1 className="hero-title">
                        Connect, Share, &<br /> 
                        Inspire <span style={{color: '#818cf8'}}>Together</span>
                    </h1>
                    
                    <p className="hero-text">
                        Discussify is the modern platform for communities. 
                        Join specialized groups, share resources, and engage in meaningful discussions without the noise.
                    </p>

                    <div className="d-flex justify-content-center gap-3 flex-wrap">
                        <button className="btn-glow-primary" onClick={() => navigate('/communities')}>
                            Explore Communities
                        </button>
                        <button className="btn-glass-secondary" onClick={() => navigate('/create-community')}>
                            Create Your Own
                        </button>
                    </div>

                    {/* --- NEW: VALUE PROPOSITIONS (Professional) --- */}
                    <div className="container features-container">
                        <div className="row g-4">
                            {/* Feature 1 */}
                            <div className="col-md-4">
                                <div className="feature-glass-card">
                                    <div className="feature-icon-wrapper" style={{background: 'rgba(79, 70, 229, 0.2)', color: '#818cf8'}}>
                                        <i className="bi bi-people-fill"></i>
                                    </div>
                                    <h3 className="feature-title">Community First</h3>
                                    <p className="feature-desc">
                                        Build public or private spaces tailored to your needs. 
                                        Manage members with advanced role-based permissions.
                                    </p>
                                </div>
                            </div>
                            
                            {/* Feature 2 */}
                            <div className="col-md-4">
                                <div className="feature-glass-card">
                                    <div className="feature-icon-wrapper" style={{background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6'}}>
                                        <i className="bi bi-collection-play-fill"></i>
                                    </div>
                                    <h3 className="feature-title">Resource Library</h3>
                                    <p className="feature-desc">
                                        Don't just chat—share. Upload files, documents, and assets 
                                        directly to your community's dedicated resource hub.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="col-md-4">
                                <div className="feature-glass-card">
                                    <div className="feature-icon-wrapper" style={{background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8'}}>
                                        <i className="bi bi-shield-check"></i>
                                    </div>
                                    <h3 className="feature-title">Secure & Focused</h3>
                                    <p className="feature-desc">
                                        A distraction-free environment with secure authentication 
                                        and privacy controls to keep conversations meaningful.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured Communities */}
            <div className="container py-5 position-relative z-1">
                <div className="d-flex justify-content-between align-items-end mb-5">
                    <div>
                        <h2 className="fw-bold mb-1" style={{fontSize: '2rem'}}>Trending Now</h2>
                        <p className="text-white-50 m-0">Communities making an impact today</p>
                    </div>
                    <button className="btn btn-link text-decoration-none text-white d-none d-md-block" onClick={() => navigate('/communities')}>
                        View All <i className="bi bi-arrow-right ms-1"></i>
                    </button>
                </div>
                
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                ) : (
                    <div className="row g-4">
                        {communities.length > 0 ? communities.map(community => (
                            <div key={community._id} className="col-lg-4 col-md-6">
                                <div className="community-card-glass">
                                    <div className="card-content">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="card-icon-box">
                                                {community.icon ? (
                                                    <img src={`${IMG_URL}${community.icon}`} alt={community.name} className="card-icon-img"/>
                                                ) : (
                                                    <i className="bi bi-people-fill"></i>
                                                )}
                                            </div>
                                            <span className={`badge rounded-pill ${community.isPrivate ? 'bg-warning text-dark' : 'bg-success bg-opacity-75'}`}>
                                                {community.isPrivate ? 'Private' : 'Public'}
                                            </span>
                                        </div>

                                        <h5 className="card-heading text-truncate">{community.name}</h5>
                                        <p className="card-desc text-truncate-2">
                                            {community.description}
                                        </p>

                                        <button 
                                            className="btn-card-action mt-auto"
                                            onClick={() => navigate(`/communities/${community._id}`)}
                                        >
                                            View Community
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-12 text-center text-muted py-5 glass-card">
                                <i className="bi bi-inbox fs-1 mb-3 d-block"></i>
                                <p>No communities found yet.</p>
                                <button className="btn btn-outline-primary mt-2" onClick={() => navigate('/create-community')}>Create the first one</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* CTA Section */}
            <div className="container pb-5">
                <div className="cta-glass-panel">
                    <h2 className="fw-bold mb-3">Ready to Join the Conversation?</h2>
                    <p className="text-white-50 mb-4" style={{maxWidth: '600px', margin: '0 auto 2rem auto'}}>
                        Create an account today to start building your profile, joining communities, and sharing your knowledge with the world.
                    </p>
                    <button className="btn-glow-primary" onClick={handleGetStarted}>
                        Get Started Now
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Home;