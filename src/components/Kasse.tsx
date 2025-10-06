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
  kategorie: string;
};

type VerkaufItem = {
  produkt: Produkt;
  anzahl: number;
};

type KuehlschrankInhalt = {
  produkt_id: number;
  bestand: number;
  kuehlschrank_id: number;
};

type Kuehlschrank = {
  id: number;
  name: string;
  inhalt: KuehlschrankInhalt[];
};

const CATEGORY_COLORS: Record<string, string> = {
  Alkoholfrei: "#90caf9",
  Alkoholisch: "#ffb74d",
  Sonstiges: "#c8e6c9"
};

const Kasse = () => {
  const [sessionActive, setSessionActive] = useState(() => {
    return localStorage.getItem("verkaufSessionActive") === "true";
  });
  const [startDialogOpen, setStartDialogOpen] = useState(!sessionActive);
  const [produkte, setProdukte] = useState<Produkt[]>([]);
  const [verkauf, setVerkauf] = useState<VerkaufItem[]>([]);
  const [snack, setSnack] = useState<{ message: string; severity: "success" | "error" }>({ message: "", severity: "success" });
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<"Alkoholfrei" | "Alkoholisch" | "Sonstiges">("Alkoholfrei");

  // Kühlschrankdaten für aktuellen Bestand
  const [kuehlschraenke, setKuehlschraenke] = useState<Kuehlschrank[]>([]);

  // Verkaufssession-ID
  const [sessionId, setSessionId] = useState<number | null>(() => {
    const id = localStorage.getItem("verkaufSessionId");
    return id ? Number(id) : null;
  });

  useEffect(() => {
    setLoading(true);
    api.get<Produkt[]>("/kiosk/preisliste")
      .then(res => setProdukte(res.data))
      .finally(() => setLoading(false));
    api.get<Kuehlschrank[]>("/kiosk/kuehlschraenke")
      .then(res => setKuehlschraenke(res.data))
      .catch(() => setKuehlschraenke([]));
  }, []);

  // Verkaufssumme berechnen
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

  // Verkauf bestätigen (Session-ID mitschicken!)
  const handleBestaetigen = async () => {
    if (verkauf.length === 0 || !sessionId) {
      setSnack({ message: "Session nicht aktiv!", severity: "error" });
      return;
    }
    try {
      for (const v of verkauf) {
        await api.post("/kiosk/verkauf", {
          produktId: v.produkt.id,
          anzahl: v.anzahl,
          sessionId: sessionId, // <- WICHTIG!
        });
      }
      setSnack({ message: "Verkauf gebucht!", severity: "success" });
      setVerkauf([]);
      api.get<Kuehlschrank[]>("/kiosk/kuehlschraenke")
        .then(res => setKuehlschraenke(res.data))
        .catch(() => setKuehlschraenke([]));
    } catch {
      setSnack({ message: "Fehler beim Buchen!", severity: "error" });
    }
  };

  // Verkaufssession starten (Session-ID holen und speichern!)
  const handleSessionStart = async () => {
    try {
      const res = await api.post("/kiosk/session/start");
      setSessionActive(true);
      setStartDialogOpen(false);
      setVerkauf([]);
      setSessionId(res.data.id);
      localStorage.setItem("verkaufSessionActive", "true");
      localStorage.setItem("verkaufSessionId", String(res.data.id));
    } catch {
      setSnack({ message: "Fehler beim Starten der Session!", severity: "error" });
    }
  };

  // Verkaufssession beenden (Session-ID auf null setzen, Endpunkt aufrufen)
  const handleSessionEnd = async () => {
    setSessionActive(false);
    setStartDialogOpen(true);
    setVerkauf([]);
    setSnack({ message: "Verkaufssession beendet!", severity: "success" });
    localStorage.setItem("verkaufSessionActive", "false");
    if (sessionId) {
      await api.post(`/kiosk/session/end/${sessionId}`);
      setSessionId(null);
      localStorage.removeItem("verkaufSessionId");
    }
  };

  // Session-Status und Session-ID in allen Tabs synchron halten
  useEffect(() => {
    const handler = () => {
      setSessionActive(localStorage.getItem("verkaufSessionActive") === "true");
      setStartDialogOpen(localStorage.getItem("verkaufSessionActive") !== "true");
      const id = localStorage.getItem("verkaufSessionId");
      setSessionId(id ? Number(id) : null);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Nach Kategorie filtern
  const filteredProdukte = produkte.filter(p => p.kategorie === category);

  // Bestände für ein Produkt aus allen Kühlschränken summieren & anzuzeigen
  const getBestandForProdukt = (produktId: number) => {
    const bestands = [];
    let gesamt = 0;
    for (const k of kuehlschraenke) {
      const inhalt = k.inhalt.find(i => i.produkt_id === produktId);
      if (inhalt) {
        bestands.push({ kuehlschrank: k.name, bestand: inhalt.bestand });
        gesamt += inhalt.bestand;
      }
    }
    return { gesamt, bestands };
  };

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
            Verkaufssession läuft {sessionId ? `(ID: ${sessionId})` : ""}
          </Typography>

          {/* Kategorie-Toggle */}
          <ToggleButtonGroup
            color="primary"
            value={category}
            exclusive
            onChange={(_, value) =>
              value && setCategory(value as "Alkoholfrei" | "Alkoholisch" | "Sonstiges")
            }
            sx={{ mb: 2, display: "flex", flexWrap: "wrap" }}
          >
            <ToggleButton value="Alkoholfrei">Alkoholfrei</ToggleButton>
            <ToggleButton value="Alkoholisch">Alkoholisch</ToggleButton>
            <ToggleButton value="Sonstiges">Sonstiges</ToggleButton>
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
                filteredProdukte.map(prod => {
                  const { gesamt, bestands } = getBestandForProdukt(prod.id);
                  return (
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

                      {/* Bestände anzeigen */}
                      <Typography sx={{ fontSize: 14, mt: 1 }}>
                        Bestand gesamt: <b>{gesamt}</b>
                      </Typography>
                      {bestands.length > 0 && (
                        <Box>
                          {bestands.map(b =>
                            <Typography key={b.kuehlschrank} sx={{ fontSize: 12 }}>
                              {b.kuehlschrank}: {b.bestand}
                            </Typography>
                          )}
                        </Box>
                      )}

                      <Typography sx={{ fontSize: 14, mt: 1 }}>
                        Im Verkauf: {verkauf.find(v => v.produkt.id === prod.id)?.anzahl || 0}
                      </Typography>
                    </Paper>
                  );
                })
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