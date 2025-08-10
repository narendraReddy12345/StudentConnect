import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import './index.css';
import FeatureCard from "../FeatureCard";

// Import department animations
import csAnim from "../assets/VKhYjb22FM.json";
import mechAnim from "../assets/34ZNnga4BN.json";
import eceAnim from "../assets/95GzEM9w07.json";
import eeeAnim from "../assets/34ZNnga4BN.json";
import civilAnim from "../assets/y7ura4rwDL.json";
import mbaAnim from '../assets/5xPSLhVoOz.json';
import agriAnim from '../assets/eIjokjtCGL.json';


import itAnim from '../assets/VKhYjb22FM.json'

const Departments = () => {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);

  const departments = [
    { 
      code: "cse", 
      name: "Computer Science", 
      animation: csAnim, 
      onClick: () => navigate("/faculty/cse") 
    },
    { 
      code: "mech", 
      name: "Mechanical", 
      animation: mechAnim, 
      onClick: () => navigate("/faculty/mech") 
    },
    { 
      code: "ece", 
      name: "Electronics & Communication", 
      animation: eceAnim, 
      onClick: () => navigate("/faculty/ece") 
    },
    { 
      code: "eee", 
      name: "Electrical & Electronics", 
      animation: eeeAnim, 
      onClick: () => navigate("/faculty/eee") 
    },
    { 
      code: "civil", 
      name: "CIVIL", 
      animation: civilAnim, 
      onClick: () => navigate("/faculty/civil") 
    },
    { 
      name: "Information Technology", 
      code: "it", 
      animation: itAnim, 
      onClick: () => navigate("/faculty/it") 
    },
    { 
      name: "Master of Business Administration", 
      code: "mba", 
      animation: mbaAnim, 
      onClick: () => navigate("/faculty/mba") 
    },
    { 
      name: "Agriculture", 
      code: "agri", 
      animation: agriAnim, 
      onClick: () => navigate("/faculty/agri") 
    },
    { 
      name: "Bio-Technology", 
      code: "Bio-tech", 
      animation: itAnim, 
      onClick: () => navigate("/faculty/Bio") 
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Back Arrow */}
      <motion.div 
        className="nav-arrow left"
        onClick={() => navigate(-1)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
      >
        <motion.svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={isHovering ? { x: -3 } : { x: 0 }}
          transition={{ type: "spring", stiffness: 500 }}
        >
          <path
            d="M15 18L9 12L15 6"
            stroke="#4A5568"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.div>

      <div className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <h2>Departments</h2>
            <p className="dptittle">Select a department to view faculty</p>
          </div>
        </div>
      </div>

      <div className="features-grid">
        {departments.map((dept) => (
          <FeatureCard
            key={dept.code}
            title={dept.name}
            subtitle={dept.code}
            animationData={dept.animation}
            onClick={dept.onClick}
          />
        ))}
      </div>

      {/* Home Arrow */}
      <motion.div 
        className="nav-arrow home"
        onClick={() => navigate("/")}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={isHovering ? { rotate: 15 } : { rotate: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <path
            d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
            stroke="#4A5568"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.div>
    </div>
  );
};

export default Departments;