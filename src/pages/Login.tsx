import React, { useState } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
} from "@mui/material";
import api from "../api/api";
import { useUserStore } from "../store/userStore";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setUser } = useUserStore();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    try {
      const res = await api.post("/login", { username, password });

      // Prüfe ob Token vorhanden ist
      if (!res.data.token) {
        setError("Login fehlgeschlagen: Kein Token vom Server erhalten.");
        return;
      }

      localStorage.setItem("token", res.data.token);

      // Hole zusätzliche Userdaten aus /api/profile
      try {
        const profileRes = await api.get("/api/profile", {
          headers: { Authorization: `Bearer ${res.data.token}` },
        });

        setUser({
          username: res.data.username,
          role: res.data.role,
          token: res.data.token,
          email: profileRes.data.email,
          score: profileRes.data.score,
        });
      } catch (profileErr) {
        setError("Login erfolgreich, aber Fehler beim Laden des Profils.");
        console.error("Profile Fetch Error:", profileErr);
        return;
      }

      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message ||
          "Login fehlgeschlagen! Bitte überprüfe deine Daten.";
        setError(message);
        console.error("Login Error:", err);
      } else {
        setError("Unbekannter Fehler beim Login.");
        console.error("Unbekannter Fehler beim Login:", err);
      }
    }
  };

  return (
    <Box sx={{ mt: 8, display: "flex", justifyContent: "center" }}>
      <Paper sx={{ p: 4, maxWidth: 400, width: "100%" }} elevation={3}>
        <Typography variant="h5" mb={2} color="primary" align="center">
          TSV Wolfschlugen Login
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          fullWidth
          label="Benutzername"
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <TextField
          fullWidth
          label="Passwort"
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
        <Button
          fullWidth
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={handleLogin}
        >
          Login
        </Button>
      </Paper>
    </Box>
  );
};

export default Login;