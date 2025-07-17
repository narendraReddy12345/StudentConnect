import React from "react";
import "./index.css";
import FeatureCard from "../FeatureCard";
import facultyAnim from "../assets/wckZq0erh9.json";
import eventAnim from '../assets/fuGIip804B.json';
import aiAnim from '../assets/94ye6EefMs.json';
import formAnim from "../assets/KE3rP60rHv.json";
import collegeMap from '../assets/t9sC61E7hk.json';
import Updates from '../assets/Ltz69bkEEA.json';


const Home = ({ user }) => {
  return (
    <div className="home-container">
      <div className="user-header">
        <h2>Welcome, {user.name || "Student"} 👋</h2>
        <p>{user.email}</p>
      </div>
      <div className="features-grid">
        <FeatureCard title="Faculty 🔍" animationData={facultyAnim} onClick={() => alert("Faculty Search Clicked")} />
        <FeatureCard title="Event Registrations" animationData={eventAnim} onClick={() => alert("Event Registrations Clicked")} />
        <FeatureCard title="Update" animationData={Updates} onClick={() => alert("College Updates")} />
       
        <FeatureCard title="Form Details" animationData={formAnim} onClick={() => alert("Form Details Clicked")} />
        <FeatureCard title="Map" animationData={collegeMap} onClick={() => alert("College Map")} />
        
        <FeatureCard title="AI " animationData={aiAnim} onClick={() => alert("AI Help Clicked")} />
      </div>
    </div>
  );
};

export default Home;
