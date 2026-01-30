import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Kiosk from "./pages/Kiosk"; // <--- Importiert!
import { useUserStore } from "./store/userStore";
import { CircularProgress, Box } from "@mui/material";

const App: React.FC = () => {
  const { user, fetchUser, isLoading } = useUserStore();

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route
          path="/admin"
          element={
            user && (user.role === "admin" || user.role === "organisator") ? <Admin /> : <Navigate to="/" />
          }
        />
        {/* --- Kiosk Route korrekt ergänzt --- */}
        <Route
          path="/kiosk"
          element={
            user && user.role === "admin"
              ? <Kiosk user={user} />
              : <Navigate to="/" />
          }
        />
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Routes>
    </>
  );
};

export default App;