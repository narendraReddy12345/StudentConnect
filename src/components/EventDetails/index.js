import React, { useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../../firebase";
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiMapPin, 
  FiUser, 
  FiUsers,
  FiClock,
  FiExternalLink,
  FiHeart,
  FiShare2,
  FiMessageSquare
} from "react-icons/fi";
import Lottie from "lottie-react";
import registerAnim from "../assets/fuGIip804B.json";
import './index.css'

const EventDetails = () => {
  const { id } = useParams();
  const history = useHistory();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, "events", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const eventData = docSnap.data();
          setEvent({
            id: docSnap.id,
            ...eventData
          });
          
          // Check if user is registered (you would replace this with actual auth check)
          setIsRegistered(eventData.participants && eventData.participants.includes("user-id"));
          setIsFavorite(localStorage.getItem(`favorite-${id}`) === "true");
          
          // Load comments if available
          if (eventData.comments) {
            setComments(eventData.comments);
          }
        } else {
          setError("Event not found");
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [id]);

  // Handle registration
  const handleRegister = async () => {
    try {
      const eventRef = doc(db, "events", id);
      
      if (isRegistered) {
        // Unregister
        await updateDoc(eventRef, {
          participants: arrayRemove("user-id") // Replace with actual user ID
        });
      } else {
        // Register
        await updateDoc(eventRef, {
          participants: arrayUnion("user-id") // Replace with actual user ID
        });
      }
      
      setIsRegistered(!isRegistered);
    } catch (err) {
      console.error("Error updating registration:", err);
      setError("Failed to update registration");
    }
  };

  // Toggle favorite
  const toggleFavorite = () => {
    localStorage.setItem(`favorite-${id}`, !isFavorite);
    setIsFavorite(!isFavorite);
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    try {
      const newComment = {
        id: Date.now(),
        text: comment,
        author: "Current User", // Replace with actual user name
        timestamp: new Date().toISOString()
      };
      
      const eventRef = doc(db, "events", id);
      await updateDoc(eventRef, {
        comments: arrayUnion(newComment)
      });
      
      setComments([...comments, newComment]);
      setComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Failed to add comment");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="kl-event-loading">
        <div className="kl-event-spinner"></div>
        <p>Loading event details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kl-event-error">
        <h3>{error}</h3>
        <button 
          className="kl-event-back-btn"
          onClick={() => history.goBack()}
        >
          <FiArrowLeft size={20} />
          Back to Events
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="kl-event-not-found">
        <h3>Event not found</h3>
        <button 
          className="kl-event-back-btn"
          onClick={() => history.goBack()}
        >
          <FiArrowLeft size={20} />
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="kl-event-detail-root">
      {/* Header with back button */}
      <header className="kl-event-navbar">
        <button 
          className="kl-event-back-btn"
          onClick={() => history.goBack()}
          aria-label="Go back"
        >
          <FiArrowLeft size={24} />
        </button>
        
        <div className="kl-event-nav-actions">
          <button 
            className={`kl-event-nav-btn ${isFavorite ? "active" : ""}`}
            onClick={toggleFavorite}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <FiHeart size={20} />
          </button>
          <button 
            className="kl-event-nav-btn"
            onClick={() => navigator.share({
              title: event.title,
              text: `Check out this event: ${event.title}`,
              url: window.location.href
            })}
            aria-label="Share event"
          >
            <FiShare2 size={20} />
          </button>
        </div>
      </header>

      {/* Event poster with gradient overlay */}
      <div className="kl-event-hero">
        {event.posterUrl ? (
          <img 
            src={event.posterUrl} 
            alt={event.title} 
            className="kl-event-hero-img"
          />
        ) : (
          <div className="kl-event-hero-fallback">
            <FiCalendar size={48} />
          </div>
        )}
        <div className="kl-event-hero-overlay"></div>
        <h1 className="kl-event-hero-title">{event.title}</h1>
      </div>

      {/* Quick info bar */}
      <div className="kl-event-meta-bar">
        <div className="kl-event-meta-item">
          <FiCalendar size={18} />
          <span>{formatDate(event.date)}</span>
        </div>
        <div className="kl-event-meta-item">
          <FiClock size={18} />
          <span>{event.time}</span>
        </div>
        {event.location && (
          <div className="kl-event-meta-item">
            <FiMapPin size={18} />
            <span>{event.location}</span>
          </div>
        )}
      </div>

      {/* Registration status bar */}
      <div className="kl-event-register-bar">
        <div className="kl-event-attendees">
          <FiUsers size={18} />
          <span>
            {event.participants?.length || 0}
            {event.maxParticipants ? `/${event.maxParticipants}` : ""} registered
          </span>
        </div>
        
        <button 
          className={`kl-event-register-btn ${isRegistered ? "registered" : ""}`}
          onClick={handleRegister}
        >
          {isRegistered ? "Registered ✓" : "Register Now"}
        </button>
      </div>

      {/* Tab navigation */}
      <nav className="kl-event-tab-nav">
        <button 
          className={`kl-event-tab-btn ${activeTab === "details" ? "active" : ""}`}
          onClick={() => setActiveTab("details")}
        >
          Details
        </button>
        <button 
          className={`kl-event-tab-btn ${activeTab === "comments" ? "active" : ""}`}
          onClick={() => setActiveTab("comments")}
        >
          Comments ({comments.length})
        </button>
        <button 
          className={`kl-event-tab-btn ${activeTab === "location" ? "active" : ""}`}
          onClick={() => setActiveTab("location")}
        >
          Location
        </button>
      </nav>

      {/* Tab content */}
      <div className="kl-event-tab-content">
        {activeTab === "details" && (
          <div className="kl-event-detail-content">
            {event.organizer && (
              <div className="kl-event-detail-section">
                <h3>
                  <FiUser size={20} />
                  Organizer
                </h3>
                <p>{event.organizer}</p>
              </div>
            )}
            
            <div className="kl-event-detail-section">
              <h3>About This Event</h3>
              <p>{event.description || "No description provided."}</p>
            </div>
            
            {event.registrationDeadline && (
              <div className="kl-event-detail-section kl-event-deadline">
                <h3>Registration Deadline</h3>
                <p>
                  {formatDate(event.registrationDeadline)}
                  {new Date(event.registrationDeadline) < new Date() && (
                    <span className="kl-event-deadline-warning"> (Passed)</span>
                  )}
                </p>
              </div>
            )}
            
            {event.videoUrl && (
              <div className="kl-event-detail-section">
                <h3>Event Video</h3>
                <div className="kl-event-media-container">
                  <video controls>
                    <source src={event.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === "comments" && (
          <div className="kl-event-comments-content">
            <div className="kl-event-comments-list">
              {comments.length === 0 ? (
                <p className="kl-event-no-comments">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="kl-event-comment-item">
                    <div className="kl-event-comment-author">{comment.author}</div>
                    <div className="kl-event-comment-body">{comment.text}</div>
                    <div className="kl-event-comment-time">
                      {new Date(comment.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={handleCommentSubmit} className="kl-event-comment-form">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="kl-event-comment-input"
              />
              <button type="submit" className="kl-event-comment-submit">
                <FiMessageSquare size={20} />
              </button>
            </form>
          </div>
        )}
        
        {activeTab === "location" && (
          <div className="kl-event-location-content">
            {event.location ? (
              <>
                <div className="kl-event-map-placeholder">
                  {/* In a real app, you would embed a map here */}
                  <FiMapPin size={48} />
                  <p>Map view would appear here</p>
                </div>
                <a 
                  href={`https://maps.google.com/?q=${event.location}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kl-event-map-link"
                >
                  <FiExternalLink size={16} />
                  Open in Maps
                </a>
                <p className="kl-event-address">{event.location}</p>
              </>
            ) : (
              <p className="kl-event-no-location">Location not specified</p>
            )}
          </div>
        )}
      </div>

      {/* Floating action button for registration */}
      {!isRegistered && (
        <button 
          className="kl-event-fab"
          onClick={handleRegister}
        >
          <Lottie 
            animationData={registerAnim} 
            loop={true} 
            style={{ height: 40, marginRight: 8 }} 
          />
          Register Now
        </button>
      )}
    </div>
  );
};

export default EventDetails;