import React from "react";
import { Container, Typography, Paper, Box, Divider } from "@mui/material";
import UserAdmin from "../components/UserAdmin";
import TermineAdmin from "../components/TermineAdmin";

const Admin: React.FC = () => {
  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" mb={2}>
          Admin-Bereich
        </Typography>
        <Typography mb={3}>
          Hier kannst du Termine und Benutzer verwalten!
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box mb={4}>
          <UserAdmin />
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Box>
          <TermineAdmin />
        </Box>
      </Paper>
    </Container>
  );
};

export default Admin;