import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiX,  FiUser, FiClock, FiHome, FiBook } from 'react-icons/fi';
import './index.css';

const Admin = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentFaculty, setCurrentFaculty] = useState({
    id: '',
    name: '',
    age: '',
    gender: '',
    faClass: '',
    subjects: '',
    timetable: {
      Monday: Array(8).fill(''),
      Tuesday: Array(8).fill(''),
      Wednesday: Array(8).fill(''),
      Thursday: Array(8).fill(''),
      Friday: Array(8).fill('')
    },
    cabin: '',
    department: '',
    present: false
  });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch faculty data
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'faculty'));
        const facultyData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timetable: doc.data().timetable || {
            Monday: Array(8).fill(''),
            Tuesday: Array(8).fill(''),
            Wednesday: Array(8).fill(''),
            Thursday: Array(8).fill(''),
            Friday: Array(8).fill('')
          }
        }));
        setFaculty(facultyData);
        setError(null);
      } catch (error) {
        console.error("Error fetching faculty: ", error);
        setError("Failed to load faculty data. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, []);

  const togglePresence = async (id, currentStatus) => {
    if (offline) {
      setError("Cannot update status while offline");
      return;
    }

    try {
      const facultyRef = doc(db, 'faculty', id);
      await updateDoc(facultyRef, { present: !currentStatus });
      
      setFaculty(faculty.map(f => 
        f.id === id ? { ...f, present: !currentStatus } : f
      ));
      setSuccess(`Status updated to ${!currentStatus ? 'Present' : 'Absent'}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error updating presence: ", error);
      setError("Failed to update status. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('timetable-')) {
      const [, day, period] = name.split('-');
      setCurrentFaculty(prev => ({
        ...prev,
        timetable: {
          ...prev.timetable,
          [day]: prev.timetable[day].map((val, idx) => 
            idx === parseInt(period) ? value : val
          )
        }
      }));
    } else {
      setCurrentFaculty({
        ...currentFaculty,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleEdit = (facultyMember) => {
    setIsEditing(true);
    setCurrentFaculty({
      ...facultyMember,
      age: facultyMember.age?.toString() || '',
      timetable: facultyMember.timetable || {
        Monday: Array(8).fill(''),
        Tuesday: Array(8).fill(''),
        Wednesday: Array(8).fill(''),
        Thursday: Array(8).fill(''),
        Friday: Array(8).fill('')
      }
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setCurrentFaculty({
      id: '',
      name: '',
      age: '',
      gender: '',
      faClass: '',
      subjects: '',
      timetable: {
        Monday: Array(8).fill(''),
        Tuesday: Array(8).fill(''),
        Wednesday: Array(8).fill(''),
        Thursday: Array(8).fill(''),
        Friday: Array(8).fill('')
      },
      cabin: '',
      department: '',
      present: false
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (offline) {
      setError("Cannot save changes while offline");
      return;
    }

    try {
      const facultyData = {
        name: currentFaculty.name.trim(),
        age: currentFaculty.age ? Number(currentFaculty.age) : null,
        gender: currentFaculty.gender.trim(),
        faClass: currentFaculty.faClass.trim(),
        subjects: currentFaculty.subjects.trim(),
        timetable: currentFaculty.timetable,
        cabin: currentFaculty.cabin.trim(),
        department: currentFaculty.department.trim(),
        present: Boolean(currentFaculty.present)
      };

      if (isEditing) {
        const facultyRef = doc(db, 'faculty', currentFaculty.id);
        await updateDoc(facultyRef, facultyData);
        setFaculty(faculty.map(f => 
          f.id === currentFaculty.id ? { ...facultyData, id: currentFaculty.id } : f
        ));
        setSuccess("Faculty member updated successfully");
      } else {
        const docRef = await addDoc(collection(db, 'faculty'), facultyData);
        setFaculty([...faculty, { ...facultyData, id: docRef.id }]);
        setSuccess("New faculty member added successfully");
      }
      
      setShowForm(false);
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error saving faculty: ", error);
      setError(`Failed to save: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (offline) {
      setError("Cannot delete while offline");
      return;
    }

    if (window.confirm("Are you sure you want to delete this faculty member?")) {
      try {
        await deleteDoc(doc(db, 'faculty', id));
        setFaculty(faculty.filter(f => f.id !== id));
        setSuccess("Faculty member deleted successfully");
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error("Error deleting faculty: ", error);
        setError("Failed to delete. Please try again.");
      }
    }
  };

  const filteredFaculty = faculty.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.department && f.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const slideUp = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const stagger = {
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  if (loading) {
    return (
      <motion.div 
        className="loading-container"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="loading-spinner"></div>
        <p>Loading faculty data...</p>
        {offline && <p className="offline-notice">You're currently offline</p>}
      </motion.div>
    );
  }

  return (
    <div className="admin-container">
      <AnimatePresence>
        {offline && (
          <motion.div 
            className="offline-banner"
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            exit={{ y: -50 }}
          >
            <div className="offline-content">
              <span className="pulse-dot"></span>
              You're offline. Some features may be limited.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.h1 
        initial="hidden"
        animate="visible"
        variants={slideUp}
      >
        Faculty Management
      </motion.h1>
      
      <AnimatePresence>
        {error && (
          <motion.div 
            className="notification error"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {error}
            <button onClick={() => setError(null)} className="close-notification">
              <FiX />
            </button>
          </motion.div>
        )}
        
        {success && (
          <motion.div 
            className="notification success"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {success}
            <button onClick={() => setSuccess(null)} className="close-notification">
              <FiX />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="admin-actions">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="add-faculty-btn" onClick={handleAddNew}>
          <FiPlus /> Add Faculty
        </button>
      </div>
      
      <AnimatePresence>
        {showForm && (
          <motion.div 
            className="faculty-form-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="faculty-form-container"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <div className="form-header">
                <h2>{isEditing ? 'Edit Faculty' : 'Add Faculty'}</h2>
                <button 
                  className="close-form-btn"
                  onClick={() => setShowForm(false)}
                >
                  <FiX />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3><FiUser /> Basic Information</h3>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={currentFaculty.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Dr. John Doe"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Age</label>
                      <input
                        type="number"
                        name="age"
                        value={currentFaculty.age}
                        onChange={handleInputChange}
                        min="18"
                        max="100"
                        placeholder="35"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Gender</label>
                      <select
                        name="gender"
                        value={currentFaculty.gender}
                        onChange={handleInputChange}
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="form-section">
                  <h3><FiBook /> Teaching Details</h3>
                  <div className="form-group">
                    <label>Class/Division</label>
                    <input
                      type="text"
                      name="faClass"
                      value={currentFaculty.faClass}
                      onChange={handleInputChange}
                      placeholder="12-A, B.Tech CSE, etc."
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Subjects</label>
                    <input
                      type="text"
                      name="subjects"
                      value={currentFaculty.subjects}
                      onChange={handleInputChange}
                      placeholder="Mathematics, Physics, etc."
                    />
                  </div>
                </div>
                
                <div className="form-section">
                  <h3><FiClock /> Timetable</h3>
                  <div className="timetable-scroll-container">
                    <table className="timetable-table">
                      <thead>
                        <tr>
                          <th>Day</th>
                          {["9:00AM - 10:00AM", "10:00AM - 11:00AM","11:00AM - 12:00AM","12:00PM - 1:00PM","1:00PM - 2:00PM", "2:00PM - 3:00PM","3:00PM - 4:00PM","4:00PM - 5:00PM"].map(period => (
                            <th key={period}>{period}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                          <tr key={day}>
                            <td>{day.substring(0, 3)}</td>
                            {currentFaculty.timetable[day].map((value, period) => (
                              <td key={`${day}-${period}`}>
                                <input
                                  type="text"
                                  name={`timetable-${day}-${period}`}
                                  value={value}
                                  onChange={handleInputChange}
                                  placeholder="-"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="form-section">
                  <h3><FiHome /> Additional Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Cabin Number</label>
                      <input
                        type="text"
                        name="cabin"
                        value={currentFaculty.cabin}
                        onChange={handleInputChange}
                        placeholder="A-12"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Department *</label>
                      <input
                        type="text"
                        name="department"
                        value={currentFaculty.department}
                        onChange={handleInputChange}
                        required
                        placeholder="Computer Science"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="present"
                        checked={currentFaculty.present}
                        onChange={handleInputChange}
                        className="checkbox-input"
                      />
                      <span className="checkbox-custom"></span>
                      Currently Present on Campus
                    </label>
                  </div>
                </div>
                
                <div className="form-buttons">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="save-btn">
                    {isEditing ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div 
        className="faculty-list-container"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {filteredFaculty.length > 0 ? (
          <motion.div className="faculty-cards">
            {filteredFaculty.map((f) => (
              <motion.div 
                key={f.id}
                className="faculty-card"
                variants={slideUp}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="card-header">
                  <h3>{f.name}</h3>
                  <div className={`status-badge ${f.present ? 'present' : 'absent'}`}>
                    {f.present ? 'Present' : 'Absent'}
                  </div>
                </div>
                
                <div className="card-details">
                  <div className="detail-item">
                    <span className="detail-label">Department:</span>
                    <span>{f.department || 'N/A'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Subjects:</span>
                    <span>{f.subjects || 'N/A'}</span>
                  </div>
                  
                  <div className="detail-row">
                    <div className="detail-item">
                      <span className="detail-label">Class:</span>
                      <span>{f.faClass || 'N/A'}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">Cabin:</span>
                      <span>{f.cabin || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="card-actions">
                  <button 
                    onClick={() => togglePresence(f.id, f.present)}
                    className={`status-btn ${f.present ? 'absent-btn' : 'present-btn'}`}
                  >
                    {f.present ? 'Mark Absent' : 'Mark Present'}
                  </button>
                  
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleEdit(f)}
                      className="edit-btn"
                    >
                      <FiEdit2 />
                    </button>
                    <button 
                      onClick={() => handleDelete(f.id)}
                      className="delete-btn"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="no-results"
            variants={fadeIn}
          >
            <img src="/empty-state.svg" alt="No results" />
            <p>No faculty members found</p>
            {searchTerm && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                Clear search
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Admin;