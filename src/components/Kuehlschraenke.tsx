import React, { useEffect, useState } from "react";
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
  Typography,
  TextField,
  IconButton,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../api/api";
import { BarChart } from "@mui/x-charts";
import type { SelectChangeEvent } from "@mui/material/Select";

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

  // Produktbearbeitung/Dialog
  const [produktDialogOpen, setProduktDialogOpen] = useState(false);
  const [selectedKuehlschrank, setSelectedKuehlschrank] = useState<Kuehlschrank | null>(null);
  const [selectedProdukt, setSelectedProdukt] = useState<KuehlschrankProdukt | null>(null);
  const [produktBestand, setProduktBestand] = useState<number>(0);

  // Produkt hinzufügen Dialog
  const [addProduktDialogOpen, setAddProduktDialogOpen] = useState(false);
  const [addProduktId, setAddProduktId] = useState<string>("");
  const [addProduktBestand, setAddProduktBestand] = useState<number>(0);

  // Toggle für Balkendiagramm
  const [diagrammModus, setDiagrammModus] = useState<"einzeln" | "gesamt">("einzeln");

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
    setAddProduktId("");
    setAddProduktBestand(0);
  };

  // Neues Produkt im Kühlschrank speichern
  const handleAddProdukt = async () => {
    if (!selectedKuehlschrank || addProduktId === "" || isNaN(Number(addProduktId))) return;
    try {
      await api.post(`/kiosk/kuehlschraenke/${selectedKuehlschrank.id}/inhalt`, {
        produktId: Number(addProduktId),
        bestand: addProduktBestand,
      });
      setSnack({ message: "Produkt hinzugefügt!", severity: "success" });
      setAddProduktDialogOpen(false);
      setSelectedKuehlschrank(null);
      setAddProduktId("");
      setAddProduktBestand(0);
      fetchKuehlschraenke();
    } catch {
      setSnack({ message: "Fehler beim Hinzufügen!", severity: "error" });
    }
  };

  // --- Balkendiagramm: Einzelbestand oder Gesamtbestand ---
  const einzelLabels: string[] = [];
  const einzelData: number[] = [];
  kuehlschraenke.forEach(k => {
    k.inhalt.forEach(p => {
      einzelLabels.push(`${p.name} (${k.name})`);
      einzelData.push(p.bestand);
    });
  });

  // Gesamtbestand je Produkt
  const gesamtMap = new Map<string, number>();
  kuehlschraenke.forEach(k => {
    k.inhalt.forEach(p => {
      gesamtMap.set(
        p.name,
        (gesamtMap.get(p.name) ?? 0) + p.bestand
      );
    });
  });
  const gesamtLabels = Array.from(gesamtMap.keys());
  const gesamtData = Array.from(gesamtMap.values());

  return (
    <Box sx={{ mt: 3, px: { xs: 1, sm: 2, md: 6 } }}>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditOpen(true)} sx={{ mb: 2 }}>
        Kühlschrank hinzufügen
      </Button>
      {/* Cards ohne Grid */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {kuehlschraenke.map(k => (
          <Card
            key={k.id}
            sx={{
              minWidth: 260,
              maxWidth: 400,
              bgcolor: "#e3f2fd",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <CardContent>
              <Typography variant="h6">{k.name}</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>Standort: {k.standort}</Typography>
              <Typography variant="subtitle2">Inhalt:</Typography>
              <Button
                size="small"
                variant="outlined"
                sx={{ mb: 1, mt: 1 }}
                fullWidth
                onClick={() => openAddProduktDialog(k)}
              >
                Produkt hinzufügen
              </Button>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {k.inhalt?.length > 0 ? (
                  k.inhalt.map(p => (
                    <Box
                      key={p.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: "white",
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                        boxShadow: 1
                      }}
                    >
                      <Typography sx={{ fontSize: 15, wordBreak: "break-word" }}>
                        {p.name} ({p.bestand})
                      </Typography>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton size="small" onClick={() => openProduktDialog(k, p)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => { setSelectedKuehlschrank(k); setSelectedProdukt(p); setProduktDialogOpen(true); }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary">leer</Typography>
                )}
              </Stack>
            </CardContent>
            <CardActions sx={{ mt: "auto" }}>
              <Button
                size="small"
                color="error"
                variant="outlined"
                fullWidth
                onClick={() => { setKuehlschrankToDelete(k); setDeleteKuehlschrankDialogOpen(true); }}
              >
                Löschen
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      {/* Umschalter für Diagramm */}
      <Box sx={{ mt: 4, mb: 1 }}>
        <ToggleButtonGroup
          color="primary"
          value={diagrammModus}
          exclusive
          onChange={(_, value) => value && setDiagrammModus(value)}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="einzeln">Bestand je Kühlschrank & Produkt</ToggleButton>
          <ToggleButton value="gesamt">Gesamtbestand je Produkt</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {diagrammModus === "einzeln"
            ? "Bestand je Kühlschrank & Produkt"
            : "Gesamtbestand je Produkt"}
        </Typography>
        <Box sx={{
          maxWidth: "100vw",
          overflowX: "auto",
          pb: 2
        }}>
          <BarChart
            xAxis={[
              { scaleType: 'band', data: diagrammModus === "einzeln" ? einzelLabels : gesamtLabels }
            ]}
            series={[
              {
                data: diagrammModus === "einzeln" ? einzelData : gesamtData,
                color: "#1976d2",
                label: "Bestand",
                valueFormatter: (value: number | null) => value === null ? "" : value.toString()
              }
            ]}
            height={340}
            width={Math.max(400, (diagrammModus === "einzeln" ? einzelLabels.length : gesamtLabels.length) * 140)}
          />
        </Box>
      </Box>

      {/* Dialog Kühlschrank anlegen */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Kühlschrank hinzufügen</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            value={form.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, name: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Standort"
            fullWidth
            value={form.standort}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, standort: e.target.value }))}
          />
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProduktBestand(Number(e.target.value))}
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
              value={addProduktId}
              onChange={(e: SelectChangeEvent) => setAddProduktId(e.target.value)}
              label="Produkt"
            >
              {produktePreisliste.map(prod => (
                <MenuItem key={prod.id} value={String(prod.id)}>{prod.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Bestand"
            type="number"
            fullWidth
            value={addProduktBestand}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddProduktBestand(Number(e.target.value))}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddProduktDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleAddProdukt}>Hinzufügen</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar ohne Alert */}
      <Snackbar
        open={!!snack.message}
        autoHideDuration={3000}
        onClose={() => setSnack({ message: "", severity: "success" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message={snack.message}
      />
    </Box>
  );
};

export default Kuehlschraenke;