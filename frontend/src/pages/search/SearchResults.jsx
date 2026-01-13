import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../../services/api';
import '../../styles/searchResults.css'; 

const SearchResults = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q'); 

    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (query) {
            performSearch();
        }
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/communities?search=${encodeURIComponent(query)}`);
            setCommunities(res.data.data.communities);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper for Community Images
    const getCommunityImg = (icon) => {
        if (!icon) return null;
        if (icon.startsWith('http')) return icon;
        return `http://localhost:5000/img/communities/${icon}`;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    return (
        <div className="search-results-page-dark"> {/* Added wrapper class for dark background */}
            <div className="container py-5">
                <h3 className="mb-4 fw-bold page-title-dark"> {/* Custom text color class */}
                    Results for "<span className="text-primary">{query}</span>"
                </h3>

                {communities.length > 0 ? (
                    <div className="row g-4">
                        {communities.map(c => (
                            <div key={c._id} className="col-lg-6">
                                <div 
                                    className="community-result-card h-100 hover-effect" // Custom dark card class applied
                                    onClick={() => navigate(`/communities/${c._id}`)}
                                    style={{cursor: 'pointer'}}
                                >
                                    <div className="card-body d-flex align-items-start p-4">
                                        
                                        {/* --- UPDATED ICON LOGIC --- */}
                                        <div className="me-3" style={{width: '60px', height: '60px'}}>
                                            {c.icon ? (
                                                <img 
                                                    src={getCommunityImg(c.icon)} 
                                                    alt={c.name} 
                                                    className="rounded-circle object-fit-cover"
                                                    style={{width: '60px', height: '60px'}}
                                                    onError={(e) => {
                                                        // Replace the image with the fallback div on error
                                                        e.target.outerHTML = '<div class="rounded-circle bg-light d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;"><i class="bi bi-people fs-3 text-secondary"></i></div>';
                                                    }}
                                                />
                                            ) : (
                                                // Render fallback directly if no icon is provided
                                                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                                                    <i className="bi bi-people fs-3 text-secondary"></i>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between">
                                                <h5 className="card-title mb-1 text-primary">{c.name}</h5>
                                                <span 
                                                    className={`status-badge-dark ${c.isPrivate ? 'badge-private-dark' : 'badge-public-dark'} align-self-start`} // Custom dark badges
                                                >
                                                    {c.isPrivate ? 'Private' : 'Public'}
                                                </span>
                                            </div>
                                            <p className="small mb-2 text-truncate-2 card-desc-dark">
                                                {c.description}
                                            </p>
                                            <small className="text-info-dark">
                                                <i className="bi bi-people-fill me-1"></i> {c.members.length} Members
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-5 empty-state-dark"> {/* Custom empty state class */}
                        <i className="bi bi-search text-muted" style={{fontSize: '3rem'}}></i>
                        <h4 className="mt-3 text-muted">No communities found</h4>
                        <p>Try adjusting your search terms.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResults;