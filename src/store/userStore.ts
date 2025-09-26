import { create } from "zustand";

interface UserType {
  username: string;
  role: "admin" | "user";
  token: string;
}

interface UserStore {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));