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
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Popover
} from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { de } from "date-fns/locale";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import AddIcon from "@mui/icons-material/Add";
import api from "../api/api";
import type { SelectChangeEvent } from "@mui/material/Select";

type TerminKategorie = "Schiedsrichter" | "Grillen" | "Sonstiges";

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
  kategorie: "Sonstiges"
};

const kategorien: TerminKategorie[] = ["Schiedsrichter", "Grillen", "Sonstiges"];

const TermineAdmin: React.FC = () => {
  const [termine, setTermine] = useState<Termin[]>([]);
  const [form, setForm] = useState<Omit<Termin, "id" | "teilnehmer">>(initialTerminState);
  const [editTermin, setEditTermin] = useState<Termin | null>(null);
  const [message, setMessage] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [userPopover, setUserPopover] = useState<{ anchorEl: HTMLElement | null, terminId: number | null }>({ anchorEl: null, terminId: null });
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>("");

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
      if (err) console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get<User[]>("/users");
      setUsers(res.data);
    } catch (err) {
      setUsers([]);
      setMessage("Fehler beim Laden der User.");
      if (err) console.error(err);
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

  const handleKategorieChange = (e: SelectChangeEvent) => {
    setForm(prev => ({
      ...prev,
      kategorie: e.target.value as TerminKategorie
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
      if (err) console.error(err);
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
      anzahl: termin.anzahl ?? undefined,
      kategorie: termin.kategorie ?? "Sonstiges"
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
      if (err) console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/termine/${id}`);
      setMessage("Termin gelöscht");
      fetchTermine();
    } catch (err) {
      setMessage("Fehler beim Löschen!");
      if (err) console.error(err);
    }
  };

  // User-Popover für Hinzufügen öffnen/schließen
  const handleOpenUserPopover = (event: React.MouseEvent<HTMLElement>, terminId: number) => {
    setUserPopover({ anchorEl: event.currentTarget, terminId });
    setSelectedUserToAdd("");
  };

  const handleCloseUserPopover = () => {
    setUserPopover({ anchorEl: null, terminId: null });
    setSelectedUserToAdd("");
  };

  const handleAddUserToTermin = async () => {
    if (!userPopover.terminId || !selectedUserToAdd) return;
    try {
      await api.post(`/termine/${userPopover.terminId}/teilnehmen`, { username: selectedUserToAdd });
      setMessage(`User ${selectedUserToAdd} zum Termin hinzugefügt!`);
      setSelectedUserToAdd("");
      handleCloseUserPopover();
      fetchTermine();
    } catch (err) {
      setMessage("Fehler beim Hinzufügen des Users zum Termin!");
      if (err) console.error(err);
    }
  };

  const handleRemoveUserFromTermin = async (terminId: number, username: string) => {
    try {
      await api.delete(`/termine/${terminId}/teilnehmer/${username}`);
      setMessage(`User ${username} vom Termin entfernt!`);
      fetchTermine();
    } catch (err) {
      setMessage("Fehler beim Entfernen des Users vom Termin!");
      if (err) console.error(err);
    }
  };

  const aktuelleTermine = termine.filter(t => {
    const dateOnly = t.datum.slice(0, 10);
    const ende = t.ende && /^\d{2}:\d{2}$/.test(t.ende) ? t.ende : "10:00";
    const endDate = new Date(`${dateOnly}T${ende}`);
    return endDate >= new Date();
  });

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" mb={2}>Terminverwaltung</Typography>
      {message && <Alert severity={message.includes("Fehler") ? "error" : "success"} sx={{ mb: 2 }}>{message}</Alert>}
      <Typography mb={1}>{editTermin ? "Termin bearbeiten:" : "Neuen Termin anlegen:"}</Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
        <Box mb={2} display="flex" flexWrap="wrap" gap={1}>
          <TextField label="Titel" name="titel" value={form.titel} onChange={handleChange} size="small" />
          <TextField label="Beschreibung" name="beschreibung" value={form.beschreibung} onChange={handleChange} size="small" />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="kategorie-label">Kategorie</InputLabel>
            <Select
              labelId="kategorie-label"
              name="kategorie"
              label="Kategorie"
              value={form.kategorie ?? "Sonstiges"}
              onChange={handleKategorieChange}
            >
              {kategorien.map(kat => (
                <MenuItem key={kat} value={kat}>{kat}</MenuItem>
              ))}
            </Select>
          </FormControl>
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
        {aktuelleTermine.map(termin => (
          <ListItem key={termin.id}
            secondaryAction={
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(termin)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(termin.id)}>
                  <DeleteIcon />
                </IconButton>
                <IconButton edge="end" aria-label="add-user" onClick={(e) => handleOpenUserPopover(e, termin.id)}>
                  <AddIcon />
                </IconButton>
              </>
            }>
            <ListItemText
              primary={`${termin.titel} (${termin.datum})`}
              secondary={
                <>
                  <span><b>Kategorie:</b> {termin.kategorie ?? "Sonstiges"} | </span>
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
          </ListItem>
        ))}
      </List>

      {/* Popover für User-Hinzufügen */}
      <Popover
        open={!!userPopover.anchorEl}
        anchorEl={userPopover.anchorEl}
        onClose={handleCloseUserPopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, minWidth: 220 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>User hinzufügen</Typography>
          <FormControl fullWidth size="small">
            <InputLabel id="add-user-label">User</InputLabel>
            <Select
              labelId="add-user-label"
              value={selectedUserToAdd}
              label="User"
              onChange={e => setSelectedUserToAdd(e.target.value)}
            >
              {users.map(u => (
                <MenuItem key={u.username} value={u.username}>{u.username}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="contained" size="small" onClick={handleAddUserToTermin} disabled={!selectedUserToAdd}>
              Hinzufügen
            </Button>
            <Button variant="outlined" size="small" onClick={handleCloseUserPopover}>
              Abbrechen
            </Button>
          </Box>
        </Box>
      </Popover>
    </Paper>
  );
};

export default TermineAdmin;