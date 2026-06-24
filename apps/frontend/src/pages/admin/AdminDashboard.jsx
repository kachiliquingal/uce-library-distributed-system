import { useEffect, useState } from "react";
import { userApi, catalogApi } from "../../api/client";
import { 
  Users, 
  BookOpen, 
  BookMarked, 
  Activity, 
  TrendingUp,
  LogOut
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import logger from "../../utils/logger";

export const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { logout, user } = useAuthStore();

  const [activeLoansCount, setActiveLoansCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await userApi.get("/");
        setUsers(usersRes.data);
      } catch (error) {
        logger.error("Error fetching users:", error);
      }

      try {
        const booksRes = await catalogApi.get("/books");
        setBooks(booksRes.data);
      } catch (error) {
        logger.error("Error fetching books:", error);
      }

      try {
        const { loanApi } = await import('../../api/loanApi');
        const token = useAuthStore.getState().token;
        // Fetch all active loans using the true flag for activeOnly
        const loansRes = await loanApi.getAllLoans(true, 1, 1, token);
        setActiveLoansCount(loansRes.total || 0);
      } catch (error) {
        logger.error("Error fetching active loans:", error);
      }

      setIsLoading(false);
    };
    fetchData();
  }, []);

  const stats = {
    totalBooks: books.length,
    activeLoans: activeLoansCount,
    availableBooks: books.filter(b => b.available).length,
    totalUsers: users.length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                Admin Panel
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 hidden sm:block">
                {user?.email}
              </span>
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard General</h1>
          <p className="mt-1 text-sm text-gray-500">
            Métricas principales de inventario y actividad de usuarios.
          </p>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard 
            title="Total Usuarios" 
            value={stats.totalUsers} 
            icon={<Users className="h-6 w-6 text-blue-600" />} 
            trend="+12% este mes"
          />
          <KpiCard 
            title="Total Libros" 
            value={stats.totalBooks} 
            icon={<BookOpen className="h-6 w-6 text-indigo-600" />} 
          />
          <KpiCard 
            title="Libros Disponibles" 
            value={stats.availableBooks} 
            icon={<BookMarked className="h-6 w-6 text-emerald-600" />} 
          />
          <KpiCard 
            title="Préstamos Activos" 
            value={stats.activeLoans} 
            icon={<Activity className="h-6 w-6 text-amber-600" />} 
          />
        </div>

        {/* Charts & Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Users Table (2/3 width) */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Usuarios Registrados</h3>
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                Sincronizado via Kafka
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol Primario</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold">
                              {u.email.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                            <div className="text-sm text-gray-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {u.roles?.[0]?.name || 'USER'}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                        No hay usuarios sincronizados aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Books / Activity Placeholder (1/3 width) */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="w-24 h-24 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 relative z-10">
                Top 5: Libros Más Prestados
              </h3>
              <div className="space-y-4 relative z-10">
                {/* Placeholder items for the future MS-03 */}
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400 group-hover:text-blue-600 transition-colors">0{i}</span>
                      <div className="w-32 h-4 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                    <span className="text-xs text-gray-400">---</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  * Los datos reales se conectarán al implementar el Loan Service (MS-03).
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-sm p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Actividad de Préstamos</h3>
              <p className="text-indigo-100 text-sm mb-4">
                El módulo de reportería y filtros por facultad estará disponible próximamente.
              </p>
              <div className="flex gap-2">
                {['Día', 'Semana', 'Mes', 'Año'].map(t => (
                  <span key={t} className="px-2 py-1 bg-white/10 rounded text-xs font-medium backdrop-blur-sm">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

// Componente utilitario para las tarjetas KPI
const KpiCard = ({ title, value, icon, trend, trendColor = "text-green-600" }) => (
  <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-2xl p-6 transition-all hover:shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="p-3 bg-gray-50 rounded-xl">
        {icon}
      </div>
    </div>
    {trend && (
      <div className="mt-4">
        <span className={`text-sm font-medium ${trendColor}`}>{trend}</span>
      </div>
    )}
  </div>
);
