import React, { useEffect, useState } from "react";
import { Paper, Typography, TextField, Button, List, ListItem, ListItemText, Box, Alert, Divider, IconButton, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
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
  stichtag_mail_gesendet?: boolean;
};

type User = {
  username: string;
  email: string;
  role: string;
  score: number;
};

const initialTerminState: Omit<Termin, "id"> = {
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
  stichtag_mail_gesendet: false,
};

const TermineAdmin: React.FC = () => {
  const [termine, setTermine] = useState<Termin[]>([]);
  const [form, setForm] = useState<Omit<Termin, "id">>(initialTerminState);
  const [editTermin, setEditTermin] = useState<Termin | null>(null);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");

  const fetchTermine = async () => {
    try {
      const res = await api.get<Termin[]>("/termine");
      setTermine(res.data);
    } catch {
      setTermine([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get<User[]>("/users");
      setUsers(res.data);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchTermine();
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      stichtag_mail_gesendet: e.target.checked
    }));
  };

  const handleCreate = async () => {
    try {
      await api.post("/termine", form);
      setMessage("Termin erfolgreich angelegt!");
      setForm(initialTerminState);
      fetchTermine();
    } catch {
      setMessage("Fehler beim Anlegen!");
    }
  };

  const handleEdit = (termin: Termin) => {
    setEditTermin(termin);
    setForm(termin);
  };

  const handleUpdate = async () => {
    if (!editTermin) return;
    try {
      await api.put(`/termine/${editTermin.id}`, form);
      setMessage("Termin erfolgreich bearbeitet!");
      setEditTermin(null);
      setForm(initialTerminState);
      fetchTermine();
    } catch {
      setMessage("Fehler beim Bearbeiten!");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/termine/${id}`);
      setMessage("Termin gelöscht");
      fetchTermine();
    } catch {
      setMessage("Fehler beim Löschen!");
    }
  };

  // Admin kann User zu Termin hinzufügen
  const handleAddUserToTermin = async () => {
    if (!editTermin || !selectedUser) return;
    try {
      await api.post(`/termine/${editTermin.id}/teilnehmen`, { username: selectedUser });
      setMessage(`User ${selectedUser} zum Termin hinzugefügt!`);
      setSelectedUser("");
    } catch {
      setMessage("Fehler beim Hinzufügen des Users zum Termin!");
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" mb={2}>Terminverwaltung</Typography>
      {/* Abschnitt 1: Neuen Termin anlegen */}
      <Typography mb={1}>Neuen Termin anlegen:</Typography>
      <Box mb={2} display="flex" flexWrap="wrap" gap={1}>
        <TextField label="Titel" name="titel" value={form.titel} onChange={handleChange} size="small" />
        <TextField label="Beschreibung" name="beschreibung" value={form.beschreibung} onChange={handleChange} size="small" />
        <TextField label="Datum" name="datum" type="date" value={form.datum} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} />
        <TextField label="Beginn" name="beginn" value={form.beginn} onChange={handleChange} size="small" />
        <TextField label="Ende" name="ende" value={form.ende} onChange={handleChange} size="small" />
        <TextField label="Anzahl" name="anzahl" type="number" value={form.anzahl ?? ""} onChange={handleChange} size="small" />
        <TextField label="Stichtag" name="stichtag" type="date" value={form.stichtag} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} />
        <TextField label="Ansprechpartner Name" name="ansprechpartner_name" value={form.ansprechpartner_name} onChange={handleChange} size="small" />
        <TextField label="Ansprechpartner Mail" name="ansprechpartner_mail" value={form.ansprechpartner_mail} onChange={handleChange} size="small" />
        <TextField label="Score" name="score" type="number" value={form.score ?? ""} onChange={handleChange} size="small" />
        <label>
          <input
            type="checkbox"
            checked={!!form.stichtag_mail_gesendet}
            onChange={handleCheckboxChange}
          />
          Stichtag-Mail gesendet
        </label>
        {!editTermin ? (
          <Button variant="contained" onClick={handleCreate}>Anlegen</Button>
        ) : (
          <Button variant="contained" color="secondary" onClick={handleUpdate}>Speichern</Button>
        )}
        {editTermin && (
          <Button variant="outlined" color="error" onClick={() => {setEditTermin(null); setForm(initialTerminState);}}>Abbrechen</Button>
        )}
      </Box>
      <Divider sx={{ my: 2 }} />
      {/* Abschnitt 2: Termine bearbeiten/löschen + User zuweisen */}
      <Typography mb={1}>Vorhandene Termine bearbeiten/löschen:</Typography>
      {message && <Alert severity={message.includes("Fehler") ? "error" : "success"} sx={{mb:1}}>{message}</Alert>}
      <List>
        {termine.map(termin => (
          <ListItem key={termin.id}
            secondaryAction={
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(termin)}>
                  <Edit />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(termin.id)}>
                  <Delete />
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
                  {typeof termin.stichtag_mail_gesendet !== "undefined" && <span>Mail gesendet: {termin.stichtag_mail_gesendet ? "Ja" : "Nein"}</span>}
                </>
              }
            />
            {/* User zu Termin hinzufügen */}
            {editTermin && editTermin.id === termin.id && (
              <Box sx={{ mt: 1 }}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel id="user-select-label">User hinzufügen</InputLabel>
                  <Select
                    labelId="user-select-label"
                    value={selectedUser}
                    label="User hinzufügen"
                    onChange={e => setSelectedUser(e.target.value)}
                  >
                    {users.map(u => (
                      <MenuItem key={u.username} value={u.username}>{u.username}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="outlined" sx={{ ml: 1 }} onClick={handleAddUserToTermin}>Hinzufügen</Button>
              </Box>
            )}
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default TermineAdmin;