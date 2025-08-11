import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { collection, getDocs, addDoc, doc, deleteDoc } from "firebase/firestore";
import { db,storage} from "../../../firebase";
import { ref
  , uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  FiCalendar, 
  FiMapPin, 
  FiUser, 
  FiX, 
  FiPlus, 
  FiArrowLeft,
  FiHome,
  
  FiVideo,
  FiImage
} from "react-icons/fi";
import "./index.css";

const Events = ({ isMobile }) => {
  const history = useHistory();
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    organizer: "",
    maxParticipants: "",
    registrationDeadline: "",
    posterUrl: "",
    videoUrl: ""
  });

  // Fetch events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsSnapshot = await getDocs(collection(db, "events"));
        const eventsData = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(eventsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  // Handle file upload
  const handleFileUpload = async (file, type) => {
    if (!file) return;
    
    try {
      setUploading(true);
      const storageRef = ref(storage, `event-media/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setNewEvent(prev => ({
        ...prev,
        [type === 'poster' ? 'posterUrl' : 'videoUrl']: downloadURL
      }));
      
    } catch (err) {
      console.error("Error uploading file:", err);
      setError(`Failed to upload ${type}. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Basic validation
      if (!newEvent.title || !newEvent.date || !newEvent.time) {
        setError("Title, date, and time are required");
        return;
      }

      // Add new event to Firestore
      const docRef = await addDoc(collection(db, "events"), {
        ...newEvent,
        createdAt: new Date().toISOString(),
        participants: []
      });

      // Update local state
      setEvents([{ ...newEvent, id: docRef.id }, ...events]);
      
      // Reset form and hide it
      setNewEvent({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        organizer: "",
        maxParticipants: "",
        registrationDeadline: "",
        posterUrl: "",
        videoUrl: ""
      });
      setShowForm(false);
      setError(null);
      
    } catch (err) {
      console.error("Error adding event:", err);
      setError("Failed to add event. Please try again.");
    }
  };

  // Handle event deletion
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteDoc(doc(db, "events", id));
        setEvents(events.filter(event => event.id !== id));
      } catch (err) {
        console.error("Error deleting event:", err);
        setError("Failed to delete event. Please try again.");
      }
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="events-container">
      {/* Navigation Header */}
      <header className="app-header">
        <button 
          className="nav-button"
          onClick={() => history.goBack()}
          aria-label="Go back"
        >
          <FiArrowLeft size={24} />
        </button>
        <h1>Event Registrations</h1>
        <button 
          className="nav-button"
          onClick={() => history.push("/")}
          aria-label="Go home"
        >
          <FiHome size={24} />
        </button>
      </header>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        className="fab"
        onClick={() => setShowForm(true)}
        aria-label="Add event"
      >
        <FiPlus size={24} />
      </button>

      {/* Add Event Form */}
      {showForm && (
        <div className="event-form-overlay">
          <div className="event-form-container">
            <div className="form-header">
              <h2>Create New Event</h2>
              <button 
                className="close-button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                aria-label="Close form"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Event Title *</label>
                <input
                  type="text"
                  name="title"
                  value={newEvent.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter event title"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={newEvent.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter event description"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={newEvent.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Time *</label>
                  <input
                    type="time"
                    name="time"
                    value={newEvent.time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={newEvent.location}
                  onChange={handleInputChange}
                  placeholder="Enter event location"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Organizer</label>
                  <input
                    type="text"
                    name="organizer"
                    value={newEvent.organizer}
                    onChange={handleInputChange}
                    placeholder="Enter organizer name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Max Participants</label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={newEvent.maxParticipants}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="0 for unlimited"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Registration Deadline</label>
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={newEvent.registrationDeadline}
                  onChange={handleInputChange}
                />
              </div>
              
              {/* Poster Upload */}
              <div className="form-group">
                <label>Event Poster</label>
                <div className="file-upload-container">
                  <label className="file-upload-button">
                    <FiImage size={18} />
                    <span>{newEvent.posterUrl ? "Change Poster" : "Upload Poster"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files[0], 'poster')}
                      hidden
                    />
                  </label>
                  {uploading && newEvent.posterUrl && <span className="upload-status">Uploading...</span>}
                  {newEvent.posterUrl && !uploading && (
                    <div className="preview-thumbnail">
                      <img src={newEvent.posterUrl} alt="Event poster preview" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Video Upload */}
              <div className="form-group">
                <label>Event Video</label>
                <div className="file-upload-container">
                  <label className="file-upload-button">
                    <FiVideo size={18} />
                    <span>{newEvent.videoUrl ? "Change Video" : "Upload Video"}</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e.target.files[0], 'video')}
                      hidden
                    />
                  </label>
                  {uploading && newEvent.videoUrl && <span className="upload-status">Uploading...</span>}
                  {newEvent.videoUrl && !uploading && (
                    <div className="preview-thumbnail">
                      <video controls>
                        <source src={newEvent.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={uploading}
                >
                  {uploading ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="events-list">
        {events.length === 0 ? (
          <div className="empty-state">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/4076/4076478.png" 
              alt="No events"
              className="empty-image"
            />
            <h3>No Events Found</h3>
            <p>Create your first event to get started</p>
            <button 
              className="primary-button"
              onClick={() => setShowForm(true)}
            >
              Create Event
            </button>
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="event-card">
              {event.posterUrl && (
                <div className="event-poster">
                  <img src={event.posterUrl} alt={`${event.title} poster`} />
                </div>
              )}
              
              <div className="event-content">
                <div className="event-header">
                  <h3>{event.title}</h3>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(event.id)}
                    aria-label="Delete event"
                  >
                    <FiX size={18} />
                  </button>
                </div>
                
                <p className="event-description">{event.description}</p>
                
                <div className="event-details">
                  <div className="detail-item">
                    <FiCalendar className="icon" />
                    <span>{formatDate(event.date)} at {event.time}</span>
                  </div>
                  
                  {event.location && (
                    <div className="detail-item">
                      <FiMapPin className="icon" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  
                  {event.organizer && (
                    <div className="detail-item">
                      <FiUser className="icon" />
                      <span>Organizer: {event.organizer}</span>
                    </div>
                  )}
                </div>
                
                <div className="event-actions">
                  <button
                    className="view-button"
                    onClick={() => history.push(`/events/${event.id}`)}
                  >
                    View Details
                  </button>
                  <button
                    className="register-button"
                    onClick={() => history.push(`/events/${event.id}/register`)}
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Events;