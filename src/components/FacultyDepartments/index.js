// FacultyDepartments.jsx
import React from "react";
import './index.css';
import Lottie from "lottie-react";
import { useNavigate } from "react-router-dom";

import cseAnim from "../assets/VKhYjb22FM.json";
import eceAnim from "../assets/95GzEM9w07.json";
import mechAnim from "../assets/34ZNnga4BN.json";
import civilAnim from "../assets/y7ura4rwDL.json";
import MBAAnim from "../assets/5xPSLhVoOz.json";
import AGRIAnim from "../assets/eIjokjtCGL.json";
const departments = [
  { name: "CSE", animation: cseAnim },
  { name: "ECE", animation: eceAnim },
  { name: "Mechanical", animation: mechAnim },
  { name: "Civil", animation: civilAnim },
  {name:"MBA", animation:MBAAnim},
  {name: "Agriculture",animation:AGRIAnim},
];

const FacultyDepartments = () => {
  const navigate = useNavigate();

  return (
    <div className="dept-container">
      <h2 className="dept-title">Select a Department</h2>
      <div className="dept-grid">
        {departments.map((dept, index) => (
          <div
            key={index}
            className="dept-card"
            onClick={() => navigate(`/departments/${dept.name.toLowerCase()}`)}
          >
            <Lottie animationData={dept.animation} loop={true} className="dept-animation" />
            <h3>{dept.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FacultyDepartments;
