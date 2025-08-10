import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc,doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import './index.css';

const EventsManagement = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    const fetchEvents = async () => {
      const querySnapshot = await getDocs(collection(db, 'events'));
      setEvents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchEvents();
  }, []);

  const handleInputChange = (e) => {
    setNewEvent({
      ...newEvent,
      [e.target.name]: e.target.value
    });
  };

  const handleAddEvent = async () => {
    try {
      const docRef = await addDoc(collection(db, 'events'), newEvent);
      setEvents([...events, { ...newEvent, id: docRef.id }]);
      setNewEvent({
        title: '',
        date: '',
        location: '',
        description: ''
      });
    } catch (error) {
      console.error("Error adding event: ", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'events', id));
      setEvents(events.filter(e => e.id !== id));
    } catch (error) {
      console.error("Error deleting event: ", error);
    }
  };

  return (
    <div className="events-management">
      <h2>Events Management</h2>
      
      <div className="add-event-form">
        <h3>Add New Event</h3>
        <div className="form-group">
          <input
            type="text"
            name="title"
            placeholder="Event Title"
            value={newEvent.title}
            onChange={handleInputChange}
          />
          <input
            type="date"
            name="date"
            value={newEvent.date}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={newEvent.location}
            onChange={handleInputChange}
          />
          <textarea
            name="description"
            placeholder="Description"
            value={newEvent.description}
            onChange={handleInputChange}
          />
          <button onClick={handleAddEvent}>Add Event</button>
        </div>
      </div>

      <div className="events-list">
        <h3>Upcoming Events</h3>
        {events.map(event => (
          <div key={event.id} className="event-card">
            <div className="event-info">
              <h4>{event.title}</h4>
              <p>Date: {event.date}</p>
              <p>Location: {event.location}</p>
              {event.description && <p>Description: {event.description}</p>}
            </div>
            <button 
              onClick={() => handleDelete(event.id)}
              className="delete-btn"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsManagement;