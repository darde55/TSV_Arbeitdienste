import React, { useEffect, useState, useMemo } from "react";
import {
  Paper, Typography, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableHead, TableRow, Box, Button,
  Avatar, TableContainer
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from "date-fns";
import { de } from "date-fns/locale/de";
import api from "../api/api";

// TypeScript Fix: If you get an error with 'react-big-calendar', create a file src/react-big-calendar.d.ts with: declare module 'react-big-calendar';

const locales = { 'de': de };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

type Termin = {
  id: number;
  titel: string;
  beschreibung?: string;
  datum: string; // YYYY-MM-DD
  beginn?: string; // HH:MM
  ende?: string;
  anzahl?: number;
  stichtag?: string;
  ansprechpartner_name?: string;
  ansprechpartner_mail?: string;
  score?: number;
};

type User = {
  username: string;
  email: string;
  role: string;
  score: number;
};

const Dashboard: React.FC = () => {
  const [termine, setTermine] = useState<Termin[]>([]);
  const [userTermine, setUserTermine] = useState<Termin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    api.get<Termin[]>("/termine").then(res => setTermine(res.data));
    api.get<User[]>("/users", { headers: { Authorization: `Bearer ${token}` }}).then(res => setUsers(res.data));
    api.get<Termin[]>("/profile/termine", { headers: { Authorization: `Bearer ${token}` }}).then(res => setUserTermine(res.data));
  }, [token]);

  // Events für Kalender
  const calendarEvents = useMemo(() =>
    termine.map(t => ({
      title: t.titel,
      start: new Date(`${t.datum}T${t.beginn || "00:00"}`),
      end: new Date(`${t.datum}T${t.ende || t.beginn || "23:59"}`),
      allDay: !t.beginn,
      resource: t,
    })), [termine]
  );

  // Eigene Termin-IDs für schnelles Lookup
  const userTerminIds = useMemo(() => new Set(userTermine.map(t => t.id)), [userTermine]);

  // Nächster Termin
  const nextTermin = useMemo(() =>
    termine
      .filter(t => new Date(t.datum) >= new Date())
      .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())[0], [termine]
  );

  // Weitere Termine (außer nächster)
  const weitereTermine = useMemo(() =>
    termine
      .filter(t => t.id !== nextTermin?.id && new Date(t.datum) >= new Date())
      .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime()), [termine, nextTermin]
  );

  // Handler für Anmelden
  const handleAnmelden = async (terminId: number) => {
    setLoading(true);
    try {
      await api.post(`/termine/${terminId}/teilnehmen`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Aktualisiere eigene Termine
      const res = await api.get<Termin[]>("/profile/termine", { headers: { Authorization: `Bearer ${token}` }});
      setUserTermine(res.data);
    } catch {
      // Fehlerbehandlung nach Bedarf
    }
    setLoading(false);
  };

  // Admins aus Score-Tabelle herausfiltern
  const usersFiltered = users.filter(u => u.role !== "admin");

  // Moderneres Table-Design
  const tableHeaderSx = { background: "#f5f5f5", fontWeight: 700 };

  // Alle sichtbaren Termine (nächster + weitere)
  const alleSichtbarenTermine = [nextTermin, ...weitereTermine].filter(Boolean);

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 3, mb: 4 }}>
      {/* Großer Kalender */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h5" mb={2}>Terminkalender</Typography>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 400 }}
          culture="de"
        />
      </Paper>

      {/* Einzelne Termin-Boxen, sortiert */}
      {alleSichtbarenTermine.map((t) => (
        <Paper key={t.id} sx={{ p: 2, mb: 2, boxShadow: 3, borderRadius: 2 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ width: "100%" }}>
                <Typography variant="h6">{t.titel}</Typography>
                <Typography>
                  {t.datum}
                  {t.beginn && ` | ${t.beginn} Uhr`}
                  {t.ende && ` - ${t.ende} Uhr`}
                </Typography>
              </Box>
              {!userTerminIds.has(t.id) &&
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ ml: 2 }}
                  disabled={loading}
                  onClick={e => {
                    e.stopPropagation();
                    handleAnmelden(t.id);
                  }}
                >
                  Anmelden
                </Button>
              }
            </AccordionSummary>
            <AccordionDetails>
              <Typography>Stichtag: {t.stichtag || "-"}</Typography>
              <Typography>Ansprechpartner: {t.ansprechpartner_name || "-"} {t.ansprechpartner_mail && `(${t.ansprechpartner_mail})`}</Typography>
            </AccordionDetails>
          </Accordion>
        </Paper>
      ))}

      {/* Eigene Termine (Accordion) */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Meine Termine</Typography>
        {userTermine.length === 0 && <Typography>Du bist aktuell für keine Termine angemeldet.</Typography>}
        {userTermine.map(t => (
          <Accordion key={t.id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{t.titel} ({t.datum} {t.beginn && `um ${t.beginn}`})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>Beschreibung: {t.beschreibung}</Typography>
              <Typography>Beginn: {t.beginn}</Typography>
              <Typography>Ende: {t.ende}</Typography>
              <Typography>Anzahl: {t.anzahl}</Typography>
              <Typography>Stichtag: {t.stichtag}</Typography>
              <Typography>Ansprechpartner: {t.ansprechpartner_name} ({t.ansprechpartner_mail})</Typography>
              <Typography>Score: {t.score}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      {/* Score-Tabelle (ohne Admins) */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" mb={2}>Score Tabelle</Typography>
        <TableContainer>
          <Table size="small" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <TableHead>
              <TableRow>
                <TableCell sx={tableHeaderSx}>Benutzer</TableCell>
                <TableCell sx={tableHeaderSx}>Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersFiltered
                .sort((a, b) => a.score - b.score)
                .map(u => (
                  <TableRow key={u.username}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: "#1976d2" }}>{u.username[0].toUpperCase()}</Avatar>
                        <span>{u.username}</span>
                      </Box>
                    </TableCell>
                    <TableCell>{u.score}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Dashboard;