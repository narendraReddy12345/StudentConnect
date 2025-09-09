import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { ref, onValue, off } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, realtimeDb } from '../../../firebase'; // Import realtimeDb
import { FiUpload, FiTrash2, FiUser, FiMail, FiPhone, FiHome, FiEdit, FiChevronDown, FiX, FiPlus, FiBook, FiUserX } from 'react-icons/fi';
import './index.css';

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [isAddingFaculty, setIsAddingFaculty] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [registerNoError, setRegisterNoError] = useState('');
  const [currentFaculty, setCurrentFaculty] = useState(null); // Track current faculty in cabin
  
  const departments = {
    'cse': 'Computer Science & Engineering',
    'mech': 'Mechanical Engineering',
    'ece': 'Electronics & Communication Engineering',
    'eee': 'Electrical & Electronics Engineering',
    'civil': 'Civil Engineering',
    'it': 'Information Technology',
    'mba': 'MBA',
    'agri': 'Agriculture Engineering'
  };

  const [newFaculty, setNewFaculty] = useState({
    registerNo: '',
    name: '',
    department: '',
    email: '',
    phone: '',
    cabin: '',
    isFA: false,
    FAClass: '',
    timetable: {}
  });

  // Listen to Realtime Database for current faculty presence
  useEffect(() => {
    const presenceRef = ref(realtimeDb, '/chair');
    
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const currentRegisterNo = data.current_register_no || '';
        const currentStatus = data.current_status || 'Absent';
        
        // Find the faculty member with the current register number
        if (currentRegisterNo && currentStatus === 'Present') {
          const currentFacultyMember = faculty.find(f => f.registerNo === currentRegisterNo);
          setCurrentFaculty(currentFacultyMember || { registerNo: currentRegisterNo, status: 'Present' });
        } else {
          setCurrentFaculty(null);
        }
      }
    }, (error) => {
      console.error("Error listening to Realtime Database:", error);
    });

    // Cleanup listener on unmount
    return () => {
      off(presenceRef, 'value', unsubscribe);
    };
  }, [faculty]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const facultySnapshot = await getDocs(collection(db, 'faculty'));
        setFaculty(facultySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please refresh the page.");
      }
    };
    fetchData();
  }, []);

  const resetForm = () => {
    setNewFaculty({
      registerNo: '',
      name: '',
      department: '',
      email: '',
      phone: '',
      cabin: '',
      isFA: false,
      FAClass: '',
      timetable: {}
    });
    setImageFile(null);
    setEditingId(null);
    setRegisterNoError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear register number error when user starts typing
    if (name === 'registerNo' && registerNoError) {
      setRegisterNoError('');
    }
    
    setNewFaculty({
      ...newFaculty,
      [name]: value
    });
  };

  const checkRegisterNoExists = async (registerNo) => {
    try {
      const q = query(
        collection(db, 'faculty'), 
        where('registerNo', '==', registerNo)
      );
      const querySnapshot = await getDocs(q);
      
      // If editing, exclude the current faculty member from the check
      if (editingId) {
        return querySnapshot.docs.some(doc => doc.id !== editingId);
      }
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking register number:", error);
      return false;
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleTimetableChange = (day, slot, value) => {
    setNewFaculty(prev => ({
      ...prev,
      timetable: {
        ...prev.timetable,
        [day]: {
          ...(prev.timetable[day] || {}),
          [slot]: value
        }
      }
    }));
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    
    try {
      const ref = storageRef(storage, `faculty_images/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(ref, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload image. Please try again.");
    }
  };

  const handleAddFaculty = async () => {
    if (!newFaculty.registerNo || !newFaculty.name || !newFaculty.department || !newFaculty.email) {
      setError("Register number, name, department and email are required");
      return;
    }

    // Validate register number format (alphanumeric, 6-15 characters)
    const registerNoRegex = /^[a-zA-Z0-9]{6,15}$/;
    if (!registerNoRegex.test(newFaculty.registerNo)) {
      setError("Register number must be 6-15 alphanumeric characters");
      return;
    }

    try {
      // Check if register number already exists
      const registerNoExists = await checkRegisterNoExists(newFaculty.registerNo);
      if (registerNoExists) {
        setRegisterNoError('This register number is already in use');
        return;
      }

      setIsAddingFaculty(true);
      setError(null);
      setRegisterNoError('');

      let imageUrl = newFaculty.imageUrl || '';
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const facultyData = {
        ...newFaculty,
        imageUrl: imageUrl || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        await updateDoc(doc(db, 'faculty', editingId), facultyData);
        setFaculty(faculty.map(f => f.id === editingId ? { ...facultyData, id: editingId } : f));
      } else {
        const docRef = await addDoc(collection(db, 'faculty'), facultyData);
        setFaculty([...faculty, { ...facultyData, id: docRef.id }]);
      }
      
      resetForm();
      setActiveTab('list');
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Error adding/updating faculty:", error);
      setError(error.message || "Failed to add/update faculty. Please try again.");
    } finally {
      setIsAddingFaculty(false);
    }
  };

  const handleEdit = (facultyMember) => {
    setNewFaculty({
      registerNo: facultyMember.registerNo || '',
      name: facultyMember.name,
      department: facultyMember.department,
      email: facultyMember.email,
      phone: facultyMember.phone || '',
      cabin: facultyMember.cabin || '',
      isFA: facultyMember.isFA || false,
      FAClass: facultyMember.FAClass || '',
      timetable: facultyMember.timetable || {},
      imageUrl: facultyMember.imageUrl || ''
    });
    setEditingId(facultyMember.id);
    setActiveTab('add');
    setIsMobileMenuOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        await deleteDoc(doc(db, 'faculty', id));
        setFaculty(faculty.filter(f => f.id !== id));
      } catch (error) {
        console.error("Error deleting faculty:", error);
        setError("Failed to delete faculty. Please try again.");
      }
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '1 (09-11)', '2 (10-11)', '3 (11-12)', 
    '4 (12-01)', '5 (01-02)', '6 (02-03)', 
    '7 (03-04)', '8 (04-05)'
  ];

  return (
    <div className="faculty-app">
      {/* Mobile Header */}
      <header className="mobile-header">
        <h1>Faculty Management</h1>
        <button 
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiChevronDown size={24} />}
        </button>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <button 
            className={`mobile-menu-item ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('list');
              setIsMobileMenuOpen(false);
            }}
          >
            Faculty List
          </button>
          <button 
            className={`mobile-menu-item ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('add');
              if (!editingId) resetForm();
              setIsMobileMenuOpen(false);
            }}
          >
            {editingId ? 'Edit Faculty' : <><FiPlus size={16} /> Add Faculty</>}
          </button>
        </div>
      )}

      {/* Desktop Header */}
      <header className="desktop-header">
        <h1>Faculty Management</h1>
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('list');
              resetForm();
            }}
          >
            Faculty List
          </button>
          <button 
            className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('add');
              if (!editingId) resetForm();
            }}
          >
            {editingId ? 'Edit Faculty' : 'Add Faculty'}
          </button>
        </div>
      </header>

      {/* Current Faculty Status Card */}
      {currentFaculty && (
        <div className="current-faculty-card">
          
          <div className="current-faculty-details">
            {currentFaculty.name ? (
              <>
                
                
              </>
            ) : (
              <div className="unknown-faculty">
                <FiUserX size={32} />
                <p>Unknown Faculty (ID: {currentFaculty.registerNo})</p>
                <small>This faculty member is not in the database</small>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <main className="app-content">
        {activeTab === 'list' ? (
          <div className="faculty-list">
            {faculty.length === 0 ? (
              <div className="empty-state">
                <p>No faculty members found</p>
                <button 
                  className="primary-button"
                  onClick={() => setActiveTab('add')}
                >
                  Add New Faculty
                </button>
              </div>
            ) : (
              faculty.map(member => (
                <div key={member.id} className="faculty-card">
                  <div className="card-header">
                    {member.imageUrl ? (
                      <img src={member.imageUrl} alt={member.name} className="faculty-avatar" />
                    ) : (
                      <div className="avatar-placeholder">
                        <FiUser size={24} />
                      </div>
                    )}
                    <div className="faculty-info">
                      <h3>{member.name}</h3>
                      <p className="department">{departments[member.department] || member.department}</p>
                      {member.registerNo && (
                        <p className="register-no">
                          <FiBook size={12} /> Reg No: {member.registerNo}
                        </p>
                      )}
                      {member.isFA && member.FAClass && (
                        <span className="fa-badge">Class Teacher: {member.FAClass}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="card-details">
                    <div className="detail-item">
                      <FiMail className="icon" />
                      <span>{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="detail-item">
                        <FiPhone className="icon" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    {member.cabin && (
                      <div className="detail-item">
                        <FiHome className="icon" />
                        <span>Cabin: {member.cabin}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-actions">
                    <button 
                      onClick={() => handleEdit(member)}
                      className="edit-button"
                      aria-label="Edit"
                    >
                      <FiEdit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(member.id)}
                      className="delete-button"
                      aria-label="Delete"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="add-faculty-form">
            <div className="form-section">
              <h2>Basic Information</h2>
              
              <div className="input-group">
                <label>Register Number *</label>
                <input
                  type="text"
                  name="registerNo"
                  placeholder="Enter register number (e.g., FAC123)"
                  value={newFaculty.registerNo}
                  onChange={handleInputChange}
                  required
                  className={registerNoError ? 'error' : ''}
                />
                {registerNoError && <span className="field-error">{registerNoError}</span>}
                <small className="helper-text">Must be 6-15 alphanumeric characters</small>
              </div>
              
              <div className="input-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  value={newFaculty.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Department *</label>
                <select
                  name="department"
                  value={newFaculty.department}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Department</option>
                  {Object.entries(departments).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  value={newFaculty.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter phone number"
                  value={newFaculty.phone}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="input-group">
                <label>Cabin Number</label>
                <input
                  type="text"
                  name="cabin"
                  placeholder="Enter cabin number"
                  value={newFaculty.cabin}
                  onChange={handleInputChange}
                />
              </div>

              <div className="input-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isFA"
                    checked={newFaculty.isFA}
                    onChange={(e) => setNewFaculty({...newFaculty, isFA: e.target.checked})}
                  />
                  Is Class Teacher
                </label>
              </div>
              
              {newFaculty.isFA && (
                <div className="input-group">
                  <label>Class Assigned</label>
                  <input
                    type="text"
                    name="FAClass"
                    placeholder="Enter class (e.g., CSE-A)"
                    value={newFaculty.FAClass}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>
            
            <div className="form-section">
              <h2>Faculty Photo</h2>
              <div className="image-upload-container">
                <label className="upload-label">
                  <FiUpload className="upload-icon" />
                  <span>{imageFile ? imageFile.name : 'Choose an image (optional)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden-input"
                  />
                </label>
                {imageFile && (
                  <div className="file-preview">
                    <small>Selected: {imageFile.name}</small>
                  </div>
                )}
                {newFaculty.imageUrl && !imageFile && (
                  <div className="current-image">
                    <small>Current image:</small>
                    <img src={newFaculty.imageUrl} alt="Current faculty" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-section">
              <h2>Timetable</h2>
              <div className="timetable-container">
                <div className="timetable-scroll">
                  <table className="timetable">
                    <thead>
                      <tr>
                        <th>Day/Slot</th>
                        {timeSlots.map(slot => (
                          <th key={slot}>{slot.split(' ')[0]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {days.map(day => (
                        <tr key={day}>
                          <td>{day.substring(0, 3)}</td>
                          {timeSlots.map(slot => (
                            <td key={slot}>
                              <input
                                type="text"
                                value={newFaculty.timetable[day]?.[slot] || ''}
                                onChange={(e) => handleTimetableChange(day, slot, e.target.value)}
                                placeholder="-"
                                className="timetable-input"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                onClick={() => {
                  setActiveTab('list');
                  resetForm();
                }}
                className="secondary-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddFaculty}
                className="primary-button"
                disabled={isAddingFaculty || !newFaculty.registerNo || !newFaculty.name || !newFaculty.department || !newFaculty.email}
              >
                {isAddingFaculty 
                  ? (editingId ? 'Updating...' : 'Adding...') 
                  : (editingId ? 'Update Faculty' : 'Add Faculty')}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FacultyManagement;