import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { db } from "../../firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  arrayUnion, 
  arrayRemove,
  increment 
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiChevronLeft, 
  FiShare2, 
  FiHeart, 
  FiMessageCircle, 
  FiMoreHorizontal, 
  FiVolume2, 
  FiVolumeX, 
  FiSend, 
  FiClock, 
  FiX,
  FiBookmark,
  FiEye,
  FiFlag
} from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import Lottie from "lottie-react";
import updatesAnim from "../assets/Ltz69bkEEA.json";
import './index.css';

const UpdatesFeed = () => {
  const history = useHistory();
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [currentUpdate, setCurrentUpdate] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [activeReaction, setActiveReaction] = useState(null);
  const [savedUpdates, setSavedUpdates] = useState([]);
  const videoRefs = useRef([]);
  const containerRef = useRef(null);
  const commentInputRef = useRef(null);

  // Format time since post was created
  const formatTimeSince = (timestamp) => {
    if (!timestamp?.seconds) return "Just now";
    
    const now = new Date();
    const postDate = new Date(timestamp.seconds * 1000);
    const diffInSeconds = Math.floor((now - postDate) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return postDate.toLocaleDateString();
  };

  useEffect(() => {
    const q = query(collection(db, "updates"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUpdates(updatesList);
      setIsLoading(false);
    });
    
    // Load saved updates from localStorage
    const saved = JSON.parse(localStorage.getItem('savedUpdates')) || [];
    setSavedUpdates(saved);
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const scrollPosition = container.scrollTop;
      const containerHeight = container.clientHeight;
      const currentVideoIndex = Math.round(scrollPosition / containerHeight);
      
      if (currentVideoIndex !== currentIndex) {
        // Pause previous video
        if (videoRefs.current[currentIndex]?.pause) {
          videoRefs.current[currentIndex].pause();
        }
        
        // Play new video
        if (videoRefs.current[currentVideoIndex]?.play) {
          videoRefs.current[currentVideoIndex].play().catch(e => console.log("Autoplay prevented", e));
        }
        
        setCurrentIndex(currentVideoIndex);
      }
    };

    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);
    
    return () => {
      container?.removeEventListener('scroll', handleScroll);
    };
  }, [updates.length, currentIndex]);

  const handleLike = async (updateId, alreadyLiked) => {
    try {
      const updateRef = doc(db, "updates", updateId);
      
      if (alreadyLiked) {
        await updateDoc(updateRef, {
          likes: increment(-1),
          likedBy: arrayRemove("currentUser") // Replace with actual user ID
        });
      } else {
        await updateDoc(updateRef, {
          likes: increment(1),
          likedBy: arrayUnion("currentUser") // Replace with actual user ID
        });
      }
    } catch (error) {
      console.error("Error updating like: ", error);
    }
  };

  const handleSave = (updateId) => {
    const newSaved = savedUpdates.includes(updateId)
      ? savedUpdates.filter(id => id !== updateId)
      : [...savedUpdates, updateId];
    
    setSavedUpdates(newSaved);
    localStorage.setItem('savedUpdates', JSON.stringify(newSaved));
  };

  const handleShare = async (update) => {
    try {
      // Update share count in database
      const updateRef = doc(db, "updates", update.id);
      await updateDoc(updateRef, {
        shares: increment(1)
      });

      if (navigator.share) {
        await navigator.share({
          title: update.title,
          text: update.description,
          url: window.location.href,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = !isMuted;
      }
    });
  };

  const openComments = (update) => {
    setCurrentUpdate(update);
    setShowComments(true);
    // Focus on comment input after animation
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 300);
  };

  const closeComments = () => {
    setShowComments(false);
    setCurrentUpdate(null);
    setNewComment("");
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUpdate) return;

    try {
      await addDoc(collection(db, "updates", currentUpdate.id, "comments"), {
        text: newComment,
        createdAt: serverTimestamp(),
        user: {
          id: "currentUser", // Replace with actual user ID
          name: "Current User", // Replace with actual user name
          avatar: "https://ui-avatars.com/api/?name=User&background=random"
        },
      });
      
      // Update comment count
      const updateRef = doc(db, "updates", currentUpdate.id);
      await updateDoc(updateRef, {
        comments: increment(1)
      });
      
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
  };

  const reportContent = (updateId) => {
    if (window.confirm("Report this content as inappropriate?")) {
      console.log("Reported content:", updateId);
      // Implement actual reporting functionality
      alert("Thank you for your report. We'll review this content shortly.");
    }
  };

  if (isLoading) {
    return (
      <div className="updates-loading-container">
        <Lottie animationData={updatesAnim} loop={true} style={{ height: 200 }} />
        <p>Loading updates...</p>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="updates-empty-container">
        <Lottie animationData={updatesAnim} loop={true} style={{ height: 200 }} />
        <p>No updates available yet</p>
        <button onClick={() => history.goBack()} className="updates-back-btn">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="updates-container">
      {/* Header */}
      <div className="updates-header">
        <button onClick={() => history.goBack()} className="updates-back-btn">
          <FiChevronLeft size={24} />
        </button>
        <h2 className="updates-title">College Updates</h2>
        <button className="updates-saved-btn" onClick={() => alert("View your saved updates")}>
          <FiBookmark size={20} />
        </button>
      </div>

      {/* Main Updates Content */}
      <div className="updates-content" ref={containerRef}>
        {updates.map((update, index) => {
          const isLiked = update.likedBy?.includes("currentUser"); // Replace with actual user ID
          const isSaved = savedUpdates.includes(update.id);
          const viewsCount = update.views || Math.floor(Math.random() * 1000) + 100;
          
          return (
            <div 
              key={update.id} 
              className={`update-item ${index === currentIndex ? 'active' : ''}`}
            >
              {/* Media Content - Half Screen */}
              <div className="update-media-container">
                {update.imageUrl && (
                  <motion.img
                    src={update.imageUrl}
                    alt={update.title}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
                {update.videoUrl && (
                  <div className="video-wrapper">
                    <motion.video
                      ref={el => videoRefs.current[index] = el}
                      src={update.videoUrl}
                      loop
                      muted={isMuted}
                      playsInline
                      autoPlay={index === 0}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                    <button className="mute-toggle-btn" onClick={toggleMute}>
                      {isMuted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
                    </button>
                  </div>
                )}
                
                {/* Views Counter */}
                <div className="views-counter">
                  <FiEye size={14} />
                  <span>{viewsCount.toLocaleString()}</span>
                </div>
              </div>

              {/* Update Info */}
              <div className="update-info">
                <div className="update-meta">
                  <span className="update-date">
                    <FiClock size={14} />
                    {formatTimeSince(update.createdAt)}
                  </span>
                  {update.isImportant && (
                    <span className="update-important-badge">Important</span>
                  )}
                </div>
                
                <h3 className="update-title">{update.title}</h3>
                <p className="update-description">{update.description}</p>
                
                {/* Engagement Metrics */}
                <div className="engagement-metrics">
                  <span>{update.likes || 0} likes</span>
                  <span>•</span>
                  <span>{update.comments || 0} comments</span>
                  <span>•</span>
                  <span>{update.shares || 0} shares</span>
                </div>
                
                {/* Action Buttons */}
                <div className="update-actions">
                  <button 
                    className={`update-action-btn ${isLiked ? 'active' : ''}`}
                    onClick={() => handleLike(update.id, isLiked)}
                    onMouseEnter={() => setActiveReaction(update.id)}
                    onMouseLeave={() => setActiveReaction(null)}
                  >
                    {isLiked ? <FaHeart size={20} color="#ff3040" /> : <FiHeart size={20} />}
                    <span>Like</span>
                    
                    {/* Reaction animation */}
                    <AnimatePresence>
                      {activeReaction === update.id && !isLiked && (
                        <motion.div 
                          className="reaction-preview"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                        >
                          {['❤️', '👍', '🎉', '😮', '😢'].map(reaction => (
                            <span 
                              key={reaction} 
                              className="reaction-option"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(update.id, false);
                              }}
                            >
                              {reaction}
                            </span>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                  
                  <button 
                    className="update-action-btn"
                    onClick={() => openComments(update)}
                  >
                    <FiMessageCircle size={20} />
                    <span>Comment</span>
                  </button>
                  
                  <button 
                    className="update-action-btn" 
                    onClick={() => handleShare(update)}
                  >
                    <FiShare2 size={20} />
                    <span>Share</span>
                  </button>

                  <button 
                    className={`update-action-btn ${isSaved ? 'active' : ''}`}
                    onClick={() => handleSave(update.id)}
                  >
                    <FiBookmark size={20} fill={isSaved ? "currentColor" : "none"} />
                    <span>{isSaved ? "Saved" : "Save"}</span>
                  </button>
                </div>
              </div>
              
              {/* More options menu */}
              <div className="more-options">
                <button className="more-options-btn">
                  <FiMoreHorizontal size={20} />
                </button>
                <div className="more-options-menu">
                  <button onClick={() => reportContent(update.id)}>
                    <FiFlag size={16} />
                    Report
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comments Panel */}
      <AnimatePresence>
        {showComments && currentUpdate && (
          <>
            <motion.div 
              className="comments-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeComments}
            />
            <motion.div 
              className="comments-panel"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="comments-header">
                <h3>Comments • {currentUpdate.comments || 0}</h3>
                <button className="close-comments" onClick={closeComments}>
                  <FiX size={24} />
                </button>
              </div>
              
              <div className="comments-list">
                {/* Sample comments - in a real app, you would fetch these from your database */}
                <div className="comment">
                  <div className="comment-avatar">
                    <img src="https://ui-avatars.com/api/?name=User&background=random" alt="User" />
                  </div>
                  <div className="comment-content">
                    <div className="comment-author">John Doe</div>
                    <div className="comment-text">This is a great update! Thanks for sharing.</div>
                    <div className="comment-time">{formatTimeSince({ seconds: Date.now()/1000 - 7200 })}</div>
                  </div>
                </div>
                
                <div className="comment">
                  <div className="comment-avatar">
                    <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Admin" />
                  </div>
                  <div className="comment-content">
                    <div className="comment-author">College Admin</div>
                    <div className="comment-text">Let us know if you have any questions!</div>
                    <div className="comment-time">{formatTimeSince({ seconds: Date.now()/1000 - 3600 })}</div>
                  </div>
                </div>
              </div>
              
              <form className="comment-form" onSubmit={handleCommentSubmit}>
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  ref={commentInputRef}
                />
                <button type="submit" disabled={!newComment.trim()}>
                  <FiSend size={20} />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global Mute Button */}
      <button className="global-mute-btn" onClick={toggleMute}>
        {isMuted ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
      </button>
    </div>
  );
};

export default UpdatesFeed;