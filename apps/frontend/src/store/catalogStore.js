import { create } from "zustand";
import { catalogApi } from "../api/client";

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
      console.error(error);
      set({
        error: "Error al conectar con el microservicio de catálogo",
        isLoading: false,
      });
    }
  },
}));
