import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
    
    // Auto refresh notifications every 30s
    const interval = setInterval(fetchNotifications, 30000);
    window.addEventListener('notification-update', fetchNotifications);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-update', fetchNotifications);
    };
  }, [user]);

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

  const fetchNotifications = async () => {
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
  };

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
