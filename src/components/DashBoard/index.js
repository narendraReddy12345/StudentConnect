import React, { useState, useEffect } from "react";
import "./index.css";
import FeatureCard from "../FeatureCard";
import { useHistory } from "react-router-dom";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";

// Import animations
import facultyAnim from "../assets/wckZq0erh9.json";
import eventAnim from "../assets/fuGIip804B.json";
import aiAnim from "../assets/94ye6EefMs.json";
import formAnim from "../assets/KE3rP60rHv.json";
import updatesAnim from "../assets/Ltz69bkEEA.json";
import adminAnim from '../assets/IGeZmAD5Dp.json';

// Import college images (you'll need to add these to your assets)
import collegeImage1 from "../../assets/college2.jpg";
import collegeImage2 from "../../assets/building-19-scaled.jpg";
import collegeImage3 from "../../assets/1716807242kala.jpg";
import collegeImage4 from "../../assets/images.jpg";

const Home = ({ user, setUser }) => {
  const history = useHistory();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // College images array
  const collegeImages = [
    collegeImage1,
    collegeImage2,
    collegeImage3,
    collegeImage4
  ];

  // Auto slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % collegeImages.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [collegeImages.length]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      
      if (typeof setUser === "function") {
        setUser(null);
      }
      
      history.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      alert(error.message || "Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <h2>Welcome, {user?.name || "Student"} 👋</h2>
            <p className="user-email">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="logout-btn"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <span className="logout-spinner">Logging out...</span>
            ) : (
              "Logout"
            )}
          </button>
        </div>
      </div>
       {/* Image Slider Section */}
      <div className="college-slider-container">
        
        <div className="slider-wrapper">
          {collegeImages.map((image, index) => (
            <div 
              key={index}
              className={`slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
        </div>
        <div className="slider-dots">
          {collegeImages.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>

      <div className="features-grid">
        <FeatureCard
          title="Faculty 🔍"
          animationData={facultyAnim}
          onClick={() => history.push("/departments")}
        />
        <FeatureCard
          title="Event Registrations"
          animationData={eventAnim}
          onClick={() => history.push("/events")}
        />
        <FeatureCard
          title="Updates"
          animationData={updatesAnim}
          onClick={() => history.push("/updates")}
        />
        <FeatureCard
          title="Form Details"
          animationData={formAnim}
          onClick={() => history.push("/forms")}
        />
        <FeatureCard
          title="AI Assistant"
          animationData={aiAnim}
          onClick={() => history.push("/ai-help")}
        />
        {user?.isAdmin && (
          <FeatureCard
            title="Admin Panel 🔒"
            animationData={adminAnim}
            onClick={() => history.push("/admin")}
          />
        )}
      </div>

     
    </div>
  );
};

export default Home;