import React, { useEffect, useState } from "react";
import { Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Select, MenuItem, FormControl, InputLabel, IconButton, Stack } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../api/api";

type Produkt = { id: number; name: string; preis: number | string; kategorie: string };

const kategorien = [
  { value: "Alkoholfrei", label: "Alkoholfreie Getränke" },
  { value: "Alkoholisch", label: "Alkoholische Getränke" }
];

const Preisliste: React.FC = () => {
  const [produkte, setProdukte] = useState<Produkt[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<null | number>(null); // Produkt-ID oder null
  const [form, setForm] = useState({ name: "", preis: 0, kategorie: kategorien[0].value });
  const [snack, setSnack] = useState("");

  useEffect(() => {
    fetchProdukte();
  }, []);

  const fetchProdukte = async () => {
    const res = await api.get<Produkt[]>("/kiosk/preisliste");
    setProdukte(res.data.map(p => ({
      ...p,
      preis: typeof p.preis === "string" ? parseFloat(p.preis) : p.preis
    })));
  };

  const handleAddProdukt = async () => {
    await api.post("/kiosk/preisliste", form);
    setEditOpen(false);
    setForm({ name: "", preis: 0, kategorie: kategorien[0].value });
    setEditMode(null);
    setSnack("Produkt hinzugefügt!");
    fetchProdukte();
  };

  const handleEditProdukt = (p: Produkt) => {
    setEditMode(p.id);
    setForm({
      name: p.name,
      preis: typeof p.preis === "number" ? p.preis : parseFloat(p.preis),
      kategorie: p.kategorie
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editMode === null) return;
    await api.put(`/kiosk/preisliste/${editMode}`, form);
    setEditOpen(false);
    setForm({ name: "", preis: 0, kategorie: kategorien[0].value });
    setEditMode(null);
    setSnack("Produkt geändert!");
    fetchProdukte();
  };

  const handleDeleteProdukt = async (id: number) => {
    await api.delete(`/kiosk/preisliste/${id}`);
    setSnack("Produkt gelöscht!");
    fetchProdukte();
  };

  return (
    <>
      <Button variant="contained" onClick={() => { setEditOpen(true); setEditMode(null); setForm({ name: "", preis: 0, kategorie: kategorien[0].value }); }} sx={{ mb: 2 }}>
        Produkt hinzufügen
      </Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Preis (€)</TableCell>
            <TableCell>Kategorie</TableCell>
            <TableCell align="right">Aktionen</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {produkte.map(p => (
            <TableRow key={p.id}>
              <TableCell>{p.name}</TableCell>
              <TableCell>{typeof p.preis === "number" ? p.preis.toFixed(2) : p.preis}</TableCell>
              <TableCell>{kategorien.find(k => k.value === p.kategorie)?.label || p.kategorie}</TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <IconButton size="small" color="primary" onClick={() => handleEditProdukt(p)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteProdukt(p.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>{editMode === null ? "Produkt hinzufügen" : "Produkt bearbeiten"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Preis"
            type="number"
            fullWidth
            value={form.preis}
            onChange={e => setForm(f => ({ ...f, preis: parseFloat(e.target.value) || 0 }))}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="kategorie-label">Kategorie</InputLabel>
            <Select
              labelId="kategorie-label"
              label="Kategorie"
              value={form.kategorie}
              onChange={e => setForm(f => ({ ...f, kategorie: e.target.value as string }))}
            >
              {kategorien.map(k => (
                <MenuItem key={k.value} value={k.value}>{k.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={editMode === null ? handleAddProdukt : handleSaveEdit}>
            {editMode === null ? "Speichern" : "Änderungen speichern"}
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
    </>
  );
};

export default Preisliste;