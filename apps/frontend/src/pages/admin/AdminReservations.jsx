import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Search, RefreshCw } from 'lucide-react';
import { useReservationStore } from '../../store/reservationStore';
import toast from 'react-hot-toast';

const UCE_FACULTIES = [
  'Todas las Facultades',
  'Facultad de Ciencias Administrativas',
  'Facultad de Ingeniería y Ciencias Aplicadas',
  'Facultad de Ciencias Psicológicas',
  'Facultad de Comunicación Social',
  'Facultad de Jurisprudencia y Ciencias Políticas y Sociales',
  'Facultad de Ciencias Médicas',
  'Facultad de Filosofía, Letras y Ciencias de la Educación',
  'Facultad de Arquitectura y Urbanismo',
  'Facultad de Ciencias Económicas',
  'Facultad de Ciencias Agrícolas',
  'Facultad de Ciencias Químicas',
  'Facultad de Odontología',
  'Facultad de Medicina Veterinaria y Zootecnia',
  'Facultad de Ciencias de la Discapacidad',
  'Facultad de Artes',
  'Facultad de Ciencias de la Tierra y Recursos Minerales',
  'Facultad de Cultura Física',
  'Facultad de Ciencias Biológicas',
  'Facultad de Ingeniería Química',
  'Facultad de Sociología y Política',
  'Facultad de Trabajo Social'
];

export const AdminReservations = () => {
  const { rooms, reservations, isLoading, fetchRooms, fetchAllReservations, cancelReservation, error, successMessage, clearMessages } = useReservationStore();

  const [selectedFaculty, setSelectedFaculty] = useState('Todas las Facultades');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, COMPLETED, CANCELLED

  useEffect(() => {
    fetchRooms(selectedFaculty === 'Todas las Facultades' ? 'all' : selectedFaculty);
    fetchAllReservations();
  }, [selectedFaculty, fetchRooms, fetchAllReservations]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearMessages();
    }
    if (successMessage) {
      toast.success(successMessage);
      clearMessages();
    }
  }, [error, successMessage, clearMessages]);

  const handleAdminCancel = async (id, roomName) => {
    if (window.confirm(`¿Estás seguro de liberar y finalizar el turno en ${roomName}?`)) {
      await cancelReservation(id, 'admin', true);
    }
  };

  const filteredReservations = reservations.filter(res => {
    const matchesSearch = res.roomName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          res.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          res.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          res.faculty?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || res.status === statusFilter;
    const matchesFaculty = selectedFaculty === 'Todas las Facultades' || res.faculty === selectedFaculty;
    return matchesSearch && matchesStatus && matchesFaculty;
  });

  const activeCount = reservations.filter(r => r.status === 'ACTIVE').length;
  const availableRoomsCount = rooms.filter(r => r.currentStatus === 'AVAILABLE').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <Calendar className="w-9 h-9 text-indigo-600" />
            Supervisión General de Salas de Estudio
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">
            Control bibliotecario en tiempo real sobre las 42 salas universitarias (2 por cada facultad UCE).
          </p>
        </div>
        <button
          onClick={() => {
            fetchRooms(selectedFaculty === 'Todas las Facultades' ? 'all' : selectedFaculty);
            fetchAllReservations();
            toast.success('Estado de salas actualizado en tiempo real');
          }}
          className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          Sincronizar MQTT / Outbox
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white shadow-md">
          <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Total Salas Oficiales</p>
          <h3 className="text-4xl font-extrabold">{rooms.length || 42}</h3>
          <p className="text-xs text-indigo-200 mt-2">2 salas por cada una de las 21 facultades</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl p-6 text-white shadow-md">
          <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-1">Salas Disponibles Hoy</p>
          <h3 className="text-4xl font-extrabold">{availableRoomsCount}</h3>
          <p className="text-xs text-green-200 mt-2">Listas para asignación de turnos</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-md">
          <p className="text-amber-100 text-xs font-bold uppercase tracking-wider mb-1">Turnos en Curso (5 min)</p>
          <h3 className="text-4xl font-extrabold">{activeCount}</h3>
          <p className="text-xs text-amber-100 mt-2">Monitoreados por temporizador de liberación</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-4 md:space-y-0 md:flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por estudiante, correo, sala o facultad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-sm font-medium"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-600"
          >
            {UCE_FACULTIES.map((fac, idx) => (
              <option key={idx} value={fac}>{fac}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">Turnos en Curso (Activos)</option>
            <option value="COMPLETED">Turnos Finalizados</option>
            <option value="CANCELLED">Turnos Cancelados</option>
          </select>
        </div>
      </div>

      {/* Tabla de Reservas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-gray-900 text-lg">Historial y Control de Turnos</h2>
          <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            {filteredReservations.length} registros encontrados
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredReservations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6">Estudiante / Usuario</th>
                  <th className="py-4 px-6">Sala y Facultad</th>
                  <th className="py-4 px-6">Fecha y Horario</th>
                  <th className="py-4 px-6">Duración</th>
                  <th className="py-4 px-6 text-right">Acción Administrativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      {res.status === 'ACTIVE' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          EN CURSO
                        </span>
                      )}
                      {res.status === 'COMPLETED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          FINALIZADO
                        </span>
                      )}
                      {res.status === 'CANCELLED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          CANCELADO
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-gray-900">{res.userName}</p>
                      <p className="text-xs text-gray-500">{res.userEmail}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-gray-800">{res.roomName}</p>
                      <p className="text-xs text-indigo-600 font-medium">{res.faculty}</p>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="font-semibold text-gray-900">{res.date}</p>
                      <p className="text-xs text-gray-500">{res.startTime} - {res.endTime}</p>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg text-xs">
                        {res.durationMinutes || 5} min
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      {res.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleAdminCancel(res.id, res.roomName)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white font-bold rounded-lg transition-colors text-xs inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Liberar Sala
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Sin acción requerida</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-700 text-base">No hay turnos registrados con los filtros actuales</p>
            <p className="text-xs mt-1">Los turnos generados por estudiantes o administración aparecerán aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
};
