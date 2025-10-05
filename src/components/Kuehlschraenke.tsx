import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Typography,
  TextField,
  IconButton,
  Stack
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
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
  const [snack, setSnack] = useState<{ message: string; severity: "success" | "error" }>({ message: "", severity: "success" });
  const [deleteKuehlschrankDialogOpen, setDeleteKuehlschrankDialogOpen] = useState(false);
  const [kuehlschrankToDelete, setKuehlschrankToDelete] = useState<Kuehlschrank | null>(null);

  // Inhalt bearbeiten Dialog
  const [inhaltDialogOpen, setInhaltDialogOpen] = useState(false);
  const [selectedKuehlschrank, setSelectedKuehlschrank] = useState<Kuehlschrank | null>(null);

  // Produkt bearbeiten im Kühlschrank
  const [produktName, setProduktName] = useState("");
  const [produktBestand, setProduktBestand] = useState<number>(0);
  const [editProduktId, setEditProduktId] = useState<number | null>(null);

  useEffect(() => {
    fetchKuehlschraenke();
  }, []);

  const fetchKuehlschraenke = async () => {
    try {
      const res = await api.get<Kuehlschrank[]>("/api/kiosk/kuehlschraenke");
      setKuehlschraenke(res.data);
    } catch {
      setSnack({ message: "Fehler beim Laden!", severity: "error" });
    }
  };

  // Kühlschrank anlegen
  const handleAddKuehlschrank = async () => {
    try {
      await api.post("/api/kiosk/kuehlschraenke", form);
      setSnack({ message: "Kühlschrank hinzugefügt!", severity: "success" });
      setForm({ name: "", standort: "" });
      setEditOpen(false);
      fetchKuehlschraenke();
    } catch {
      setSnack({ message: "Fehler beim Hinzufügen!", severity: "error" });
    }
  };

  // Kühlschrank löschen
  const handleDeleteKuehlschrank = async () => {
    if (!kuehlschrankToDelete) return;
    try {
      await api.delete(`/api/kiosk/kuehlschraenke/${kuehlschrankToDelete.id}`);
      setSnack({ message: "Kühlschrank gelöscht!", severity: "success" });
      setDeleteKuehlschrankDialogOpen(false);
      setKuehlschrankToDelete(null);
      fetchKuehlschraenke();
    } catch {
      setSnack({ message: "Fehler beim Löschen!", severity: "error" });
    }
  };

  // Inhalt bearbeiten öffnen
  const handleOpenInhaltDialog = (k: Kuehlschrank) => {
    setSelectedKuehlschrank(k);
    setInhaltDialogOpen(true);
    setEditProduktId(null);
    setProduktName("");
    setProduktBestand(0);
  };

  // Produkt bearbeiten in Kühlschrank (Dialog)
  const handleEditProdukt = (p: KuehlschrankProdukt) => {
    setEditProduktId(p.id);
    setProduktName(p.name);
    setProduktBestand(p.bestand);
  };

  // Produkt speichern/bearbeiten
  const handleSaveProdukt = async () => {
    if (!selectedKuehlschrank) return;
    try {
      await api.post(`/api/kiosk/kuehlschraenke/${selectedKuehlschrank.id}/inhalt`, {
        name: produktName,
        bestand: produktBestand,
        produktId: editProduktId ?? undefined,
      });
      setSnack({ message: editProduktId ? "Produkt geändert!" : "Produkt hinzugefügt!", severity: "success" });
      setEditProduktId(null);
      setProduktName("");
      setProduktBestand(0);
      fetchKuehlschraenke();
      // Refresh Inhalt
      const updated = await api.get<Kuehlschrank>(`/api/kiosk/kuehlschraenke/${selectedKuehlschrank.id}`);
      setSelectedKuehlschrank(updated.data);
    } catch {
      setSnack({ message: "Fehler beim Speichern!", severity: "error" });
    }
  };

  // Produkt aus Kühlschrank löschen
  const handleDeleteProdukt = async () => {
    if (!selectedKuehlschrank || !editProduktId) return;
    try {
      await api.delete(`/api/kiosk/kuehlschraenke/${selectedKuehlschrank.id}/inhalt/${editProduktId}`);
      setSnack({ message: "Produkt entfernt!", severity: "success" });
      setEditProduktId(null);
      setProduktName("");
      setProduktBestand(0);
      fetchKuehlschraenke();
      // Refresh Inhalt
      const updated = await api.get<Kuehlschrank>(`/api/kiosk/kuehlschraenke/${selectedKuehlschrank.id}`);
      setSelectedKuehlschrank(updated.data);
    } catch {
      setSnack({ message: "Fehler beim Löschen!", severity: "error" });
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditOpen(true)}>
        Kühlschrank hinzufügen
      </Button>
      <Stack direction="row" spacing={3} sx={{ mt: 2, flexWrap: "wrap" }}>
        {kuehlschraenke.map(k => (
          <Card key={k.id} sx={{ width: 250, minHeight: 180, position: "relative", bgcolor: "#e3f2fd" }}>
            <CardContent>
              <Typography variant="h6">{k.name}</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>Standort: {k.standort}</Typography>
              <Typography variant="subtitle2">Inhalt:</Typography>
              {k.inhalt?.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {k.inhalt.map(p => (
                    <li key={p.id}>
                      {p.name} ({p.bestand}){" "}
                      <IconButton size="small" onClick={() => handleEditProdukt(p)}><EditIcon fontSize="small" /></IconButton>
                    </li>
                  ))}
                </ul>
              ) : <Typography color="text.secondary">leer</Typography>}
            </CardContent>
            <CardActions sx={{ position: "absolute", bottom: 8, left: 8 }}>
              <Button size="small" variant="outlined" onClick={() => handleOpenInhaltDialog(k)}>
                Inhalt bearbeiten
              </Button>
              <Button size="small" color="error" variant="outlined" onClick={() => { setKuehlschrankToDelete(k); setDeleteKuehlschrankDialogOpen(true); }}>
                Löschen
              </Button>
            </CardActions>
          </Card>
        ))}
      </Stack>

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

      {/* Dialog Inhalt bearbeiten */}
      <Dialog open={inhaltDialogOpen} onClose={() => setInhaltDialogOpen(false)}>
        <DialogTitle>Inhalt bearbeiten – {selectedKuehlschrank?.name}</DialogTitle>
        <DialogContent>
          <TextField label="Produktname" fullWidth value={produktName} onChange={e => setProduktName(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Bestand" type="number" fullWidth value={produktBestand} onChange={e => setProduktBestand(Number(e.target.value))} sx={{ mb: 2 }} />
        </DialogContent>
        <DialogActions>
          {editProduktId && (
            <Button color="error" onClick={handleDeleteProdukt}>
              Produkt entfernen
            </Button>
          )}
          <Button onClick={() => setInhaltDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSaveProdukt}>
            {editProduktId ? "Speichern" : "Hinzufügen"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack.message}
        autoHideDuration={3000}
        onClose={() => setSnack({ message: "", severity: "success" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack({ message: "", severity: "success" })}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Kuehlschraenke;