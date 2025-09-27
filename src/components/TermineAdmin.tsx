import React, { useEffect, useState } from "react";
import { Paper, Typography, TextField, Button, List, ListItem, ListItemText, Box, Alert, Divider } from "@mui/material";
import api from "../api/api";

type Termin = {
  id: number;
  titel: string;
  beschreibung?: string;
  datum: string;
};

const TermineAdmin: React.FC = () => {
  const [termine, setTermine] = useState<Termin[]>([]);
  const [titel, setTitel] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [datum, setDatum] = useState("");
  const [message, setMessage] = useState("");

  const fetchTermine = async () => {
    try {
      const res = await api.get<Termin[]>("/termine");
      setTermine(res.data);
    } catch {
      setTermine([]);
    }
  };

  useEffect(() => {
    fetchTermine();
  }, []);

  const handleCreate = async () => {
    try {
      await api.post("/termine", { titel, beschreibung, datum });
      setMessage("Termin erfolgreich angelegt!");
      setTitel(""); setBeschreibung(""); setDatum("");
      fetchTermine();
    } catch {
      setMessage("Fehler beim Anlegen!");
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" mb={2}>Terminverwaltung</Typography>
      <Box mb={2} display="flex" flexWrap="wrap" gap={1}>
        <TextField label="Titel" value={titel} onChange={e => setTitel(e.target.value)} size="small" />
        <TextField label="Beschreibung" value={beschreibung} onChange={e => setBeschreibung(e.target.value)} size="small" />
        <TextField
          label="Datum"
          type="date"
          value={datum}
          onChange={e => setDatum(e.target.value)}
          size="small"
          sx={{ width: 170 }}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={handleCreate}>Anlegen</Button>
      </Box>
      {message && <Alert severity={message.includes("Fehler") ? "error" : "success"}>{message}</Alert>}
      <Divider sx={{ my: 2 }} />
      <List>
        {termine.map(termin => (
          <ListItem key={termin.id}>
            <ListItemText 
              primary={`${termin.titel} (${termin.datum})`} 
              secondary={termin.beschreibung} 
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default TermineAdmin;