import React from "react";
import "./index.css";
import Lottie from "lottie-react";

const FeatureCard = ({ animationData, title, onClick }) => {
  return (
    <div className="feature-card" onClick={onClick}>
      <Lottie animationData={animationData} loop={true} className="feature-lottie" />
      <p>{title}</p>
    </div>
  );
};

export default FeatureCard;
