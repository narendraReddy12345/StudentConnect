import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import Lottie from 'lottie-react';
import eventAnimation from '../../../assets/fuGIip804B.json';
import './EventManagement.css';

// Import icons
import { 
  IoArrowBack, 
  IoSearch, 
  IoAdd, 
  IoClose,
  IoCalendar,
  IoLocation,
  IoPricetag,
  IoCreate,
  IoTrash
} from 'react-icons/io5';

const EventManagement = () => {
  const history = useHistory();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Cloudinary configuration
  const CLOUD_NAME = 'dmu3tqxgb'; // Your Cloudinary cloud name
  const UPLOAD_PRESET = 'eventimgs'; // Your upload preset

  const eventTypes = [
    'Technical Workshop',
    'Hackathon',
    'Cultural Festival',
    'Sports Event',
    'Seminar',
    'Conference',
    'Webinar',
    'Competition',
    'Exhibition',
    'Guest Lecture'
  ];

  const [newEvent, setNewEvent] = useState({
    title: '',
    type: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    image: null,
    imagePreview: '',
    video: null,
    registrationLink: '',
    isPaid: false,
    paymentQR: null,
    paymentQRPreview: '',
    contactInfo: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const filterEvents = useCallback(() => {
    let results = events;
    
    if (searchQuery) {
      results = results.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (activeCategory !== 'All') {
      results = results.filter(event => event.type === activeCategory);
    }
    
    setFilteredEvents(results);
  }, [searchQuery, activeCategory, events]);

  useEffect(() => {
    filterEvents();
  }, [filterEvents]);

  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsData = [];
      querySnapshot.forEach((doc) => {
        eventsData.push({ id: doc.id, ...doc.data() });
      });
      eventsData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events: ", error);
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      try {
        const data = await uploadToCloudinary(file);
        setNewEvent({
          ...newEvent,
          image: data.secure_url,
          imagePreview: data.secure_url,
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Image upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleQRChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      try {
        const data = await uploadToCloudinary(file);
        setNewEvent({
          ...newEvent,
          paymentQR: data.secure_url,
          paymentQRPreview: data.secure_url,
        });
      } catch (error) {
        console.error('Error uploading QR code:', error);
        alert('QR code upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.type || !newEvent.date) {
      alert('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    try {
      // Prepare event data for Firestore
      const eventData = {
        title: newEvent.title,
        type: newEvent.type,
        description: newEvent.description,
        date: newEvent.date,
        time: newEvent.time,
        venue: newEvent.venue,
        registrationLink: newEvent.registrationLink,
        isPaid: newEvent.isPaid,
        contactInfo: newEvent.contactInfo,
        createdAt: new Date().toISOString(),
        imageURL: newEvent.imagePreview || '',
        paymentQRURL: newEvent.isPaid ? (newEvent.paymentQRPreview || '') : ''
      };

      if (isEditing && editingEventId) {
        await updateDoc(doc(db, 'events', editingEventId), eventData);
        alert('Event updated successfully!');
      } else {
        await addDoc(collection(db, 'events'), eventData);
        alert('Event added successfully!');
      }

      resetForm();
      fetchEvents();
    } catch (error) {
      console.error("Error saving event: ", error);
      alert('Error saving event. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (event) => {
    setNewEvent({
      title: event.title,
      type: event.type,
      description: event.description || '',
      date: event.date,
      time: event.time || '',
      venue: event.venue || '',
      image: null,
      imagePreview: event.imageURL || '',
      registrationLink: event.registrationLink || '',
      isPaid: event.isPaid || false,
      paymentQR: null,
      paymentQRPreview: event.paymentQRURL || '',
      contactInfo: event.contactInfo || ''
    });
    setIsEditing(true);
    setEditingEventId(event.id);
    setShowForm(true);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
        alert('Event deleted successfully!');
        fetchEvents();
      } catch (error) {
        console.error("Error deleting event: ", error);
        alert('Error deleting event. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setNewEvent({
      title: '',
      type: '',
      description: '',
      date: '',
      time: '',
      venue: '',
      image: null,
      imagePreview: '',
      video: null,
      registrationLink: '',
      isPaid: false,
      paymentQR: null,
      paymentQRPreview: '',
      contactInfo: ''
    });
    setIsEditing(false);
    setEditingEventId(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getEventIcon = (type) => {
    switch(type) {
      case 'Technical Workshop': return '🔧';
      case 'Hackathon': return '💻';
      case 'Cultural Festival': return '🎭';
      case 'Sports Event': return '⚽';
      case 'Seminar': return '📚';
      case 'Conference': return '👔';
      case 'Webinar': return '📹';
      case 'Competition': return '🏆';
      case 'Exhibition': return '🖼️';
      case 'Guest Lecture': return '🎤';
      default: return '📅';
    }
  };

  return (
    <div className="event-management-container">
      <div className="event-header">
        <button onClick={() => history.goBack()} className="back-btn">
          <IoArrowBack size={24} />
        </button>
        <h2>Event Management</h2>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className={`add-event-btn ${showForm ? 'active' : ''}`}
        >
          {showForm ? <IoClose size={24} /> : <IoAdd size={24} />}
        </button>
      </div>

      <div className="search-section">
        <div className="search-bar">
          <IoSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              <IoClose />
            </button>
          )}
        </div>
        
        <div className="category-tabs">
          <button 
            className={activeCategory === 'All' ? 'active' : ''}
            onClick={() => setActiveCategory('All')}
          >
            All
          </button>
          {eventTypes.map(type => (
            <button
              key={type}
              className={activeCategory === type ? 'active' : ''}
              onClick={() => setActiveCategory(type)}
            >
              {getEventIcon(type)} {type}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="event-form-section">
          <div className="form-header">
            <Lottie animationData={eventAnimation} loop={true} className="form-animation" />
            <h3>{isEditing ? 'Edit Event' : 'Create New Event'}</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="event-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Event Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Event Type *</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                  required
                >
                  <option value="">Select Event Type</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Venue</label>
                <input
                  type="text"
                  value={newEvent.venue}
                  onChange={(e) => setNewEvent({...newEvent, venue: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Registration Link (Google Form)</label>
                <input
                  type="url"
                  value={newEvent.registrationLink}
                  onChange={(e) => setNewEvent({...newEvent, registrationLink: e.target.value})}
                  placeholder="https://forms.google.com/..."
                />
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newEvent.isPaid}
                    onChange={(e) => setNewEvent({...newEvent, isPaid: e.target.checked})}
                  />
                  Paid Event
                </label>
              </div>
              
              {newEvent.isPaid && (
                <div className="form-group">
                  <label>Payment QR Code</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQRChange}
                    disabled={isUploading}
                  />
                  {newEvent.paymentQRPreview && (
                    <div className="image-preview">
                      <img src={newEvent.paymentQRPreview} alt="QR Code Preview" />
                    </div>
                  )}
                </div>
              )}
              
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <label>Event Poster/Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isUploading}
                />
                {newEvent.imagePreview && (
                  <div className="image-preview">
                    <img src={newEvent.imagePreview} alt="Event Preview" />
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Contact Information</label>
                <input
                  type="text"
                  value={newEvent.contactInfo}
                  onChange={(e) => setNewEvent({...newEvent, contactInfo: e.target.value})}
                  placeholder="Email or phone number for queries"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                onClick={resetForm} 
                className="cancel-btn"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isUploading} 
                className="submit-btn"
              >
                {isUploading ? 'Saving...' : (isEditing ? 'Update Event' : 'Create Event')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="events-list-section">
        <div className="section-header">
          <h3>Events ({filteredEvents.length})</h3>
          <div className="filter-info">
            {activeCategory !== 'All' && (
              <span className="active-filter">
                 {activeCategory}
                <button onClick={() => setActiveCategory('All')}>
                  <IoClose />
                </button>
              </span>
            )}
          </div>
        </div>
        
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <Lottie animationData={eventAnimation} loop={true} className="empty-animation" />
            <p>
              {searchQuery || activeCategory !== 'All' 
                ? 'No events match your search criteria' 
                : 'No events found. Create your first event!'}
            </p>
            {(searchQuery || activeCategory !== 'All') && (
              <button 
                className="clear-filters-btn"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map(event => (
              <div key={event.id} className="event-card">
                {event.imageURL && (
                  <div className="event-image">
                    <img src={event.imageURL} alt={event.title} />
                  </div>
                )}
                <div className="event-content">
                  <div className="event-header">
                    <h4>{event.title}</h4>
                    <span className="event-type">
                      {getEventIcon(event.type)} {event.type}
                    </span>
                  </div>
                  
                  <div className="event-details">
                    <div className="event-meta">
                      <div className="meta-item">
                        <IoCalendar className="meta-icon" />
                        <span>{formatDate(event.date)}{event.time && ` • ${event.time}`}</span>
                      </div>
                      
                      {event.venue && (
                        <div className="meta-item">
                          <IoLocation className="meta-icon" />
                          <span>{event.venue}</span>
                        </div>
                      )}
                      
                      <div className="meta-item">
                        <IoPricetag className="meta-icon" />
                        <span className={event.isPaid ? 'paid-badge' : 'free-badge'}>
                          {event.isPaid ? 'Paid Event' : 'Free Event'}
                        </span>
                      </div>
                    </div>
                    
                    {event.description && (
                      <p className="event-description">
                        {event.description.length > 100 
                          ? `${event.description.substring(0, 100)}...` 
                          : event.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="event-actions">
                    <button 
                      onClick={() => handleEdit(event)}
                      className="edit-btn"
                    >
                      <IoCreate size={18} />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(event.id)}
                      className="delete-btn"
                    >
                      <IoTrash size={18} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventManagement;