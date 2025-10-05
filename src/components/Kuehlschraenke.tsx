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
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../api/api";
import { BarChart } from "@mui/x-charts";

type KuehlschrankProdukt = {
  id: number;
  produkt_id: number;
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
type ProduktPreisliste = {
  id: number;
  name: string;
  preis: number;
  kategorie: string;
};

const Kuehlschraenke = () => {
  const [kuehlschraenke, setKuehlschraenke] = useState<Kuehlschrank[]>([]);
  const [produktePreisliste, setProduktePreisliste] = useState<ProduktPreisliste[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", standort: "" });
  const [snack, setSnack] = useState<{ message: string; severity: "success" | "error" }>({ message: "", severity: "success" });
  const [deleteKuehlschrankDialogOpen, setDeleteKuehlschrankDialogOpen] = useState(false);
  const [kuehlschrankToDelete, setKuehlschrankToDelete] = useState<Kuehlschrank | null>(null);

  // Dialog für Produktbearbeitung (Bestand ändern/löschen)
  const [produktDialogOpen, setProduktDialogOpen] = useState(false);
  const [selectedKuehlschrank, setSelectedKuehlschrank] = useState<Kuehlschrank | null>(null);
  const [selectedProdukt, setSelectedProdukt] = useState<KuehlschrankProdukt | null>(null);
  const [produktBestand, setProduktBestand] = useState<number>(0);

  // Dialog für neues Produkt im Kühlschrank
  const [addProduktDialogOpen, setAddProduktDialogOpen] = useState(false);
  const [addProduktId, setAddProduktId] = useState<number | null>(null);
  const [addProduktBestand, setAddProduktBestand] = useState<number>(0);

  useEffect(() => {
    fetchKuehlschraenke();
    fetchPreisliste();
  }, []);

  const fetchKuehlschraenke = async () => {
    try {
      const res = await api.get<Kuehlschrank[]>("/kiosk/kuehlschraenke");
      setKuehlschraenke(res.data);
    } catch {
      setSnack({ message: "Fehler beim Laden!", severity: "error" });
    }
  };

  const fetchPreisliste = async () => {
    try {
      const res = await api.get<ProduktPreisliste[]>("/kiosk/preisliste");
      setProduktePreisliste(res.data);
    } catch { /* ignore */ }
  };

  // Kühlschrank anlegen
  const handleAddKuehlschrank = async () => {
    try {
      await api.post("/kiosk/kuehlschraenke", form);
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
      await api.delete(`/kiosk/kuehlschraenke/${kuehlschrankToDelete.id}`);
      setSnack({ message: "Kühlschrank gelöscht!", severity: "success" });
      setDeleteKuehlschrankDialogOpen(false);
      setKuehlschrankToDelete(null);
      fetchKuehlschraenke();
    } catch {
      setSnack({ message: "Fehler beim Löschen!", severity: "error" });
    }
  };

  // Produkt bearbeiten im Kühlschrank
  const openProduktDialog = (k: Kuehlschrank, p: KuehlschrankProdukt) => {
    setSelectedKuehlschrank(k);
    setSelectedProdukt(p);
    setProduktBestand(p.bestand);
    setProduktDialogOpen(true);
  };

  // Produktbestand speichern
  const handleSaveProdukt = async () => {
    if (!selectedKuehlschrank || !selectedProdukt) return;
    try {
      await api.post(`/kiosk/kuehlschraenke/${selectedKuehlschrank.id}/inhalt`, {
        produktId: selectedProdukt.produkt_id,
        bestand: produktBestand,
      });
      setSnack({ message: "Bestand geändert!", severity: "success" });
      setProduktDialogOpen(false);
      setSelectedKuehlschrank(null);
      setSelectedProdukt(null);
      setProduktBestand(0);
      fetchKuehlschraenke();
    } catch {
      setSnack({ message: "Fehler beim Speichern!", severity: "error" });
    }
  };

  // Produkt aus Kühlschrank löschen
  const handleDeleteProdukt = async () => {
    if (!selectedKuehlschrank || !selectedProdukt) return;
    try {
      await api.delete(`/kiosk/kuehlschraenke/${selectedKuehlschrank.id}/inhalt/${selectedProdukt.id}`);
      setSnack({ message: "Produkt entfernt!", severity: "success" });
      setProduktDialogOpen(false);
      setSelectedKuehlschrank(null);
      setSelectedProdukt(null);
      setProduktBestand(0);
      fetchKuehlschraenke();
    } catch {
      setSnack({ message: "Fehler beim Löschen!", severity: "error" });
    }
  };

  // Dialog für neues Produkt im Kühlschrank öffnen
  const openAddProduktDialog = (k: Kuehlschrank) => {
    setSelectedKuehlschrank(k);
    setAddProduktDialogOpen(true);
    setAddProduktId(null);
    setAddProduktBestand(0);
  };

  // Neues Produkt im Kühlschrank speichern
  const handleAddProdukt = async () => {
    if (!selectedKuehlschrank || !addProduktId) return;
    try {
      await api.post(`/kiosk/kuehlschraenke/${selectedKuehlschrank.id}/inhalt`, {
        produktId: addProduktId,
        bestand: addProduktBestand,
      });
      setSnack({ message: "Produkt hinzugefügt!", severity: "success" });
      setAddProduktDialogOpen(false);
      setSelectedKuehlschrank(null);
      setAddProduktId(null);
      setAddProduktBestand(0);
      fetchKuehlschraenke();
    } catch {
      setSnack({ message: "Fehler beim Hinzufügen!", severity: "error" });
    }
  };

  // --- Balkendiagramm: Bestand je Produkt & Kühlschrank ---
  const chartData: { name: string; bestand: number }[] = [];
  kuehlschraenke.forEach(k => {
    k.inhalt.forEach(p => {
      chartData.push({
        name: `${p.name} (${k.name})`,
        bestand: p.bestand
      });
    });
  });

  return (
    <Box sx={{ mt: 3 }}>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditOpen(true)}>
        Kühlschrank hinzufügen
      </Button>
      <Stack direction="row" spacing={3} sx={{ mt: 2, flexWrap: "wrap" }}>
        {kuehlschraenke.map(k => (
          <Card key={k.id} sx={{ width: 260, minHeight: 180, position: "relative", bgcolor: "#e3f2fd" }}>
            <CardContent>
              <Typography variant="h6">{k.name}</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>Standort: {k.standort}</Typography>
              <Typography variant="subtitle2">Inhalt:</Typography>
              <Button
                size="small"
                variant="outlined"
                sx={{ mb: 1 }}
                onClick={() => openAddProduktDialog(k)}
              >
                Produkt hinzufügen
              </Button>
              {k.inhalt?.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                  {k.inhalt.map(p => (
                    <li
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        padding: "2px 0",
                      }}
                    >
                      <span>
                        {p.name} ({p.bestand})
                      </span>
                      <span>
                        <IconButton size="small" onClick={() => openProduktDialog(k, p)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => openProduktDialog(k, p)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : <Typography color="text.secondary">leer</Typography>}
            </CardContent>
            <CardActions sx={{ position: "absolute", bottom: 8, left: 8 }}>
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

      {/* Dialog Produkt bearbeiten/löschen */}
      <Dialog open={produktDialogOpen} onClose={() => setProduktDialogOpen(false)}>
        <DialogTitle>
          Produkt bearbeiten – {selectedKuehlschrank?.name}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Produkt: <b>{selectedProdukt?.name}</b>
          </Typography>
          <TextField
            label="Bestand"
            type="number"
            fullWidth
            value={produktBestand}
            onChange={e => setProduktBestand(Number(e.target.value))}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={handleDeleteProdukt}>Produkt entfernen</Button>
          <Button onClick={() => setProduktDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSaveProdukt}>Speichern</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Produkt hinzufügen */}
      <Dialog open={addProduktDialogOpen} onClose={() => setAddProduktDialogOpen(false)}>
        <DialogTitle>Produkt hinzufügen – {selectedKuehlschrank?.name}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="produkt-select-label">Produkt</InputLabel>
            <Select
              labelId="produkt-select-label"
              value={addProduktId ?? ""}
              onChange={e => setAddProduktId(Number(e.target.value))}
              label="Produkt"
            >
              {produktePreisliste.map(prod => (
                <MenuItem key={prod.id} value={prod.id}>{prod.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Bestand" type="number" fullWidth value={addProduktBestand} onChange={e => setAddProduktBestand(Number(e.target.value))} sx={{ mb: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddProduktDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleAddProdukt}>Hinzufügen</Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Bestand je Kühlschrank & Produkt</Typography>
        <BarChart
          xAxis={[{ scaleType: 'band', data: chartData.map(d => d.name) }]}
          series={[{ data: chartData.map(d => d.bestand), color: "#1976d2", label: "Bestand" }]}
          height={300}
          width={Math.max(400, chartData.length * 90)}
        />
      </Box>

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