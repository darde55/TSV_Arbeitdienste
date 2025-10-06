import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import api from "../api/api";

type Produkt = {
  id: number;
  name: string;
  preis: number | string;
  kategorie: string; // z.B. "alkoholfrei", "alkoholisch", "sonstiges"
};

type VerkaufItem = {
  produkt: Produkt;
  anzahl: number;
};

const CATEGORY_COLORS: Record<string, string> = {
  alkoholfrei: "#90caf9",    // hellblau
  alkoholisch: "#ffb74d",    // orange
  sonstiges: "#c8e6c9"       // grün
};

const Kasse = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [startDialogOpen, setStartDialogOpen] = useState(true);
  const [produkte, setProdukte] = useState<Produkt[]>([]);
  const [verkauf, setVerkauf] = useState<VerkaufItem[]>([]);
  const [snack, setSnack] = useState<{ message: string; severity: "success" | "error" }>({ message: "", severity: "success" });
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<"alkoholfrei" | "alkoholisch" | "sonstiges">("alkoholfrei");

  useEffect(() => {
    setLoading(true);
    api.get<Produkt[]>("/kiosk/preisliste")
      .then(res => setProdukte(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Verkaufssumme berechnen (preis als Zahl absichern)
  const gesamtpreis = verkauf.reduce(
    (sum, v) => sum + Number(v.produkt.preis) * v.anzahl, 0);

  // Produkt zu Verkauf hinzufügen/erhöhen
  const handleAddProdukt = (produkt: Produkt) => {
    setVerkauf(prev => {
      const idx = prev.findIndex(v => v.produkt.id === produkt.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].anzahl += 1;
        return copy;
      } else {
        return [...prev, { produkt, anzahl: 1 }];
      }
    });
  };

  // Produkt aus Verkauf entfernen/erniedrigen
  const handleRemoveProdukt = (produkt: Produkt) => {
    setVerkauf(prev => {
      const idx = prev.findIndex(v => v.produkt.id === produkt.id);
      if (idx >= 0) {
        const copy = [...prev];
        if (copy[idx].anzahl > 1) {
          copy[idx].anzahl -= 1;
          return copy;
        } else {
          return copy.filter((_, i) => i !== idx);
        }
      } else {
        return prev;
      }
    });
  };

  // Verkauf bestätigen
  const handleBestaetigen = async () => {
    if (verkauf.length === 0) return;
    try {
      for (const v of verkauf) {
        const kuehlschrankId = 1; // ggf. anpassen!
        await api.post("/kiosk/verkauf", {
          produktId: v.produkt.id,
          anzahl: v.anzahl,
          kuehlschrankId,
        });
      }
      setSnack({ message: "Verkauf gebucht!", severity: "success" });
      setVerkauf([]);
    } catch {
      setSnack({ message: "Fehler beim Buchen!", severity: "error" });
    }
  };

  // Verkaufssession beenden
  const handleSessionEnd = () => {
    setSessionActive(false);
    setStartDialogOpen(true);
    setVerkauf([]);
    setSnack({ message: "Verkaufssession beendet!", severity: "success" });
  };

  // Session starten
  const handleSessionStart = () => {
    setSessionActive(true);
    setStartDialogOpen(false);
    setVerkauf([]);
  };

  // Nach Kategorie filtern
  const filteredProdukte = produkte.filter(p => p.kategorie === category);

  return (
    <Box sx={{ p: 1 }}>
      {/* Pop-up zum Session-Start */}
      <Dialog open={startDialogOpen}>
        <DialogTitle>Neuen Verkauf starten?</DialogTitle>
        <DialogContent>
          <Typography>Möchtest du eine neue Verkaufssession beginnen?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSessionStart}>
            Ja, starten
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hauptbereich nur sichtbar bei aktiver Session */}
      {sessionActive && (
        <Paper sx={{ p: { xs: 1, sm: 2 }, mb: 1 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Verkaufssession läuft
          </Typography>

          {/* Kategorie-Toggle */}
          <ToggleButtonGroup
            color="primary"
            value={category}
            exclusive
            onChange={(_, value) =>
              value && setCategory(value as "alkoholfrei" | "alkoholisch" | "sonstiges")
            }
            sx={{ mb: 2, display: "flex", flexWrap: "wrap" }}
          >
            <ToggleButton value="alkoholfrei">Alkoholfrei</ToggleButton>
            <ToggleButton value="alkoholisch">Alkoholisch</ToggleButton>
            <ToggleButton value="sonstiges">Sonstiges</ToggleButton>
          </ToggleButtonGroup>

          {/* Produkt-Übersicht mit Touch-optimierten Karten */}
          {loading ? (
            <Typography>Lade Produkte …</Typography>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                mb: 3,
                justifyContent: { xs: "center", sm: "flex-start" }
              }}
            >
              {filteredProdukte.length === 0 ? (
                <Typography color="text.secondary">Keine Produkte in dieser Kategorie.</Typography>
              ) : (
                filteredProdukte.map(prod => (
                  <Paper
                    key={prod.id}
                    sx={{
                      p: 2,
                      minWidth: 120,
                      maxWidth: 180,
                      textAlign: "center",
                      bgcolor: CATEGORY_COLORS[prod.kategorie] || "#fff",
                      boxShadow: 2,
                      borderRadius: 3,
                      mx: "auto"
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      {prod.name}
                    </Typography>
                    <Typography sx={{ mb: 1 }}>
                      <b>
                        {typeof prod.preis === "number"
                          ? prod.preis.toFixed(2)
                          : Number(prod.preis).toFixed(2)} €
                      </b>
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ mr: 1, minWidth: 32 }}
                        onClick={() => handleAddProdukt(prod)}
                        aria-label={`Hinzufügen ${prod.name}`}
                      >
                        <AddIcon />
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 32 }}
                        onClick={() => handleRemoveProdukt(prod)}
                        aria-label={`Entfernen ${prod.name}`}
                      >
                        <RemoveIcon />
                      </Button>
                    </Box>
                    <Typography sx={{ fontSize: 14 }}>
                      Im Verkauf: {verkauf.find(v => v.produkt.id === prod.id)?.anzahl || 0}
                    </Typography>
                  </Paper>
                ))
              )}
            </Box>
          )}

          {/* Verkaufsliste und Summe */}
          <Paper sx={{ p: 2, mb: 2, bgcolor: "#f5f5f5" }}>
            <Typography variant="h6">Produkte im Verkauf:</Typography>
            {verkauf.length === 0 ? (
              <Typography color="text.secondary">Keine Produkte gewählt.</Typography>
            ) : (
              verkauf.map(v => (
                <Typography key={v.produkt.id} sx={{ fontSize: 17 }}>
                  {v.produkt.name} × {v.anzahl} = {typeof v.produkt.preis === "number"
                    ? (v.produkt.preis * v.anzahl).toFixed(2)
                    : (Number(v.produkt.preis) * v.anzahl).toFixed(2)} €
                </Typography>
              ))
            )}
            <Typography sx={{ mt: 2, fontWeight: "bold", fontSize: 22 }}>
              Gesamtpreis: {gesamtpreis.toFixed(2)} €
            </Typography>
          </Paper>

          {/* Große Buttons am unteren Rand */}
          <Box sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "stretch",
            mb: 1
          }}>
            <Button
              variant="contained"
              color="success"
              onClick={handleBestaetigen}
              disabled={verkauf.length === 0}
              sx={{
                fontSize: 20,
                py: 2,
                flex: 1,
                borderRadius: 2
              }}
            >
              Verkauf bestätigen
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleSessionEnd}
              sx={{
                fontSize: 20,
                py: 2,
                flex: 1,
                borderRadius: 2
              }}
            >
              Verkauf beenden
            </Button>
          </Box>
        </Paper>
      )}

      <Snackbar
        open={!!snack.message}
        autoHideDuration={2500}
        onClose={() => setSnack({ message: "", severity: "success" })}
        message={snack.message}
      />
    </Box>
  );
};

export default Kasse;