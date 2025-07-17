import React, { useState } from "react";
import Login from "./components/Auth/Login";
import Home from "./components/DashBoard";

function App() {
  const [user, setUser] = useState(null);

  return user ? <Home user={user} /> : <Login setUser={setUser} />;
}

export default App;
