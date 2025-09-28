import { create } from "zustand";
import axios from "axios";

interface UserType {
  username: string;
  email: string;
  role: "admin" | "user";
  score: number;
  token: string; // Nur lokal, nicht vom API!
}

interface UserStore {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => {
    if (user) {
      localStorage.setItem("token", user.token);
    } else {
      localStorage.removeItem("token");
    }
    set({ user });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ user: null });
  },
  fetchUser: async () => {
    const token = localStorage.getItem("token");
    if (!token) return set({ user: null });
    try {
      const res = await axios.get("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Mische die Daten aus dem Backend mit dem Token aus LocalStorage
      set({ user: { ...res.data, token } });
    } catch {
      localStorage.removeItem("token");
      set({ user: null });
    }
  },
}));