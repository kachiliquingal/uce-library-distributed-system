import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Archive, X, Package } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { useCatalogStore } from '../../store/catalogStore';
import { useInventoryStore } from '../../store/inventoryStore';
import toast from 'react-hot-toast';

const FACULTIES = [
  "Arquitectura", "Artes", "Ciencias", "Ciencias Administrativas",
  "Ciencias Agrícolas", "Ciencias Biológicas", "Ciencias de la Discapacidad",
  "Ciencias Económicas", "Ciencias Médicas", "Ciencias Psicológicas",
  "Ciencias Químicas", "Comunicación Social", "Cultura Física",
  "Derecho y Ciencias Políticas", "Filosofía y Letras", "Ingeniería",
  "Ingeniería Química", "Medicina Veterinaria", "Odontología",
  "Ciencias Sociales", "Turismo y Hospitalidad"
];

export const AdminInventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const { books, suggestions, isLoading, fetchBooks, createBook, updateBook, deleteBook, fetchSuggestions, clearSuggestions } = useCatalogStore();
  const { fetchPhysicalStock, createPhysicalStock, addCopies, isLoading: isInventoryLoading } = useInventoryStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  
  // Stock Modal State
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockBook, setStockBook] = useState(null);
  const [physicalStock, setPhysicalStock] = useState(null);
  const [stockForm, setStockForm] = useState({ initialCopies: '', shelfLocation: '', copiesToAdd: '' });
  
  // Form State
  const [formData, setFormData] = useState({ title: '', author: '', isbn: '', category: '', publishedYear: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchBooks(debouncedSearchTerm);
    setPage(1);
  }, [debouncedSearchTerm, fetchBooks]);

  useEffect(() => {
    if (debouncedSearchTerm.trim().length >= 2) {
      fetchSuggestions(debouncedSearchTerm);
      setShowSuggestions(true);
    } else {
      clearSuggestions();
      setShowSuggestions(false);
    }
  }, [debouncedSearchTerm, fetchSuggestions, clearSuggestions]);

  const totalPages = Math.ceil(books.length / ITEMS_PER_PAGE) || 1;
  const displayBooks = books.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleOpenModal = (book = null) => {
    if (book) {
      setEditingBook(book);
      setFormData({ title: book.title, author: book.author, isbn: book.isbn, category: book.category || '', publishedYear: book.publishedYear || '' });
    } else {
      setEditingBook(null);
      setFormData({ title: '', author: '', isbn: '', category: '', publishedYear: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBook(null);
    setFormData({ title: '', author: '', isbn: '', category: '', publishedYear: '' });
  };

  const handleOpenStockModal = async (book) => {
    setStockBook(book);
    setStockForm({ 
      initialCopies: '', 
      shelfLocation: book.category ? `Biblioteca - ${book.category}` : '', 
      copiesToAdd: '' 
    });
    setIsStockModalOpen(true);
    const stock = await fetchPhysicalStock(book.isbn);
    setPhysicalStock(stock);
  };

  const handleCloseStockModal = () => {
    setIsStockModalOpen(false);
    setStockBook(null);
    setPhysicalStock(null);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (physicalStock) {
      if (!stockForm.copiesToAdd || parseInt(stockForm.copiesToAdd) <= 0) {
        toast.error('Ingrese una cantidad válida a añadir');
        return;
      }
      const success = await addCopies(stockBook.isbn, parseInt(stockForm.copiesToAdd));
      if (success) {
        toast.success('Copias añadidas exitosamente');
        handleCloseStockModal();
      }
    } else {
      if (!stockForm.initialCopies || !stockForm.shelfLocation) {
        toast.error('Todos los campos son obligatorios');
        return;
      }
      const success = await createPhysicalStock({
        isbn: stockBook.isbn,
        initialCopies: parseInt(stockForm.initialCopies),
        shelfLocation: stockForm.shelfLocation
      });
      if (success) {
        toast.success('Stock físico inicializado');
        handleCloseStockModal();
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Validation for ISBN to only accept numbers
    if (name === 'isbn') {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: numbersOnly }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author || !formData.isbn || !formData.category || !formData.publishedYear) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    if (!editingBook && formData.isbn.length !== 10 && formData.isbn.length !== 13) {
      toast.error('El ISBN debe tener exactamente 10 o 13 dígitos');
      return;
    }

    setIsSubmitting(true);
    let success = false;

    if (editingBook) {
      const bookId = editingBook._id || editingBook.id;
      success = await updateBook(bookId, {
        title: formData.title,
        author: formData.author,
        category: formData.category,
        publishedYear: parseInt(formData.publishedYear, 10)
      });
      if (success) toast.success('Libro actualizado exitosamente');
    } else {
      success = await createBook({
        ...formData,
        publishedYear: parseInt(formData.publishedYear, 10)
      });
      if (success) toast.success('Libro creado exitosamente');
    }

    setIsSubmitting(false);
    if (success) {
      handleCloseModal();
      fetchBooks(debouncedSearchTerm); // Refresh list
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este libro del inventario?')) {
      const success = await deleteBook(id);
      if (success) {
        toast.success('Libro eliminado exitosamente');
        fetchBooks(debouncedSearchTerm);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Archive className="text-indigo-600" />
            Inventario de Libros
          </h1>
          <p className="text-gray-500 mt-1">Gestiona el catálogo de libros del sistema</p>
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
              onFocus={() => {
                if (searchTerm.trim().length >= 2) setShowSuggestions(true);
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchTerm(suggestion);
                      setShowSuggestions(false);
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            Nuevo libro
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Autor
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ISBN
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Disponibilidad
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && books.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : displayBooks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No se encontraron libros en el inventario.
                  </td>
                </tr>
              ) : (
                displayBooks.map((book) => (
                  <tr key={book._id || book.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{book.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{book.author}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-500">{book.isbn}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${book.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {book.available ? 'Disponible' : 'Prestado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleOpenStockModal(book)}
                          className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg transition-colors"
                          title="Stock Físico"
                        >
                          <Package className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(book)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg transition-colors"
                          title="Editar Metadata"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(book._id || book.id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBook ? 'Editar Libro' : 'Nuevo Libro'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                  placeholder="Ej. El Quijote"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                  placeholder="Ej. Miguel de Cervantes"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría (Facultad)</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                  >
                    <option value="" disabled>Seleccione una facultad</option>
                    {FACULTIES.map(faculty => (
                      <option key={faculty} value={faculty}>{faculty}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año de Publicación</label>
                  <input
                    type="number"
                    name="publishedYear"
                    value={formData.publishedYear}
                    onChange={handleChange}
                    required
                    min="1000"
                    max={new Date().getFullYear()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    placeholder="Ej. 1967"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                  required
                  disabled={!!editingBook}
                  maxLength="13"
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg outline-none ${editingBook ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-600'}`}
                  placeholder="Ej. 9781234567890 (Solo números)"
                />
                {editingBook && (
                  <p className="text-xs text-amber-600 mt-1">El ISBN no puede ser modificado después de la creación.</p>
                )}
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[120px]"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : editingBook ? (
                    'Guardar Cambios'
                  ) : (
                    'Crear Libro'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Modal */}
      {isStockModalOpen && stockBook && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="text-emerald-600" />
                Stock Físico
              </h2>
              <button onClick={handleCloseStockModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 pb-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">{stockBook.title}</h3>
                <p className="text-sm text-gray-500 font-mono">ISBN: {stockBook.isbn}</p>
              </div>

              {isInventoryLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : physicalStock ? (
                <form onSubmit={handleStockSubmit} className="space-y-4">
                  <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-xs text-emerald-600 uppercase font-bold">Total</p>
                        <p className="text-2xl font-bold text-emerald-900">{physicalStock.totalCopies}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600 uppercase font-bold">Disponibles</p>
                        <p className="text-2xl font-bold text-emerald-900">{physicalStock.availableCopies}</p>
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-xs text-emerald-600 uppercase font-bold">Ubicación (Biblioteca)</p>
                      <p className="text-sm font-medium text-emerald-900">{physicalStock.shelfLocation}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Añadir Copias</label>
                    <input
                      type="number"
                      value={stockForm.copiesToAdd}
                      onChange={(e) => setStockForm({...stockForm, copiesToAdd: e.target.value})}
                      min="1"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
                      placeholder="Ej. 5"
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isInventoryLoading}
                      className="w-full px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      Sumar al Inventario
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleStockSubmit} className="space-y-4">
                  <div className="bg-amber-50 rounded-lg p-4 mb-4 text-amber-800 text-sm">
                    No hay inventario físico registrado para este libro. Por favor, inicializa el stock.
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Copias Iniciales</label>
                    <input
                      type="number"
                      value={stockForm.initialCopies}
                      onChange={(e) => setStockForm({...stockForm, initialCopies: e.target.value})}
                      min="1"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Biblioteca (Facultad)</label>
                    <select
                      value={stockForm.shelfLocation}
                      onChange={(e) => setStockForm({...stockForm, shelfLocation: e.target.value})}
                      required
                      disabled={!!stockBook?.category}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none ${
                        stockBook?.category ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-white'
                      }`}
                    >
                      <option value="" disabled>Seleccione una biblioteca</option>
                      {FACULTIES.map(faculty => (
                        <option key={faculty} value={`Biblioteca - ${faculty}`}>
                          Biblioteca de la Facultad de {faculty}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isInventoryLoading}
                      className="w-full px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      Inicializar Stock
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
