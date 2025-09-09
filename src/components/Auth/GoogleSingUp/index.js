import React, { useState } from "react";
import './index.css'
import { auth, provider } from "../../../firebase";
import { signInWithPopup } from "firebase/auth";
import { motion } from "framer-motion";
import { FaGoogle, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";

const GoogleSignup = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      onSuccess(result.user);
      toast.success(`Welcome, ${result.user.displayName || 'User'}!`);
    } catch (error) {
      toast.error("Google sign-in failed. Please try again.");
      console.error("Google sign-in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      className="google-btn"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="btn-content">
        {isLoading ? (
          <FaSpinner className="spinner-icon" />
        ) : (
          <>
            <div className="google-icon-container">
              <FaGoogle className="google-icon" />
            </div>
            <span className="btn-text">Continue with Google</span>
          </>
        )}
      </div>
      
      {/* Animated border effect */}
      <div className="btn-border-effect"></div>
    </motion.button>
  );
};

export default GoogleSignup;