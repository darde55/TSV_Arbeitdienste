import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  IconButton,
  Snackbar,
  Alert,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../api/api";

type Produkt = { id: number; name: string; preis: number };
type KuehlschrankProdukt = { id: number; name: string; bestand: number; preis?: number };
type Kuehlschrank = { id: number; name: string; standort: string; inhalt: KuehlschrankProdukt[] };

const Kuehlschraenke = () => {
  const [kuehlschraenke, setKuehlschraenke] = useState<Kuehlschrank[]>([]);
  const [produkte, setProdukte] = useState<Produkt[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", standort: "" });
  const [snack, setSnack] = useState<string>("");
  const [selectedKuehlschrank, setSelectedKuehlschrank] = useState<Kuehlschrank | null>(null);
  const [produktName, setProduktName] = useState("");
  const [produktBestand, setProduktBestand] = useState<number>(0);
  const [editProduktId, setEditProduktId] = useState<number | null>(null);
  const [produktPreis, setProduktPreis] = useState<number>(0);
  const [produktDialogOpen, setProduktDialogOpen] = useState(false);
  const [deleteKuehlschrankDialogOpen, setDeleteKuehlschrankDialogOpen] = useState(false);
  const [kuehlschrankToDelete, setKuehlschrankToDelete] = useState<Kuehlschrank | null>(null);

  useEffect(() => {
    fetchKuehlschraenke();
    fetchProdukte();
  }, []);

  const fetchKuehlschraenke = async () => {
    const res = await api.get<Kuehlschrank[]>("/kiosk/kuehlschraenke");
    setKuehlschraenke(res.data);
  };

  const fetchProdukte = async () => {
    const res = await api.get<Produkt[]>("/kiosk/preisliste");
    setProdukte(res.data);
  };

  // Kühlschrank hinzufügen
  const handleAddKuehlschrank = async () => {
    await api.post("/kiosk/kuehlschraenke", form);
    setSnack("Kühlschrank hinzugefügt!");
    setForm({ name: "", standort: "" });
    setEditOpen(false);
    fetchKuehlschraenke();
  };

  // Produkt hinzufügen/ändern
  const handleAddProdukt = async () => {
    if (!selectedKuehlschrank) return;
    await api.post(`/kiosk/kuehlschraenke/${selectedKuehlschrank.id}/inhalt`, {
      name: produktName,
      bestand: produktBestand,
      preis: produktPreis,
      produktId: editProduktId ?? undefined,
    });
    setSnack(editProduktId ? "Produkt geändert!" : "Produkt hinzugefügt!");
    setEditProduktId(null);
    setProduktName("");
    setProduktBestand(0);
    setProduktPreis(0);
    setProduktDialogOpen(false);
    fetchKuehlschraenke();
  };

  // Produkt löschen aus Kühlschrank
  const handleDeleteProdukt = async () => {
    if (!selectedKuehlschrank || !editProduktId) return;
    try {
      await api.delete(`/kiosk/kuehlschraenke/${selectedKuehlschrank.id}/inhalt/${editProduktId}`);
      setSnack("Produkt entfernt!");
      setEditProduktId(null);
      setProduktName("");
      setProduktBestand(0);
      setProduktPreis(0);
      setProduktDialogOpen(false);
      fetchKuehlschraenke();
    } catch {
      setSnack("Fehler beim Löschen!");
    }
  };

  // Gesamten Kühlschrank löschen
  const handleDeleteKuehlschrank = async () => {
    if (!kuehlschrankToDelete) return;
    try {
      await api.delete(`/kiosk/kuehlschraenke/${kuehlschrankToDelete.id}`);
      setSnack("Kühlschrank gelöscht!");
      setDeleteKuehlschrankDialogOpen(false);
      setKuehlschrankToDelete(null);
      fetchKuehlschraenke();
    } catch {
      setSnack("Fehler beim Löschen des Kühlschranks!");
    }
  };

  // Öffnet den Dialog zum Produkt Hinzufügen/Bearbeiten
  const openProduktDialog = (
    k: Kuehlschrank,
    p?: KuehlschrankProdukt
  ) => {
    setSelectedKuehlschrank(k);
    setProduktName(p?.name || "");
    setProduktBestand(p?.bestand || 0);
    setEditProduktId(p?.id ?? null);
    setProduktPreis(p?.preis ?? 0);
    setProduktDialogOpen(true);
  };

  const closeProduktDialog = () => {
    setSelectedKuehlschrank(null);
    setProduktName("");
    setProduktBestand(0);
    setEditProduktId(null);
    setProduktPreis(0);
    setProduktDialogOpen(false);
  };

  // Öffnet Dialog für Kühlschrank-Löschung
  const openDeleteKuehlschrankDialog = (k: Kuehlschrank) => {
    setKuehlschrankToDelete(k);
    setDeleteKuehlschrankDialogOpen(true);
  };

  const closeDeleteKuehlschrankDialog = () => {
    setKuehlschrankToDelete(null);
    setDeleteKuehlschrankDialogOpen(false);
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
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {kuehlschraenke.map(k => (
              <TableRow key={k.id}>
                <TableCell>{k.name}</TableCell>
                <TableCell>{k.standort}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {(!k.inhalt || k.inhalt.length === 0) && <span style={{ color: "#888" }}>leer</span>}
                    {k.inhalt && k.inhalt.map(p => (
                      <Box key={p.id} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <span>
                          {p.name} ({p.bestand}){typeof p.preis === "number" && ` - ${p.preis.toFixed(2)} €`}
                        </span>
                        <IconButton size="small" color="primary" onClick={() => openProduktDialog(k, p)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => openProduktDialog(k, p)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => openProduktDialog(k)}
                    >
                      Produkt hinzufügen
                    </Button>
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => openDeleteKuehlschrankDialog(k)}
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
          <TextField label="Name" fullWidth value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} sx={{ mb: 2 }} />
          <TextField label="Standort" fullWidth value={form.standort} onChange={e => setForm(f => ({ ...f, standort: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleAddKuehlschrank}>Speichern</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Produkt hinzufügen/bearbeiten/löschen */}
      <Dialog open={produktDialogOpen} onClose={closeProduktDialog}>
        <DialogTitle>{editProduktId ? "Produkt bearbeiten oder löschen" : "Produkt hinzufügen"}</DialogTitle>
        <DialogContent>
          <TextField label="Produktname" fullWidth value={produktName} onChange={e => setProduktName(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Bestand" type="number" fullWidth value={produktBestand} onChange={e => setProduktBestand(Number(e.target.value))} sx={{ mb: 2 }} />
          <TextField
            label="Preis"
            type="number"
            fullWidth
            value={produktPreis}
            onChange={e => setProduktPreis(Number(e.target.value))}
            sx={{ mb: 2 }}
            select
            SelectProps={{
              native: true
            }}
          >
            <option value={0}>Kein Preis</option>
            {produkte.map(prod => (
              <option key={prod.id} value={prod.preis}>{prod.name} - {prod.preis.toFixed(2)} €</option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          {editProduktId && (
            <Button color="error" onClick={handleDeleteProdukt}>
              Produkt löschen
            </Button>
          )}
          <Button onClick={closeProduktDialog}>Abbrechen</Button>
          <Button variant="contained" onClick={handleAddProdukt}>
            {editProduktId ? "Speichern" : "Hinzufügen"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Gesamten Kühlschrank löschen */}
      <Dialog open={deleteKuehlschrankDialogOpen} onClose={closeDeleteKuehlschrankDialog}>
        <DialogTitle>Kühlschrank löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Möchtest du den Kühlschrank{' '}
            <b>{kuehlschrankToDelete?.name}</b> wirklich <b>vollständig löschen</b>?
            <br />
            Alle zugehörigen Produkte werden entfernt!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteKuehlschrankDialog}>Abbrechen</Button>
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