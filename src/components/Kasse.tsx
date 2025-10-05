import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Switch,
  FormControlLabel,
} from "@mui/material";
import api from "../api/api";

type KuehlschrankProdukt = {
  id: number;
  name: string;
  bestand: number;
  preis?: number;
  kategorie?: string;
};
type Kuehlschrank = {
  id: number;
  name: string;
  standort: string;
  inhalt: KuehlschrankProdukt[];
};
type AuswertungRow = {
  produkt: string;
  kategorie: string;
  verkauft: number;
  umsatz: number;
};

const Kasse = () => {
  const [kuehlschraenke, setKuehlschraenke] = useState<Kuehlschrank[]>([]);
  const [snack, setSnack] = useState<string>("");
  const [auswertungOpen, setAuswertungOpen] = useState(false);
  const [auswertung, setAuswertung] = useState<AuswertungRow[]>([]);
  const [anzahl, setAnzahl] = useState<{ [id: number]: number }>({});
  const [pfandAktiv, setPfandAktiv] = useState(false);

  useEffect(() => {
    fetchKuehlschraenke();
  }, []);

  const fetchKuehlschraenke = async () => {
    const res = await api.get<Kuehlschrank[]>("/kiosk/kuehlschraenke");
    setKuehlschraenke(res.data);
  };

  const handleVerkauf = async (
    produktId: number,
    kuehlschrankId: number,
    preis?: number
  ) => {
    const count = anzahl[produktId] ?? 1;
    const pfand = pfandAktiv ? 1 * count : 0;
    await api.post("/kiosk/verkauf", {
      produktId,
      anzahl: count,
      kuehlschrankId,
    });
    setSnack(
      `Verkauf gebucht! Gesamt: ${((preis ?? 0) * count + pfand).toFixed(2)} €`
    );
    fetchKuehlschraenke();
    setAnzahl((a) => ({ ...a, [produktId]: 1 }));
  };

  const loadAuswertung = async () => {
    const date = new Date();
    const yyyyMMdd = date.toISOString().split("T")[0];
    const from = `${yyyyMMdd}T00:00:00`;
    const to = `${yyyyMMdd}T23:59:59`;
    const res = await api.get<AuswertungRow[]>(
      `/kiosk/auswertung?from=${from}&to=${to}`
    );
    setAuswertung(res.data);
    setAuswertungOpen(true);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" mb={2}>
        Kasse
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={pfandAktiv}
            onChange={(_, checked) => setPfandAktiv(checked)}
            color="primary"
          />
        }
        label="Pfand aktivieren (1 € auf jedes Produkt)"
        sx={{ mb: 2 }}
      />
      <Button variant="outlined" sx={{ mb: 2 }} onClick={loadAuswertung}>
        Auswertung anzeigen
      </Button>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {kuehlschraenke.flatMap((k) =>
          k.inhalt.map((prod) => (
            <Paper key={prod.id} sx={{ p: 2, minWidth: 150, textAlign: "center" }}>
              <Typography>
                <b>{prod.name}</b>
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Kategorie: {prod.kategorie ?? "-"}
              </Typography>
              <Typography variant="body2">Bestand: {prod.bestand}</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Preis: {prod.preis ? prod.preis.toFixed(2) : "-"} €
                {pfandAktiv ? " + 1 € Pfand" : ""}
              </Typography>
              <TextField
                label="Stückzahl"
                type="number"
                size="small"
                value={anzahl[prod.id] ?? 1}
                onChange={(e) =>
                  setAnzahl((a) => ({
                    ...a,
                    [prod.id]: Math.max(1, Number(e.target.value)),
                  }))
                }
                sx={{ mb: 1, width: 80 }}
                inputProps={{ min: 1, max: prod.bestand }}
              />
              <Button
                variant="contained"
                color="success"
                fullWidth
                sx={{ mt: 1 }}
                onClick={() => handleVerkauf(prod.id, k.id, prod.preis)}
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
        <Alert severity="success" onClose={() => setSnack("")}>
          {snack}
        </Alert>
      </Snackbar>
      <Dialog open={auswertungOpen} onClose={() => setAuswertungOpen(false)}>
        <DialogTitle>Verkaufs-Auswertung</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Produkt</TableCell>
                <TableCell>Kategorie</TableCell>
                <TableCell>Verkauft</TableCell>
                <TableCell>Umsatz (€)</TableCell>
                <TableCell>Pfand (€)</TableCell>
                <TableCell>Gesamt (€)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auswertung.map((row) => {
                const pfand = pfandAktiv ? row.verkauft * 1 : 0;
                const gesamt = row.umsatz + pfand;
                return (
                  <TableRow key={row.produkt}>
                    <TableCell>{row.produkt}</TableCell>
                    <TableCell>{row.kategorie}</TableCell>
                    <TableCell>{row.verkauft}</TableCell>
                    <TableCell>{row.umsatz.toFixed(2)}</TableCell>
                    <TableCell>{pfand.toFixed(2)}</TableCell>
                    <TableCell>{gesamt.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Kasse;