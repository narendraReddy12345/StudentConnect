import React from "react";
import "./GoogleSignup.css";
import { auth, provider } from "../../../firebase";
import { signInWithPopup } from "firebase/auth";

const GoogleSignup = () => {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      alert(`Signed in as: ${result.user.email}`);
    } catch (error) {
      alert("Google sign-in failed!");
    }
  };

  return (
    <button className="google-btn" onClick={handleGoogleLogin}>
      <span className="google-icon">
        {/* Embedded Google G Logo SVG */}
        <svg width="20" height="20" viewBox="0 0 533.5 544.3">
          <path fill="#4285F4" d="M533.5 278.4c0-17.8-1.4-35-4-51.6H272v97.7h147.4c-6.4 34-25 62.7-53.2 82v68.2h85.8c50.3-46.3 81.5-114.5 81.5-196.3z"/>
          <path fill="#34A853" d="M272 544.3c72.6 0 133.5-24 178-65.4l-85.8-68.2c-23.9 16-54.4 25.3-92.2 25.3-70.9 0-131-47.9-152.4-112.1H30.8v70.4C74.6 482.3 166.7 544.3 272 544.3z"/>
          <path fill="#FBBC05" d="M119.6 323.9c-10.4-30.8-10.4-63.8 0-94.6V158.9H30.8c-30.5 61-30.5 133.4 0 194.5l88.8-29.5z"/>
          <path fill="#EA4335" d="M272 107.7c39.5 0 75 13.6 102.9 40.5l77.3-77.3C405.4 24 344.5 0 272 0 166.7 0 74.6 62 30.8 158.9l88.8 70.4C141 155.6 201.1 107.7 272 107.7z"/>
        </svg>
      </span>
      <span className="btn-text">Sign in with Google</span>
    </button>
  );
};

export default GoogleSignup;
