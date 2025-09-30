import React, { useEffect, useState, useMemo } from "react";
import {
  Paper, Typography, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableHead, TableRow, Box, Button,
  Avatar, TableContainer, Snackbar, Alert
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { Event as RBCEvent } from "react-big-calendar";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from "date-fns";
import { de } from "date-fns/locale";
import api from "../api/api";
import axios from "axios";

// Kalender-Lokalisierung
const locales = { 'de': de };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Typdefinitionen
type Termin = {
  id: number;
  titel: string;
  beschreibung?: string;
  datum: string;
  beginn?: string;
  ende?: string;
  anzahl?: number;
  stichtag?: string;
  ansprechpartner_name?: string;
  ansprechpartner_mail?: string;
  score?: number;
  teilnehmer?: { username: string }[];
};

type User = {
  username: string;
  email: string;
  role: string;
  score: number;
};

type CalendarEvent = RBCEvent & {
  resource: Termin;
};

const Dashboard: React.FC = () => {
  const [termine, setTermine] = useState<Termin[]>([]);
  const [userTermine, setUserTermine] = useState<Termin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [tokenError, setTokenError] = useState<string>("");

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatTime = (time?: string) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    if (!h || !m) return time;
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  };

  const fetchAllData = async () => {
    if (!localStorage.getItem("token")) {
      setTokenError("Du bist nicht eingeloggt. Bitte melde dich zuerst an.");
      return;
    }
    try {
      const [termineRes, usersRes, userTermineRes] = await Promise.all([
        api.get<Termin[]>("/termine"),
        api.get<User[]>("/users"),
        api.get<Termin[]>("/profile/termine"),
      ]);
      setTermine(termineRes.data);
      setUsers(usersRes.data);
      setUserTermine(userTermineRes.data);
      setTokenError("");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setTokenError(
          err.response?.data?.message ||
          "Fehler beim Laden der Daten. Dein Token ist ungültig oder abgelaufen. Bitte melde dich neu an."
        );
        console.error("Fehler beim Laden der Daten:", err);
      } else {
        setTokenError("Unbekannter Fehler beim Laden der Daten.");
        console.error("Unbekannter Fehler beim Laden der Daten:", err);
      }
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Kalender-Events
  const calendarEvents: CalendarEvent[] = useMemo(() =>
    termine.map(t => ({
      title: t.titel,
      start: t.beginn
        ? new Date(`${t.datum}T${t.beginn}`)
        : new Date(t.datum),
      end: t.ende
        ? new Date(`${t.datum}T${t.ende}`)
        : (t.beginn
            ? new Date(`${t.datum}T${t.beginn}`)
            : new Date(t.datum)),
      allDay: !t.beginn,
      resource: t,
    })), [termine]
  );

  // Eigene Termin-IDs
  const userTerminIds = useMemo(() => new Set(userTermine.map(t => t.id)), [userTermine]);

  // Kalender-Event-Styles
  const eventPropGetter = (event: CalendarEvent) => {
    const isUserAngemeldet = userTerminIds.has(event.resource.id);
    // FEHLERFREI:
    const isPast = event.end ? event.end < new Date() : false;

    const style: React.CSSProperties = {
      backgroundColor: "#1976d2",
      color: "white",
      borderRadius: "8px",
      border: "none",
      opacity: 1,
      fontWeight: 600,
    };
    if (isUserAngemeldet) {
      style.backgroundColor = "#2e7d32";
    }
    if (isPast) {
      style.backgroundColor = "#b0b0b0";
      style.color = "#333";
      style.opacity = 0.7;
    }
    return { style };
  };

  // Nächster Termin
  const nextTermin = useMemo(() =>
    termine
      .filter(t => new Date(t.datum) >= new Date())
      .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())[0], [termine]
  );

  // Weitere Termine
  const weitereTermine = useMemo(() =>
    termine
      .filter(t => t.id !== nextTermin?.id && new Date(t.datum) >= new Date())
      .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime()), [termine, nextTermin]
  );

  // Admins aus Score-Tabelle herausfiltern
  const usersFiltered = users.filter(u => u.role !== "admin");
  const tableHeaderSx = { background: "#f5f5f5", fontWeight: 700 };

  function offenePlaetze(t: Termin) {
    const max = t.anzahl ?? 0;
    const teilnehmer = t.teilnehmer ? t.teilnehmer.length : 0;
    return max > 0 ? Math.max(0, max - teilnehmer) : "-";
  }

  const handleAnmelden = async (terminId: number) => {
    setLoading(true);
    try {
      await api.post(`/termine/${terminId}/teilnehmen`);
      await fetchAllData();
      setSnackOpen(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setTokenError(
          err.response?.data?.message ||
          "Fehler beim Anmelden. Dein Token ist ungültig oder abgelaufen. Bitte melde dich neu an."
        );
        console.error("Fehler beim Anmelden:", err);
      } else {
        setTokenError("Unbekannter Fehler beim Anmelden.");
        console.error("Unbekannter Fehler beim Anmelden:", err);
      }
    }
    setLoading(false);
  };

  const alleSichtbarenTermine = [nextTermin, ...weitereTermine].filter(Boolean);

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 3, mb: 4 }}>
      <Snackbar
        open={snackOpen}
        autoHideDuration={8000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }} onClose={() => setSnackOpen(false)}>
          Du bist angemeldet! Checke dein E-Mail Postfach – auch den Ordner Spam.
        </Alert>
      </Snackbar>

      {tokenError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {tokenError}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h5" mb={2}>Terminkalender</Typography>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 400 }}
          culture="de"
          eventPropGetter={eventPropGetter}
        />
      </Paper>

      {alleSichtbarenTermine.map((t) => (
        <Paper key={t.id} sx={{ p: 2, mb: 2, boxShadow: 3, borderRadius: 2 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ width: "100%" }}>
                <Typography variant="h6">{t.titel}</Typography>
                <Typography>
                  {formatDate(t.datum)}
                  {t.beginn && ` | ${formatTime(t.beginn)} Uhr`}
                  {t.ende && ` - ${formatTime(t.ende)} Uhr`}
                </Typography>
                {t.anzahl &&
                  <Typography sx={{ color: "text.secondary" }}>
                    Offene Plätze: {offenePlaetze(t)} / {t.anzahl}
                  </Typography>
                }
              </Box>
              {!userTerminIds.has(t.id) &&
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ ml: 2 }}
                  disabled={loading || !!tokenError}
                  onClick={e => {
                    e.stopPropagation();
                    handleAnmelden(t.id);
                  }}
                >
                  Anmelden
                </Button>
              }
              {userTerminIds.has(t.id) &&
                <Typography sx={{ ml: 2, color: "success.main", fontWeight: 700 }}>
                  Du bist angemeldet!
                </Typography>
              }
            </AccordionSummary>
            <AccordionDetails>
              <Typography>Stichtag: {formatDate(t.stichtag)}</Typography>
              <Typography>Ansprechpartner: {t.ansprechpartner_name || "-"} {t.ansprechpartner_mail && `(${t.ansprechpartner_mail})`}</Typography>
            </AccordionDetails>
          </Accordion>
        </Paper>
      ))}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Meine Termine</Typography>
        {userTermine.length === 0 && <Typography>Du bist aktuell für keine Termine angemeldet.</Typography>}
        {userTermine.map(t => (
          <Accordion key={t.id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>
                {t.titel} ({formatDate(t.datum)}{t.beginn && ` um ${formatTime(t.beginn)}`})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>Beschreibung: {t.beschreibung}</Typography>
              <Typography>Beginn: {formatTime(t.beginn)}</Typography>
              <Typography>Ende: {formatTime(t.ende)}</Typography>
              <Typography>Anzahl: {t.anzahl}</Typography>
              <Typography>Stichtag: {formatDate(t.stichtag)}</Typography>
              <Typography>Ansprechpartner: {t.ansprechpartner_name} {t.ansprechpartner_mail && `(${t.ansprechpartner_mail})`}</Typography>
              <Typography>Score: {t.score}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

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