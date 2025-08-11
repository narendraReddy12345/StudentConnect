import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { db } from "../../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import { FiChevronLeft, FiShare2, FiHeart, FiMessageCircle, FiMoreHorizontal } from "react-icons/fi";
import Lottie from "lottie-react";
import updatesAnim from "../assets/Ltz69bkEEA.json";
import './index.css';

const UpdatesFeed = () => {
  const history = useHistory();
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef([]);
  const containerRef = useRef(null);

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
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Handle video play/pause when scrolling
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

  const handleLike = (id) => {
    // Implement like functionality
    console.log("Liked update:", id);
  };

  const handleShare = (update) => {
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: update.title,
        text: update.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback for browsers that don't support Web Share API
      alert("Share this update: " + update.title);
    }
  };

  if (isLoading) {
    return (
      <div className="reels-loading-container">
        <Lottie animationData={updatesAnim} loop={true} style={{ height: 200 }} />
        <p>Loading updates...</p>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="reels-empty-container">
        <Lottie animationData={updatesAnim} loop={true} style={{ height: 200 }} />
        <p>No updates available yet</p>
        <button onClick={() => history.goBack()} className="reels-back-btn">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="reels-container">
      {/* Header */}
      <div className="reels-header">
        <button onClick={() => history.goBack()} className="reels-back-btn">
          <FiChevronLeft size={24} />
        </button>
        <h2 className="reels-title">College Updates</h2>
        <div className="reels-header-spacer"></div>
      </div>

      {/* Main Reels Content */}
      <div className="reels-content" ref={containerRef}>
        {updates.map((update, index) => (
          <div 
            key={update.id} 
            className={`reel ${index === currentIndex ? 'active' : ''}`}
          >
            {/* Video/Image Content */}
            <div className="reel-media-container">
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
                <motion.video
                  ref={el => videoRefs.current[index] = el}
                  src={update.videoUrl}
                  loop
                  muted
                  playsInline
                  autoPlay={index === 0}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </div>

            {/* Update Info Overlay */}
            <div className="reel-info-overlay">
              <div className="reel-text-content">
                <div className="reel-meta">
                  <span className="reel-date">
                    {new Date(update.createdAt?.seconds * 1000).toLocaleDateString()}
                  </span>
                  {update.isImportant && (
                    <span className="reel-important-badge">Important</span>
                  )}
                </div>
                <h3 className="reel-update-title">{update.title}</h3>
                <p className="reel-update-description">{update.description}</p>
              </div>
            </div>

            {/* Right Action Bar */}
            <div className="reel-actions">
              <button 
                className="reel-action-btn" 
                onClick={() => handleLike(update.id)}
              >
                <FiHeart size={24} />
                <span>Like</span>
              </button>
              
              <button className="reel-action-btn">
                <FiMessageCircle size={24} />
                <span>Comment</span>
              </button>
              
              <button 
                className="reel-action-btn" 
                onClick={() => handleShare(update)}
              >
                <FiShare2 size={24} />
                <span>Share</span>
              </button>
              
              <button className="reel-action-btn">
                <FiMoreHorizontal size={24} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpdatesFeed;