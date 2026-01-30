import React, { useState } from "react";
import { Container, Typography, Paper, Box, Divider, Tabs, Tab } from "@mui/material";
import UserAdmin from "../components/UserAdmin";
import TermineAdmin from "../components/TermineAdmin";
import TerminArchiv from "../components/TerminArchiv";
import { useUserStore } from "../store/userStore";

const Admin: React.FC = () => {
  const { user } = useUserStore();
  const isAdmin = user?.role === "admin";
  const [tabIndex, setTabIndex] = useState(isAdmin ? 0 : 0);

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" mb={2}>{isAdmin ? "Admin-Bereich" : "Terminverwaltung"}</Typography>
        <Typography mb={2}>
          {isAdmin ? "Hier kannst du Termine und Benutzer verwalten!" : "Hier kannst du Termine verwalten!"}
        </Typography>
        <Tabs
          value={tabIndex}
          onChange={(_, idx) => setTabIndex(idx)}
          sx={{ mb: 3 }}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          {isAdmin && <Tab label="Benutzer" />}
          <Tab label="Termine" />
          <Tab label="Archiv" />
        </Tabs>
        <Divider sx={{ mb: 3 }} />
        <Box>
          {isAdmin && tabIndex === 0 && <UserAdmin />}
          {isAdmin && tabIndex === 1 && <TermineAdmin />}
          {isAdmin && tabIndex === 2 && <TerminArchiv />}
          {!isAdmin && tabIndex === 0 && <TermineAdmin />}
          {!isAdmin && tabIndex === 1 && <TerminArchiv />}
        </Box>
      </Paper>
    </Container>
  );
};

export default Admin;