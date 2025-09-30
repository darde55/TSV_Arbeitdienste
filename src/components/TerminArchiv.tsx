import React, { useEffect, useState } from "react";
import {
  Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Box, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import api from "../api/api";

type Termin = {
  id: number;
  titel: string;
  datum: string;
  beginn?: string;
  ende?: string;
};

const TerminArchiv: React.FC = () => {
  const [termine, setTermine] = useState<Termin[]>([]);
  const [sortBy, setSortBy] = useState<"datum" | "titel">("datum");
  const [snackOpen, setSnackOpen] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchTermine = async () => {
    try {
      const res = await api.get<Termin[]>("/termine");
      setTermine(res.data);
    } catch {
      setError("Fehler beim Laden der Termine.");
    }
  };

  useEffect(() => {
    fetchTermine();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/termine/${id}`);
      setSnackOpen(true);
      fetchTermine();
    } catch {
      setError("Fehler beim Löschen des Termins.");
    }
  };

  const sortedTermine = [...termine].sort((a, b) => {
    if (sortBy === "datum") {
      return new Date(a.datum).getTime() - new Date(b.datum).getTime();
    }
    return a.titel.localeCompare(b.titel, "de", { sensitivity: "base" });
  });

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" mb={2}>Termin-Archiv</Typography>
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <FormControl size="small">
          <InputLabel id="sort-label">Sortieren nach</InputLabel>
          <Select
            labelId="sort-label"
            value={sortBy}
            label="Sortieren nach"
            onChange={e => setSortBy(e.target.value as "datum" | "titel")}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="datum">Datum</MenuItem>
            <MenuItem value="titel">Alphabetisch</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Titel</TableCell>
              <TableCell>Datum</TableCell>
              <TableCell>Beginn</TableCell>
              <TableCell>Ende</TableCell>
              <TableCell>Löschen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTermine.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.titel}</TableCell>
                <TableCell>
                  {new Date(t.datum).toLocaleDateString("de-DE")}
                </TableCell>
                <TableCell>{t.beginn}</TableCell>
                <TableCell>{t.ende}</TableCell>
                <TableCell>
                  <IconButton color="error" onClick={() => handleDelete(t.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSnackOpen(false)}>
          Termin wurde gelöscht!
        </Alert>
      </Snackbar>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
};

export default TerminArchiv;