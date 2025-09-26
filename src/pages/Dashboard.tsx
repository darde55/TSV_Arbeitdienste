import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  CircularProgress,
} from "@mui/material";

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

const dummyTermine: Termin[] = [
  {
    id: 1,
    titel: "Arbeitseinsatz",
    beschreibung: "Platzpflege am Samstag",
    datum: "2025-10-01",
    beginn: "10:00",
    ende: "14:00",
    anzahl: 10,
    stichtag: "2025-09-28",
    ansprechpartner_name: "Max Mustermann",
    ansprechpartner_mail: "max@verein.de",
    score: 0,
  },
];

const Dashboard: React.FC = () => {
  const [termine, setTermine] = useState<Termin[]>([]);
  const [loading, setLoading] = useState(true);
  const [myTeilnahmen, setMyTeilnahmen] = useState<number[]>([]);
  const [joining, setJoining] = useState<number | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setTermine(dummyTermine);
      setLoading(false);
    }, 1000);
  }, []);

  const handleTeilnehmen = (id: number) => {
    setJoining(id);
    setTimeout(() => {
      setMyTeilnahmen((prev) => [...prev, id]);
      setJoining(null);
    }, 500);
  };

  const handleAbmelden = (id: number) => {
    setJoining(id);
    setTimeout(() => {
      setMyTeilnahmen((prev) => prev.filter((tid) => tid !== id));
      setJoining(null);
    }, 500);
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
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            justifyContent: "flex-start",
          }}
        >
          {termine.map((termin) => {
            const isAngemeldet = myTeilnahmen.includes(termin.id);
            const past =
              new Date(termin.datum).getTime() < new Date().getTime() - 24 * 3600 * 1000;
            return (
              <Box key={termin.id} sx={{ width: { xs: "100%", sm: "48%", md: "31%" } }}>
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
              </Box>
            );
          })}
        </Box>
      )}
    </Container>
  );
};

export default Dashboard;