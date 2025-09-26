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

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setUser } = useUserStore();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setError("");
      // Korrigierte API-URL (nur /login, da baseURL schon /api ist)
      const res = await api.post("/login", { username, password });
      setUser({
        username: res.data.username,
        role: res.data.role,
        token: res.data.token,
      });
      navigate("/");
    } catch {
      setError("Login fehlgeschlagen! Bitte überprüfe deine Daten.");
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