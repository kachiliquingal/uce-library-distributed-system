import { useEffect, useState } from 'react';
import { loanApi } from '../../api/loanApi';
import { useAuthStore } from '../../store/authStore';
import { BookOpen, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export const UserLoans = () => {
  const { user, token } = useAuthStore();
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 8;

  useEffect(() => {
    fetchLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchLoans = async () => {
    try {
      setIsLoading(true);
      const res = await loanApi.getUserLoans(user.id, page, limit, token);
      setLoans(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error(error);
      alert('Error fetching loans: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> Activo</span>;
      case 'RETURNED': return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Devuelto</span>;
      case 'OVERDUE': return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Atrasado</span>;
      default: return null;
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Clock className="text-indigo-600 h-8 w-8" /> Mis Préstamos
      </h1>

      {loans.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No tienes préstamos activos.</h3>
          <p className="text-gray-500">Ve al catálogo para solicitar un libro.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loans.map(loan => (
              <div key={loan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <BookOpen className="h-6 w-6 text-indigo-600" />
                  </div>
                  {getStatusBadge(loan.status)}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">ISBN: {loan.isbn}</h3>
                <div className="text-sm text-gray-500 space-y-2 mt-2 flex-1">
                  <p><strong>Fecha de Préstamo:</strong> {new Date(loan.borrowDate).toLocaleDateString()}</p>
                  <p><strong>Fecha de Devolución Esperada:</strong> {new Date(loan.dueDate).toLocaleDateString()}</p>
                  {loan.returnDate && (
                    <p><strong>Devuelto el:</strong> {new Date(loan.returnDate).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium bg-white shadow-sm"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600 font-medium">
                Página {page} de {totalPages}
              </span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium bg-white shadow-sm"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
