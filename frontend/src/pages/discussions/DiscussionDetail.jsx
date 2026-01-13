import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../../styles/discussionDetail.css';

// --- SUB-COMPONENT: Single Comment Item (Recursive) ---
const CommentItem = ({ comment, user, onReply, onLike, isMember }) => {
  const navigate = useNavigate();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Helper for Profile Images
  const getProfileSrc = (photo) => {
    if (photo && !photo.startsWith('http')) {
      return `http://localhost:5000/img/users/${photo}`;
    }
    if (photo) return photo;
    return 'https://ui-avatars.com/api/?background=random&name=User';
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();

    // Defensive client-side guard: should never happen if UI is correct,
    // but protects against race/stale state
    if (!isMember) {
      toast.warning("You must be a member of this community to reply.");
      setIsReplying(false);
      setReplyContent('');
      return;
    }

    setSubmitting(true);
    try {
      await onReply(replyContent, comment._id);
      toast.success("Reply posted!");
    } catch (err) {
      console.error('Reply failed', err);
      toast.error(err?.response?.data?.message || 'Failed to post reply.');
    } finally {
      setSubmitting(false);
      setIsReplying(false);
      setReplyContent('');
    }
  };

  // Check if current user liked this comment
  const currentUserId = user?._id || user?.id;
  const isLiked = user && comment.likes?.some(id => id.toString() === currentUserId?.toString());

  return (
    <div className="comment-item mb-3">
      <div className="d-flex">
        <img
          src={getProfileSrc(comment.author?.photo)}
          alt="User"
          className="comment-avatar me-2 mt-1"
        />
        <div className="flex-grow-1">
          <div className="bg-light p-3 rounded position-relative">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="fw-bold small">{comment.author?.username || 'Unknown'}</span>
              <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="mb-0 text-dark small">{comment.content}</p>

            {/* COMMENT LIKE BUTTON */}
            <button
              className={`btn btn-sm position-absolute bottom-0 end-0 mb-1 me-1 border-0 ${isLiked ? 'text-danger' : 'text-muted'}`}
              style={{ fontSize: '0.8rem' }}
              onClick={() => onLike(comment._id)}
            >
              <i className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}`}></i> {comment.likes?.length || 0}
            </button>
          </div>

          {/* Action Bar (Reply Button) - conditional rendering for UX */}
          <div className="comment-actions mt-1 ms-2 d-flex align-items-center">
            {!user ? (
              <button
                className="btn btn-link p-0 text-decoration-none"
                onClick={() => {
                  toast.info("Please login to reply");
                  navigate('/login');
                }}
              >
                <i className="bi bi-reply-fill me-1"></i>Reply
              </button>
            ) : !isMember ? (
              // Visually disabled control with hint (no click handler)
              <>
                <button
                  className="btn btn-link p-0 text-decoration-none text-muted"
                  disabled
                  title="Join this community to reply"
                  aria-disabled="true"
                >
                  <i className="bi bi-reply-fill me-1"></i>Reply
                </button>
                <small className="text-muted ms-2">Join community to reply</small>
              </>
            ) : (
              <button
                className="btn btn-link p-0 text-decoration-none"
                onClick={() => setIsReplying(!isReplying)}
              >
                <i className="bi bi-reply-fill me-1"></i>Reply
              </button>
            )}
          </div>

          {/* Reply Form (Conditionally rendered only for members) */}
          {isReplying && isMember && (
            <div className="mt-2 ms-2">
              <form onSubmit={handleReplySubmit}>
                <textarea
                  className="form-control form-control-sm mb-2"
                  rows="2"
                  placeholder={`Reply to ${comment.author?.username}...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  required
                />
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || !replyContent.trim()}>
                    {submitting ? '...' : 'Reply'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* RECURSION: Render Children (Nested Comments) */}
      {comment.children && comment.children.length > 0 && (
        <div className="nested-comments">
          {comment.children.map(child => (
            <CommentItem
              key={child._id}
              comment={child}
              user={user}
              onReply={onReply}
              onLike={onLike}
              isMember={isMember} // <-- PASS PROP DOWN RECURSIVELY
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
const DiscussionDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [discussion, setDiscussion] = useState(null);
  const [comments, setComments] = useState([]); // Flat list from DB
  const [rootComments, setRootComments] = useState([]); // Tree structure
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDiscussionData();
    // eslint-disable-next-line
  }, [id]);

  // Whenever the flat list changes, rebuild the tree
  useEffect(() => {
    if (comments) {
      const tree = buildCommentTree(JSON.parse(JSON.stringify(comments)));
      setRootComments(tree);
    }
  }, [comments]);

  const fetchDiscussionData = async () => {
    try {
      const discRes = await API.get(`/discussions/${id}`);
      setDiscussion(discRes.data.data.discussion);

      const commRes = await API.get(`/discussions/${id}/comments`);
      setComments(commRes.data.data.comments);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching discussion:', error);
      setLoading(false);
      if (error.response && (error.response.status === 404 || error.response.status === 403)) {
        toast.error(error.response.data.message || "Cannot view this discussion");
        navigate('/communities');
      }
    }
  };

  // Helper to build tree
  const buildCommentTree = (comments) => {
    const commentMap = {};
    const roots = [];
    comments.forEach(c => { c.children = []; commentMap[c._id] = c; });
    comments.forEach(c => {
      if (c.parentComment && commentMap[c.parentComment]) {
        commentMap[c.parentComment].children.push(c);
      } else {
        roots.push(c);
      }
    });
    return roots;
  };

  // --- NEW LOGIC: Calculate Membership Status ---
  const isMember = user && discussion?.community?.members?.some(m => {
    const memberId = m.user?._id || m.user;
    const currentUserId = user?._id || user?.id;
    return memberId?.toString() === currentUserId?.toString();
  });
  // --- END NEW LOGIC ---

  // 1. LIKE DISCUSSION LOGIC
  const handleLikeDiscussion = async () => {
    if (!user) {
      toast.info("Please login to like posts");
      navigate('/login');
      return;
    }

    try {
      const currentUserId = user._id || user.id;
      const isLiked = discussion.likes.some(uid => uid.toString() === currentUserId.toString());

      // Optimistic Update
      const newLikes = isLiked
        ? discussion.likes.filter(uid => uid.toString() !== currentUserId.toString())
        : [...discussion.likes, currentUserId];

      setDiscussion(prev => ({ ...prev, likes: newLikes }));

      // API Call
      await API.post(`/discussions/${id}/like`);
    } catch (error) {
      console.error("Like failed", error);
      fetchDiscussionData(); // Revert if failed
    }
  };

  // 2. LIKE COMMENT LOGIC
  const handleLikeComment = async (commentId) => {
    if (!user) {
      toast.info("Please login to like comments");
      navigate('/login');
      return;
    }

    try {
      const currentUserId = user._id || user.id;

      // Optimistic Update on Flat List (Effect will rebuild tree automatically)
      setComments(prevComments => prevComments.map(c => {
        if (c._id === commentId) {
          const likes = c.likes || [];
          const isLiked = likes.some(uid => uid.toString() === currentUserId.toString());

          const newLikes = isLiked
            ? likes.filter(uid => uid.toString() !== currentUserId.toString())
            : [...likes, currentUserId];

          return { ...c, likes: newLikes };
        }
        return c;
      }));

      // API Call
      await API.post(`/discussions/${id}/comments/${commentId}/like`);
    } catch (error) {
      console.error("Comment like failed", error);
      fetchDiscussionData(); // Revert
    }
  };

  // Unified submit handler for both Main Comments and Replies
  const handlePostComment = async (content, parentId = null) => {
    if (!user) {
      toast.info("Please login to comment");
      navigate('/login');
      return;
    }

    // MEMBERSHIP CHECK: Server must enforce this, but client-side visual check is below
    // The handlePostComment function can rely on the server 403/error for strict enforcement
    // but the UI must prevent the action first.
    if (!isMember) {
      toast.error("Action Failed: You must be a member of this community to comment.");
      return;
    }

    if (!parentId) setSubmitting(true);

    try {
      const res = await API.post(`/discussions/${id}/comments`, {
        content: content,
        parentComment: parentId
      });

      const newlyCreatedComment = res.data?.data?.comment;

      if (newlyCreatedComment) {
        // Optimistic Update
        const currentUserId = user._id || user.id;
        newlyCreatedComment.author = {
          _id: currentUserId,
          username: user.username,
          photo: user.photo || null
        };
        newlyCreatedComment.likes = []; // Initialize empty likes

        setComments(prev => [...prev, newlyCreatedComment]);

        if (!parentId) setNewComment('');
        toast.success("Comment posted!");
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(error.response?.data?.message || 'Failed to post comment.');
    } finally {
      if (!parentId) setSubmitting(false);
    }
  };

  // Main comment form submit wrapper with client-side membership check
  const handleMainSubmit = (e) => {
    e.preventDefault();
    if (!isMember) {
      toast.error("You must be a member of this community to post comments.");
      return;
    }
    handlePostComment(newComment, null);
  };

  // Attempt to join the community (minimal UX — server must implement endpoint)
  const handleJoinCommunity = async () => {
    if (!user) {
      toast.info("Please login to join the community.");
      navigate('/login');
      return;
    }

    try {
      const commId = discussion.community?._id || discussion.community;
      // Call your join endpoint (adjust path if different)
      await API.post(`/communities/${commId}/join`);
      toast.success("Join request sent / joined successfully.");
      // Re-fetch discussion so `discussion.community.members` is fresh and UI updates
      fetchDiscussionData();
    } catch (err) {
      console.error("Join failed", err);
      toast.error(err.response?.data?.message || "Failed to join community.");
    }
  };

  const getProfileSrc = (photo) => {
    if (photo && !photo.startsWith('http')) {
      return `http://localhost:5000/img/users/${photo}`;
    }
    if (photo) return photo;
    return 'https://ui-avatars.com/api/?background=random&name=User';
  };

  const goBack = () => {
    if (discussion && discussion.community) {
      const commId = discussion.community._id || discussion.community;
      navigate(`/communities/${commId}`);
    } else {
      navigate('/communities');
    }
  };

  if (loading) return <div className="d-flex justify-content-center p-5"><div className="spinner-border text-primary"></div></div>;
  if (!discussion) return null;

  // Check if discussion is liked by current user
  const currentUserId = user?._id || user?.id;
  const isDiscussionLiked = user && discussion.likes?.some(uid => uid.toString() === currentUserId?.toString());

  return (
    <div className="discussion-detail-container">
      <div className="container py-4">
        <button className="btn btn-outline-secondary mb-3 btn-sm" onClick={goBack}>
          <i className="bi bi-arrow-left me-2"></i>Back to Community
        </button>

        {/* DISCUSSION CARD */}
        <div className="card shadow-sm border-0 mb-5">
          <div className="card-body p-4">
            <h2 className="fw-bold mb-3">{discussion.title}</h2>
            <div className="d-flex align-items-center mb-4 text-muted small">
              <img src={getProfileSrc(discussion.author?.photo)} alt="Author" className="rounded-circle me-2" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
              <span className="fw-bold me-2 text-dark">{discussion.author?.username}</span>
              <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="card-text" style={{ whiteSpace: 'pre-wrap', fontSize: '1.05rem' }}>{discussion.content}</p>

            <div className="mt-4 pt-3 border-top d-flex justify-content-end">
              {/* DISCUSSION LIKE BUTTON */}
              <button
                className={`btn btn-sm rounded-pill px-3 ${isDiscussionLiked ? 'btn-danger text-white' : 'btn-outline-danger'}`}
                onClick={handleLikeDiscussion}
              >
                <i className={`bi ${isDiscussionLiked ? 'bi-heart-fill' : 'bi-heart'} me-1`}></i>
                {discussion.likes?.length || 0} Likes
              </button>
            </div>
          </div>
        </div>

        {/* COMMENTS SECTION */}
        <div className="row justify-content-center">
          <div className="col-lg">
            <h4 className="mb-4 text-light">Comments ({comments.length})</h4>

            {/* Main Comment Box - explicit UX for not-logged-in / non-member / member */}
            {!user ? (
              <div className="alert alert-secondary mb-4 text-center">
                Please <span className="text-primary fw-bold" style={{ cursor: 'pointer' }} onClick={() => navigate('/login')}>login</span> to join the conversation.
              </div>
            ) : !isMember ? (
              <div className="card mb-4 border-0 shadow-sm bg-light">
                <div className="card-body">
                  <textarea
                    className="form-control border-0 bg-white"
                    rows="3"
                    placeholder="Join the community to add to the discussion..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled
                  />
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <div className="text-muted small">You must be a member to post comments.</div>
                    <div>
                      <button className="btn btn-outline-primary btn-sm me-2" onClick={handleJoinCommunity}>
                        Join Community
                      </button>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(`/communities/${discussion.community?._id || discussion.community}`)}>
                        View Community
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card mb-4 border-0 shadow-sm bg-light">
                <div className="card-body">
                  <form onSubmit={handleMainSubmit}>
                    <textarea
                      className="form-control border-0 bg-white"
                      rows="3"
                      placeholder="Add to the discussion..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                    />
                    <div className="d-flex justify-content-end mt-2">
                      <button type="submit" className="btn btn-primary px-4 btn-sm" disabled={submitting || !newComment.trim()}>
                        {submitting ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Recursive Comment Tree */}
            <div className="comment-thread">
              {rootComments.length > 0 ? (
                rootComments.map(comment => (
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    user={user}
                    onReply={handlePostComment}
                    onLike={handleLikeComment}
                    isMember={isMember} // <-- Pass isMember status to children
                  />
                ))
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted">No comments yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionDetail;
