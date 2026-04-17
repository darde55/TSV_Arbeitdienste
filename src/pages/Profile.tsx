import React, { useEffect, useState } from "react";
import {
  Paper, Typography, Box, Chip, Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow
} from "@mui/material";
import api from "../api/api";
import axios from "axios";

interface UserProfileType {
  username: string;
  email: string;
  role: string;
  score: number;
}

interface ScoreHistoryItem {
  delta: number;
  reason: string;
  created_at: string;
  termin_titel?: string | null;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [error, setError] = useState<string>("");
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryItem[]>([]);
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [pwError, setPwError] = useState<string>("");
  const [pwSuccess, setPwSuccess] = useState<string>("");
  const [pwLoading, setPwLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Du bist nicht eingeloggt. Bitte melde dich zuerst an.");
        return;
      }
      try {
        const [res, historyRes] = await Promise.all([
          api.get<UserProfileType>("/profile", { headers: { Authorization: `Bearer ${token}` } }),
          api.get<ScoreHistoryItem[]>("/profile/score-history", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setProfile(res.data);
        setScoreHistory(historyRes.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
              "Fehler beim Laden des Profils. Dein Token ist ungültig, abgelaufen oder die API-Route /api/profile existiert nicht."
          );
        } else {
          setError("Unbekannter Fehler beim Laden des Profils.");
        }
        console.error("Profil-Fehler:", err);
      }
    };
    fetchProfile();
  }, []);

  const handlePwChange = async () => {
    setPwError("");
    setPwSuccess("");
    if (!oldPw || !newPw || !newPwConfirm) {
      setPwError("Bitte fülle alle Felder aus.");
      return;
    }
    if (newPw !== newPwConfirm) {
      setPwError("Die neuen Passwörter stimmen nicht überein.");
      return;
    }
    setPwLoading(true);
    try {
      const token = localStorage.getItem("token");
      await api.post("/profile/password", {
        oldPassword: oldPw,
        newPassword: newPw,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPwSuccess("Passwort erfolgreich geändert!");
      setOldPw("");
      setNewPw("");
      setNewPwConfirm("");
      setPwDialogOpen(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setPwError(
          err.response?.data?.message ||
          "Fehler beim Ändern des Passworts. Überprüfe dein altes Passwort."
        );
      } else {
        setPwError("Unbekannter Fehler beim Passwortwechsel.");
      }
    }
    setPwLoading(false);
  };

  if (error) {
    return (
      <Box sx={{ mt: 5, display: "flex", justifyContent: "center" }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!profile) return null;

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleString("de-DE");
  };

  return (
    <Box sx={{ mt: 5, display: "flex", justifyContent: "center", gap: 3, flexWrap: "wrap" }}>
      <Paper sx={{ p: 4, maxWidth: 400, width: "100%" }} elevation={2}>
        <Typography variant="h6" mb={2}>
          Mein Profil
        </Typography>
        <Typography>
          <b>Benutzername:</b> {profile.username}
        </Typography>
        <Typography>
          <b>E-Mail:</b> {profile.email}
        </Typography>
        <Typography>
          <b>Rolle:</b>{" "}
          <Chip
            label={
              profile.role === "admin" 
                ? "Admin" 
                : profile.role === "organisator" 
                  ? "Organisator" 
                  : "Mitglied"
            }
            color={profile.role === "admin" ? "secondary" : "primary"}
            size="small"
          />
        </Typography>
        <Typography sx={{ mt: 1 }}>
          <b>Score:</b> {profile.score}
        </Typography>

        <Button
          sx={{ mt: 3 }}
          variant="outlined"
          onClick={() => setPwDialogOpen(true)}
        >
          Passwort ändern
        </Button>

        {pwSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>{pwSuccess}</Alert>
        )}
      </Paper>

      <Paper sx={{ p: 4, maxWidth: 700, width: "100%" }} elevation={2}>
        <Typography variant="h6" mb={2}>
          Score-Transparenz
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Datum</TableCell>
                <TableCell>Grund</TableCell>
                <TableCell>Termin</TableCell>
                <TableCell align="right">Delta</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scoreHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>Keine Einträge vorhanden.</TableCell>
                </TableRow>
              )}
              {scoreHistory.map((item, idx) => (
                <TableRow key={`${item.created_at}-${idx}`}>
                  <TableCell>{formatDateTime(item.created_at)}</TableCell>
                  <TableCell>{item.reason}</TableCell>
                  <TableCell>{item.termin_titel || "-"}</TableCell>
                  <TableCell align="right">{item.delta > 0 ? `+${item.delta}` : item.delta}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={pwDialogOpen} onClose={() => setPwDialogOpen(false)}>
        <DialogTitle>Passwort ändern</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <TextField
            label="Altes Passwort"
            type="password"
            fullWidth
            margin="normal"
            value={oldPw}
            onChange={e => setOldPw(e.target.value)}
            autoComplete="current-password"
          />
          <TextField
            label="Neues Passwort"
            type="password"
            fullWidth
            margin="normal"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            autoComplete="new-password"
          />
          <TextField
            label="Neues Passwort wiederholen"
            type="password"
            fullWidth
            margin="normal"
            value={newPwConfirm}
            onChange={e => setNewPwConfirm(e.target.value)}
            autoComplete="new-password"
          />
          {pwError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {pwError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handlePwChange}
            disabled={pwLoading}
            variant="contained"
            color="primary"
          >
            {pwLoading ? <CircularProgress size={20} /> : "Speichern"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;