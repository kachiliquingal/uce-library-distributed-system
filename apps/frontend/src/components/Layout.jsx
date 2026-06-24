
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, BookOpen, Clock, Users, Home } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export const Layout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col shadow-xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            UCE Library
          </h2>
          <p className="text-indigo-200 text-sm mt-2 font-medium">
            Bienvenido, {user?.email.split('@')[0]}
          </p>
          <span className="inline-block mt-2 px-2 py-1 bg-indigo-800 text-xs rounded-full font-semibold">
            {user?.role}
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {user?.role === 'ADMIN' ? (
            <>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-indigo-700 font-semibold' : 'hover:bg-indigo-800 text-indigo-100'
                  }`
                }
                end
              >
                <Home className="h-5 w-5" /> Dashboard
              </NavLink>
              <NavLink
                to="/admin/loans"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-indigo-700 font-semibold' : 'hover:bg-indigo-800 text-indigo-100'
                  }`
                }
              >
                <Clock className="h-5 w-5" /> Todos los Préstamos
              </NavLink>
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-indigo-700 font-semibold' : 'hover:bg-indigo-800 text-indigo-100'
                  }`
                }
              >
                <Users className="h-5 w-5" /> Gestión de Usuarios
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/catalog"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-indigo-700 font-semibold' : 'hover:bg-indigo-800 text-indigo-100'
                  }`
                }
              >
                <BookOpen className="h-5 w-5" /> Catálogo
              </NavLink>
              <NavLink
                to="/my-loans"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-indigo-700 font-semibold' : 'hover:bg-indigo-800 text-indigo-100'
                  }`
                }
              >
                <Clock className="h-5 w-5" /> Mis Préstamos
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-indigo-100 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar could go here if needed */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
