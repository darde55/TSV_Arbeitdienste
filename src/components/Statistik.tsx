import { useEffect, useState } from "react";
import { Box, Typography, ToggleButtonGroup, ToggleButton, Paper } from "@mui/material";
import { BarChart, LineChart } from "@mui/x-charts";
import api from "../api/api";

// Typen für Backend-Daten
type Einnahmen = {
  jahr: string; // z.B. "2025-01-01T00:00:00.000Z"
  monat: string; // z.B. "2025-01-01T00:00:00.000Z"
  umsatz: number;
};

type ProduktStat = {
  name: string;
  jahr: string;
  verkauft: number;
};

type VerkaufSession = {
  id: number;
  started_at: string;
  ended_at: string | null;
  username: string;
  // Optional: weitere Felder, z.B. Gesamtumsatz, Anzahl Verkäufe, etc.
};

const Statistik = () => {
  const [einnahmen, setEinnahmen] = useState<Einnahmen[]>([]);
  const [produktStat, setProduktStat] = useState<ProduktStat[]>([]);
  const [modus, setModus] = useState<"umsatz" | "produkte" | "session">("umsatz");
  const [sessions, setSessions] = useState<VerkaufSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<Einnahmen[]>("/kiosk/statistik/gesamteinahmen").then(res => setEinnahmen(res.data));
    api.get<ProduktStat[]>("/kiosk/statistik/produktJahr").then(res => setProduktStat(res.data));
    // Optional: Session-Statistik (Backend-Endpunkt muss existieren)
    api.get<VerkaufSession[]>("/kiosk/statistik/session").then(res => setSessions(res.data)).finally(() => setLoading(false));
  }, []);

  // Umsatz-Graph-Daten
  const umsatzLabels = einnahmen.map(e => {
    const jahr = e.jahr?.slice(0, 4);
    const monat = e.monat?.slice(5, 7);
    return `${jahr}-${monat}`;
  });
  const umsatzData = einnahmen.map(e => e.umsatz);

  // Produktstatistik-Daten
  const jahre = Array.from(new Set(produktStat.map(p => p.jahr)));
  const produkte = Array.from(new Set(produktStat.map(p => p.name)));
  const produktData = produkte.map(prod =>
    jahre.map(jahr =>
      produktStat.find(p => p.name === prod && p.jahr === jahr)?.verkauft || 0
    )
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Statistik</Typography>
      <ToggleButtonGroup
        value={modus}
        exclusive
        onChange={(_, value) => value && setModus(value)}
        sx={{ mb: 3 }}
      >
        <ToggleButton value="umsatz">Gesamteinnahmen</ToggleButton>
        <ToggleButton value="produkte">Verkäufe pro Produkt/Jahr</ToggleButton>
        <ToggleButton value="session">Verkaufssessions</ToggleButton>
      </ToggleButtonGroup>

      {loading && <Typography sx={{ mb: 2 }}>Lade Statistikdaten...</Typography>}

      {modus === "umsatz" && (
        <LineChart
          xAxis={[{ scaleType: "point", data: umsatzLabels }]}
          series={[{ data: umsatzData, label: "Umsatz (€)", color: "#1976d2" }]}
          height={340}
          width={Math.max(400, umsatzLabels.length * 80)}
        />
      )}

      {modus === "produkte" && (
        <BarChart
          xAxis={[{ scaleType: "band", data: jahre }]}
          series={produkte.map((prod, idx) => ({
            data: produktData[idx],
            label: prod,
          }))}
          height={340}
          width={Math.max(400, jahre.length * 80)}
        />
      )}

      {modus === "session" && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Verkaufssessions</Typography>
          {sessions.length === 0 ? (
            <Typography color="text.secondary">Keine Sessions gefunden.</Typography>
          ) : (
            sessions.map(s => (
              <Box key={s.id} sx={{ mb: 2, borderBottom: "1px solid #eee", pb: 1 }}>
                <Typography>
                  <b>Session #{s.id}</b> – Benutzer: {s.username}
                </Typography>
                <Typography>
                  Start: {new Date(s.started_at).toLocaleString()}<br />
                  Ende: {s.ended_at ? new Date(s.ended_at).toLocaleString() : "läuft"}
                </Typography>
                {/* Optional: Umsatz, Anzahl Verkäufe, weitere Statistiken hier */}
              </Box>
            ))
          )}
        </Paper>
      )}
    </Box>
  );
};

export default Statistik;