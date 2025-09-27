import React, { useEffect, useState } from "react";
import { Paper, Typography, TextField, Button, List, ListItem, ListItemText, Box, Alert, Divider } from "@mui/material";
import api from "../api/api";

type User = {
  username: string;
  email: string;
  role: string;
  score: number;
};

const UserAdmin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await api.get<User[]>("/users");
      setUsers(res.data);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    try {
      await api.post("/users", { username, email, password, role });
      setMessage("Benutzer erfolgreich angelegt!");
      setUsername(""); setEmail(""); setPassword(""); setRole("user");
      fetchUsers();
    } catch {
      setMessage("Fehler beim Anlegen!");
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" mb={2}>Benutzerverwaltung</Typography>
      <Box mb={2} display="flex" flexWrap="wrap" gap={1}>
        <TextField label="Benutzername" value={username} onChange={e => setUsername(e.target.value)} size="small" />
        <TextField label="Email" value={email} onChange={e => setEmail(e.target.value)} size="small" />
        <TextField label="Passwort" type="password" value={password} onChange={e => setPassword(e.target.value)} size="small" />
        <TextField label="Rolle" value={role} onChange={e => setRole(e.target.value)} size="small" sx={{ width: 120 }} />
        <Button variant="contained" onClick={handleCreate}>Anlegen</Button>
      </Box>
      {message && <Alert severity={message.includes("Fehler") ? "error" : "success"}>{message}</Alert>}
      <Divider sx={{ my: 2 }} />
      <List>
        {users.map(user => (
          <ListItem key={user.username}>
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