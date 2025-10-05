import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Snackbar,
  Alert,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import api from "../api/api";

type Kuehlschrank = {
  id: number;
  name: string;
  standort: string;
  inhalt: KuehlschrankProdukt[];
};

type KuehlschrankProdukt = {
  id: number;
  name: string;
  bestand: number;
};

const Kiosk: React.FC<{ user: { role: string } }> = ({ user }) => {
  const [tab, setTab] = useState(0);
  const [kuehlschraenke, setKuehlschraenke] = useState<Kuehlschrank[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", standort: "" });
  const [snack, setSnack] = useState<string>("");
  const [selectedKuehlschrank, setSelectedKuehlschrank] = useState<Kuehlschrank | null>(null);
  const [produktName, setProduktName] = useState("");
  const [produktBestand, setProduktBestand] = useState<number>(0);
  const [editProduktId, setEditProduktId] = useState<number | null>(null);

  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    fetchKuehlschraenke();
  }, []);

  const fetchKuehlschraenke = async () => {
    const res = await api.get<Kuehlschrank[]>("/kiosk/kuehlschraenke");
    setKuehlschraenke(res.data);
  };

  // Kühlschrank hinzufügen
  const handleAddKuehlschrank = async () => {
    await api.post("/kiosk/kuehlschraenke", form);
    setSnack("Kühlschrank hinzugefügt!");
    setForm({ name: "", standort: "" });
    setEditOpen(false);
    fetchKuehlschraenke();
  };

  // Inhalt (Produkt) hinzufügen/ändern
  const handleAddProdukt = async () => {
    if (!selectedKuehlschrank) return;
    await api.post(`/kiosk/kuehlschraenke/${selectedKuehlschrank.id}/inhalt`, {
      name: produktName,
      bestand: produktBestand,
      produktId: editProduktId ?? undefined,
    });
    setSnack(editProduktId ? "Produkt geändert!" : "Produkt hinzugefügt!");
    setEditProduktId(null);
    setProduktName("");
    setProduktBestand(0);
    fetchKuehlschraenke();
  };

  // Produkt löschen
  const handleDeleteProdukt = async (produktId: number) => {
    if (!selectedKuehlschrank) return;
    await api.delete(`/kiosk/kuehlschraenke/${selectedKuehlschrank.id}/inhalt/${produktId}`);
    setSnack("Produkt entfernt!");
    fetchKuehlschraenke();
  };

  // Verkauf (Kasse)
  const handleVerkauf = async (produktId: number, anzahl: number, kuehlschrankId: number) => {
    await api.post("/kiosk/verkauf", { produktId, anzahl, kuehlschrankId });
    setSnack("Verkauf gebucht!");
    fetchKuehlschraenke();
  };

  if (user.role !== "admin") {
    return (
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography>Kein Zugriff</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: isMobile ? 0 : 2, mt: 2 }}>
      <Typography variant="h6" mb={2}>Kiosk</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
        <Tab label="Kühlschränke" />
        <Tab label="Kasse" />
      </Tabs>
      {/* --- Kühlschränke --- */}
      {tab === 0 && (
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
                            <span>{p.name} ({p.bestand})</span>
                            <IconButton size="small" color="primary" onClick={() => {
                              setSelectedKuehlschrank(k);
                              setProduktName(p.name);
                              setProduktBestand(p.bestand);
                              setEditProduktId(p.id);
                            }}><EditIcon /></IconButton>
                            <IconButton size="small" color="error" onClick={() => {
                              setSelectedKuehlschrank(k);
                              handleDeleteProdukt(p.id);
                            }}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        ))}
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            setSelectedKuehlschrank(k);
                            setProduktName("");
                            setProduktBestand(0);
                            setEditProduktId(null);
                          }}
                        >
                          Produkt hinzufügen
                        </Button>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {/* Optional: Kühlschrank löschen */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* --- Kasse --- */}
      {tab === 1 && (
        <Box sx={{
          mt: 3,
          width: "100vw",
          height: isMobile ? "calc(100vh - 70px)" : "80vh",
          maxWidth: "100vw",
          position: "relative",
          left: isMobile ? "-16px" : 0,
          bgcolor: "#fafafa",
          p: isMobile ? 1 : 4
        }}>
          <Typography variant="h6" mb={2}>Kasse</Typography>
          {(!kuehlschraenke || kuehlschraenke.length === 0) && <Typography sx={{ color: "#888" }}>Keine Produkte vorhanden.</Typography>}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {kuehlschraenke.flatMap(k =>
              k.inhalt.map(prod => (
                <Paper key={prod.id} sx={{ p: 2, minWidth: 100, textAlign: "center" }}>
                  <Typography>{prod.name}</Typography>
                  <Typography variant="body2" sx={{ color: "#666" }}>Bestand: {prod.bestand}</Typography>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    sx={{ mt: 1 }}
                    onClick={() => handleVerkauf(prod.id, 1, kuehlschraenke.find(ks => ks.inhalt.some(p => p.id === prod.id))?.id ?? 0)}
                    disabled={prod.bestand <= 0}
                  >
                    Verkaufen
                  </Button>
                </Paper>
              ))
            )}
          </Box>
        </Box>
      )}

      {/* Dialog zum Kühlschrank anlegen */}
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

      {/* Dialog zum Produkt hinzufügen/bearbeiten */}
      <Dialog open={!!selectedKuehlschrank} onClose={() => {
        setSelectedKuehlschrank(null);
        setProduktName("");
        setProduktBestand(0);
        setEditProduktId(null);
      }}>
        <DialogTitle>{editProduktId ? "Produkt bearbeiten" : "Produkt hinzufügen"}</DialogTitle>
        <DialogContent>
          <TextField label="Produktname" fullWidth value={produktName} onChange={e => setProduktName(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Bestand" type="number" fullWidth value={produktBestand} onChange={e => setProduktBestand(Number(e.target.value))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSelectedKuehlschrank(null);
            setProduktName("");
            setProduktBestand(0);
            setEditProduktId(null);
          }}>Abbrechen</Button>
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
    </Paper>
  );
};

export default Kiosk;