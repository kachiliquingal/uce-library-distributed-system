import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, CheckCircle, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useReservationStore } from '../../store/reservationStore';
import { useAuthStore } from '../../store/authStore';
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

export const UserReservations = () => {
  const { rooms, userReservations, isLoading, fetchRooms, fetchUserReservations, createReservation, cancelReservation, error, successMessage, clearMessages } = useReservationStore();
  const user = useAuthStore(state => state.user);
  const userId = user?.id || user?.userId || 'student-101';
  const userEmail = user?.email || 'estudiante@uce.edu.ec';
  const userName = user?.name || 'Estudiante UCE';

  const [selectedFaculty, setSelectedFaculty] = useState('Todas las Facultades');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [purpose, setPurpose] = useState('Estudio individual e investigación bibliográfica');
  const [attendees, setAttendees] = useState(1);
  const [showModal, setShowModal] = useState(false);

  // Calculate Today and Tomorrow in YYYY-MM-DD
  const getAllowedDates = () => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
    const today = now.toISOString().split('T')[0];
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];
    return { today, tomorrow };
  };

  const { today, tomorrow } = getAllowedDates();

  useEffect(() => {
    setSelectedDate(today);
    fetchRooms(selectedFaculty === 'Todas las Facultades' ? 'all' : selectedFaculty);
    fetchUserReservations(userId);
  }, [selectedFaculty, fetchRooms, fetchUserReservations, userId, today]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearMessages();
    }
    if (successMessage) {
      toast.success(successMessage);
      clearMessages();
      window.dispatchEvent(new Event('notification-update'));
    }
  }, [error, successMessage, clearMessages]);

  // Handle Booking
  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedRoom || !selectedDate || !selectedTime) {
      toast.error('Por favor completa todos los campos requeridos.');
      return;
    }

    const res = await createReservation({
      userId,
      userEmail,
      userName,
      roomId: selectedRoom.id,
      date: selectedDate,
      startTime: selectedTime,
      purpose,
      attendees: Number(attendees)
    });

    if (res.success) {
      setShowModal(false);
      setSelectedRoom(null);
    }
  };

  const handleCancel = async (id, roomName) => {
    const ok = await cancelReservation(id, userId, false);
    if (ok) {
      toast.success(`Turno finalizado en ${roomName}`);
      window.dispatchEvent(new Event('notification-update'));
    }
  };

  const activeReservations = userReservations.filter(r => r.status === 'ACTIVE');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl p-8 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3">
            <Calendar className="w-10 h-10 text-yellow-300" />
            Salas de Estudio Universitarias
          </h1>
          <p className="mt-2 text-indigo-100 max-w-2xl text-lg">
            Reserva espacios para lectura silenciosa, trabajo en grupo o multimedia. Turnos oficiales de 5 minutos con liberación automática en tiempo real.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
          <Calendar className="w-96 h-96" />
        </div>
      </div>

      {/* Mis Reservas Activas */}
      {activeReservations.length > 0 && (
        <div className="mb-10 bg-indigo-50 border border-indigo-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
            Mi Turno en Curso
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeReservations.map(res => (
              <div key={res.id} className="bg-white rounded-xl p-5 shadow-sm border border-indigo-100 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                      EN CURSO
                    </span>
                    <span className="text-xs font-semibold text-gray-500">{res.date}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{res.roomName}</h3>
                  <p className="text-xs text-gray-500 mb-3">{res.faculty}</p>
                  <div className="space-y-1 text-sm text-gray-700 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>Inicio: <strong>{res.startTime}</strong> | Fin: <strong>{res.endTime}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Duración asignada: <strong>5 minutos</strong></span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCancel(res.id, res.roomName)}
                  className="w-full py-2 px-4 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Finalizar y Liberar Sala
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros de Búsqueda y Facultad */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Filtrar por Facultad UCE</label>
          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none font-medium text-gray-800 transition-all"
          >
            {UCE_FACULTIES.map((fac, i) => (
              <option key={i} value={fac}>{fac}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-auto flex items-center gap-4 bg-indigo-50 px-4 py-3 rounded-xl border border-indigo-100">
          <Calendar className="w-6 h-6 text-indigo-600" />
          <div>
            <p className="text-xs font-semibold text-indigo-900">Reservas Disponibles Para:</p>
            <p className="text-sm font-bold text-indigo-700">Hoy ({today}) y Mañana ({tomorrow})</p>
          </div>
        </div>
      </div>

      {/* Grid de Salas de Estudio */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => {
            const isAvailable = room.currentStatus === 'AVAILABLE';
            return (
              <div
                key={room.id}
                className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                  isAvailable ? 'border-gray-200' : 'border-amber-200 bg-amber-50/30'
                }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
                      {isAvailable ? 'DISPONIBLE' : 'OCUPADA / RESERVADA'}
                    </span>
                    <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                      Capacidad: {room.capacity} pers.
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-1">{room.name}</h3>
                  <p className="text-xs font-medium text-indigo-600 mb-4">{room.faculty}</p>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{room.location}</span>
                  </div>

                  <div className="space-y-1.5 mb-6">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Amenidades:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {room.amenities.map((item, idx) => (
                        <span key={idx} className="bg-gray-50 border border-gray-200 text-gray-600 text-xs px-2.5 py-1 rounded-md">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setSelectedRoom(room);
                      setShowModal(true);
                    }}
                    disabled={!isAvailable}
                    className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      isAvailable
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isAvailable ? (
                      <>
                        <Clock className="w-5 h-5" />
                        Reservar Turno (5 min)
                      </>
                    ) : (
                      'Sala No Disponible'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No hay salas encontradas</h3>
          <p className="text-gray-500 mt-1">Prueba seleccionando otra facultad en el filtro superior.</p>
        </div>
      )}

      {/* Modal de Reserva */}
      {showModal && selectedRoom && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900">Reservar Sala de Estudio</h3>
                <p className="text-sm font-medium text-indigo-600 mt-0.5">{selectedRoom.name}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleBook} className="space-y-4">
              <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-1">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Duración Asignada: 5 Minutos</span>
                </div>
                <p className="text-xs text-indigo-700">
                  Al confirmar, dispondrás de exactamente 5 minutos para el uso de la sala antes de su liberación automática.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de Reserva (Hoy o Mañana)</label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none font-medium bg-white"
                >
                  <option value={today}>Hoy - {today}</option>
                  <option value={tomorrow}>Mañana - {tomorrow}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hora de Inicio</label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                    min="08:00"
                    max="19:55"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Asistentes</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedRoom.capacity}
                    value={attendees}
                    onChange={(e) => setAttendees(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Motivo / Actividad</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Ej. Estudio para examen parcial de Cálculo"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none font-medium"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-3 px-4 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-1/2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {isLoading ? 'Confirmando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
