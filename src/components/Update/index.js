// Updates.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Updates.css";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

const Updates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "updates"));
        const updatesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUpdates(updatesData);
      } catch (error) {
        console.error("Error fetching updates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, []);

  return (
    <div className="updates-container">
      <div className="updates-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          &larr; Back
        </button>
        <h2>College Updates</h2>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : updates.length === 0 ? (
        <div className="no-updates">
          <p>No updates available at the moment</p>
        </div>
      ) : (
        <div className="updates-list">
          {updates.map((update) => (
            <div key={update.id} className="update-card">
              {update.imageUrl && (
                <div className="update-image-container">
                  <img 
                    src={update.imageUrl} 
                    alt={update.title} 
                    className="update-image"
                  />
                </div>
              )}
              <div className="update-content">
                <h3 className="update-title">{update.title}</h3>
                <p className="update-info">{update.description}</p>
                <div className="update-meta">
                  <span className="update-date">
                    {new Date(update.timestamp?.toDate()).toLocaleDateString()}
                  </span>
                  <span className="update-author">
                    Posted by: {update.author || "Admin"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Updates;