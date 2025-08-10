import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Login from "./components/Auth/Login";
import Home from "./components/DashBoard";
import Departments from "./components/Departments";
import LoadingSpinner from "./components/LoadingSpinner";
import Events from "./components/Events";
import Forms from "./components/Forms";
import CampusMap from "./components/CampusMap";
import AIAssistant from "./components/AIAssistant";
import AdminHome from "./components/Adminpanel/home";
import FacultyManagement from "./components/Adminpanel/Faculty";
import EventsManagement from "./components/Adminpanel/Events";
import FacultyList from "./components/facultyview";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || "Student",
          email: firebaseUser.email,
          isAdmin: firebaseUser.email === "99220041116@klu.ac.in" || 
                  firebaseUser.email === "admin@klu.ac.in"
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner />
        <p>Loading your campus experience...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className={`app-container ${isMobile ? 'mobile' : 'desktop'}`}>
        <Routes>
          {/* Authentication */}
          <Route
            path="/"
            element={!user ? <Login setUser={setUser} isMobile={isMobile} /> : <Navigate to="/home" />}
          />
          
          {/* Main App Routes */}
          <Route
            path="/home"
            element={
              user ? <Home user={user} setUser={setUser} isMobile={isMobile} /> : <Navigate to="/" />
            }
          />
          <Route
            path="/departments"
            element={user ? <Departments isMobile={isMobile} /> : <Navigate to="/" />}
          />
          <Route
            path="/faculty/:dept"  // New faculty list route
            element={user ? <FacultyList isMobile={isMobile} /> : <Navigate to="/" />}
          />
          <Route
            path="/events"
            element={user ? <Events isMobile={isMobile} /> : <Navigate to="/" />}
          />
          <Route
            path="/forms"
            element={user ? <Forms isMobile={isMobile} /> : <Navigate to="/" />}
          />
          <Route
            path="/map"
            element={user ? <CampusMap isMobile={isMobile} /> : <Navigate to="/" />}
          />
          <Route
            path="/ai-help"
            element={user ? <AIAssistant isMobile={isMobile} /> : <Navigate to="/" />}
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              user?.isAdmin ? <AdminHome isMobile={isMobile} /> : <Navigate to="/home" />
            }
          />
          <Route
            path="/admin/faculty"
            element={
              user?.isAdmin ? <FacultyManagement isMobile={isMobile} /> : <Navigate to="/home" />
            }
          />
          <Route
            path="/admin/events"
            element={
              user?.isAdmin ? <EventsManagement isMobile={isMobile} /> : <Navigate to="/home" />
            }
          />
          
          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to={user ? "/home" : "/"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;