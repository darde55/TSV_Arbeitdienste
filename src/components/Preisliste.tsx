import React, { useEffect, useState } from "react";
import { Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert } from "@mui/material";
import api from "../api/api";


type Produkt = { id: number; name: string; preis: number };

const Preisliste: React.FC = () => {
  const [produkte, setProdukte] = useState<Produkt[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", preis: 0 });
  const [snack, setSnack] = useState("");

  useEffect(() => {
    fetchProdukte();
  }, []);

  const fetchProdukte = async () => {
    const res = await api.get<Produkt[]>("/kiosk/preisliste");
    setProdukte(res.data);
  };

  const handleAddProdukt = async () => {
    await api.post("/kiosk/preisliste", form);
    setEditOpen(false);
    setForm({ name: "", preis: 0 });
    setSnack("Produkt hinzugefügt!");
    fetchProdukte();
  };

  return (
    <>
      <Button variant="contained" onClick={() => setEditOpen(true)} sx={{ mb: 2 }}>
        Produkt hinzufügen
      </Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Preis (€)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {produkte.map(p => (
            <TableRow key={p.id}>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.preis.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Produkt hinzufügen</DialogTitle>
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
            onChange={e => setForm(f => ({ ...f, preis: parseFloat(e.target.value) }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleAddProdukt}>Speichern</Button>
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