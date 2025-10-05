import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Typography,
  TextField
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../api/api";

type KuehlschrankProdukt = {
  id: number;
  name: string;
  bestand: number;
  preis: number;
};

type Kuehlschrank = {
  id: number;
  name: string;
  standort: string;
  inhalt: KuehlschrankProdukt[];
};

const Kuehlschraenke = () => {
  const [kuehlschraenke, setKuehlschraenke] = useState<Kuehlschrank[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", standort: "" });
  const [snack, setSnack] = useState<string>("");
  const [deleteKuehlschrankDialogOpen, setDeleteKuehlschrankDialogOpen] = useState(false);
  const [kuehlschrankToDelete, setKuehlschrankToDelete] = useState<Kuehlschrank | null>(null);

  useEffect(() => {
    fetchKuehlschraenke();
  }, []);

  const fetchKuehlschraenke = async () => {
    try {
      const res = await api.get<Kuehlschrank[]>("/kiosk/kuehlschraenke");
      setKuehlschraenke(res.data);
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "response" in err) {
        const errorObj = err as { response?: { data?: { message?: string } }, message?: string };
        setSnack("Fehler beim Laden: " + (errorObj.response?.data?.message || errorObj.message || ""));
      } else if (err instanceof Error) {
        setSnack("Fehler beim Laden: " + err.message);
      } else {
        setSnack("Fehler beim Laden: Unbekannter Fehler");
      }
    }
  };

  // Kühlschrank anlegen
  const handleAddKuehlschrank = async () => {
    try {
      await api.post("/kiosk/kuehlschraenke", form);
      setSnack("Kühlschrank hinzugefügt!");
      setForm({ name: "", standort: "" });
      setEditOpen(false);
      fetchKuehlschraenke();
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "response" in err) {
        const errorObj = err as { response?: { data?: { message?: string } }, message?: string };
        setSnack("Fehler beim Hinzufügen: " + (errorObj.response?.data?.message || errorObj.message || ""));
      } else if (err instanceof Error) {
        setSnack("Fehler beim Hinzufügen: " + err.message);
      } else {
        setSnack("Fehler beim Hinzufügen: Unbekannter Fehler");
      }
    }
  };

  // Kühlschrank löschen
  const handleDeleteKuehlschrank = async () => {
    if (!kuehlschrankToDelete) return;
    try {
      await api.delete(`/kiosk/kuehlschraenke/${kuehlschrankToDelete.id}`);
      setSnack("Kühlschrank gelöscht!");
      setDeleteKuehlschrankDialogOpen(false);
      setKuehlschrankToDelete(null);
      fetchKuehlschraenke();
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "response" in err) {
        const errorObj = err as { response?: { data?: { message?: string } }, message?: string };
        setSnack("Fehler beim Löschen: " + (errorObj.response?.data?.message || errorObj.message || ""));
      } else if (err instanceof Error) {
        setSnack("Fehler beim Löschen: " + err.message);
      } else {
        setSnack("Fehler beim Löschen: Unbekannter Fehler");
      }
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditOpen(true)}>
        Kühlschrank hinzufügen
      </Button>
      <TableContainer sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Standort</TableCell>
              <TableCell>Inhalt</TableCell>
              <TableCell>Aktion</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {kuehlschraenke.map(k => (
              <TableRow key={k.id}>
                <TableCell>{k.name}</TableCell>
                <TableCell>{k.standort}</TableCell>
                <TableCell>
                  {k.inhalt && k.inhalt.length > 0
                    ? k.inhalt.map(p => `${p.name} (${p.bestand})`).join(", ")
                    : <span style={{ color: "#888" }}>leer</span>}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => { setKuehlschrankToDelete(k); setDeleteKuehlschrankDialogOpen(true); }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Kühlschrank anlegen */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Kühlschrank hinzufügen</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} sx={{ mb: 2 }} />
          <TextField label="Standort" fullWidth value={form.standort}
            onChange={e => setForm(f => ({ ...f, standort: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleAddKuehlschrank}>Speichern</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Kühlschrank löschen */}
      <Dialog open={deleteKuehlschrankDialogOpen} onClose={() => setDeleteKuehlschrankDialogOpen(false)}>
        <DialogTitle>Kühlschrank löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Möchtest du den Kühlschrank <b>{kuehlschrankToDelete?.name}</b> wirklich löschen?
            <br />
            Alle Inhalte werden entfernt!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteKuehlschrankDialogOpen(false)}>Abbrechen</Button>
          <Button color="error" variant="contained" onClick={handleDeleteKuehlschrank}>
            Kühlschrank löschen
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
    </Box>
  );
};

export default Kuehlschraenke;