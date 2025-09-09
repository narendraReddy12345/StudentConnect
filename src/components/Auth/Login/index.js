import React, { useState, useEffect } from "react";
import "./index.css";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import Lottie from "lottie-react";
import busAnimation from "../../assets/yWegn1eidv.json";
import { auth } from "../../../firebase";
import { signInWithEmailAndPassword,  signOut } from "firebase/auth";
import { useHistory } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import GoogleSignup from "../GoogleSingUp";

// Meme images for non-college email attempts
const MEMES = [
  "https://i.imgflip.com/4/1bij.jpg",
  "https://i.imgflip.com/4/1bgw.jpg",
  "https://i.imgflip.com/4/1bh8.jpg"
];

const collegeDomain = "@klu.ac.in";
const adminEmail = "99220041116@klu.ac.in";

const Login = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMeme, setShowMeme] = useState(false);
  const [currentMeme, setCurrentMeme] = useState("");
  const [isFocused, setIsFocused] = useState({
    email: false,
    password: false
  });
  const history = useHistory();

  useEffect(() => {
    // Preload a random meme
    setCurrentMeme(MEMES[Math.floor(Math.random() * MEMES.length)]);
  }, []);

  const isCollegeEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@klu\.ac\.in$/;
    return emailRegex.test(email);
  };

  const showRandomMeme = () => {
    const randomMeme = MEMES[Math.floor(Math.random() * MEMES.length)];
    setCurrentMeme(randomMeme);
    setShowMeme(true);
    setTimeout(() => setShowMeme(false), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isCollegeEmail(email)) {
      showRandomMeme();
      toast.warning("Please use your KLU email address");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userEmail = result.user.email;
      
      if (!isCollegeEmail(userEmail)) {
        await signOut(auth);
        showRandomMeme();
        return;
      }

      setUser({
        name: result.user.displayName || "Student",
        email: userEmail,
        isAdmin: userEmail === adminEmail,
      });
      
      toast.success(`Welcome back, ${result.user.displayName || 'Student'}!`);
      history.push("/home");
    } catch (error) {
      let errorMessage = "Login failed. Please try again.";
      if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Account temporarily locked. Try again later";
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = (user) => {
    const userEmail = user.email;
    
    if (!isCollegeEmail(userEmail)) {
      signOut(auth);
      showRandomMeme();
      return;
    }

    setUser({
      name: user.displayName || "Google User",
      email: userEmail,
      isAdmin: userEmail === adminEmail,
    });
    history.push("/home");
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="animation-container">
          <Lottie 
            animationData={busAnimation} 
            loop 
            style={{ maxWidth: 250, margin: '0 auto' }}
          />
        </div>
        
        <motion.div 
          className="welcome-section"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="welcome-text">Welcome to KLU Connect</h1>
       
        </motion.div>

        <AnimatePresence>
          {showMeme && (
            <motion.div 
              className="meme-popup"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="meme-content">
                <img 
                  src={currentMeme} 
                  alt="College email required" 
                  className="meme-image" 
                />
                <p className="meme-caption">Only @klu.ac.in emails allowed!</p>
                <button 
                  className="meme-close-btn"
                  onClick={() => setShowMeme(false)}
                >
                  I understand
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form 
          className="login-form" 
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className={`input-group ${isFocused.email ? 'focused' : ''}`}>
            <label htmlFor="email">College Email</label>
            <div className="input-field">
              <FiMail className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder={`username${collegeDomain}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused({...isFocused, email: true})}
                onBlur={() => setIsFocused({...isFocused, email: false})}
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>
          </div>

          <div className={`input-group ${isFocused.password ? 'focused' : ''}`}>
            <label htmlFor="password">Password</label>
            <div className="input-field">
              <FiLock className="input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsFocused({...isFocused, password: true})}
                onBlur={() => setIsFocused({...isFocused, password: false})}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <motion.button 
            type="submit" 
            className="primary-btn" 
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <span className="spinner"></span>
            ) : (
              <>
                Sign In <FiArrowRight className="arrow-icon" />
              </>
            )}
          </motion.button>
        </motion.form>

        <div className="divider">
          <span>or continue with</span>
        </div>

        <GoogleSignup onSuccess={handleGoogleSuccess} />

        <div className="help-links">
          <a href="/forgot-password">Forgot password?</a>
          <span>•</span>
          <a href="/contact-support">Need help?</a>
        </div>
      </div>
    </div>
  );
};

export default Login;