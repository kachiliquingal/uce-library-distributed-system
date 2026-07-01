import { useState, useEffect } from 'react';
import { Search, BookOpen, LogOut } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { useCatalogStore } from '../../store/catalogStore';
import { useAuthStore } from '../../store/authStore';

export const UserCatalog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const { books, isLoading, fetchBooks } = useCatalogStore();
  const logout = useAuthStore(state => state.logout);

  useEffect(() => {
    fetchBooks(debouncedSearchTerm);
    setPage(1);
  }, [debouncedSearchTerm, fetchBooks]);

  const totalPages = Math.ceil(books.length / ITEMS_PER_PAGE) || 1;
  const displayBooks = books.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="text-blue-600" />
            Catálogo Universitario
          </h1>
          <p className="text-gray-500 mt-1">Explora nuestra colección de microservicios</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por título o autor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>
          <button 
            onClick={logout}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid de Libros */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : displayBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayBooks.map((book) => (
            <div key={book.isbn || book._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="font-bold text-gray-900 line-clamp-1">{book.title}</h3>
              <p className="text-sm text-gray-500 mb-2">{book.author}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                  ISBN: {book.isbn}
                </span>
                <button
                  onClick={async () => {
                    try {
                      const { loanApi } = await import('../../api/loanApi');
                      const { useAuthStore } = await import('../../store/authStore');
                      const { toast } = await import('react-hot-toast');
                      const user = useAuthStore.getState().user;
                      const token = useAuthStore.getState().token;
                      const userId = user?.id || user?.userId;
                      await loanApi.borrowBook(userId, book.isbn, book.title, book.category, token);
                      toast.success(`Préstamo exitoso de "${book.title}". Retíralo en biblioteca.`);
                      window.dispatchEvent(new Event('notification-update'));
                      
                      // Actualizar el estado local para reflejar el cambio de inmediato
                      useCatalogStore.getState().fetchBooks();
                    } catch (error) {
                      const { toast } = await import('react-hot-toast');
                      toast.error(`Error: ${error.message}`);
                    }
                  }}
                  disabled={book.available === false}
                  className={`text-sm font-semibold px-3 py-1 rounded-lg transition-colors ${
                    book.available !== false 
                      ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {book.available !== false ? "Prestar" : "No disponible"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No se encontraron libros</h3>
          <p className="text-gray-500">Intenta con otros términos de búsqueda o añade libros usando Postman.</p>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600 font-medium px-4">
            Página {page} de {totalPages}
          </span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};