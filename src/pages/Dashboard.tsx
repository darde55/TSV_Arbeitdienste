import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Box,
  CircularProgress,
} from "@mui/material";
import api from "../api/api";
import { useUserStore } from "../store/userStore";

interface Termin {
  id: number;
  titel: string;
  beschreibung: string;
  datum: string;
  beginn: string;
  ende: string;
  anzahl: number;
  stichtag: string;
  ansprechpartner_name: string;
  ansprechpartner_mail: string;
  score: number;
}

const Dashboard: React.FC = () => {
  const [termine, setTermine] = useState<Termin[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUserStore();
  const [myTeilnahmen, setMyTeilnahmen] = useState<number[]>([]);
  const [joining, setJoining] = useState<number | null>(null);

  const fetchTermine = async () => {
    setLoading(true);
    try {
      const res = await api.get("/termine");
      setTermine(res.data);
    } finally {
      setLoading(false);
    }
  };

  // Optional: fetchMyTeilnahmen() für eigene Teilnahmen (ausbauen, wenn du Endpunkt hast)

  useEffect(() => {
    fetchTermine();
  }, []);

  const handleTeilnehmen = async (id: number) => {
    setJoining(id);
    try {
      await api.post(`/termine/${id}/teilnehmen`);
      setMyTeilnahmen((prev) => [...prev, id]);
    } finally {
      setJoining(null);
    }
  };

  const handleAbmelden = async (id: number) => {
    setJoining(id);
    try {
      await api.delete(`/termine/${id}/teilnehmen`);
      setMyTeilnahmen((prev) => prev.filter((tid) => tid !== id));
    } finally {
      setJoining(null);
    }
  };

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" mb={2}>
        Termine
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {termine.map((termin) => {
            const isAngemeldet = myTeilnahmen.includes(termin.id);
            const past =
              new Date(termin.datum).getTime() < new Date().getTime() - 24 * 3600 * 1000;
            return (
              <Grid item xs={12} sm={6} md={4} key={termin.id}>
                <Card
                  variant="outlined"
                  sx={{
                    opacity: past ? 0.6 : 1,
                    borderLeft: `8px solid ${past ? "#ccc" : "#B71C1C"}`,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6">{termin.titel}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {new Date(termin.datum).toLocaleDateString()} {termin.beginn} - {termin.ende}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      {termin.beschreibung}
                    </Typography>
                    <Chip
                      label={`Max. ${termin.anzahl} Plätze`}
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`Stichtag: ${new Date(termin.stichtag).toLocaleDateString()}`}
                      color="secondary"
                      size="small"
                    />
                  </CardContent>
                  <CardActions>
                    {isAngemeldet ? (
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleAbmelden(termin.id)}
                        disabled={joining === termin.id || past}
                      >
                        Abmelden
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleTeilnehmen(termin.id)}
                        disabled={joining === termin.id || past}
                      >
                        Anmelden
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard;