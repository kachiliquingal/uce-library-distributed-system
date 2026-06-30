import { create } from "zustand";
import { catalogApi } from "../api/client";
import logger from "../utils/logger";

export const useCatalogStore = create((set) => ({
  books: [],
  isLoading: false,
  error: null,

  fetchBooks: async (search = "") => {
    set({ isLoading: true, error: null });
    try {
      const response = await catalogApi.get("/books");
      let fetchedBooks = response.data;

      if (search) {
        const lowerSearch = search.toLowerCase();
        fetchedBooks = fetchedBooks.filter(
          (book) =>
            book.title?.toLowerCase().includes(lowerSearch) ||
            book.author?.toLowerCase().includes(lowerSearch),
        );
      }

      set({ books: fetchedBooks, isLoading: false });
    } catch (error) {
      logger.error(error);
      set({
        error: "Error al conectar con el microservicio de catálogo",
        isLoading: false,
      });
    }
  },

  createBook: async (bookData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await catalogApi.post("/books", bookData);
      set((state) => ({ 
        books: [...state.books, response.data],
        isLoading: false 
      }));
      return true;
    } catch (error) {
      logger.error(error);
      set({ error: error.response?.data?.error || "Error al crear el libro", isLoading: false });
      return false;
    }
  },

  updateBook: async (id, bookData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await catalogApi.put(`/books/${id}`, bookData);
      set((state) => ({
        books: state.books.map((book) => 
          book.id === id ? response.data : book
        ),
        isLoading: false
      }));
      return true;
    } catch (error) {
      logger.error(error);
      set({ error: error.response?.data?.error || "Error al actualizar el libro", isLoading: false });
      return false;
    }
  },

  deleteBook: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await catalogApi.delete(`/books/${id}`);
      set((state) => ({
        books: state.books.filter((book) => book.id !== id),
        isLoading: false
      }));
      return true;
    } catch (error) {
      logger.error(error);
      set({ error: error.response?.data?.error || "Error al eliminar el libro", isLoading: false });
      return false;
    }
  },
}));
