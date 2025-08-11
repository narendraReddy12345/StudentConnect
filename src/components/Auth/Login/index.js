import React, { useState, useEffect } from "react";
import "./index.css";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";
import Lottie from "lottie-react";
import busAnimation from "../../assets/yWegn1eidv.json";
import { auth, provider } from "../../../firebase";
import { signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { useHistory } from "react-router-dom"; // Changed from useNavigate

// Meme images for non-college email attempts
const MEMES = [
  "https://tse4.mm.bing.net/th/id/OIP.t5unEAO_4HQZ4MN9hBa8nAHaD5?pid=Api&P=0&h=180"
];

const collegeDomain = "@klu.ac.in";
const adminEmail = "99220041116@klu.ac.in";

const Login = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showMeme, setShowMeme] = useState(false);
  const [currentMeme, setCurrentMeme] = useState("");
  const [welcomeAnimation, setWelcomeAnimation] = useState(false);
  const history = useHistory(); // Changed from useNavigate

  useEffect(() => {
    setWelcomeAnimation(true);
    // Preload a random meme
    setCurrentMeme(MEMES[Math.floor(Math.random() * MEMES.length)]);
  }, []);

  const isCollegeEmail = (email) => {
    // Strict email validation with regex
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
      history.push("/home"); // Changed from navigate
    } catch (error) {
      let errorMessage = "Login failed. Please try again.";
      if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Account temporarily locked. Try again later or reset password";
      }
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;
      
      if (!isCollegeEmail(userEmail)) {
        await signOut(auth);
        showRandomMeme();
        return;
      }

      setUser({
        name: result.user.displayName || "Google User",
        email: userEmail,
        isAdmin: userEmail === adminEmail,
      });
      history.push("/home"); // Changed from navigate
    } catch (error) {
      alert("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="animation-container">
          <Lottie animationData={busAnimation} loop />
        </div>
        
        <div className={`welcome-section ${welcomeAnimation ? "animate" : ""}`}>
          <h1 className="welcome-text">Welcome to KLU Connect</h1>
          <p className="subtext">Sign in to access campus services</p>
        </div>

        {showMeme && (
          <div className="meme-popup">
            <div className="meme-content">
              <img src={currentMeme} alt="College email required" className="meme-image" />
              <p className="meme-caption">Only @klu.ac.in emails allowed!</p>
              <button 
                className="meme-close-btn"
                onClick={() => setShowMeme(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">College Email</label>
            <div className="input-field">
              <FiMail className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder={`username${collegeDomain}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-field">
              <FiLock className="input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button type="submit" className="primary-btn" disabled={isLoading}>
            {isLoading ? <span className="spinner"></span> : "Login"}
          </button>
        </form>

        <div className="divider">
          <span>or continue with</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="google-btn"
          disabled={googleLoading}
        >
          {googleLoading ? (
            <span className="spinner"></span>
          ) : (
            <>
              <FaGoogle className="google-icon" />
              <span>Google Sign In</span>
            </>
          )}
        </button>

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