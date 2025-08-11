import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { FiSearch, FiArrowLeft, FiArrowRight, FiCalendar, FiMapPin, FiClock } from "react-icons/fi";
import Lottie from "lottie-react";
import eventAnim from "../assets/fuGIip804B.json";
import './index.css';

const EventRegistration = () => {
  const history = useHistory();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState("all");
  const eventsPerPage = 6;

  // Categories for filtering
  const categories = [
    { id: "all", name: "All Events" },
    { id: "upcoming", name: "Upcoming" },
    { id: "music", name: "Music" },
    { id: "sports", name: "Sports" },
    { id: "tech", name: "Tech" },
    { id: "art", name: "Art" },
  ];

  // Fetch events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsSnapshot = await getDocs(collection(db, "events"));
        const eventsData = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(eventsData);
        setFilteredEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events based on search term and category
  useEffect(() => {
    let filtered = events;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (activeCategory !== "all") {
      if (activeCategory === "upcoming") {
        filtered = filtered.filter(event => 
          new Date(event.date) > new Date()
        );
      } else {
        filtered = filtered.filter(event => 
          event.category?.toLowerCase() === activeCategory
        );
      }
    }
    
    setFilteredEvents(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, events, activeCategory]);

  // Pagination logic
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Lottie 
          animationData={eventAnim} 
          loop={true} 
          style={{ height: 200 }} 
        />
        <p className="loading-text">Discovering amazing events...</p>
        <div className="loading-progress"></div>
      </div>
    );
  }

  return (
    <div className="event-registration-container">
      {/* Header with back button and search */}
      <header className="event-header">
        <button 
          className="back-button"
          onClick={() => history.goBack()}
          aria-label="Go back"
        >
          <FiArrowLeft size={24} />
        </button>
        
        <div className="header-content">
          <h1 className="header-title">Event Registration</h1>
          
        </div>
      </header>

      {/* Search bar with floating effect */}
      <div className="search-wrapper">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search events by name, location or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm("")}
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div className="category-scroller">
        <div className="category-container">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-chip ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="events-content">
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <Lottie 
              animationData={eventAnim} 
              loop={true} 
              style={{ height: 200 }} 
            />
            <h3 className="empty-title">No events found</h3>
            <p className="empty-message">
              {searchTerm 
                ? "Try a different search term or category" 
                : "Check back later for upcoming events"}
            </p>
            <button 
              className="refresh-button"
              onClick={() => window.location.reload()}
            >
              Refresh Events
            </button>
          </div>
        ) : (
          <>
            <div className="events-count">
              Showing {currentEvents.length} of {filteredEvents.length} events
            </div>
            
            <div className="events-grid">
              {currentEvents.map(event => (
                <div 
                  key={event.id} 
                  className="event-card"
                  onClick={() => history.push(`/events/${event.id}`)}
                >
                  <div className="event-card-inner">
                    {event.posterUrl ? (
                      <div 
                        className="event-poster"
                        style={{ backgroundImage: `url(${event.posterUrl})` }}
                      >
                        <div className="event-date-badge">
                          <FiCalendar size={14} />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        {event.category && (
                          <div className="event-category-badge">
                            {event.category}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="event-poster-placeholder">
                        <div className="placeholder-icon">
                          <FiCalendar size={32} />
                        </div>
                      </div>
                    )}
                    
                    <div className="event-info">
                      <h3 className="event-title">{event.title}</h3>
                      <div className="event-meta">
                        <div className="event-location">
                          <FiMapPin size={14} />
                          <span>{event.location || "Venue to be announced"}</span>
                        </div>
                        {event.time && (
                          <div className="event-time">
                            <FiClock size={14} />
                            <span>{formatTime(event.time)}</span>
                          </div>
                        )}
                      </div>
                      <div className="event-price">
                        {event.price ? `From $${event.price}` : "Free Entry"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  <FiArrowLeft size={18} />
                  <span>Previous</span>
                </button>
                
                <div className="page-dots">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      className={`page-dot ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    />
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  <span>Next</span>
                  <FiArrowRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default EventRegistration;