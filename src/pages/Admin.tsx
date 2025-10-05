import React, { useState } from "react";
import { Container, Typography, Paper, Box, Divider, Tabs, Tab } from "@mui/material";
import UserAdmin from "../components/UserAdmin";
import TermineAdmin from "../components/TermineAdmin";
import TerminArchiv from "../components/TerminArchiv";

const Admin: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" mb={2}>Admin-Bereich</Typography>
        <Typography mb={2}>
          Hier kannst du Termine und Benutzer verwalten!
        </Typography>
        <Tabs
          value={tabIndex}
          onChange={(_, idx) => setTabIndex(idx)}
          sx={{ mb: 3 }}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Benutzer" />
          <Tab label="Termine" />
          <Tab label="Archiv" />
        </Tabs>
        <Divider sx={{ mb: 3 }} />
        <Box>
          {tabIndex === 0 && <UserAdmin />}
          {tabIndex === 1 && <TermineAdmin />}
          {tabIndex === 2 && <TerminArchiv />}
        </Box>
      </Paper>
    </Container>
  );
};

export default Admin;