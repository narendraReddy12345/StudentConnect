import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { ref, onValue, off } from 'firebase/database';
import { db, realtimeDb } from '../../firebase';
import { FiSearch, FiUser, FiMail, FiPhone, FiHome, FiChevronLeft, FiClock, FiX, FiCalendar } from 'react-icons/fi';
import './index.css';

const FacultyList = () => {
  const { dept } = useParams();
  const history = useHistory();
  const [faculty, setFaculty] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [presenceData, setPresenceData] = useState({
    current_register_no: '',
    current_status: 'Present',
    current_weight: 0
  });
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [selectedFacultyName, setSelectedFacultyName] = useState('');
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [currentDay, setCurrentDay] = useState(getCurrentDay());

  // Get current day
  function getCurrentDay() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }

  // Time slots
  const timeSlots = [
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 1:00 PM',
    '1:00 PM - 2:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM'
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Get department full name from code
  const getDeptName = (code) => {
    const deptNames = {
      'cse': 'Computer Science & Engineering',
      'mech': 'Mechanical Engineering',
      'ece': 'Electronics & Communication Engineering',
      'eee': 'Electrical & Electronics Engineering',
      'civil': 'Civil Engineering',
      'it': 'Information Technology',
      'mba': 'MBA',
      'agri': 'Agriculture Engineering'
    };
    return deptNames[code] || code;
  };

  // Listen to Realtime Database for presence updates
  useEffect(() => {
    const presenceRef = ref(realtimeDb, '/chair');
    
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log("Realtime DB data:", data);
        setPresenceData({
          current_register_no: data.current_register_no || '',
          current_status: data.current_status || 'Absent',
          current_weight: data.current_weight || 0
        });
      }
    }, (error) => {
      console.error("Error listening to Realtime Database:", error);
    });

    return () => {
      off(presenceRef, 'value', unsubscribe);
    };
  }, []);

  // Check if a faculty member is currently present
  const isFacultyPresent = (registerNo) => {
    const isPresent = presenceData.current_register_no === registerNo && 
                     presenceData.current_status === 'Present';
    console.log(`Faculty ${registerNo} present: ${isPresent}`);
    return isPresent;
  };

  // Fetch faculty timetable
  const fetchFacultyTimetable = async (facultyId, facultyName) => {
    try {
      const facultyRef = doc(db, 'faculty', facultyId);
      const facultyDoc = await getDoc(facultyRef);
      if (facultyDoc.exists()) {
        const data = facultyDoc.data();
        setSelectedTimetable(data.timetable || {});
        setSelectedFacultyName(facultyName);
        setShowTimetableModal(true);
      }
    } catch (err) {
      console.error("Error fetching timetable:", err);
      setError("Failed to load timetable");
    }
  };

  // Get current time slot
  const getCurrentTimeSlot = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    for (let slot of timeSlots) {
      const [start, end] = slot.split(' - ');
      const [startHour, startMinute] = parseTime(start);
      const [endHour, endMinute] = parseTime(end);
      
      const currentTotalMinutes = currentHour * 60 + currentMinute;
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      
      if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes) {
        return slot;
      }
    }
    return null;
  };

  const parseTime = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    let [hour, minute] = time.split(':').map(Number);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return [hour, minute];
  };

  // Render timetable view
  const renderTimetableContent = () => {
    if (!selectedTimetable || Object.keys(selectedTimetable).length === 0) {
      return (
        <div className="empty-timetable">
          <FiCalendar size={48} />
          <p>No timetable set for this faculty</p>
        </div>
      );
    }

    const currentSlot = getCurrentTimeSlot();
    const todaySchedule = selectedTimetable[currentDay] || {};

    return (
      <div className="timetable-container">
        {/* Day Selector */}
        <div className="day-selector">
          {daysOfWeek.map(day => (
            <button
              key={day}
              className={`day-btn ${currentDay === day ? 'active' : ''}`}
              onClick={() => setCurrentDay(day)}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Today's Schedule Highlight */}
        <div className="today-schedule">
          <div className="today-header">
            <h3>{currentDay}'s Schedule</h3>
            <span className="today-badge">Today</span>
          </div>
          
          <div className="schedule-list">
            {timeSlots.map(slot => {
              const subject = todaySchedule[slot];
              const isCurrentSlot = currentSlot === slot && currentDay === getCurrentDay();
              
              if (!subject) return null;
              
              return (
                <div key={slot} className={`schedule-item ${isCurrentSlot ? 'current' : ''}`}>
                  <div className="schedule-time">
                    <FiClock size={14} />
                    <span>{slot}</span>
                    {isCurrentSlot && <span className="live-badge">LIVE</span>}
                  </div>
                  <div className="schedule-subject">{subject}</div>
                </div>
              );
            })}
            
            {Object.keys(todaySchedule).length === 0 && (
              <div className="no-classes">
                <p>No classes scheduled for {currentDay}</p>
              </div>
            )}
          </div>
        </div>

        {/* Full Week View Toggle */}
        <details className="full-week-view">
          <summary>View Full Week Schedule</summary>
          <div className="week-schedule">
            {daysOfWeek.map(day => {
              const daySchedule = selectedTimetable[day] || {};
              const hasClasses = Object.keys(daySchedule).length > 0;
              
              return (
                <div key={day} className="day-schedule">
                  <h4 className="day-title">{day}</h4>
                  {hasClasses ? (
                    Object.entries(daySchedule).map(([slot, subject]) => (
                      <div key={slot} className="week-schedule-item">
                        <span className="week-time">{slot}</span>
                        <span className="week-subject">{subject}</span>
                      </div>
                    ))
                  ) : (
                    <p className="no-schedule">No classes</p>
                  )}
                </div>
              );
            })}
          </div>
        </details>
      </div>
    );
  };

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        setIsLoading(true);
        let q;
        
        if (dept) {
          q = query(collection(db, 'faculty'), where('department', '==', dept));
        } else {
          q = collection(db, 'faculty');
        }
        
        const facultySnapshot = await getDocs(q);
        const facultyData = facultySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        setFaculty(facultyData);
        setFilteredFaculty(facultyData);
      } catch (err) {
        console.error("Error fetching faculty:", err);
        setError("Failed to load faculty data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFaculty();
  }, [dept]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFaculty(faculty);
    } else {
      const filtered = faculty.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.phone && member.phone.includes(searchTerm)) ||
        (member.registerNo && member.registerNo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredFaculty(filtered);
    }
  }, [searchTerm, faculty]);

  return (
    <div className="faculty-app">
      {/* Header */}
      <header className="app-header">
        <button 
          className="back-btn"
          onClick={() => history.goBack()}
        >
          <FiChevronLeft size={24} />
        </button>
        <h1 className="app-title">{getDeptName(dept)} Faculty</h1>
        <div className="header-spacer"></div>
      </header>

      {/* Status Summary */}
      <div className="status-summary">
        <div className="status-counters">
          <div className="counter-item">
            <div className="status-indicator online-indicator"></div>
            <span>In Cabin</span>
          </div>
          <div className="counter-item">
            <div className="status-indicator offline-indicator"></div>
            <span>Not Available</span>
          </div>
        </div>
        <div className="current-status">
          <div className="status-info">
            <span className="info-label">Current:</span>
           
          </div>
          <div className="status-info">
            <span className="info-label">Status:</span>
            <span className={`info-value ${presenceData.current_status.toLowerCase()}`}>
              {presenceData.current_status}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar1">
        <div className="search-wrapper1">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search faculty by name, email, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="faculty-content">
        {isLoading ? (
          <div className="loading-view">
            <div className="loading-spinner"></div>
            <p>Loading faculty...</p>
          </div>
        ) : error ? (
          <div className="error-view">
            <p>{error}</p>
            <button 
              className="retry-btn"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : filteredFaculty.length === 0 ? (
          <div className="empty-view">
            {searchTerm ? (
              <>
                <p>No faculty found matching "{searchTerm}"</p>
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                >
                  Clear search
                </button>
              </>
            ) : (
              <p>No faculty members found in this department</p>
            )}
          </div>
        ) : (
          <div className="faculty-list">
            {filteredFaculty.map(member => {
              const isPresent = isFacultyPresent(member.registerNo);
              
              return (
                <div key={member.id} className="faculty-item">
                  <div className="item-content">
                    <div className="avatar-container">
                      <div className="avatar-wrapper">
                        {member.imageUrl ? (
                          <img 
                            src={member.imageUrl} 
                            alt={member.name} 
                            className="faculty-avatar" 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '';
                              e.target.className = 'avatar-error';
                            }}
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            <FiUser size={20} />
                          </div>
                        )}
                        <div className={`online-dot ${isPresent ? 'active' : 'inactive'}`}></div>
                      </div>
                    </div>
                    
                    <div className="faculty-info">
                      <div className="info-header">
                        <h3 className="faculty-name">{member.name}</h3>
                        <button 
                          className="timetable-icon-btn"
                          onClick={() => fetchFacultyTimetable(member.id, member.name)}
                        >
                          <FiClock size={18} />
                        </button>
                      </div>
                      
                      <p className="department">{getDeptName(member.department)}</p>
                      {member.registerNo && (
                        <p className="faculty-id">ID: {member.registerNo}</p>
                      )}
                      
                      <div className="contact-info">
                        <div className="contact-item">
                          <FiMail size={14} />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="contact-item">
                            <FiPhone size={14} />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        {member.cabin && (
                          <div className="contact-item">
                            <FiHome size={14} />
                            <span>Cabin: {member.cabin}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Instagram-style Timetable Modal */}
      {showTimetableModal && (
        <div className="instagram-modal-overlay" onClick={() => setShowTimetableModal(false)}>
          <div className="instagram-modal" onClick={(e) => e.stopPropagation()}>
            <div className="instagram-modal-header">
              <div className="modal-header-content">
                <div className="faculty-info-mini">
                  <FiUser size={20} />
                  <div>
                    <h3>{selectedFacultyName}</h3>
                    <p>Weekly Schedule</p>
                  </div>
                </div>
                <button 
                  className="close-modal-btn"
                  onClick={() => setShowTimetableModal(false)}
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>
            
            <div className="instagram-modal-body">
              {renderTimetableContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyList;