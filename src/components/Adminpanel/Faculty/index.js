import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import { FiUpload, FiTrash2, FiUser, FiMail, FiPhone, FiHome, FiEdit, FiChevronDown, FiX, FiPlus } from 'react-icons/fi';
import './index.css';

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [isAddingFaculty, setIsAddingFaculty] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
    name: '',
    department: '',
    email: '',
    phone: '',
    cabin: '',
    isFA: false,
    FAClass: '',
    timetable: {}
  });

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
  };

  const handleInputChange = (e) => {
    setNewFaculty({
      ...newFaculty,
      [e.target.name]: e.target.value
    });
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
      const storageRef = ref(storage, `faculty_images/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload image. Please try again.");
    }
  };

  const handleAddFaculty = async () => {
    if (!newFaculty.name || !newFaculty.department || !newFaculty.email) {
      setError("Name, department and email are required");
      return;
    }

    try {
      setIsAddingFaculty(true);
      setError(null);

      let imageUrl = newFaculty.imageUrl || '';
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const facultyData = {
        ...newFaculty,
        imageUrl: imageUrl || null,
        createdAt: new Date().toISOString()
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
                disabled={isAddingFaculty || !newFaculty.name || !newFaculty.department || !newFaculty.email}
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