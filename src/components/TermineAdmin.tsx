import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Box,
  Alert,
  Divider,
  IconButton,
  FormControlLabel,
  Checkbox
} from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { de } from "date-fns/locale";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import api from "../api/api";

// Debug-Hinweis: State & Props anzeigen, damit du Fehler sofort erkennst

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
};

type User = {
  username: string;
  email: string;
  role: string;
  score: number;
};

const initialTerminState: Omit<Termin, "id" | "teilnehmer"> = {
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
};

const TermineAdminDebug: React.FC = () => {
  const [termine, setTermine] = useState<Termin[]>([]);
  const [form, setForm] = useState<Omit<Termin, "id" | "teilnehmer">>(initialTerminState);
  const [editTermin, setEditTermin] = useState<Termin | null>(null);
  const [message, setMessage] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");

  useEffect(() => {
    fetchTermine();
    fetchUsers();
  }, []);

  const fetchTermine = async () => {
    try {
      const res = await api.get<Termin[]>("/termine");
      setTermine(res.data);
    } catch (err) {
      setTermine([]);
      setMessage("Fehler beim Laden der Termine.");
      if (err) console.error("Termine-Fehler:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get<User[]>("/users");
      setUsers(res.data);
    } catch (err) {
      setUsers([]);
      setMessage("Fehler beim Laden der User.");
      if (err) console.error("User-Fehler:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const parseTime = (value?: string): Date | null => {
    if (!value) return null;
    const [hour, minute] = value.split(":");
    const d = new Date();
    d.setHours(Number(hour));
    d.setMinutes(Number(minute));
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
  };

  const formatTime = (date: Date | null): string => {
    if (!date) return "";
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const handleCreate = async () => {
    try {
      await api.post("/termine", form);
      setMessage("Termin erfolgreich angelegt!");
      setForm(initialTerminState);
      fetchTermine();
    } catch (err) {
      setMessage("Fehler beim Anlegen!");
      if (err) console.error("Create-Fehler:", err);
    }
  };

  const handleEdit = (termin: Termin) => {
    setEditTermin(termin);
    setForm({
      ...termin,
      beginn: termin.beginn ?? "",
      ende: termin.ende ?? "",
      stichtag: termin.stichtag ?? "",
      beschreibung: termin.beschreibung ?? "",
      ansprechpartner_name: termin.ansprechpartner_name ?? "",
      ansprechpartner_mail: termin.ansprechpartner_mail ?? "",
      score: termin.score ?? 0,
      stichtagsmail_senden: termin.stichtagsmail_senden ?? false,
      zufallsauswahl: termin.zufallsauswahl ?? false,
      anzahl: termin.anzahl ?? undefined
    });
  };

  const handleUpdate = async () => {
    if (!editTermin) return;
    try {
      await api.put(`/termine/${editTermin.id}`, form);
      setMessage("Termin erfolgreich bearbeitet!");
      setEditTermin(null);
      setForm(initialTerminState);
      fetchTermine();
    } catch (err) {
      setMessage("Fehler beim Bearbeiten!");
      if (err) console.error("Update-Fehler:", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/termine/${id}`);
      setMessage("Termin gelöscht");
      fetchTermine();
    } catch (err) {
      setMessage("Fehler beim Löschen!");
      if (err) console.error("Delete-Fehler:", err);
    }
  };

  const handleAddUserToTermin = async () => {
    if (!editTermin || !selectedUser) return;
    try {
      await api.post(`/termine/${editTermin.id}/teilnehmen`, { username: selectedUser });
      setMessage(`User ${selectedUser} zum Termin hinzugefügt!`);
      setSelectedUser("");
      fetchTermine();
    } catch (err) {
      setMessage("Fehler beim Hinzufügen des Users zum Termin!");
      if (err) console.error("AddUser-Fehler:", err);
    }
  };

  const handleRemoveUserFromTermin = async (terminId: number, username: string) => {
    try {
      await api.delete(`/termine/${terminId}/teilnehmer/${username}`);
      setMessage(`User ${username} vom Termin entfernt!`);
      fetchTermine();
    } catch (err) {
      setMessage("Fehler beim Entfernen des Users vom Termin!");
      if (err) console.error("RemoveUser-Fehler:", err);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" mb={2}>Terminverwaltung (DEBUG-Version)</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>DEBUG: Wenn du hier keinen Fehler siehst, ist das File korrekt eingebunden!</Alert>
      {message && <Alert severity={message.includes("Fehler") ? "error" : "success"} sx={{ mb: 2 }}>{message}</Alert>}
      <Typography mb={1}>{editTermin ? "Termin bearbeiten:" : "Neuen Termin anlegen:"}</Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
        <Box mb={2} display="flex" flexWrap="wrap" gap={1}>
          <TextField label="Titel" name="titel" value={form.titel} onChange={handleChange} size="small" />
          <TextField label="Beschreibung" name="beschreibung" value={form.beschreibung} onChange={handleChange} size="small" />
          <TextField label="Datum" name="datum" type="date" value={form.datum} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} />
          <TimePicker
            label="Beginn"
            value={parseTime(form.beginn)}
            onChange={value => setForm(prev => ({
              ...prev,
              beginn: formatTime(value as Date)
            }))}
            ampm={false}
            slotProps={{
              textField: { size: "small" }
            }}
          />
          <TimePicker
            label="Ende"
            value={parseTime(form.ende)}
            onChange={value => setForm(prev => ({
              ...prev,
              ende: formatTime(value as Date)
            }))}
            ampm={false}
            slotProps={{
              textField: { size: "small" }
            }}
          />
          <TextField label="Anzahl" name="anzahl" type="number" value={form.anzahl ?? ""} onChange={handleChange} size="small" />
          <TextField label="Stichtag" name="stichtag" type="date" value={form.stichtag} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="Ansprechpartner Name" name="ansprechpartner_name" value={form.ansprechpartner_name} onChange={handleChange} size="small" />
          <TextField label="Ansprechpartner Mail" name="ansprechpartner_mail" value={form.ansprechpartner_mail} onChange={handleChange} size="small" />
          <TextField label="Score" name="score" type="number" value={form.score ?? ""} onChange={handleChange} size="small" />
          <FormControlLabel
            control={
              <Checkbox
                name="stichtagsmail_senden"
                checked={!!form.stichtagsmail_senden}
                onChange={handleCheckboxChange}
              />
            }
            label="Stichtagsmail senden"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="zufallsauswahl"
                checked={!!form.zufallsauswahl}
                onChange={handleCheckboxChange}
              />
            }
            label="Zufallsauswahl aktivieren"
          />
          {!editTermin ? (
            <Button variant="contained" onClick={handleCreate}>Anlegen</Button>
          ) : (
            <>
              <Button variant="contained" color="secondary" onClick={handleUpdate}>Speichern</Button>
              <Button variant="outlined" color="error" onClick={() => { setEditTermin(null); setForm(initialTerminState); }}>Abbrechen</Button>
            </>
          )}
        </Box>
      </LocalizationProvider>
      <Divider sx={{ my: 2 }} />
      <Typography mb={1}>Vorhandene Termine:</Typography>
      <List>
        {termine.map(termin => (
          <ListItem key={termin.id}
            secondaryAction={
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(termin)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(termin.id)}>
                  <DeleteIcon />
                </IconButton>
              </>
            }>
            <ListItemText
              primary={`${termin.titel} (${termin.datum})`}
              secondary={
                <>
                  {termin.beschreibung && <span>Beschreibung: {termin.beschreibung} | </span>}
                  {termin.beginn && <span>Beginn: {termin.beginn} | </span>}
                  {termin.ende && <span>Ende: {termin.ende} | </span>}
                  {typeof termin.anzahl === "number" && <span>Anzahl: {termin.anzahl} | </span>}
                  {termin.stichtag && <span>Stichtag: {termin.stichtag} | </span>}
                  {termin.ansprechpartner_name && <span>Ansprechpartner: {termin.ansprechpartner_name} | </span>}
                  {termin.ansprechpartner_mail && <span>Email: {termin.ansprechpartner_mail} | </span>}
                  {typeof termin.score === "number" && <span>Score: {termin.score} | </span>}
                  {typeof termin.stichtagsmail_senden !== "undefined" && <span>Stichtagsmail: {termin.stichtagsmail_senden ? "Ja" : "Nein"} | </span>}
                  {typeof termin.zufallsauswahl !== "undefined" && <span>Zufallsauswahl: {termin.zufallsauswahl ? "Ja" : "Nein"} | </span>}
                  {/* Teilnehmer anzeigen und entfernen */}
                  {termin.teilnehmer && termin.teilnehmer.length > 0 && (
                    <Box sx={{ display: "block", mt: 1 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>Teilnehmer:</Typography>
                      {termin.teilnehmer.map(tn => (
                        <Box key={tn.username} sx={{ display: "inline-flex", alignItems: "center", mr: 2 }}>
                          <span>{tn.username}</span>
                          <IconButton size="small" color="error" sx={{ ml: 0.5 }}
                            onClick={() => handleRemoveUserFromTermin(termin.id, tn.username)}>
                            <RemoveCircleIcon />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </>
              }
            />
            {editTermin && editTermin.id === termin.id && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">User zu diesem Termin hinzufügen:</Typography>
                <TextField
                  select
                  label="User"
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                  size="small"
                  sx={{ minWidth: 120, mr: 1 }}
                  SelectProps={{ native: true }}
                >
                  <option value="">Bitte wählen</option>
                  {users.map(u => (
                    <option key={u.username} value={u.username}>{u.username}</option>
                  ))}
                </TextField>
                <Button variant="outlined" onClick={handleAddUserToTermin}>Hinzufügen</Button>
              </Box>
            )}
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ bgcolor: "#f5f5f5", p: 2, mt: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" color="primary">DEBUG-Bereich:</Typography>
        <Typography variant="body2">form-Objekt:</Typography>
        <pre style={{ fontSize: "0.9em" }}>{JSON.stringify(form, null, 2)}</pre>
        <Typography variant="body2">editTermin:</Typography>
        <pre style={{ fontSize: "0.9em" }}>{JSON.stringify(editTermin, null, 2)}</pre>
        <Typography variant="body2">Termine:</Typography>
        <pre style={{ fontSize: "0.9em", maxHeight: 100, overflow: "auto" }}>{JSON.stringify(termine, null, 2)}</pre>
        <Typography variant="body2">Users:</Typography>
        <pre style={{ fontSize: "0.9em", maxHeight: 100, overflow: "auto" }}>{JSON.stringify(users, null, 2)}</pre>
      </Box>
    </Paper>
  );
};

export default TermineAdminDebug;