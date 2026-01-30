import { create } from "zustand";
import api from "../api/api";

interface UserType {
  username: string;
  email: string;
  role: "admin" | "organisator" | "user";
  score: number;
  token: string; // lokal, nicht vom API!
}

interface UserStore {
  user: UserType | null;
  isLoading: boolean;
  setUser: (user: UserType | null) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: true,
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
    set({ isLoading: true });
    const token = localStorage.getItem("token");
    if (!token) {
      set({ user: null, isLoading: false });
      return;
    }
    try {
      const res = await api.get("/profile");
      set({ user: { ...res.data, token }, isLoading: false });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, isLoading: false });
    }
  },
}));