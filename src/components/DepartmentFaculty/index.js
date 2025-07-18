// DepartmentFaculty.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { FiSearch, FiArrowLeft, FiUser, FiBook, FiHome, FiPhone, FiMail } from 'react-icons/fi';
import './index.css';
import { motion} from 'framer-motion';

const DepartmentFaculty = () => {
  const { department } = useParams();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  // Fetch faculty data for the specific department
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'faculty'), 
          where('department', '==', department.toUpperCase())
        );
        
        const querySnapshot = await getDocs(q);
        const facultyData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setFaculty(facultyData);
        setError(null);
      } catch (error) {
        console.error("Error fetching faculty: ", error);
        setError("Failed to load faculty data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, [department]);

  const filteredFaculty = faculty.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.subjects && f.subjects.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading {department} faculty...</p>
      </div>
    );
  }

  return (
    <div className="department-faculty-container">
      <div className="department-header">
        <button 
          className="back-button"
          onClick={() => window.history.back()}
        >
          <FiArrowLeft />
        </button>
        <h1>{department.toUpperCase()} Faculty</h1>
      </div>
      
      <div className="search-bar">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder={`Search ${department} faculty...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <motion.div 
        className="faculty-list"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        {filteredFaculty.length > 0 ? (
          filteredFaculty.map((f) => (
            <motion.div 
              key={f.id}
              className="faculty-card"
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="faculty-card-header">
                <div className="faculty-avatar">
                  <FiUser />
                </div>
                <div className="faculty-name">
                  <h3>{f.name}</h3>
                  <p className="faculty-status">
                    <span className={`status-dot ${f.present ? 'present' : 'absent'}`}></span>
                    {f.present ? 'Present' : 'Not on campus'}
                  </p>
                </div>
              </div>
              
              <div className="faculty-details">
                <div className="detail-item">
                  <FiBook className="detail-icon" />
                  <span>{f.subjects || 'Subjects not specified'}</span>
                </div>
                
                {f.faClass && (
                  <div className="detail-item">
                    <FiUser className="detail-icon" />
                    <span>Class: {f.faClass}</span>
                  </div>
                )}
                
                {f.cabin && (
                  <div className="detail-item">
                    <FiHome className="detail-icon" />
                    <span>Cabin: {f.cabin}</span>
                  </div>
                )}
              </div>
              
              <div className="faculty-contact">
                <button className="contact-button">
                  <FiPhone /> Call
                </button>
                <button className="contact-button">
                  <FiMail /> Email
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="no-results">
            <p>No faculty members found</p>
            {searchTerm && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DepartmentFaculty;