import React, { useState } from "react";
import { Paper, Tabs, Tab } from "@mui/material";
import Kuehlschraenke from "../components/Kuehlschraenke";
import Kasse from "../components/Kasse";
import Preisliste from "../components/Preisliste";

const Kiosk: React.FC<{ user: { role: string } }> = ({ user }) => {
  const [tab, setTab] = useState(0);

  if (user.role !== "admin") {
    return <Paper sx={{ p: 3, mt: 2 }}>Kein Zugriff</Paper>;
  }

  return (
    <Paper sx={{ mt: 2, p: 2 }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
        <Tab label="Kühlschränke" />
        <Tab label="Kasse" />
        <Tab label="Preisliste" />
      </Tabs>
      {tab === 0 && <Kuehlschraenke />}
      {tab === 1 && <Kasse />}
      {tab === 2 && <Preisliste />}
    </Paper>
  );
};

export default Kiosk;