import { useEffect, useState } from "react";
import { Box, Typography, Paper, Button, Snackbar, Alert } from "@mui/material";
import api from "../api/api";

type KuehlschrankProdukt = { id: number; name: string; bestand: number; preis?: number };
type Kuehlschrank = { id: number; name: string; standort: string; inhalt: KuehlschrankProdukt[] };

const Kasse = () => {
  const [kuehlschraenke, setKuehlschraenke] = useState<Kuehlschrank[]>([]);
  const [snack, setSnack] = useState<string>("");

  useEffect(() => {
    fetchKuehlschraenke();
  }, []);

  const fetchKuehlschraenke = async () => {
    const res = await api.get<Kuehlschrank[]>("/kiosk/kuehlschraenke");
    setKuehlschraenke(res.data);
  };

  const handleVerkauf = async (produktId: number, anzahl: number, kuehlschrankId: number) => {
    await api.post("/kiosk/verkauf", { produktId, anzahl, kuehlschrankId });
    setSnack("Verkauf gebucht!");
    fetchKuehlschraenke();
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" mb={2}>Kasse</Typography>
      {(!kuehlschraenke || kuehlschraenke.length === 0) && <Typography sx={{ color: "#888" }}>Keine Produkte vorhanden.</Typography>}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {kuehlschraenke.flatMap(k =>
          k.inhalt.map(prod => (
            <Paper key={prod.id} sx={{ p: 2, minWidth: 100, textAlign: "center" }}>
              <Typography>{prod.name}</Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Bestand: {prod.bestand} {typeof prod.preis === "number" && `- ${prod.preis.toFixed(2)} €`}
              </Typography>
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

export default Kasse;