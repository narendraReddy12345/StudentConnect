// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Login from "./components/Auth/Login";
import Home from "./components/DashBoard";
import FacultyDepartments from "./components/FacultyDepartments";
import DepartmentFaculty from "./components/DepartmentFaculty";
import AdminDashboard from "./components/Admin";
import LoadingSpinner from "./components/LoadingSpinner";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || "Student",
          email: firebaseUser.email,
          isAdmin: firebaseUser.email === "99220041116@klu.ac.in"
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={!user ? <Login setUser={setUser} /> : <Navigate to="/home" />}
        />
        <Route
          path="/home"
          element={
            user ? (
              <Home user={user} setUser={setUser} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/departments"
          element={user ? <FacultyDepartments /> : <Navigate to="/" />}
        />
        <Route
          path="/departments/:department"
          element={user ? <DepartmentFaculty /> : <Navigate to="/" />}
        />
        <Route
          path="/admin"
          element={
            user?.isAdmin ? <AdminDashboard /> : <Navigate to="/home" />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;