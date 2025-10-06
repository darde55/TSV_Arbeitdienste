import { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import api from "../api/api";

// Typdefinitionen für Statistik-Daten
type UmsatzDatum = {
  monat: string;      // ISO-String (z.B. "2025-10-01T00:00:00.000Z")
  umsatz: number;
};

type BestsellerDatum = {
  name: string;
  verkauft: number;
};

type VerkaufDatum = {
  id: number;
  verkauft_am: string;
  name: string;
  anzahl: number;
  kuehlschrank_id: number;
  username: string;
};

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
  "#ad1457", "#7b1fa2", "#388e3c", "#1976d2", "#fbc02d", "#c62828"
];

const Statistik = () => {
  const [jahr, setJahr] = useState<number | "">("");
  const [monat, setMonat] = useState<number | "">("");
  const [loading, setLoading] = useState(true);

  const [umsatz, setUmsatz] = useState<UmsatzDatum[]>([]);
  const [bestseller, setBestseller] = useState<BestsellerDatum[]>([]);
  const [verkaeufe, setVerkaeufe] = useState<VerkaufDatum[]>([]);

  useEffect(() => {
    setLoading(true);
    api.get("/kiosk/statistik/gesamteinahmen")
      .then(res => setUmsatz(res.data))
      .finally(() => setLoading(false));
    fetchBestseller();
    fetchVerkaeufe();
    // eslint-disable-next-line
  }, []);

  // Bestseller nach Jahr/Monat
  const fetchBestseller = () => {
    let url = "/kiosk/statistik/bestseller";
    const params = [];
    if (jahr) params.push(`jahr=${jahr}`);
    if (monat) params.push(`monat=${monat}`);
    if (params.length) url += "?" + params.join("&");
    api.get(url).then(res => setBestseller(res.data));
  };

  // Verkäufe für Tabelle
  const fetchVerkaeufe = () => {
    api.get("/kiosk/statistik/verkaeufe").then(res => setVerkaeufe(res.data));
  };

  // Jahr/Monat-Arrays für Filter
  const jahre = Array.from(new Set(umsatz.map(u => new Date(u.monat).getFullYear()))).sort();
  const monate = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Statistik
      </Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="jahr-label">Jahr</InputLabel>
            <Select
              labelId="jahr-label"
              value={jahr}
              label="Jahr"
              onChange={e => {
                setJahr(e.target.value as number);
                setMonat(""); // Monat zurücksetzen
                setTimeout(fetchBestseller, 0);
              }}
            >
              <MenuItem value="">Alle</MenuItem>
              {jahre.map(j => (
                <MenuItem key={j} value={j}>{j}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="monat-label">Monat</InputLabel>
            <Select
              labelId="monat-label"
              value={monat}
              label="Monat"
              onChange={e => {
                setMonat(e.target.value as number);
                setTimeout(fetchBestseller, 0);
              }}
              disabled={!jahr}
            >
              <MenuItem value="">Alle</MenuItem>
              {monate.map(m => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 3 }}>
        {/* Umsatz-Diagramm */}
        <Paper sx={{ p: 2, flex: 1, minWidth: 350 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Umsatz</Typography>
          {loading ? <CircularProgress /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={umsatz}>
                <XAxis
                  dataKey="monat"
                  tickFormatter={m => new Date(m).toLocaleDateString("de-DE", { year: 'numeric', month: 'short' })}
                />
                <YAxis />
                <Tooltip labelFormatter={m => new Date(m).toLocaleDateString("de-DE", { year: 'numeric', month: 'short' })} />
                <Bar dataKey="umsatz" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* Bestseller-Diagramm */}
        <Paper sx={{ p: 2, flex: 1, minWidth: 350 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Bestseller-Produkte</Typography>
          {bestseller.length === 0 ? <Typography>Keine Daten</Typography> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={bestseller}
                  dataKey="verkauft"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {bestseller.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Paper>
      </Box>

      {/* Tabellenansicht */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Letzte Verkäufe</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Datum</TableCell>
              <TableCell>Produkt</TableCell>
              <TableCell>Anzahl</TableCell>
              <TableCell>Kühlschrank</TableCell>
              <TableCell>Verkäufer</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {verkaeufe.map(v => (
              <TableRow key={v.id}>
                <TableCell>{new Date(v.verkauft_am).toLocaleString("de-DE")}</TableCell>
                <TableCell>{v.name}</TableCell>
                <TableCell>{v.anzahl}</TableCell>
                <TableCell>{v.kuehlschrank_id}</TableCell>
                <TableCell>{v.username}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Statistik;