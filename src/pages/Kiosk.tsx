import React, { useState } from "react";
import { Paper, Tabs, Tab } from "@mui/material";
import Kuehlschraenke from "../components/Kuehlschraenke";
import Kasse from "../components/Kasse";
import Preisliste from "../components/Preisliste";
import Statistik from "../components/Statistik";

type User = { role: string };

const Kiosk: React.FC<{ user: User }> = ({ user }) => {
  const [tab, setTab] = useState<number>(0);

  if (user.role !== "admin") {
    return <Paper sx={{ p: 3, mt: 2 }}>Kein Zugriff</Paper>;
  }

  return (
    <Paper sx={{ mt: 2, p: 2 }}>
      <Tabs
        value={tab}
        onChange={(_event: React.SyntheticEvent, value: number) => setTab(value)}
        variant="fullWidth"
      >
        <Tab label="Kühlschränke" />
        <Tab label="Kasse" />
        <Tab label="Preisliste" />
        <Tab label="Statistik" />
      </Tabs>
      {tab === 0 && <Kuehlschraenke />}
      {tab === 1 && <Kasse />}
      {tab === 2 && <Preisliste />}
      {tab === 3 && <Statistik />}
    </Paper>
  );
};

export default Kiosk;