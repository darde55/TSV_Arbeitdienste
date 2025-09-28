import { create } from "zustand";
import axios from "axios";

interface UserType {
  username: string;
  role: "admin" | "user";
  token: string;
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
      // Set User with token, so it's always available
      set({ user: { ...res.data, token } });
    } catch {
      localStorage.removeItem("token");
      set({ user: null });
    }
  },
}));