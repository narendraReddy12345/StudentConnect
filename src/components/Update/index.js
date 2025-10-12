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
  FiBookmark,
  
  FiSend,
  FiX
} from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import Lottie from "lottie-react";
import updatesAnim from "../assets/Ltz69bkEEA.json";
import './index.css';

const UpdatesFeed = () => {
  const history = useHistory();
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedUpdates, setSavedUpdates] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [currentUpdate, setCurrentUpdate] = useState(null);
  const [newComment, setNewComment] = useState("");
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
    return postDate.toLocaleDateString();
  };

  // Load updates from Firebase
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
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const openComments = (update) => {
    setCurrentUpdate(update);
    setShowComments(true);
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
          id: "currentUser", 
          name: "Current User",
          avatar: "https://ui-avatars.com/api/?name=User&background=random"
        },
      });

      const updateRef = doc(db, "updates", currentUpdate.id);
      await updateDoc(updateRef, {
        comments: increment(1)
      });

      setNewComment("");
    } catch (error) {
      console.error("Error adding comment: ", error);
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
      </div>

      {/* Main Content */}
      <div className="updates-content">
        {updates.map((update) => {
          const isLiked = update.likedBy?.includes("currentUser");
          const isSaved = savedUpdates.includes(update.id);

          return (
            <div key={update.id} className="update-card">
              {/* Image Section */}
              <div className="update-image">
                <img src={update.imageUrl} alt={update.title} />
              </div>

              {/* Text Section */}
              <div className="update-text">
                <h2 className="update-question">{update.title}</h2>
                <p className="update-description">{update.description}</p>
              </div>

              {/* Footer Section */}
              <div className="update-footer">
                <span>{formatTimeSince(update.createdAt)}</span>
                <div className="footer-actions">
                  <button onClick={() => handleLike(update.id, isLiked)}>
                    {isLiked ? <FaHeart color="#ff3040" /> : <FiHeart />}
                    <span>{update.likes || 0}</span>
                  </button>

                  <button onClick={() => openComments(update)}>
                    <FiMessageCircle />
                    <span>{update.comments || 0}</span>
                  </button>

                  <button onClick={() => handleShare(update)}>
                    <FiShare2 />
                    <span>{update.shares || 0}</span>
                  </button>

                  <button onClick={() => handleSave(update.id)}>
                    <FiBookmark />
                    <span>{isSaved ? "Saved" : "Save"}</span>
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
    </div>
  );
};

export default UpdatesFeed;
