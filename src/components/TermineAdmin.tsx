import React, { useEffect, useMemo, useState } from "react";
import {
  Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, InputLabel, FormControl, Box, Checkbox, FormControlLabel, Snackbar, Alert
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import type { SelectChangeEvent } from "@mui/material/Select";
import api from "../api/api";
import { useUserStore } from "../store/userStore";

type TerminKategorie = "Schiedsrichter" | "Grillen" | "Sonstiges";
const kategorien: TerminKategorie[] = ["Schiedsrichter", "Grillen", "Sonstiges"];

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
  stichtagsmail_senden?: boolean;
  zufallsauswahl?: boolean;
  teilnehmer?: { username: string }[];
  kategorie?: TerminKategorie;
};

type User = {
  username: string;
  email: string;
  role?: string;
  score?: number;
};

const initialTermin: Omit<Termin, "id" | "teilnehmer"> = {
  titel: "",
  beschreibung: "",
  datum: "",
  beginn: "",
  ende: "",
  anzahl: undefined,
  stichtag: "",
  ansprechpartner_name: "",
  ansprechpartner_mail: "",
  score: 0,
  stichtagsmail_senden: false,
  zufallsauswahl: false,
  kategorie: "Sonstiges"
};

const TerminAdmin: React.FC = () => {
  const { user } = useUserStore();
  const isAdmin = user?.role === "admin";
  const canExport = user?.role === "admin" || user?.role === "organisator";
  const [termine, setTermine] = useState<Termin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTermin, setSelectedTermin] = useState<Termin | null>(null);
  const [editForm, setEditForm] = useState<Omit<Termin, "id" | "teilnehmer">>(initialTermin);
  const [editOpen, setEditOpen] = useState(false);
  const [snack, setSnack] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [zufallOpen, setZufallOpen] = useState(false);
  const [zufallTermin, setZufallTermin] = useState<Termin | null>(null);
  const [zufallSelected, setZufallSelected] = useState<string[]>([]);
  const [zufallLoading, setZufallLoading] = useState(false);
  const [zufallResult, setZufallResult] = useState<{ zugeordnet: string[]; uebersprungen: string[]; fehlend: number } | null>(null);
  const [exportKategorie, setExportKategorie] = useState<"Alle" | TerminKategorie>("Alle");
  const [exportVon, setExportVon] = useState<string>("");
  const [exportBis, setExportBis] = useState<string>("");
  const exportDateInvalid = !!exportVon && !!exportBis && exportVon > exportBis;

  const eligibleUsers = useMemo(
    () => users.filter(u => u.role !== "admin"),
    [users]
  );

  useEffect(() => {
    fetchTermine();
    fetchUsers();
  }, []);

  const fetchTermine = async () => {
    const res = await api.get<Termin[]>("/termine");
    // Nur Termine in der Zukunft anzeigen!
    const heute = new Date();
    heute.setHours(0,0,0,0);
    setTermine(
      res.data.filter(t => new Date(t.datum).setHours(0,0,0,0) >= heute.getTime())
    );
  };
  const fetchUsers = async () => {
    const res = await api.get<User[]>("/users");
    setUsers(res.data);
  };

  const getAutoSelected = (list: User[]) => {
    const sorted = [...list].sort((a, b) => {
      const scoreA = a.score ?? 0;
      const scoreB = b.score ?? 0;
      if (scoreA !== scoreB) return scoreA - scoreB;
      return a.username.localeCompare(b.username);
    });
    if (sorted.length === 0) return [];
    const minScore = sorted[0].score ?? 0;
    return sorted.filter(u => (u.score ?? 0) === minScore).map(u => u.username);
  };

  const handleZufallOpen = async (termin: Termin) => {
    setZufallTermin(termin);
    setZufallOpen(true);
    setZufallResult(null);
    if (!isAdmin) return;
    setZufallLoading(true);
    try {
      const res = await api.get<{ usernames: string[] }>(`/termine/${termin.id}/zufallspool`);
      if (res.data.usernames && res.data.usernames.length > 0) {
        setZufallSelected(res.data.usernames);
      } else {
        setZufallSelected(getAutoSelected(eligibleUsers));
      }
    } catch {
      setZufallSelected(getAutoSelected(eligibleUsers));
    } finally {
      setZufallLoading(false);
    }
  };

  const handleZufallClose = () => {
    setZufallOpen(false);
    setZufallTermin(null);
    setZufallSelected([]);
    setZufallResult(null);
  };

  const toggleZufallUser = (username: string) => {
    setZufallSelected(prev =>
      prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
    );
  };

  const applyAutoSelection = () => {
    setZufallSelected(getAutoSelected(eligibleUsers));
  };

  const handleZufallSave = async () => {
    if (!zufallTermin) return;
    await api.put(`/termine/${zufallTermin.id}/zufallspool`, { usernames: zufallSelected });
    setSnack("Zufallsauswahl-Pool gespeichert!");
    handleZufallClose();
  };

  const handleExportExcel = async () => {
    if (exportDateInvalid) {
      setSnack("Bitte gültigen Zeitraum wählen (Von ≤ Bis).");
      return;
    }
    const params: Record<string, string> = {};
    if (exportKategorie !== "Alle") params.kategorie = exportKategorie;
    if (exportVon) params.von = exportVon;
    if (exportBis) params.bis = exportBis;
    const res = await api.get("/termine/export/excel", { responseType: "blob", params });
    const blobUrl = window.URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = blobUrl;
    const today = new Date().toISOString().split("T")[0];
    const suffix = exportKategorie === "Alle" ? "" : `_${exportKategorie.toLowerCase()}`;
    const dateSuffix = `${exportVon ? `_von-${exportVon}` : ""}${exportBis ? `_bis-${exportBis}` : ""}`;
    link.download = `termine_export${suffix}${dateSuffix}_${today}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  const handleZufallStart = async () => {
    if (!zufallTermin) return;
    if (zufallSelected.length === 0) {
      setSnack("Bitte mindestens eine Person auswählen.");
      return;
    }
    setZufallLoading(true);
    try {
      const res = await api.post<{ zugeordnet: string[]; uebersprungen: string[]; fehlend?: number }>(`/termine/${zufallTermin.id}/zufallsauswahl/start`, {
        usernames: zufallSelected
      });
      setZufallResult({
        zugeordnet: res.data.zugeordnet || [],
        uebersprungen: res.data.uebersprungen || [],
        fehlend: res.data.fehlend ?? 0
      });
      setSnack("Zufallsauswahl gestartet!");
      fetchTermine();
    } finally {
      setZufallLoading(false);
    }
  };

  // Bearbeiten Dialog öffnen
  const handleEditOpen = (termin: Termin) => {
    setSelectedTermin(termin);
    setEditForm({
      titel: termin.titel ?? "",
      beschreibung: termin.beschreibung ?? "",
      datum: termin.datum ?? "",
      beginn: termin.beginn ?? "",
      ende: termin.ende ?? "",
      anzahl: termin.anzahl ?? undefined,
      stichtag: termin.stichtag ?? "",
      ansprechpartner_name: termin.ansprechpartner_name ?? "",
      ansprechpartner_mail: termin.ansprechpartner_mail ?? "",
      score: termin.score ?? 0,
      stichtagsmail_senden: termin.stichtagsmail_senden ?? false,
      zufallsauswahl: termin.zufallsauswahl ?? false,
      kategorie: termin.kategorie ?? "Sonstiges"
    });
    setEditOpen(true);
    setSelectedUser("");
  };

  // Neu-Dialog öffnen (+ Button)
  const handleAddTerminOpen = () => {
    setSelectedTermin(null);
    setEditForm(initialTermin);
    setEditOpen(true);
    setSelectedUser("");
  };

  // Bearbeiten/Neu-Dialog schließen
  const handleEditClose = () => {
    setEditOpen(false);
    setSelectedTermin(null);
    setEditForm(initialTermin);
    setSelectedUser("");
  };

  // Termin speichern (neu oder bearbeiten)
  const handleEditSave = async () => {
    if (selectedTermin) {
      // Bestehenden Termin bearbeiten
      await api.put(`/termine/${selectedTermin.id}`, editForm);
      setSnack("Termin gespeichert!");
    } else {
      // Neuen Termin anlegen!
      await api.post("/termine", editForm);
      setSnack("Neuer Termin angelegt!");
    }
    setEditOpen(false);
    fetchTermine();
  };

  // Teilnehmer hinzufügen
  const handleAddUser = async () => {
    if (!selectedTermin || !selectedUser) return;
    await api.post(`/termine/${selectedTermin.id}/teilnehmen`, { username: selectedUser });
    setSnack(`User ${selectedUser} hinzugefügt`);
    await fetchTermine();
    // Aktualisiere selectedTermin mit neuen Daten
    const updatedTermine = await api.get<Termin[]>("/termine");
    const updatedTermin = updatedTermine.data.find(t => t.id === selectedTermin.id);
    if (updatedTermin) {
      setSelectedTermin(updatedTermin);
    }
    setSelectedUser("");
  };

  // Teilnehmer entfernen
  const handleRemoveUser = async (username: string) => {
    if (!selectedTermin) return;
    await api.delete(`/termine/${selectedTermin.id}/teilnehmer/${username}`);
    setSnack(`User ${username} entfernt`);
    await fetchTermine();
    // Aktualisiere selectedTermin mit neuen Daten
    const updatedTermine = await api.get<Termin[]>("/termine");
    const updatedTermin = updatedTermine.data.find(t => t.id === selectedTermin.id);
    if (updatedTermin) {
      setSelectedTermin(updatedTermin);
    }
  };

  // Termin löschen
  const handleDelete = async (id: number) => {
    await api.delete(`/termine/${id}`);
    setSnack("Termin gelöscht!");
    fetchTermine();
  };

  // Typisiert für Input-Felder!
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value
    }));
  };
  // Typisiert für MUI Select!
  const handleSelectChange = (e: SelectChangeEvent) => {
    setEditForm(prev => ({
      ...prev,
      kategorie: e.target.value as TerminKategorie
    }));
  };
  // Typisiert für Checkbox!
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm(prev => ({
      ...prev,
      [e.target.name]: e.target.checked
    }));
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" mb={2}>Termine Verwaltung</Typography>
      {/* Neuen Termin anlegen Button */}
      <Button
        variant="contained"
        color="success"
        sx={{ mb: 2 }}
        startIcon={<AddCircleIcon />}
        onClick={handleAddTerminOpen}
      >
        Neuen Termin anlegen
      </Button>
      {canExport && (
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, mb: 2, ml: 2, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="export-kategorie-label">Termintyp</InputLabel>
            <Select
              labelId="export-kategorie-label"
              value={exportKategorie}
              label="Termintyp"
              onChange={(e: SelectChangeEvent) => setExportKategorie(e.target.value as "Alle" | TerminKategorie)}
            >
              <MenuItem value="Alle">Alle</MenuItem>
              {kategorien.map(kat => (
                <MenuItem key={kat} value={kat}>{kat}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="date"
            label="Von"
            value={exportVon}
            onChange={(e) => setExportVon(e.target.value)}
            InputLabelProps={{ shrink: true }}
            error={exportDateInvalid}
          />
          <TextField
            size="small"
            type="date"
            label="Bis"
            value={exportBis}
            onChange={(e) => setExportBis(e.target.value)}
            InputLabelProps={{ shrink: true }}
            error={exportDateInvalid}
            helperText={exportDateInvalid ? "Von darf nicht nach Bis liegen" : ""}
          />
          <Button
            variant="outlined"
            onClick={handleExportExcel}
            disabled={exportDateInvalid}
          >
            Excel-Export
          </Button>
        </Box>
      )}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Titel</TableCell>
              <TableCell>Datum</TableCell>
              <TableCell>Beginn</TableCell>
              <TableCell>Ende</TableCell>
              <TableCell>Kategorie</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Teilnehmer</TableCell>
              {isAdmin && <TableCell>Zufallsauswahl</TableCell>}
              <TableCell>Bearbeiten</TableCell>
              <TableCell>Löschen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {termine.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.titel}</TableCell>
                <TableCell>{t.datum}</TableCell>
                <TableCell>{t.beginn}</TableCell>
                <TableCell>{t.ende}</TableCell>
                <TableCell>{t.kategorie}</TableCell>
                <TableCell>{t.score}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {t.teilnehmer && t.teilnehmer.length > 0
                      ? t.teilnehmer.map(tn => (
                          <Box key={tn.username} sx={{ display: "flex", alignItems: "center", mr: 1 }}>
                            <span>{tn.username}</span>
                          </Box>
                        ))
                      : <span style={{ color: "#aaa" }}>Keine Teilnehmer</span>
                    }
                  </Box>
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleZufallOpen(t)}
                    >
                      Zufallsauswahl
                    </Button>
                  </TableCell>
                )}
                <TableCell>
                  <IconButton color="primary" onClick={() => handleEditOpen(t)}>
                    <EditIcon />
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

      {/* Edit/Neu Dialog */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle>{selectedTermin ? "Termin bearbeiten" : "Neuen Termin anlegen"}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
            <TextField label="Titel" name="titel" value={editForm.titel} onChange={handleFormChange} size="small" />
            <TextField label="Beschreibung" name="beschreibung" value={editForm.beschreibung} onChange={handleFormChange} size="small" />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="kategorie-label">Kategorie</InputLabel>
              <Select labelId="kategorie-label" name="kategorie" value={editForm.kategorie} onChange={handleSelectChange} label="Kategorie">
                {kategorien.map(kat => (
                  <MenuItem key={kat} value={kat}>{kat}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Datum" name="datum" type="date" value={editForm.datum} onChange={handleFormChange} size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Beginn" name="beginn" type="time" value={editForm.beginn} onChange={handleFormChange} size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Ende" name="ende" type="time" value={editForm.ende} onChange={handleFormChange} size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Anzahl" name="anzahl" type="number" value={editForm.anzahl ?? ""} onChange={handleFormChange} size="small" />
            <TextField label="Stichtag" name="stichtag" type="date" value={editForm.stichtag} onChange={handleFormChange} size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Ansprechpartner Name" name="ansprechpartner_name" value={editForm.ansprechpartner_name} onChange={handleFormChange} size="small" />
            <TextField label="Ansprechpartner Mail" name="ansprechpartner_mail" value={editForm.ansprechpartner_mail} onChange={handleFormChange} size="small" />
            <TextField label="Score" name="score" type="number" value={editForm.score ?? ""} onChange={handleFormChange} size="small" />
            <FormControlLabel
              control={
                <Checkbox
                  name="stichtagsmail_senden"
                  checked={!!editForm.stichtagsmail_senden}
                  onChange={handleCheckboxChange}
                />
              }
              label="Stichtagsmail senden"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="zufallsauswahl"
                  checked={!!editForm.zufallsauswahl}
                  onChange={handleCheckboxChange}
                />
              }
              label="Zufallsauswahl aktivieren"
            />
          </Box>
          {/* Teilnehmer-Verwaltung nur beim Bearbeiten */}
          {selectedTermin && (
            <Box mt={4}>
              <Typography variant="subtitle2" mb={1}>Teilnehmer:</Typography>
              <Box display="flex" gap={2} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="add-user-label">User hinzufügen</InputLabel>
                  <Select
                    labelId="add-user-label"
                    value={selectedUser}
                    label="User hinzufügen"
                    onChange={(e: SelectChangeEvent) => setSelectedUser(e.target.value)}
                  >
                    {users.map(u => (
                      <MenuItem key={u.username} value={u.username}>{u.username}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" size="small" startIcon={<AddCircleIcon />} onClick={handleAddUser} disabled={!selectedUser}>
                  Hinzufügen
                </Button>
              </Box>
              <Box mt={2} sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {selectedTermin?.teilnehmer?.map(tn => (
                  <Box key={tn.username} sx={{ display: "inline-flex", alignItems: "center", mr: 2 }}>
                    <span>{tn.username}</span>
                    <IconButton size="small" color="error" sx={{ ml: 0.5 }}
                      onClick={() => handleRemoveUser(tn.username)}>
                      <RemoveCircleIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} color="error">Abbrechen</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            {selectedTermin ? "Speichern" : "Anlegen"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Zufallsauswahl Dialog (Admin) */}
      <Dialog open={zufallOpen} onClose={handleZufallClose} maxWidth="sm" fullWidth>
        <DialogTitle>Zufallsauswahl</DialogTitle>
        <DialogContent>
          {zufallTermin && (
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Typography variant="subtitle2">
                Termin: {zufallTermin.titel}
              </Typography>
              <Box display="flex" gap={1} alignItems="center">
                <Button variant="outlined" size="small" onClick={applyAutoSelection} disabled={zufallLoading}>
                  Auto-Auswahl nach Score
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {zufallSelected.length} ausgewählt
                </Typography>
              </Box>
              <Box sx={{ maxHeight: 320, overflow: "auto", border: "1px solid #eee", borderRadius: 1, p: 1 }}>
                {eligibleUsers.length === 0 && (
                  <Typography variant="body2" color="text.secondary">Keine verfügbaren User</Typography>
                )}
                {eligibleUsers
                  .slice()
                  .sort((a, b) => {
                    const scoreA = a.score ?? 0;
                    const scoreB = b.score ?? 0;
                    if (scoreA !== scoreB) return scoreA - scoreB;
                    return a.username.localeCompare(b.username);
                  })
                  .map(u => (
                    <FormControlLabel
                      key={u.username}
                      control={
                        <Checkbox
                          checked={zufallSelected.includes(u.username)}
                          onChange={() => toggleZufallUser(u.username)}
                        />
                      }
                      label={`${u.username} (Score: ${u.score ?? 0})`}
                    />
                  ))}
              </Box>
              {zufallResult && (
                <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, p: 1 }}>
                  <Typography variant="subtitle2" mb={1}>Ergebnis</Typography>
                  <Typography variant="body2"><b>Zugeordnet:</b> {zufallResult.zugeordnet.length > 0 ? zufallResult.zugeordnet.join(", ") : "-"}</Typography>
                  <Typography variant="body2"><b>Übersprungen:</b> {zufallResult.uebersprungen.length > 0 ? zufallResult.uebersprungen.join(", ") : "-"}</Typography>
                  <Typography variant="body2"><b>Fehlend:</b> {zufallResult.fehlend}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleZufallClose} color="error">Abbrechen</Button>
          <Button onClick={handleZufallStart} variant="contained" color="secondary" disabled={zufallLoading}>
            Starten
          </Button>
          <Button onClick={handleZufallSave} variant="contained" color="primary" disabled={zufallLoading}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSnack("")}>{snack}</Alert>
      </Snackbar>
    </Paper>
  );
};

export default TerminAdmin;