import { useEffect, useState } from 'react';
import { userApi } from '../../api/client';
import { Users, Search, RefreshCw, Shield, UserCheck, Mail, Calendar, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import logger from '../../utils/logger';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await userApi.get("/");
      setUsers(res.data || []);
    } catch (error) {
      logger.error("Error fetching users:", error);
      toast.error("No se pudo cargar la lista de usuarios.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter logic
  const filteredUsers = users.filter(u => {
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const id = (u.id || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(query) || email.includes(query) || id.includes(query);
    
    const matchesRole = roleFilter === 'ALL' || (u.roles && u.roles.some(r => r.name === roleFilter));
    
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && u.isActive) || 
      (statusFilter === 'INACTIVE' && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    admins: users.filter(u => u.roles?.some(r => r.name === 'ADMIN')).length,
    regular: users.filter(u => !u.roles?.some(r => r.name === 'ADMIN')).length,
  };

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'UC';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
            Gestión y Directorio de Usuarios
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Administración centralizada de cuentas, roles y estado de acceso de la comunidad universitaria UCE.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 font-medium text-sm transition-all disabled:opacity-50 border border-indigo-100 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Sincronizar Directorio
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Usuarios</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cuentas Activas</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Administradores</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.admins}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Comunidad / Estudiantes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.regular}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-gray-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50/50 font-medium text-gray-700"
          >
            <option value="ALL">Todos los Roles</option>
            <option value="ADMIN">Administrador (ADMIN)</option>
            <option value="USER">Usuario / Estudiante (USER)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50/50 font-medium text-gray-700"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <p className="text-sm text-gray-500 font-medium">Cargando directorio de usuarios...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <th className="py-4 px-6">Usuario</th>
                  <th className="py-4 px-6">Correo Electrónico</th>
                  <th className="py-4 px-6">Roles Asignados</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6">Fecha de Registro</th>
                  <th className="py-4 px-6 text-right">ID de Cuenta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-normal">
                {paginatedUsers.map((u) => {
                  const initials = getInitials(u.firstName, u.lastName, u.email);
                  return (
                    <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}` : 'Usuario Sin Nombre'}
                            </div>
                            <div className="text-xs text-gray-400 font-mono mt-0.5">
                              ID: {u.id?.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium">{u.email}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1.5">
                          {u.roles && u.roles.length > 0 ? (
                            u.roles.map((r) => {
                              const isAdmin = r.name === 'ADMIN';
                              return (
                                <span
                                  key={r.id || r.name}
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    isAdmin
                                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                                  }`}
                                >
                                  {isAdmin && <Shield className="w-3 h-3 text-indigo-600" />}
                                  {r.name}
                                </span>
                              );
                            })
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              USER
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200/60 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/60 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Inactivo
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-EC', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'N/A'}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right font-mono text-xs text-gray-400 select-all">
                        {u.id}
                      </td>
                    </tr>
                  );
                })}

                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-10 h-10 text-gray-300" />
                        <p className="font-semibold text-gray-600">No se encontraron usuarios</p>
                        <p className="text-xs text-gray-400">Intenta cambiar los filtros de búsqueda o el rol seleccionado.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50 gap-4">
            <span className="text-sm text-gray-600">
              Mostrando <span className="font-semibold text-gray-900">{startIndex + 1}</span> a <span className="font-semibold text-gray-900">{Math.min(startIndex + limit, filteredUsers.length)}</span> de <span className="font-semibold text-gray-900">{filteredUsers.length}</span> usuarios
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-50 font-medium text-sm transition-all shadow-sm bg-gray-50"
              >
                Anterior
              </button>
              
              <div className="flex items-center gap-1 px-2">
                <span className="text-sm font-semibold text-gray-700">Pág. {page} de {totalPages}</span>
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-50 font-medium text-sm transition-all shadow-sm bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
