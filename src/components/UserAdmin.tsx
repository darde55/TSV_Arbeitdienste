import React, { useEffect, useState, useCallback } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Box,
  Alert,
  Divider,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import api from "../api/api";
import type { SelectChangeEvent } from "@mui/material/Select";

type User = {
  username: string;
  email: string;
  role: string;
  score: number;
  password?: string;
};

const initialUserState: Omit<User, "score"> = {
  username: "",
  email: "",
  role: "user",
  password: "",
};

const ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

const PAGE_SIZE = 10;

const UserAdmin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  // Score wird beim Bearbeiten als eigener State gehalten
  const [form, setForm] = useState<Omit<User, "score">>(initialUserState);
  const [score, setScore] = useState<number>(0);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get<User[]>("/users");
      setUsers(res.data);
    } catch (err) {
      setUsers([]);
      setMessage("Fehler beim Laden der Benutzer!");
      console.error("User-Admin Load Error:", err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (e: SelectChangeEvent) => {
    setForm((prev) => ({
      ...prev,
      role: e.target.value as string,
    }));
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScore(Number(e.target.value));
  };

  const handleCreate = async () => {
    try {
      await api.post("/users", { ...form });
      setMessage("Benutzer erfolgreich angelegt!");
      setForm(initialUserState);
      setScore(0);
      fetchUsers();
    } catch (err) {
      setMessage("Fehler beim Anlegen!");
      console.error("User-Admin Create Error:", err);
    }
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setForm({ ...user, password: "" }); // leeres Passwort beim Bearbeiten
    setScore(user.score ?? 0);
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    try {
      await api.put(`/users/${editUser.username}`, { ...form, score });
      setMessage("Benutzer erfolgreich bearbeitet!");
      setEditUser(null);
      setForm(initialUserState);
      setScore(0);
      fetchUsers();
    } catch (err) {
      setMessage("Fehler beim Bearbeiten!");
      console.error("User-Admin Update Error:", err);
    }
  };

  const handleDelete = async (username: string) => {
    try {
      await api.delete(`/users/${username}`);
      setMessage("Benutzer gelöscht");
      fetchUsers();
    } catch (err) {
      setMessage("Fehler beim Löschen!");
      console.error("User-Admin Delete Error:", err);
    }
  };

  // Suche und Pagination für Userliste
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const pageCount = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1); // Seite zurücksetzen, wenn Suche geändert wird
  }, [search, users.length]);

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" mb={2}>
        Benutzerverwaltung
      </Typography>
      {/* Abschnitt 1: Neuen Benutzer anlegen oder bearbeiten */}
      <Typography mb={1}>{editUser ? "Benutzer bearbeiten:" : "Neuen Benutzer anlegen:"}</Typography>
      <Box mb={2} display="flex" flexWrap="wrap" gap={1}>
        <TextField
          label="Benutzername"
          name="username"
          value={form.username}
          onChange={handleChange}
          size="small"
          disabled={!!editUser}
        />
        <TextField
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          size="small"
        />
        <TextField
          label="Passwort"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          size="small"
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="role-select-label">Rolle</InputLabel>
          <Select
            labelId="role-select-label"
            name="role"
            value={form.role}
            label="Rolle"
            onChange={handleRoleChange}
          >
            {ROLE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {editUser && (
          <TextField
            label="Score"
            name="score"
            type="number"
            value={score}
            onChange={handleScoreChange}
            size="small"
            sx={{ minWidth: 80 }}
          />
        )}
        {!editUser ? (
          <Button variant="contained" onClick={handleCreate}>
            Anlegen
          </Button>
        ) : (
          <Button
            variant="contained"
            color="secondary"
            onClick={handleUpdate}
          >
            Speichern
          </Button>
        )}
        {editUser && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              setEditUser(null);
              setForm(initialUserState);
              setScore(0);
            }}
          >
            Abbrechen
          </Button>
        )}
      </Box>
      <Divider sx={{ my: 2 }} />
      {/* Abschnitt 2: User bearbeiten/löschen */}
      <Typography mb={1}>Vorhandene Benutzer bearbeiten/löschen:</Typography>
      <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          size="small"
          label="Suche"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </Box>
      {message && (
        <Alert
          severity={message.includes("Fehler") ? "error" : "success"}
          sx={{ mb: 1 }}
        >
          {message}
        </Alert>
      )}
      <List>
        {pagedUsers.map((user) => (
          <ListItem
            key={user.username}
            secondaryAction={
              <>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={() => handleEdit(user)}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDelete(user.username)}
                >
                  <Delete />
                </IconButton>
              </>
            }
          >
            <ListItemText
              primary={`${user.username} (${user.role})`}
              secondary={`E-Mail: ${user.email} | Score: ${user.score}`}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 1, display: "flex", justifyContent: "center" }}>
        {pageCount > 1 && (
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            size="small"
          />
        )}
      </Box>
    </Paper>
  );
};

export default UserAdmin;