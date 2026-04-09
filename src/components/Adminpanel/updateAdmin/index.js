import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";
import { motion } from "framer-motion";
import {  FiTrash2, FiEdit, FiPlus, FiX, FiImage, FiVideo, FiAlertCircle,FiUser } from "react-icons/fi";
import Lottie from "lottie-react";
import updatesAnim from "../../../assets/Ltz69bkEEA.json";
import './index.css';

// Cloudinary configuration
const CLOUD_NAME = 'dmu3tqxgb'; // Replace with your Cloudinary cloud name
const UPLOAD_PRESET = 'eventimgs'; // Replace with your upload preset

const InstagramUpdateCard = ({ update, handleDelete }) => {
  return (
    <div className="instagram-post">
      <div className="post-header">
        <div className="post-user">
          <div className="user-avatar">
            <FiUser size={24} />
          </div>
          <span>College Admin</span>
        </div>
        <div className="post-actions">
          <button onClick={() => {}} className="action-btn">
            <FiEdit size={18} />
          </button>
          <button 
            onClick={() => handleDelete(update.id)} 
            className="action-btn danger"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      </div>
      
      {update.imageUrl && (
        <div className="post-media">
          <img src={update.imageUrl} alt={update.title} />
        </div>
      )}
      
      {update.videoUrl && (
        <div className="post-media">
          <video controls>
            <source src={update.videoUrl} type="video/mp4" />
          </video>
        </div>
      )}
      
      <div className="post-content">
        <div className="post-caption">
          <strong>{update.title}</strong>
          <p>{update.description}</p>
        </div>
        <div className="post-meta">
          <span className="post-date">
            {new Date(update.createdAt?.seconds * 1000).toLocaleString()}
          </span>
          {update.isImportant && (
            <span className="important-badge">
              <FiAlertCircle /> Important
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const UpdatesAdmin = () => {
  const history = useHistory();
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [isImportant, setIsImportant] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

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

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMediaFile(file);
    
    // Determine media type
    if (file.type.startsWith('image/')) {
      setMediaType('image');
      setMediaPreview(URL.createObjectURL(file));
    } else if (file.type.startsWith('video/')) {
      setMediaType('video');
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview("");
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${mediaType}/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      alert("Title and description are required");
      return;
    }

    setIsUploading(true);
    
    try {
      let mediaUrl = "";
      
      // Upload media if present
      if (mediaFile) {
        mediaUrl = await uploadToCloudinary(mediaFile);
      }
      
      // Add to Firestore
      await addDoc(collection(db, "updates"), {
        title,
        description,
        imageUrl: mediaType === 'image' ? mediaUrl : "",
        videoUrl: mediaType === 'video' ? mediaUrl : "",
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
      setIsUploading(false);
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
    <div className="instagram-admin-container">
      <div className="instagram-header">
        <button onClick={() => history.goBack()} className="back-btn">
          &larr;
        </button>
        <h2>College Updates</h2>
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
          className="instagram-create-post"
        >
          <div className="create-post-header">
            <h3>Create New Update</h3>
          </div>
          
          <div className="post-editor">
            {!mediaPreview ? (
              <div className="media-upload-area">
                <div className="upload-instructions">
                  <FiImage size={48} className="icon" />
                  <FiVideo size={48} className="icon" />
                  <p>Drag photos and videos here or click to browse</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*, video/*"
                  onChange={handleMediaChange}
                  className="hidden-input"
                />
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="select-media-btn"
                >
                  Select from device
                </button>
              </div>
            ) : (
              <div className="media-preview-container">
                {mediaType === 'image' && (
                  <img src={mediaPreview} alt="Preview" className="media-preview" />
                )}
                {mediaType === 'video' && (
                  <video controls className="media-preview">
                    <source src={mediaPreview} type={mediaFile.type} />
                  </video>
                )}
                <button onClick={clearMedia} className="clear-media-btn">
                  <FiX size={20} />
                </button>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="post-form">
              <div className="form-group">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Write a title..."
                  className="post-title"
                />
              </div>
              
              <div className="form-group">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Write a description..."
                  className="post-description"
                  rows={3}
                />
              </div>
              
              <div className="form-options">
                <label className="option-toggle">
                  <input
                    type="checkbox"
                    checked={isImportant}
                    onChange={() => setIsImportant(!isImportant)}
                  />
                  <span className="toggle-label">
                    {isImportant ? <FiAlertCircle color="#ff4757" /> : <FiAlertCircle />}
                    Mark as important
                  </span>
                </label>
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
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="post-btn" 
                  disabled={isUploading}
                >
                  {isUploading ? "Publishing..." : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
      
      {isLoading && updates.length === 0 ? (
        <div className="loading-state">
          <Lottie animationData={updatesAnim} loop={true} style={{ height: 200 }} />
          <p>Loading updates...</p>
        </div>
      ) : (
        <div className="instagram-feed">
          {updates.length === 0 ? (
            <div className="empty-state">
              <Lottie animationData={updatesAnim} loop={true} style={{ height: 200 }} />
              <p>No updates yet. Create your first update!</p>
            </div>
          ) : (
            updates.map((update) => (
              <InstagramUpdateCard 
                key={update.id}
                update={update}
                handleDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UpdatesAdmin;