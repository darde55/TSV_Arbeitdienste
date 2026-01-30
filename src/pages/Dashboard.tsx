import React, { useEffect, useState, useMemo } from "react";
import {
  Paper, Typography, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableHead, TableRow, Box, Button,
  Avatar, TableContainer, Snackbar, Alert, Chip, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions
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

const KATEGORIEN = ["Schiedsrichter", "Grillen", "Sonstiges"] as const;
type TerminKategorie = typeof KATEGORIEN[number];

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
  kategorie?: TerminKategorie;
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
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedEventForAnmeldung, setSelectedEventForAnmeldung] = useState<Termin | null>(null);

  // Accordion-State für Kategorie-Abschnitte
  const [openKategorie, setOpenKategorie] = useState<Record<TerminKategorie, boolean>>({
    Schiedsrichter: false,
    Grillen: false,
    Sonstiges: false
  });

  // Hilfsfunktionen für Datum und Uhrzeit
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

  // API-Daten laden
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

  // KORREKTES MAPPING für Kalender-Events
  const calendarEvents: CalendarEvent[] = useMemo(() =>
    termine
      .filter(t => {
        const dateOnly = t.datum.slice(0, 10);
        const ende = t.ende && /^\d{2}:\d{2}$/.test(t.ende) ? t.ende : "10:00";
        const endDate = new Date(`${dateOnly}T${ende}`);
        return endDate >= new Date();
      })
      .map(t => {
        const dateOnly = t.datum.slice(0, 10);
        const beginn = t.beginn && /^\d{2}:\d{2}$/.test(t.beginn) ? t.beginn : "09:00";
        const ende = t.ende && /^\d{2}:\d{2}$/.test(t.ende) ? t.ende : "10:00";
        return {
          title: t.titel,
          start: new Date(`${dateOnly}T${beginn}`),
          end: new Date(`${dateOnly}T${ende}`),
          allDay: false,
          resource: t,
        };
      }), [termine]
  );

  // Eigene Termin-IDs für Markierungen
  const userTerminIds = useMemo(() => new Set(userTermine.map(t => t.id)), [userTermine]);

  // Kategorie-Farben
  const getCategoryColor = (kategorie?: TerminKategorie) => {
    switch (kategorie) {
      case "Schiedsrichter": return "#ff6b6b"; // Rot
      case "Grillen": return "#ffa500"; // Orange
      case "Sonstiges": return "#1976d2"; // Blau
      default: return "#1976d2";
    }
  };

  // Event-Farben im Kalender
  const eventPropGetter = (event: CalendarEvent) => {
    const isUserAngemeldet = userTerminIds.has(event.resource.id);
    const isPast = event.end ? event.end < new Date() : false;
    const baseColor = getCategoryColor(event.resource.kategorie);
    const style: React.CSSProperties = {
      backgroundColor: baseColor,
      color: "white",
      borderRadius: "8px",
      border: "none",
      opacity: 1,
      fontWeight: 600,
    };
    if (isUserAngemeldet) {
      style.backgroundColor = "#2e7d32"; // Grün für angemeldete Termine
    }
    if (isPast) {
      style.backgroundColor = "#b0b0b0";
      style.color = "#333";
      style.opacity = 0.7;
    }
    return { style };
  };

  // Nur zukünftige Termine für Listen
  const alleSichtbarenTermine = useMemo(() =>
    termine
      .filter(t => {
        const dateOnly = t.datum.slice(0, 10);
        const ende = t.ende && /^\d{2}:\d{2}$/.test(t.ende) ? t.ende : "10:00";
        const endDate = new Date(`${dateOnly}T${ende}`);
        return endDate >= new Date();
      })
      .sort((a, b) => {
        const dateA = new Date(a.datum.slice(0, 10));
        const dateB = new Date(b.datum.slice(0, 10));
        return dateA.getTime() - dateB.getTime();
      }),
    [termine]
  );

  // Nur den nächsten Termin
  const naechsterTermin = alleSichtbarenTermine.length > 0 ? alleSichtbarenTermine[0] : null;

  // Termine nach Katigorien (außer nächster)
  const kategorisierteTermine = useMemo(() => {
    const katObj: Record<TerminKategorie, Termin[]> = {
      Schiedsrichter: [],
      Grillen: [],
      Sonstiges: [],
    };
    alleSichtbarenTermine.slice(1).forEach((t) => {
      const kat = t.kategorie ?? "Sonstiges";
      katObj[kat].push(t);
    });
    return katObj;
  }, [alleSichtbarenTermine]);

  // Nur zukünftige "Meine Termine"
  const meineZukuenftigeTermine = useMemo(() =>
    userTermine.filter(t => {
      const dateOnly = t.datum.slice(0, 10);
      const ende = t.ende && /^\d{2}:\d{2}$/.test(t.ende) ? t.ende : "10:00";
      const endDate = new Date(`${dateOnly}T${ende}`);
      return endDate >= new Date();
    }),
    [userTermine]
  );

  // Admins aus Score-Tabelle herausfiltern
  const usersFiltered = users.filter(u => u.role !== "admin");
  const tableHeaderSx = { background: "#f5f5f5", fontWeight: 700 };

  // Funktion gibt jetzt immer eine Zahl zurück!
  function offenePlaetze(t: Termin): number {
    const max = t.anzahl ?? 0;
    const teilnehmer = t.teilnehmer ? t.teilnehmer.length : 0;
    return max > 0 ? Math.max(0, max - teilnehmer) : 0;
  }

  // Accordion-Logik für den nächsten Termin
  const [openAccordionId, setOpenAccordionId] = useState<number | null>(naechsterTermin?.id ?? null);

  useEffect(() => {
    setOpenAccordionId(naechsterTermin?.id ?? null);
  }, [naechsterTermin?.id]);

  // Accordion-Logik für Kategorien
  const handleKategorieAccordion = (kat: TerminKategorie) => {
    setOpenKategorie(prev => ({
      ...prev,
      [kat]: !prev[kat]
    }));
  };

  const handleAnmelden = async (terminId: number) => {
    setLoading(true);
    try {
      await api.post(`/termine/${terminId}/teilnehmen`);
      await fetchAllData();
      setEmailDialogOpen(true);
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

  const handleEventClick = (event: CalendarEvent) => {
    const termin = event.resource;
    const isPast = event.end ? event.end < new Date() : false;
    const isAngemeldet = userTerminIds.has(termin.id);
    
    if (!isPast && !isAngemeldet) {
      setSelectedEventForAnmeldung(termin);
    }
  };

  const handleAnmeldungConfirm = async () => {
    if (selectedEventForAnmeldung) {
      await handleAnmelden(selectedEventForAnmeldung.id);
      setSelectedEventForAnmeldung(null);
    }
  };

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
        <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Chip label="Schiedsrichter" sx={{ backgroundColor: "#ff6b6b", color: "white" }} size="small" />
          <Chip label="Grillen" sx={{ backgroundColor: "#ffa500", color: "white" }} size="small" />
          <Chip label="Sonstiges" sx={{ backgroundColor: "#1976d2", color: "white" }} size="small" />
          <Chip label="Angemeldet" sx={{ backgroundColor: "#2e7d32", color: "white" }} size="small" />
        </Box>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 400 }}
          culture="de"
          eventPropGetter={eventPropGetter}
          onSelectEvent={handleEventClick}
        />
      </Paper>

      {/* Nächster Termin */}
      {naechsterTermin &&
        <Paper sx={{ p: 2, mb: 4, boxShadow: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: "primary.main" }}>Nächster Termin</Typography>
          <Accordion
            expanded={openAccordionId === naechsterTermin.id}
            onChange={(_, isExpanded) => setOpenAccordionId(isExpanded ? naechsterTermin.id : null)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="h6">{naechsterTermin.titel}</Typography>
                  <Chip size="small" label={naechsterTermin.kategorie ?? "Sonstiges"} color="default" sx={{ mb: 0.5 }} />
                  <Typography>
                    {formatDate(naechsterTermin.datum)}
                    {naechsterTermin.beginn && ` | ${formatTime(naechsterTermin.beginn)} Uhr`}
                    {naechsterTermin.ende && ` - ${formatTime(naechsterTermin.ende)} Uhr`}
                  </Typography>
                  {naechsterTermin.anzahl &&
                    <Typography sx={{ color: "text.secondary" }}>
                      Offene Plätze: {offenePlaetze(naechsterTermin)} / {naechsterTermin.anzahl}
                    </Typography>
                  }
                </Box>
                <Box>
                  {!userTerminIds.has(naechsterTermin.id) && offenePlaetze(naechsterTermin) > 0 &&
                    <Button
                      variant="contained"
                      color="error"
                      size="large"
                      sx={{
                        borderRadius: 3,
                        fontWeight: 700,
                        textTransform: "none",
                        minWidth: 100,
                        height: 56
                      }}
                      disabled={loading || !!tokenError}
                      onClick={e => {
                        e.stopPropagation();
                        handleAnmelden(naechsterTermin.id);
                      }}
                    >
                      ANMELDEN
                    </Button>
                  }
                  {userTerminIds.has(naechsterTermin.id) &&
                    <Typography sx={{ ml: 2, color: "success.main", fontWeight: 700 }}>
                      Du bist angemeldet!
                    </Typography>
                  }
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ mb: 1 }}>Stichtag: {formatDate(naechsterTermin.stichtag)}</Typography>
              <Typography sx={{ mb: 1 }}>Ansprechpartner: {naechsterTermin.ansprechpartner_name || "-"} {naechsterTermin.ansprechpartner_mail && `(${naechsterTermin.ansprechpartner_mail})`}</Typography>
              <Typography sx={{ mb: 1 }}>Beschreibung: {naechsterTermin.beschreibung || "-"}</Typography>
            </AccordionDetails>
          </Accordion>
        </Paper>
      }

      {/* Termine nach Katigorien als Accordions */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" mb={2}>Termine nach Kategorie</Typography>
        {KATEGORIEN.map(kat => (
          <Accordion
            key={kat}
            expanded={openKategorie[kat]}
            onChange={() => handleKategorieAccordion(kat)}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">{kat}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {kategorisierteTermine[kat].length === 0 &&
                <Typography sx={{ color: "text.secondary" }}>Keine Termine in dieser Kategorie.</Typography>
              }
              {kategorisierteTermine[kat].map(t => (
                <Paper key={t.id} sx={{ p: 2, mb: 2, boxShadow: 1, borderRadius: 2 }}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box>
                          <Typography variant="subtitle1">{t.titel}</Typography>
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
                        <Box>
                          {!userTerminIds.has(t.id) && offenePlaetze(t) > 0 &&
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              sx={{
                                borderRadius: 3,
                                fontWeight: 700,
                                textTransform: "none",
                                minWidth: 100,
                                height: 40
                              }}
                              disabled={loading || !!tokenError}
                              onClick={e => {
                                e.stopPropagation();
                                handleAnmelden(t.id);
                              }}
                            >
                              ANMELDEN
                            </Button>
                          }
                          {userTerminIds.has(t.id) &&
                            <Typography sx={{ ml: 2, color: "success.main", fontWeight: 700 }}>
                              Du bist angemeldet!
                            </Typography>
                          }
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography sx={{ mb: 1 }}>Stichtag: {formatDate(t.stichtag)}</Typography>
                      <Typography sx={{ mb: 1 }}>Ansprechpartner: {t.ansprechpartner_name || "-"} {t.ansprechpartner_mail && `(${t.ansprechpartner_mail})`}</Typography>
                      <Typography sx={{ mb: 1 }}>Beschreibung: {t.beschreibung || "-"}</Typography>
                    </AccordionDetails>
                  </Accordion>
                </Paper>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      {/* Meine Termine */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Meine Termine</Typography>
        {meineZukuenftigeTermine.length === 0 && <Typography>Du bist aktuell für keine zukünftigen Termine angemeldet.</Typography>}
        {meineZukuenftigeTermine.map(t => (
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

      {/* Score Tabelle */}
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
                .sort((a, b) => b.score - a.score)
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

      {/* Anmelde-Bestätigungs-Dialog */}
      <Dialog
        open={!!selectedEventForAnmeldung}
        onClose={() => setSelectedEventForAnmeldung(null)}
      >
        <DialogTitle>Für Termin anmelden?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchtest du dich für den Termin <strong>{selectedEventForAnmeldung?.titel}</strong> am <strong>{formatDate(selectedEventForAnmeldung?.datum)}</strong> anmelden?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEventForAnmeldung(null)} color="error">
            Abbrechen
          </Button>
          <Button onClick={handleAnmeldungConfirm} variant="contained" color="primary" disabled={loading}>
            Ja, anmelden
          </Button>
        </DialogActions>
      </Dialog>

      {/* E-Mail Bestätigungs-Dialog */}
      <Dialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
      >
        <DialogTitle>Anmeldung erfolgreich!</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Eine E-Mail mit der Terminbestätigung und Kalender-Datei wurde an deine E-Mail-Adresse versendet.
            <br /><br />
            <strong>Bitte überprüfe auch deinen Spam-Ordner!</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)} variant="contained" color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;