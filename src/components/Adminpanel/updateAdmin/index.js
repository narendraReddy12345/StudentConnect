import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { storage,db } from "../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { motion } from "framer-motion";
import { FiUpload, FiTrash2, FiEdit, FiPlus, FiX } from "react-icons/fi";
import Lottie from "lottie-react";
import updatesAnim from "../../../assets/Ltz69bkEEA.json";
import './index.css'

const UpdatesAdmin = () => {
  const history = useHistory();
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [videoPreview, setVideoPreview] = useState("");
  const [isImportant, setIsImportant] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "updates"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUpdates(updatesList);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setVideoFile(null);
      setVideoPreview("");
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setImageFile(null);
      setImagePreview("");
    }
  };

  const clearMedia = () => {
    setImageFile(null);
    setVideoFile(null);
    setImagePreview("");
    setVideoPreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let imageUrl = "";
      let videoUrl = "";
      
      // Upload image if present
      if (imageFile) {
        const imageRef = ref(storage, `updates/images/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }
      
      // Upload video if present
      if (videoFile) {
        const videoRef = ref(storage, `updates/videos/${Date.now()}_${videoFile.name}`);
        await uploadBytes(videoRef, videoFile);
        videoUrl = await getDownloadURL(videoRef);
      }
      
      // Add to Firestore
      await addDoc(collection(db, "updates"), {
        title,
        description,
        imageUrl,
        videoUrl,
        isImportant,
        createdAt: new Date(),
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      clearMedia();
      setIsImportant(false);
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding update:", error);
      alert("Failed to add update. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this update?")) {
      try {
        await deleteDoc(doc(db, "updates", id));
      } catch (error) {
        console.error("Error deleting update:", error);
        alert("Failed to delete update. Please try again.");
      }
    }
  };

  return (
    <div className="updates-admin-container">
      <div className="updates-admin-header">
        <button onClick={() => history.goBack()} className="back-btn">
          &larr; Back
        </button>
        <h2>Manage College Updates</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)} 
          className="add-btn"
        >
          {isAdding ? <FiX size={24} /> : <FiPlus size={24} />}
        </button>
      </div>
      
      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="add-update-form"
        >
          <h3>Add New Update</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title*</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter update title"
              />
            </div>
            
            <div className="form-group">
              <label>Description*</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Enter detailed information"
                rows={4}
              />
            </div>
            
            <div className="form-group">
              <label>Priority</label>
              <div className="priority-toggle">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isImportant}
                    onChange={() => setIsImportant(!isImportant)}
                  />
                  <span className="slider round"></span>
                </label>
                <span>{isImportant ? "Important Update" : "Regular Update"}</span>
              </div>
            </div>
            
            <div className="media-upload-section">
              <h4>Add Media (Optional)</h4>
              <div className="media-options">
                <label className="upload-btn">
                  <FiUpload /> Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    hidden
                  />
                </label>
                
                <label className="upload-btn">
                  <FiUpload /> Upload Video
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    hidden
                  />
                </label>
                
                {(imagePreview || videoPreview) && (
                  <button type="button" onClick={clearMedia} className="clear-btn">
                    <FiX /> Clear
                  </button>
                )}
              </div>
              
              {imagePreview && (
                <div className="media-preview">
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}
              
              {videoPreview && (
                <div className="media-preview">
                  <video controls>
                    <source src={videoPreview} type={videoFile.type} />
                  </video>
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  clearMedia();
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? "Publishing..." : "Publish Update"}
              </button>
            </div>
          </form>
        </motion.div>
      )}
      
      {isLoading && updates.length === 0 ? (
        <div className="loading-state">
          <Lottie animationData={updatesAnim} loop={true} style={{ height: 200 }} />
          <p>Loading updates...</p>
        </div>
      ) : (
        <div className="updates-list">
          {updates.length === 0 ? (
            <div className="empty-state">
              <Lottie animationData={updatesAnim} loop={true} style={{ height: 200 }} />
              <p>No updates yet. Add your first update!</p>
            </div>
          ) : (
            updates.map((update) => (
              <motion.div 
                key={update.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`update-card ${update.isImportant ? "important" : ""}`}
              >
                <div className="update-badge">
                  {update.isImportant ? "❗ Important" : "📢 Update"}
                </div>
                
                <div className="update-content">
                  <h3>{update.title}</h3>
                  <p className="update-date">
                    {new Date(update.createdAt?.seconds * 1000).toLocaleString()}
                  </p>
                  <p className="update-description">{update.description}</p>
                  
                  {update.imageUrl && (
                    <div className="update-media">
                      <img src={update.imageUrl} alt={update.title} />
                    </div>
                  )}
                  
                  {update.videoUrl && (
                    <div className="update-media">
                      <video controls>
                        <source src={update.videoUrl} type="video/mp4" />
                      </video>
                    </div>
                  )}
                </div>
                
                <div className="update-actions">
                  <button className="edit-btn">
                    <FiEdit /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(update.id)} 
                    className="delete-btn"
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UpdatesAdmin;