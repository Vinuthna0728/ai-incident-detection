import React from "react";
import Dashboard from "./pages/Dashboard";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      {/* 🔔 Toast Container */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* Main Dashboard */}
      <Dashboard />
    </>
  );
}

export default App;