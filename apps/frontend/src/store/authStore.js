import { create } from "zustand";
import { authApi } from "../api/client";

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("auth_token") || null,
  isAuthenticated: !!localStorage.getItem("auth_token"),
  isLoading: !!localStorage.getItem("auth_token"),
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // Make the request to the IP address of your Auth Service in AWS.
      const response = await authApi.post("/login", { email, password });
      const { token, user } = response.data;

      localStorage.setItem("auth_token", token);

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.error || "Error al iniciar sesión",
        isLoading: false,
      });
      return false;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.post("/register", { email, password });
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.error || "Error al registrar el usuario",
        isLoading: false,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    set({ user: null, token: null, isAuthenticated: false });
  },

  validateSession: async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return false;
    }

    set({ isLoading: true });
    try {
      const response = await authApi.get("/validate-token", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.valid && response.data.user) {
        const userData = response.data.user;
        if (userData.userId && !userData.id) {
          userData.id = userData.userId;
        }
        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false
        });
        return true;
      }
      throw new Error("Invalid token");
    } catch {
      localStorage.removeItem("auth_token");
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
