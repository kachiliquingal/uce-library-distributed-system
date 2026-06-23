import React, { useEffect, useState } from 'react';
import { loanApi } from '../../api/loanApi';
import { useAuthStore } from '../../store/authStore';
import { BookOpen, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export const AdminLoans = () => {
  const { token } = useAuthStore();
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchLoans();
  }, [page, activeOnly]);

  const fetchLoans = async () => {
    try {
      setIsLoading(true);
      const res = await loanApi.getAllLoans(activeOnly, page, limit, token);
      setLoans(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error(error);
      alert('Error fetching all loans: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async (loanId) => {
    try {
      if (!window.confirm('¿Confirmar devolución del libro?')) return;
      await loanApi.returnBook(loanId, token);
      alert('✅ Libro devuelto con éxito');
      fetchLoans();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="text-indigo-600 h-8 w-8" /> Control de Préstamos
        </h1>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 cursor-pointer">
            <input 
              type="checkbox" 
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="w-4 h-4 text-indigo-600"
            />
            <span className="font-medium text-gray-700">Solo Activos</span>
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4">ID Préstamo</th>
                  <th className="px-6 py-4">Usuario (ID)</th>
                  <th className="px-6 py-4">Libro (ISBN)</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fechas</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loans.map(loan => (
                  <tr key={loan.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs">{loan.id.substring(0,8)}...</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{loan.userId}</td>
                    <td className="px-6 py-4">{loan.isbn}</td>
                    <td className="px-6 py-4">{getStatusBadge(loan.status)}</td>
                    <td className="px-6 py-4 text-xs">
                      <div><span className="font-semibold">Presta:</span> {new Date(loan.borrowDate).toLocaleDateString()}</div>
                      <div><span className="font-semibold">Vence:</span> {new Date(loan.dueDate).toLocaleDateString()}</div>
                      {loan.returnDate && (
                        <div className="text-green-600"><span className="font-semibold">Devuelve:</span> {new Date(loan.returnDate).toLocaleDateString()}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {loan.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleReturn(loan.id)}
                          className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1 ml-auto"
                        >
                          <RefreshCw className="w-3 h-3" /> Registrar Devolución
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {loans.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                      No hay préstamos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50">
              <span className="text-sm text-gray-600">
                Mostrando página <span className="font-semibold text-gray-900">{page}</span> de <span className="font-semibold text-gray-900">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 font-medium text-sm transition-colors"
                >
                  Anterior
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 font-medium text-sm transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
