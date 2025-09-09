import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ref, onValue, off } from 'firebase/database';
import { db, realtimeDb } from '../../firebase';
import { FiSearch, FiUser, FiMail, FiPhone, FiHome, FiChevronLeft } from 'react-icons/fi';
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

    // Cleanup listener on unmount
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
            <span className="info-value">{presenceData.current_register_no || 'None'}</span>
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
      <div className="search-bar">
        <div className="search-wrapper">
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
                      {member.imageUrl ? (
                        <div className="avatar-wrapper">
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
                          {/* Instagram-style online indicator */}
                          <div className={`online-dot ${isPresent ? 'active' : 'inactive'}`}></div>
                        </div>
                      ) : (
                        <div className="avatar-wrapper">
                          <div className="avatar-placeholder">
                            <FiUser size={20} />
                          </div>
                          {/* Instagram-style online indicator */}
                          <div className={`online-dot ${isPresent ? 'active' : 'inactive'}`}></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="faculty-info">
                      <div className="info-header">
                        <h3 className="faculty-name">{member.name}</h3>
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
    </div>
  );
};

export default FacultyList;