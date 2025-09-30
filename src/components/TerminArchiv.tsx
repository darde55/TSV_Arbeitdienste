import React, { useEffect, useState } from "react";
import {
  Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Box, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, CircularProgress
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import api from "../api/api";

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
};

type Teilnehmer = {
  username: string;
  email?: string;
  score?: number;
};

const TerminArchiv: React.FC = () => {
  const [termine, setTermine] = useState<Termin[]>([]);
  const [sortBy, setSortBy] = useState<"datum" | "titel">("datum");
  const [snackOpen, setSnackOpen] = useState(false);
  const [error, setError] = useState<string>("");

  // Details-Dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTermin, setSelectedTermin] = useState<Termin | null>(null);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [teilnehmerLoading, setTeilnehmerLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string>("");

  const fetchTermine = async () => {
    try {
      const res = await api.get<Termin[]>("/termine");
      setTermine(res.data);
    } catch {
      setError("Fehler beim Laden der Termine.");
    }
  };

  useEffect(() => {
    fetchTermine();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/termine/${id}`);
      setSnackOpen(true);
      fetchTermine();
    } catch {
      setError("Fehler beim Löschen des Termins.");
    }
  };

  const handleShowDetails = async (termin: Termin) => {
    setDetailsOpen(true);
    setSelectedTermin(termin);
    setTeilnehmer([]);
    setTeilnehmerLoading(true);
    setDetailsError("");
    try {
      const res = await api.get<Teilnehmer[]>(`/termine/${termin.id}/teilnehmer`);
      setTeilnehmer(res.data);
    } catch {
      setDetailsError("Fehler beim Laden der Teilnehmer.");
    }
    setTeilnehmerLoading(false);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedTermin(null);
    setTeilnehmer([]);
    setDetailsError("");
  };

  const sortedTermine = [...termine].sort((a, b) => {
    if (sortBy === "datum") {
      return new Date(a.datum).getTime() - new Date(b.datum).getTime();
    }
    return a.titel.localeCompare(b.titel, "de", { sensitivity: "base" });
  });

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" mb={2}>Termin-Archiv</Typography>
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <FormControl size="small">
          <InputLabel id="sort-label">Sortieren nach</InputLabel>
          <Select
            labelId="sort-label"
            value={sortBy}
            label="Sortieren nach"
            onChange={e => setSortBy(e.target.value as "datum" | "titel")}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="datum">Datum</MenuItem>
            <MenuItem value="titel">Alphabetisch</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Titel</TableCell>
              <TableCell>Datum</TableCell>
              <TableCell>Beginn</TableCell>
              <TableCell>Ende</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Löschen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTermine.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.titel}</TableCell>
                <TableCell>{new Date(t.datum).toLocaleDateString("de-DE")}</TableCell>
                <TableCell>{t.beginn}</TableCell>
                <TableCell>{t.ende}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleShowDetails(t)}>
                    <InfoIcon />
                  </IconButton>
                </TableCell>
                <TableCell>
                  <IconButton color="error" onClick={() => handleDelete(t.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSnackOpen(false)}>
          Termin wurde gelöscht!
        </Alert>
      </Snackbar>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Dialog open={detailsOpen} onClose={handleCloseDetails}>
        <DialogTitle>Termin-Details</DialogTitle>
        <DialogContent sx={{ minWidth: 350 }}>
          {selectedTermin && (
            <>
              <Typography>
                <b>Titel:</b> {selectedTermin.titel}
              </Typography>
              <Typography>
                <b>Beschreibung:</b> {selectedTermin.beschreibung || "-"}
              </Typography>
              <Typography>
                <b>Datum:</b> {new Date(selectedTermin.datum).toLocaleDateString("de-DE")}
              </Typography>
              <Typography>
                <b>Beginn:</b> {selectedTermin.beginn}
              </Typography>
              <Typography>
                <b>Ende:</b> {selectedTermin.ende}
              </Typography>
              <Typography>
                <b>Plätze:</b> {selectedTermin.anzahl}
              </Typography>
              <Typography>
                <b>Stichtag:</b> {selectedTermin.stichtag ? new Date(selectedTermin.stichtag).toLocaleDateString("de-DE") : "-"}
              </Typography>
              <Typography>
                <b>Ansprechpartner:</b> {selectedTermin.ansprechpartner_name} {selectedTermin.ansprechpartner_mail && `(${selectedTermin.ansprechpartner_mail})`}
              </Typography>
              <Typography>
                <b>Score:</b> {selectedTermin.score}
              </Typography>
              <Typography sx={{ mt: 2, mb: 1 }}>
                <b>Teilnehmer:</b>
              </Typography>
              {teilnehmerLoading ? (
                <CircularProgress size={24} />
              ) : detailsError ? (
                <Alert severity="error">{detailsError}</Alert>
              ) : teilnehmer.length === 0 ? (
                <Typography>Keine Teilnehmer eingetragen.</Typography>
              ) : (
                <List dense>
                  {teilnehmer.map(u => (
                    <ListItem key={u.username}>
                      <ListItemText
                        primary={u.username}
                        secondary={u.email ? `E-Mail: ${u.email} | Score: ${u.score}` : undefined}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TerminArchiv;