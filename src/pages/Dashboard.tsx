import React, { useEffect, useState, useMemo } from "react";
import { Paper, Typography, Accordion, AccordionSummary, AccordionDetails, Table, TableBody, TableCell, TableHead, TableRow, Box } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from "date-fns";
import { de } from "date-fns/locale/de";
import api from "../api/api";

// Fix for missing types
// If you get an error with 'react-big-calendar', create a file src/react-big-calendar.d.ts with: declare module 'react-big-calendar';

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

  const token = localStorage.getItem("token");

  useEffect(() => {
    // Alle Termine
    api.get<Termin[]>("/termine").then(res => setTermine(res.data));
    // Alle Benutzer
    api.get<User[]>("/users", { headers: { Authorization: `Bearer ${token}` }}).then(res => setUsers(res.data));
    // Eigene Termine (API muss existieren!)
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

      {/* Nächster Termin */}
      {nextTermin &&
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Nächster Termin</Typography>
          <Typography><b>{nextTermin.titel}</b> am {nextTermin.datum} {nextTermin.beginn && `um ${nextTermin.beginn}`}</Typography>
          <Typography>{nextTermin.beschreibung}</Typography>
          <Typography>Ansprechpartner: {nextTermin.ansprechpartner_name} ({nextTermin.ansprechpartner_mail})</Typography>
        </Paper>
      }

      {/* Weitere Termine */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Weitere Termine</Typography>
        {weitereTermine.length === 0 && <Typography>Keine weiteren Termine.</Typography>}
        {weitereTermine.map(t => (
          <Box key={t.id} sx={{ mb: 1 }}>
            <Typography><b>{t.titel}</b> am {t.datum} {t.beginn && `um ${t.beginn}`}</Typography>
            <Typography>{t.beschreibung}</Typography>
          </Box>
        ))}
      </Paper>

      {/* Eigene Termine (Accordion) */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Meine Termine</Typography>
        {userTermine.length === 0 && <Typography>Du bist aktuell für keine Termine angemeldet.</Typography>}
        {userTermine.map(t => (
          <Accordion key={t.id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{t.titel} ({t.datum})</Typography>
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

      {/* Score-Tabelle */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Score Tabelle</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Benutzer</TableCell>
              <TableCell>Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users
              .sort((a, b) => a.score - b.score)
              .map(u => (
                <TableRow key={u.username}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.score}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Dashboard;