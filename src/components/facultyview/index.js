import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom'; // Changed from useNavigate
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { FiSearch, FiUser, FiMail, FiPhone, FiHome, FiChevronLeft } from 'react-icons/fi';
import './index.css';

const FacultyList = () => {
  const { dept } = useParams();
  const history = useHistory(); // Changed from useNavigate
  const [faculty, setFaculty] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get department full name from code
  const getDeptName = (code) => {
    const deptNames = {
      'cse': 'cse',
      'Mechanical Engineering': 'mech',
      'ece': 'ece',
      'eee': 'eee',
      'civil': 'civil',
      'it': 'it',
      'mba': 'mba',
      'agri': 'agri'
    };
    return deptNames[code] || code;
  };

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        setIsLoading(true);
        let q;
        
        if (dept) {
          q = query(collection(db, 'faculty'), where('department', '==', getDeptName(dept)));
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
        (member.phone && member.phone.includes(searchTerm))
      );
      setFilteredFaculty(filtered);
    }
  }, [searchTerm, faculty]);

  return (
    <div className="faculty-list-container">
      {/* Header */}
      <header className="faculty-header">
        <button 
          className="back-button"
          onClick={() => history.goBack()} // Changed from navigate(-1)
        >
          <FiChevronLeft size={24} />
        </button>
        <h1>{getDeptName(dept)} Faculty</h1>
        <div className="header-spacer"></div>
      </header>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-input">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search faculty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="faculty-content">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading faculty...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : filteredFaculty.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? (
              <>
                <p>No faculty found matching "{searchTerm}"</p>
                <button 
                  className="clear-search"
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
          <div className="faculty-cards">
            {filteredFaculty.map(member => (
              <div key={member.id} className="faculty-card">
                <div className="card-main">
                  {member.imageUrl ? (
                    <img 
                      src={member.imageUrl} 
                      alt={member.name} 
                      className="faculty-avatar" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '';
                        e.target.className = 'faculty-avatar-error';
                      }}
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      <FiUser size={20} />
                    </div>
                  )}
                  
                  <div className="faculty-info">
                    <h3>{member.name}</h3>
                    <p className="department">{member.department}</p>
                    
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FacultyList;