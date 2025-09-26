import axios from "axios";
import { useUserStore } from "../store/userStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
});

api.interceptors.request.use((config) => {
  const { user } = useUserStore.getState();
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

export default api;