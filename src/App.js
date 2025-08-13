import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

// Components
import Login from "./components/Auth/Login";
import Home from "./components/DashBoard";
import Departments from "./components/Departments";
import LoadingSpinner from "./components/LoadingSpinner";
import UpdatesFeed from "./components/Update";
import EventDetails from "./components/EventDetails";
import EventRegistration from './components/Events'
import FormsAdmin from "./components/Adminpanel/forms";
import CampusMap from "./components/CampusMap";

import AdminHome from "./components/Adminpanel/home";
import FacultyManagement from "./components/Adminpanel/Faculty";
import EventsManagement from "./components/Adminpanel/Events";
import FacultyList from "./components/facultyview";
import UpdatesAdmin from "./components/Adminpanel/updateAdmin";
import StudentFormsView from "./components/Forms";
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || "Student",
          email: firebaseUser.email,
          isAdmin:
            firebaseUser.email === "99220041116@klu.ac.in" ||
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
      <div className={`app-container ${isMobile ? "mobile" : "desktop"}`}>
        <Switch>
          {/* Auth Route */}
          <Route
            exact
            path="/"
            render={() =>
              !user ? (
                <Login setUser={setUser} isMobile={isMobile} />
              ) : (
                <Redirect to="/home" />
              )
            }
          />

          {/* Main Routes */}
          <Route
            path="/home"
            render={() =>
              user ? (
                <Home user={user} setUser={setUser} isMobile={isMobile} />
              ) : (
                <Redirect to="/" />
              )
            }
          />
          <Route
            path="/departments"
            render={() =>
              user ? <Departments isMobile={isMobile} /> : <Redirect to="/" />
            }
          />
          <Route
            path="/faculty/:dept"
            render={() =>
              user ? <FacultyList isMobile={isMobile} /> : <Redirect to="/" />
            }
          />
          <Route
            path="/events"
            exact
            render={() =>
              user ? <EventRegistration isMobile={isMobile} /> : <Redirect to="/" />
            }
          />
          <Route
            path="/events/:id"
            render={({ match }) =>
              user ? (
                <EventDetails eventId={match.params.id} isMobile={isMobile} />
              ) : (
                <Redirect to="/" />
              )
            }
          />
          <Route
            path="/updates"
            render={() =>
              user ? <UpdatesFeed isMobile={isMobile} /> : <Redirect to="/" />
            }
          />
          <Route
            path="/map"
            render={() =>
              user ? <CampusMap isMobile={isMobile} /> : <Redirect to="/" />
            }
          />
          <Route
            path="/forms"
            render={() =>
              user ? <StudentFormsView isMobile={isMobile} /> : <Redirect to="/" />
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            exact
            render={() =>
              user?.isAdmin ? (
                <AdminHome isMobile={isMobile} />
              ) : (
                <Redirect to="/home" />
              )
            }
          />
          <Route
            path="/admin/faculty"
            render={() =>
              user?.isAdmin ? (
                <FacultyManagement isMobile={isMobile} />
              ) : (
                <Redirect to="/home" />
              )
            }
          />
          <Route
            path="/admin/events"
            render={() =>
              user?.isAdmin ? (
                <EventsManagement isMobile={isMobile} />
              ) : (
                <Redirect to="/home" />
              )
            }
          />
          <Route
            path="/admin/updates"
            render={() =>
              user?.isAdmin ? (
                <UpdatesAdmin isMobile={isMobile} />
              ) : (
                <Redirect to="/home" />
              )
            }
          />
            <Route
            path="/admin/forms"
            render={() =>
              user?.isAdmin ? (
                <FormsAdmin isMobile={isMobile} />
              ) : (
                <Redirect to="/home" />
              )
            }
          />

          {/* Fallback */}
          <Route
            render={() => <Redirect to={user ? "/home" : "/"} />}
          />
        </Switch>
      </div>
    </Router>
  );
}

export default App;