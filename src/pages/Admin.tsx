import React from "react";
import { Container, Typography, Paper } from "@mui/material";

const Admin: React.FC = () => {
  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" mb={2}>
          Admin-Bereich
        </Typography>
        <Typography>
          Hier kannst du Termine verwalten, Teilnehmer sehen und weitere Admin-Funktionen später ergänzen!
        </Typography>
      </Paper>
    </Container>
  );
};

export default Admin;