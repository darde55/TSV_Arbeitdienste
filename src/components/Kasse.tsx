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
  Grid,
  Snackbar,
} from "@mui/material";
import api from "../api/api";

type Produkt = {
  id: number;
  name: string;
  preis: number;
  kategorie: string;
};

type VerkaufItem = {
  produkt: Produkt;
  anzahl: number;
};

const Kasse = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [startDialogOpen, setStartDialogOpen] = useState(true);
  const [produkte, setProdukte] = useState<Produkt[]>([]);
  const [verkauf, setVerkauf] = useState<VerkaufItem[]>([]);
  const [snack, setSnack] = useState<{ message: string; severity: "success" | "error" }>({ message: "", severity: "success" });

  useEffect(() => {
    api.get<Produkt[]>("/kiosk/preisliste").then(res => setProdukte(res.data));
  }, []);

  // Verkaufssumme berechnen
  const gesamtpreis = verkauf.reduce((sum, v) => sum + v.produkt.preis * v.anzahl, 0);

  // Produkt zu Verkauf hinzufügen/erhöhen
  const handleAddProdukt = (produkt: Produkt) => {
    setVerkauf(prev => {
      const idx = prev.findIndex(v => v.produkt.id === produkt.id);
      if (idx >= 0) {
        // Anzahl erhöhen
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
    try {
      // Produkte werden einzeln ans Backend gemeldet
      for (const v of verkauf) {
        await api.post("/kiosk/verkauf", {
          produktId: v.produkt.id,
          anzahl: v.anzahl,
          // kuehlschrankId: ggf. einbauen, falls Auswahl nötig
        });
      }
      setSnack({ message: "Verkauf gebucht!", severity: "success" });
      setVerkauf([]);
      // Option: Statistiken werden im Backend automatisch gespeichert
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
    // Option: Backend-Endpunkt zum Abschließen/Loggen der Session
  };

  // Session starten
  const handleSessionStart = () => {
    setSessionActive(true);
    setStartDialogOpen(false);
    setVerkauf([]);
  };

  return (
    <Box sx={{ p: 2 }}>
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
        <Paper sx={{ p: 2 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Verkaufssession läuft
          </Typography>

          {/* Produkt-Übersicht */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {produkte.map(prod => (
              <Grid item xs={12} sm={6} md={4} key={prod.id}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="subtitle1">{prod.name}</Typography>
                  <Typography color="text.secondary">{prod.kategorie}</Typography>
                  <Typography sx={{ my: 1 }}><b>{prod.preis.toFixed(2)} €</b></Typography>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mr: 1 }}
                    onClick={() => handleAddProdukt(prod)}
                  >
                    +
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleRemoveProdukt(prod)}
                  >
                    −
                  </Button>
                  <Typography sx={{ mt: 1 }}>Im aktuellen Verkauf: {verkauf.find(v => v.produkt.id === prod.id)?.anzahl || 0}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Verkaufsliste und Summe */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Produkte im Verkauf:</Typography>
            {verkauf.length === 0 ? (
              <Typography color="text.secondary">Keine Produkte gewählt.</Typography>
            ) : (
              verkauf.map(v => (
                <Typography key={v.produkt.id}>
                  {v.produkt.name} × {v.anzahl} = {(v.produkt.preis * v.anzahl).toFixed(2)} €
                </Typography>
              ))
            )}
            <Typography sx={{ mt: 2, fontWeight: "bold" }}>
              Gesamtpreis: {gesamtpreis.toFixed(2)} €
            </Typography>
          </Paper>

          {/* Button Verkauf bestätigen */}
          <Button
            variant="contained"
            color="success"
            onClick={handleBestaetigen}
            disabled={verkauf.length === 0}
            sx={{ mr: 2 }}
          >
            Verkauf bestätigen
          </Button>
          {/* Button Verkauf beenden */}
          <Button
            variant="outlined"
            color="error"
            onClick={handleSessionEnd}
          >
            Verkauf beenden
          </Button>
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