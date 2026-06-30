import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import mqtt from 'mqtt';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const user = useAuthStore((state) => state.user);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const targetUserId = user.role === 'ADMIN' ? 'ADMIN_NOTIFICATIONS' : user.id;
      const res = await fetch(`/api/notifications/user/${targetUserId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
    
    const targetUserId = user.role === 'ADMIN' ? 'ADMIN_NOTIFICATIONS' : user.id;
    const brokerUrl = import.meta.env.VITE_MQTT_URL || 'ws://localhost:9001';
    
    const client = mqtt.connect(brokerUrl);

    client.on('connect', () => {
      console.log('Connected to MQTT broker via WebSockets');
      client.subscribe(`notifications/${targetUserId}`);
    });

    client.on('message', (topic, message) => {
      console.log(`Received real-time MQTT message on ${topic}`);
      fetchNotifications();
      
      import('react-hot-toast').then(module => {
        const toast = module.default;
        try {
          const payload = JSON.parse(message.toString());
          toast.success(`Nueva alerta: ${payload.subject || 'Tienes una nueva notificación'}`, {
            duration: 5000,
            icon: '🔔',
          });
        } catch (error) {
          console.error('Failed to parse MQTT message:', error);
          toast.success('Tienes una nueva notificación', { icon: '🔔' });
        }
      });
    });

    window.addEventListener('notification-update', fetchNotifications);
    
    return () => {
      client.end();
      window.removeEventListener('notification-update', fetchNotifications);
    };
  }, [user, fetchNotifications]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async () => {
    try {
      const targetUserId = user.role === 'ADMIN' ? 'ADMIN_NOTIFICATIONS' : user.id;
      await fetch(`/api/notifications/user/${targetUserId}/read`, { method: 'PUT' });
      // Update local state to reflect read status
      setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleToggle = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening && unreadCount > 0) {
      markAsRead();
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'SENT').length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-100">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-800">
              Notificaciones {user.role === 'ADMIN' && '(Admin)'}
            </h3>
            <button onClick={fetchNotifications} className="text-xs text-indigo-600 hover:text-indigo-800">
              Actualizar
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No tienes notificaciones.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-gray-900">{notif.subject}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
