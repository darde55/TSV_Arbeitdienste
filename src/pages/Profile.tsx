import React, { useEffect, useState } from "react";
import { Paper, Typography, Box, Chip } from "@mui/material";
import api from "../api/api";

interface UserProfileType {
  username: string;
  email: string;
  role: string;
  score: number;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfileType | null>(null);

  useEffect(() => {
    api.get("/profile").then((res) => setProfile(res.data));
  }, []);

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