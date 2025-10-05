import { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Snackbar, Alert } from "@mui/material";
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
    fetchKuehlschraenke();
  };

  // Produkt löschen
  const handleDeleteProdukt = async (produktId: number) => {
    if (!selectedKuehlschrank) return;
    await api.delete(`/kiosk/kuehlschraenke/${selectedKuehlschrank.id}/inhalt/${produktId}`);
    setSnack("Produkt entfernt!");
    fetchKuehlschraenke();
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
                        <IconButton size="small" color="primary" onClick={() => {
                          setSelectedKuehlschrank(k);
                          setProduktName(p.name);
                          setProduktBestand(p.bestand);
                          setEditProduktId(p.id);
                          setProduktPreis(p.preis ?? 0);
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
                        setProduktPreis(0);
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

      {/* Dialog Produkt hinzufügen/bearbeiten */}
      <Dialog open={!!selectedKuehlschrank} onClose={() => {
        setSelectedKuehlschrank(null);
        setProduktName("");
        setProduktBestand(0);
        setEditProduktId(null);
        setProduktPreis(0);
      }}>
        <DialogTitle>{editProduktId ? "Produkt bearbeiten" : "Produkt hinzufügen"}</DialogTitle>
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
          <Button onClick={() => {
            setSelectedKuehlschrank(null);
            setProduktName("");
            setProduktBestand(0);
            setEditProduktId(null);
            setProduktPreis(0);
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
    </Box>
  );
};

export default Kuehlschraenke;