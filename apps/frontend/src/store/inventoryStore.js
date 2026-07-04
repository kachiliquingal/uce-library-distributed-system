import { create } from "zustand";
import { inventoryApi } from "../api/client";
import logger from "../utils/logger";

export const useInventoryStore = create((set) => ({
  physicalStocks: [],
  isLoading: false,
  error: null,

  fetchPhysicalStock: async (isbn) => {
    set({ isLoading: true, error: null });
    try {
      const response = await inventoryApi.get(`/${isbn}`);
      return response.data;
    } catch (error) {
      if (error.response?.status !== 404) {
        logger.error(error);
      }
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLowStock: async (threshold = 5) => {
    set({ isLoading: true, error: null });
    try {
      const response = await inventoryApi.get(`/low-stock`, { params: { threshold } });
      set({ physicalStocks: response.data || [], isLoading: false });
    } catch (error) {
      logger.error(error);
      set({
        error: "Error al conectar con el microservicio de inventario",
        isLoading: false,
      });
    }
  },

  createPhysicalStock: async (stockData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await inventoryApi.post("/", stockData);
      set((state) => ({ 
        physicalStocks: [...state.physicalStocks, response.data],
        isLoading: false 
      }));
      return true;
    } catch (error) {
      logger.error(error);
      set({ error: error.response?.data?.error || "Error al inicializar stock físico", isLoading: false });
      return false;
    }
  },

  addCopies: async (isbn, copiesToAdd) => {
    set({ isLoading: true, error: null });
    try {
      await inventoryApi.put(`/${isbn}/stock`, { copiesToAdd });
      set({ isLoading: false });
      return true;
    } catch (error) {
      logger.error(error);
      set({ error: error.response?.data?.error || "Error al añadir stock", isLoading: false });
      return false;
    }
  }
}));
