import { create } from "zustand";
import { reservationApi } from "../api/client";
import logger from "../utils/logger";

export const useReservationStore = create((set, get) => ({
  rooms: [],
  reservations: [],
  userReservations: [],
  isLoading: false,
  error: null,
  successMessage: null,

  clearMessages: () => set({ error: null, successMessage: null }),

  fetchRooms: async (faculty = "all", date = null) => {
    set({ isLoading: true, error: null });
    try {
      const params = {};
      if (faculty && faculty !== "all" && faculty !== "Todas las Facultades") params.faculty = faculty;
      if (date) params.date = date;
      const response = await reservationApi.get("/rooms", { params });
      set({ rooms: response.data || [], isLoading: false });
    } catch (error) {
      logger.error(error);
      set({
        error: "Error al conectar con el servicio de salas de estudio",
        isLoading: false,
      });
    }
  },

  fetchUserReservations: async (userId) => {
    if (!userId) return;
    set({ isLoading: true, error: null });
    try {
      const response = await reservationApi.get("/", { params: { userId } });
      set({ userReservations: response.data || [], isLoading: false });
    } catch (error) {
      logger.error(error);
      set({ isLoading: false });
    }
  },

  fetchAllReservations: async (roomId = null, date = null) => {
    set({ isLoading: true, error: null });
    try {
      const params = {};
      if (roomId) params.roomId = roomId;
      if (date) params.date = date;
      const response = await reservationApi.get("/", { params });
      set({ reservations: response.data || [], isLoading: false });
    } catch (error) {
      logger.error(error);
      set({ isLoading: false });
    }
  },

  createReservation: async (data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const response = await reservationApi.post("/", data);
      const newRes = response.data;
      set((state) => ({
        userReservations: [newRes, ...state.userReservations],
        reservations: [newRes, ...state.reservations],
        rooms: state.rooms.map((r) =>
          r.id === newRes.roomId
            ? { ...r, currentStatus: "RESERVED", activeReservationId: newRes.id }
            : r
        ),
        isLoading: false,
        successMessage: `¡Turno asignado exitosamente! Tienes 5 minutos en ${newRes.roomName}.`
      }));
      return { success: true, reservation: newRes };
    } catch (error) {
      logger.error(error);
      const msg = error.response?.data?.error || "Error al crear la reserva";
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  cancelReservation: async (id, userId, isAdmin = false) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await reservationApi.delete(`/${id}`, { data: { userId, isAdmin } });
      set((state) => {
        const cancelled = state.userReservations.find((r) => r.id === id) || state.reservations.find((r) => r.id === id);
        const roomId = cancelled?.roomId;
        return {
          userReservations: state.userReservations.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r)),
          reservations: state.reservations.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r)),
          rooms: roomId
            ? state.rooms.map((r) => (r.id === roomId ? { ...r, currentStatus: "AVAILABLE", activeReservationId: null } : r))
            : state.rooms,
          isLoading: false,
          successMessage: "Reserva finalizada y sala liberada correctamente."
        };
      });
      return true;
    } catch (error) {
      logger.error(error);
      const msg = error.response?.data?.error || "Error al finalizar la reserva";
      set({ error: msg, isLoading: false });
      return false;
    }
  }
}));
