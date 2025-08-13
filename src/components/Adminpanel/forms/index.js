import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { db, storage } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiUpload, FiTrash2, FiSearch, FiX, FiDownload, FiArrowLeft, FiEdit2 } from 'react-icons/fi';
import Lottie from 'lottie-react';
import './index.css';
import emptyFormsAnimation from '../.././../assets/KE3rP60rHv.json';

const FormsAdminModern = () => {
  const history = useHistory();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState({
    title: '',
    description: '',
    file: null,
    fileName: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeForm, setActiveForm] = useState(null);
  const [error, setError] = useState(null);

  // Glass morphism styles with gradient
  const glassStyle = {
    background:'white',
   
    border: '1px solid rgba(12, 11, 11, 0.3)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    borderRadius: '16px'
  };

  // Fetch existing forms
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const formsSnapshot = await getDocs(collection(db, "forms"));
        const formsData = formsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setForms(formsData);
      } catch (error) {
        console.error("Error fetching forms: ", error);
        setError("Failed to load forms. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchForms();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      if (e.target.files[0].size > 5 * 1024 * 1024) { // 5MB limit
        setError("File size exceeds 5MB limit");
        return;
      }
      setError(null);
      setNewForm(prev => ({
        ...prev,
        file: e.target.files[0],
        fileName: e.target.files[0].name
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      if (!newForm.file) {
        throw new Error("Please select a file to upload");
      }

      // Upload file with progress tracking
      const fileRef = ref(storage, `forms/${Date.now()}_${newForm.file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, newForm.file);
      
      // Create a promise to handle the upload
      const uploadPromise = new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            reject(error);
          },
          async () => {
            try {
              const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(fileUrl);
            } catch (error) {
              reject(error);
            }
          }
        );
      });

      const fileUrl = await uploadPromise;
      
      // Save form data to Firestore
      await addDoc(collection(db, "forms"), {
        title: newForm.title,
        description: newForm.description,
        fileUrl,
        fileName: newForm.fileName,
        createdAt: new Date().toISOString()
      });
      
      // Refresh the forms list
      const formsSnapshot = await getDocs(collection(db, "forms"));
      setForms(formsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      // Reset form and close modal
      setNewForm({ title: '', description: '', file: null, fileName: '' });
      setIsAdding(false);
      setUploadProgress(0);
    } catch (error) {
      console.error("Error adding form: ", error);
      setError(error.message || "Failed to add form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (formId) => {
    if (window.confirm("Are you sure you want to delete this form?")) {
      try {
        await deleteDoc(doc(db, "forms", formId));
        setForms(forms.filter(form => form.id !== formId));
      } catch (error) {
        console.error("Error deleting form: ", error);
        setError("Failed to delete form. Please try again.");
      }
    }
  };

  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modern-admin-container">
      {/* Header with back arrow and search */}
      <motion.div 
        className="admin-header"
        style={glassStyle}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <div className="header-top">
          <motion.button 
            onClick={() => history.push('/admin')}
            className="back-button"
            whileTap={{ scale: 0.9 }}
          >
            <FiArrowLeft size={24} />
          </motion.button>
          <h1>Forms Management</h1>
        </div>
        <motion.div 
          className="search-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <motion.div 
              className="clear-search"
              onClick={() => setSearchTerm('')}
              whileHover={{ scale: 1.1 }}
            >
              <FiX />
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.div 
          className="error-message"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
          <button onClick={() => setError(null)}>
            <FiX />
          </button>
        </motion.div>
      )}

      {/* Forms Grid */}
      <div className="forms-grid-container">
        {loading ? (
          <motion.div 
            className="loading-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="spinner-container">
              <div className="spinner"></div>
              <p>Loading forms...</p>
            </div>
          </motion.div>
        ) : filteredForms.length === 0 ? (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Lottie 
              animationData={emptyFormsAnimation} 
              loop={true} 
              style={{ height: 200 }} 
            />
            <h3>{searchTerm ? "No matching forms found" : "No forms added yet"}</h3>
            <p>{searchTerm ? "Try a different search term" : "Tap the + button to add your first form"}</p>
          </motion.div>
        ) : (
          <motion.div 
            className="forms-list"
            layout
          >
            <AnimatePresence>
              {filteredForms.map((form, index) => (
                <motion.div
                  key={form.id}
                  className="form-card"
                  style={glassStyle}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -3 }}
                  onClick={() => setActiveForm(form)}
                >
                  <div className="card-content">
                    <div className="card-icon">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/512/2991/2991112.png" 
                        alt="form icon"
                        style={{ width: 40, height: 40 }}
                      />
                    </div>
                    <div className="card-details">
                      <h3>{form.title}</h3>
                      <p className="card-description">{form.description}</p>
                      <div className="file-info">
                        <span className="file-name">{form.fileName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-actions">
                    <motion.a 
                      href={form.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="download-btn"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FiDownload size={18} />
                    </motion.a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Floating Action Button */}
      <motion.button
        className="fab"
        onClick={() => setIsAdding(true)}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <FiPlus size={24} />
      </motion.button>

      {/* Form Detail View */}
      <AnimatePresence>
        {activeForm && (
          <motion.div 
            className="form-detail-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveForm(null)}
          >
            <motion.div 
              className="form-detail-content"
              style={glassStyle}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="detail-header">
                <div className="form-icon">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/2991/2991112.png" 
                    alt="form icon"
                    style={{ width: 48, height: 48 }}
                  />
                </div>
                <div className="form-title">
                  <h2>{activeForm.title}</h2>
                  <p className="created-at">
                    Added on {new Date(activeForm.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button 
                  className="close-detail"
                  onClick={() => setActiveForm(null)}
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="form-description">
                <h4>Description</h4>
                <p>{activeForm.description}</p>
              </div>

              <div className="form-file-info">
                <h4>Document</h4>
                <div className="file-card">
                  <div className="file-icon">
                    <img 
                      src="https://cdn-icons-png.flaticon.com/512/337/337946.png" 
                      alt="pdf icon"
                      style={{ width: 40, height: 40 }}
                    />
                  </div>
                  <div className="file-details">
                    <p className="file-name">{activeForm.fileName}</p>
                    <a 
                      href={activeForm.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="download-btn"
                    >
                      <FiDownload /> Download
                    </a>
                  </div>
                </div>
              </div>

              <div className="detail-actions">
                <button 
                  className="delete-btn"
                  onClick={() => {
                    setActiveForm(null);
                    handleDelete(activeForm.id);
                  }}
                >
                  <FiTrash2 /> Delete Form
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Form Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAdding(false)}
          >
            <motion.div 
              className="modal-content"
              style={glassStyle}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-icon">
                  <FiEdit2 size={24} />
                </div>
                <h2>Add New Form</h2>
                <button 
                  className="close-modal"
                  onClick={() => setIsAdding(false)}
                >
                  <FiX size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="add-form">
                <div className="form-group">
                  <label>Form Title</label>
                  <input
                    type="text"
                    name="title"
                    value={newForm.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter Form Title"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={newForm.description}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter Description"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Upload Form PDF</label>
                  <div className="file-upload-container">
                    <input
                      type="file"
                      id="formFileUpload"
                      accept=".pdf"
                      onChange={handleFileChange}
                      required
                    />
                    <label htmlFor="formFileUpload" className="file-upload-label">
                      {newForm.fileName ? (
                        <div className="file-selected">
                          <div className="file-icon">
                            <img 
                              src="https://cdn-icons-png.flaticon.com/512/337/337946.png" 
                              alt="pdf icon"
                              style={{ width: 32, height: 32 }}
                            />
                          </div>
                          <div className="file-info">
                            <p className="file-name">{newForm.fileName}</p>
                            <button 
                              type="button"
                              className="change-file"
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('formFileUpload').click();
                              }}
                            >
                              Change File
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="upload-prompt">
                          <div className="upload-icon">
                            <FiUpload size={32} />
                          </div>
                          <p>Tap to select a PDF file</p>
                          <small>Maximum size: 5MB</small>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="upload-progress">
                    <div className="progress-text">
                      <span>Uploading: {Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner"></div>
                        Uploading...
                      </>
                    ) : (
                      'Add Form'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FormsAdminModern;