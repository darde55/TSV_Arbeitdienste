import React, { useEffect, useState } from "react";
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

const UserAdmin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<Omit<User, "score">>(initialUserState);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");

  // Helper to get token (from localStorage, Context, etc.)
  const getToken = () => localStorage.getItem("token");

  const fetchUsers = async () => {
    try {
      const res = await api.get<User[]>("/users", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setUsers(res.data);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleCreate = async () => {
    try {
      await api.post(
        "/users",
        { ...form },
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      setMessage("Benutzer erfolgreich angelegt!");
      setForm(initialUserState);
      fetchUsers();
    } catch {
      setMessage("Fehler beim Anlegen!");
    }
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setForm({ ...user, password: "" }); // leeres Passwort beim Bearbeiten
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    try {
      await api.put(`/users/${editUser.username}`, form, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setMessage("Benutzer erfolgreich bearbeitet!");
      setEditUser(null);
      setForm(initialUserState);
      fetchUsers();
    } catch {
      setMessage("Fehler beim Bearbeiten!");
    }
  };

  const handleDelete = async (username: string) => {
    try {
      await api.delete(`/users/${username}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setMessage("Benutzer gelöscht");
      fetchUsers();
    } catch {
      setMessage("Fehler beim Löschen!");
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" mb={2}>
        Benutzerverwaltung
      </Typography>
      {/* Abschnitt 1: Neuen Benutzer anlegen */}
      <Typography mb={1}>Neuen Benutzer anlegen:</Typography>
      <Box mb={2} display="flex" flexWrap="wrap" gap={1}>
        <TextField
          label="Benutzername"
          name="username"
          value={form.username}
          onChange={handleChange}
          size="small"
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
            }}
          >
            Abbrechen
          </Button>
        )}
      </Box>
      <Divider sx={{ my: 2 }} />
      {/* Abschnitt 2: User bearbeiten/löschen */}
      <Typography mb={1}>Vorhandene Benutzer bearbeiten/löschen:</Typography>
      {message && (
        <Alert
          severity={message.includes("Fehler") ? "error" : "success"}
          sx={{ mb: 1 }}
        >
          {message}
        </Alert>
      )}
      <List>
        {users.map((user) => (
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
              secondary={user.email}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default UserAdmin;