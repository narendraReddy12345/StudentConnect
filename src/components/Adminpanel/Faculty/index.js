import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, onValue, off } from 'firebase/database';
import { db, realtimeDb } from '../../../firebase';
import { FiUser, FiMail, FiPhone, FiHome, FiEdit, FiTrash2, FiPlus, FiX, FiBook, FiUpload, FiClock } from 'react-icons/fi';
import './index.css';

const FacultyManagement = () => {
  // Cloudinary configuration
  const CLOUD_NAME = 'dmu3tqxgb';
  const UPLOAD_PRESET = 'eventimgs';

  const departments = {
    'cse': 'Computer Science',
    'mech': 'Mechanical',
    'ece': 'Electronics',
    'eee': 'Electrical',
    'civil': 'Civil',
    'it': 'IT',
    'mba': 'MBA',
    'agri': 'Agriculture'
  };

  // Time slots for timetable
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

  // State
  const [faculty, setFaculty] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [activeView, setActiveView] = useState('list');
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [currentFaculty, setCurrentFaculty] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyTimetable, setFacultyTimetable] = useState({});

  const [formData, setFormData] = useState({
    registerNo: '',
    name: '',
    department: '',
    email: '',
    phone: '',
    cabin: '',
    isFA: false,
    FAClass: '',
    imageUrl: '',
    timetable: {}
  });

  // Fetch faculty data
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        setIsLoading(true);
        const facultySnapshot = await getDocs(collection(db, 'faculty'));
        const facultyData = facultySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFaculty(facultyData);
        
        // Load timetable data for each faculty
        const timetableData = {};
        facultyData.forEach(f => {
          if (f.timetable) {
            timetableData[f.id] = f.timetable;
          }
        });
        setFacultyTimetable(timetableData);
      } catch (err) {
        setError("Failed to load faculty data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFaculty();
  }, []);

  // Realtime current faculty listener
  useEffect(() => {
    const presenceRef = ref(realtimeDb, '/chair');
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const currentRegisterNo = data.current_register_no || '';
        const currentStatus = data.current_status || 'Absent';
        
        if (currentRegisterNo && currentStatus === 'Present') {
          const currentFacultyMember = faculty.find(f => f.registerNo === currentRegisterNo);
          setCurrentFaculty(currentFacultyMember || { registerNo: currentRegisterNo, status: 'Present' });
        } else {
          setCurrentFaculty(null);
        }
      }
    });

    return () => off(presenceRef, 'value', unsubscribe);
  }, [faculty]);

  // Upload image to Cloudinary
  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.registerNo || !formData.name || !formData.department || !formData.email) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Upload new image if selected
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      const facultyData = {
        ...formData,
        imageUrl,
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
      setActiveView('list');
    } catch (error) {
      setError(error.message || "Failed to save faculty data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle edit action
  const handleEdit = (facultyMember) => {
    setFormData(facultyMember);
    setEditingId(facultyMember.id);
    setActiveView('form');
  };

  // Handle delete action
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        await deleteDoc(doc(db, 'faculty', id));
        setFaculty(faculty.filter(f => f.id !== id));
      } catch (error) {
        setError("Failed to delete faculty member");
      }
    }
  };

  // Handle timetable management
  const handleManageTimetable = (facultyMember) => {
    setSelectedFaculty(facultyMember);
    const existingTimetable = facultyTimetable[facultyMember.id] || {};
    setFormData(prev => ({ ...prev, timetable: existingTimetable }));
    setShowTimetableModal(true);
  };

  // Handle timetable cell update
  const handleTimetableUpdate = (day, timeSlot, value) => {
    setFormData(prev => ({
      ...prev,
      timetable: {
        ...prev.timetable,
        [day]: {
          ...prev.timetable[day],
          [timeSlot]: value
        }
      }
    }));
  };

  // Save timetable
  const saveTimetable = async () => {
    if (!selectedFaculty) return;
    
    try {
      setIsLoading(true);
      const facultyRef = doc(db, 'faculty', selectedFaculty.id);
      await updateDoc(facultyRef, {
        timetable: formData.timetable
      });
      
      // Update local state
      setFacultyTimetable(prev => ({
        ...prev,
        [selectedFaculty.id]: formData.timetable
      }));
      
      setFaculty(faculty.map(f => 
        f.id === selectedFaculty.id 
          ? { ...f, timetable: formData.timetable }
          : f
      ));
      
      setShowTimetableModal(false);
      setError(null);
    } catch (err) {
      setError("Failed to save timetable");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      registerNo: '',
      name: '',
      department: '',
      email: '',
      phone: '',
      cabin: '',
      isFA: false,
      FAClass: '',
      imageUrl: '',
      timetable: {}
    });
    setImageFile(null);
    setEditingId(null);
  };

  // Render timetable view
  const renderTimetable = (timetable) => {
    if (!timetable || Object.keys(timetable).length === 0) {
      return <p className="no-timetable">No timetable set</p>;
    }
    
    return (
      <div className="timetable-preview">
        <table className="timetable-table">
          <thead>
            <tr>
              <th>Time / Day</th>
              {daysOfWeek.map(day => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(slot => (
              <tr key={slot}>
                <td className="time-slot">{slot}</td>
                {daysOfWeek.map(day => (
                  <td key={`${day}-${slot}`}>
                    {timetable[day]?.[slot] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="faculty-app">
      {/* Header */}
      <header className="app-header">
        <h1>Faculty Management</h1>
        <button 
          className="add-button"
          onClick={() => {
            resetForm();
            setActiveView('form');
          }}
        >
          <FiPlus size={24} />
        </button>
      </header>

      {/* Current Faculty Status */}
      {currentFaculty && (
        <div className="current-faculty-card">
          <div className="current-avatar">
            {currentFaculty.imageUrl ? (
              <img src={currentFaculty.imageUrl} alt={currentFaculty.name} />
            ) : (
              <FiUser size={32} />
            )}
          </div>
          <div className="current-info">
            <h3>{currentFaculty.name || `Unknown (${currentFaculty.registerNo})`}</h3>
            <p>{departments[currentFaculty.department] || 'No department'}</p>
            <p className="present-status">● Currently Present</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>
            <FiX size={18} />
          </button>
        </div>
      )}

      {/* Faculty List View */}
      {activeView === 'list' && (
        <div className="faculty-list">
          {isLoading && faculty.length === 0 ? (
            <div className="loading-state">
              <p>Loading faculty...</p>
            </div>
          ) : faculty.length === 0 ? (
            <div className="empty-state">
              <p>No faculty members found</p>
              <button 
                className="primary-button"
                onClick={() => setActiveView('form')}
              >
                Add Faculty
              </button>
            </div>
          ) : (
            faculty.map(member => (
              <div key={member.id} className="faculty-card">
                <div className="card-header">
                  <div className="faculty-avatar">
                    {member.imageUrl ? (
                      <img src={member.imageUrl} alt={member.name} />
                    ) : (
                      <FiUser size={32} />
                    )}
                  </div>
                  <div className="faculty-info">
                    <h3>{member.name}</h3>
                    <p className="department">{departments[member.department] || member.department}</p>
                    {member.registerNo && (
                      <p className="register-no">
                        <FiBook size={12} /> {member.registerNo}
                      </p>
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
                    onClick={() => handleManageTimetable(member)}
                    className="action-button timetable"
                    title="Manage Timetable"
                  >
                    <FiClock size={18} />
                  </button>
                  <button 
                    onClick={() => handleEdit(member)}
                    className="action-button edit"
                  >
                    <FiEdit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(member.id)}
                    className="action-button delete"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>

                {/* Timetable Preview */}
                {member.timetable && Object.keys(member.timetable).length > 0 && (
                  <div className="timetable-preview-section">
                    <details>
                      <summary>View Timetable</summary>
                      {renderTimetable(member.timetable)}
                    </details>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Faculty Form View */}
      {activeView === 'form' && (
        <div className="faculty-form">
          <div className="form-header">
            <button 
              className="back-button"
              onClick={() => {
                setActiveView('list');
                resetForm();
              }}
            >
              &larr;
            </button>
            <h2>{editingId ? 'Edit Faculty' : 'Add Faculty'}</h2>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Profile Picture Upload */}
            <div className="form-section">
              <label className="image-upload">
                <div className="avatar-preview">
                  {imageFile ? (
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" />
                  ) : formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Current" />
                  ) : (
                    <div className="upload-placeholder">
                      <FiUpload size={24} />
                      <span>Upload Photo</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="hidden-input"
                />
              </label>
            </div>

            {/* Form Fields */}
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Register Number *</label>
              <input
                type="text"
                name="registerNo"
                value={formData.registerNo}
                onChange={handleInputChange}
                placeholder="Enter register number"
                required
              />
            </div>

            <div className="form-group">
              <label>Department *</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Department</option>
                {Object.entries(departments).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </div>

            <div className="form-group">
              <label>Cabin Number</label>
              <input
                type="text"
                name="cabin"
                value={formData.cabin}
                onChange={handleInputChange}
                placeholder="Enter cabin number"
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isFA"
                  checked={formData.isFA}
                  onChange={(e) => setFormData({...formData, isFA: e.target.checked})}
                />
                Is Class Teacher
              </label>
            </div>

            {formData.isFA && (
              <div className="form-group">
                <label>Class Assigned</label>
                <input
                  type="text"
                  name="FAClass"
                  value={formData.FAClass}
                  onChange={handleInputChange}
                  placeholder="Enter class (e.g., CSE-A)"
                />
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setActiveView('list');
                  resetForm();
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timetable Modal */}
      {showTimetableModal && selectedFaculty && (
        <div className="modal-overlay">
          <div className="modal-content timetable-modal">
            <div className="modal-header">
              <h2>Manage Timetable - {selectedFaculty.name}</h2>
              <button 
                className="close-button"
                onClick={() => setShowTimetableModal(false)}
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="timetable-editor">
                <table className="timetable-table editable">
                  <thead>
                    <tr>
                      <th>Time / Day</th>
                      {daysOfWeek.map(day => (
                        <th key={day}>{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(slot => (
                      <tr key={slot}>
                        <td className="time-slot">{slot}</td>
                        {daysOfWeek.map(day => (
                          <td key={`${day}-${slot}`}>
                            <input
                              type="text"
                              value={formData.timetable[day]?.[slot] || ''}
                              onChange={(e) => handleTimetableUpdate(day, slot, e.target.value)}
                              placeholder="Subject / Class"
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
            
            <div className="modal-footer">
              <button
                className="secondary-button"
                onClick={() => setShowTimetableModal(false)}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                onClick={saveTimetable}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Timetable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyManagement;