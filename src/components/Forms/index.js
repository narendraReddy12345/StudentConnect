import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiDownload, FiArrowLeft } from 'react-icons/fi';
import Lottie from 'lottie-react';
import './index.css';
import emptyFormsAnimation from '../../assets/KE3rP60rHv.json';

const StudentFormsView = () => {
  const history = useHistory();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeForm, setActiveForm] = useState(null);

  // Clean card style
  const cardStyle = {
    background: 'white',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    borderRadius: '12px'
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
      } finally {
        setLoading(false);
      }
    };
    
    fetchForms();
  }, []);

  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="student-forms-container">
      {/* Header with back arrow and search */}
      <motion.div 
        className="forms-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-top">
          <motion.button 
            onClick={() => history.goBack()}
            className="back-button"
            whileTap={{ scale: 0.9 }}
          >
            <FiArrowLeft size={24} />
          </motion.button>
          <h1>Available Forms</h1>
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
            className='search-bar1'
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

      {/* Forms List */}
      <div className="forms-list-container">
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
            <h3>{searchTerm ? "No matching forms found" : "No forms available"}</h3>
            <p>{searchTerm ? "Try a different search term" : "Check back later for new forms"}</p>
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
                  style={cardStyle}
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
              style={cardStyle}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentFormsView;