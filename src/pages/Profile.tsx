import React, { useEffect, useState } from "react";
import { Paper, Typography, Box, Chip, Alert } from "@mui/material";
import api from "../api/api";
import axios from "axios";

interface UserProfileType {
  username: string;
  email: string;
  role: string;
  score: number;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Du bist nicht eingeloggt. Bitte melde dich zuerst an.");
        return;
      }
      try {
        // KORREKTER Pfad: /profile (NICHT /api/profile!)
        const res = await api.get<UserProfileType>("/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
              "Fehler beim Laden des Profils. Dein Token ist ungültig, abgelaufen oder die API-Route /api/profile existiert nicht."
          );
        } else {
          setError("Unbekannter Fehler beim Laden des Profils.");
        }
        console.error("Profil-Fehler:", err);
      }
    };
    fetchProfile();
  }, []);

  if (error) {
    return (
      <Box sx={{ mt: 5, display: "flex", justifyContent: "center" }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!profile) return null;

  return (
    <Box sx={{ mt: 5, display: "flex", justifyContent: "center" }}>
      <Paper sx={{ p: 4, maxWidth: 400, width: "100%" }} elevation={2}>
        <Typography variant="h6" mb={2}>
          Mein Profil
        </Typography>
        <Typography>
          <b>Benutzername:</b> {profile.username}
        </Typography>
        <Typography>
          <b>E-Mail:</b> {profile.email}
        </Typography>
        <Typography>
          <b>Rolle:</b>{" "}
          <Chip
            label={profile.role === "admin" ? "Admin" : "Mitglied"}
            color={profile.role === "admin" ? "secondary" : "primary"}
            size="small"
          />
        </Typography>
        <Typography sx={{ mt: 1 }}>
          <b>Score:</b> {profile.score}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Profile;