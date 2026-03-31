import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

export default function App() {
  // Use state so React re-renders when the token changes
  const [token, setToken] = useState(localStorage.getItem("token"));

  // This effect ensures we stay in sync with localStorage
  useEffect(() => {
    const currentToken = localStorage.getItem("token");
    setToken(currentToken);
  }, []);

  return (
    <Routes>
      {/* Pass setToken to Login so it can update the App state after a successful login 
      */}
      <Route 
        path="/login" 
        element={!token ? <Login setToken={setToken} /> : <Navigate to="/" />} 
      />

      {/* Pass setToken to Dashboard so it can update the App state when clicking Logout 
      */}
      <Route
        path="/"
        element={token ? <Dashboard setToken={setToken} /> : <Navigate to="/login" />}
      />

      {/* Redirect any unknown routes to login or dashboard */}
      <Route path="*" element={<Navigate to={token ? "/" : "/login"} />} />
    </Routes>
  );
}

