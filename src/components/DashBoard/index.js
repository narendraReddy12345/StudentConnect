
// src/components/DashBoard/index.js
import React, { useState } from "react";
import "./index.css";
import FeatureCard from "../FeatureCard";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";

import facultyAnim from "../assets/wckZq0erh9.json";
import eventAnim from "../assets/fuGIip804B.json";
import aiAnim from "../assets/94ye6EefMs.json";
import formAnim from "../assets/KE3rP60rHv.json";
import collegeMap from "../assets/t9sC61E7hk.json";
import updatesAnim from "../assets/Ltz69bkEEA.json";
import adminAnim from '../assets/IGeZmAD5Dp.json';
const Home = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      
      // Clear user state after successful logout
      if (typeof setUser === "function") {
        setUser(null);
      }
      
      navigate("/");
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

      <div className="features-grid">
        <FeatureCard
          title="Faculty 🔍"
          animationData={facultyAnim}
          onClick={() => navigate("/departments")}
        />
        <FeatureCard
          title="Event Registrations"
          animationData={eventAnim}
          onClick={() => navigate("/events")}
        />
        <FeatureCard
          title="Updates"
          animationData={updatesAnim}
          onClick={() => navigate("/updates")}
        />
        <FeatureCard
          title="Form Details"
          animationData={formAnim}
          onClick={() => navigate("/forms")}
        />
        <FeatureCard
          title="Campus Map"
          animationData={collegeMap}
          onClick={() => navigate("/map")}
        />
        <FeatureCard
          title="AI Assistant"
          animationData={aiAnim}
          onClick={() => navigate("/ai-help")}
        />
        {user?.isAdmin && (
          <FeatureCard
            title="Admin Panel 🔒"
            animationData={adminAnim}
            onClick={() => navigate("/admin")}
          />
        )}
      </div>
    </div>
  );
};

export default Home;