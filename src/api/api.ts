import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
});

// Interceptor liest Token IMMER aus localStorage (nicht aus Zustand!)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;