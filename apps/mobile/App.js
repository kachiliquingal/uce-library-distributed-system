import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

export default function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('user@test.com');
  const [password, setPassword] = useState('user123');
  const [apiUrl, setApiUrl] = useState('http://kleberchiliqingaqa1.distribuidauce.org');
  const [showSettings, setShowSettings] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, READ

  // Handle Login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa correo y contraseña.');
      return;
    }
    setLoginLoading(true);
    try {
      const cleanUrl = apiUrl.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Credenciales inválidas o servidor no disponible.');
      }

      setUser({
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        token: data.token,
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || ''
      });
    } catch (error) {
      Alert.alert('Error de Autenticación', error.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Fetch Notifications
  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);
    else setNotifLoading(true);

    try {
      const cleanUrl = apiUrl.replace(/\/$/, '');
      const targetUserId = user.role === 'ADMIN' ? 'ADMIN_NOTIFICATIONS' : user.id;
      const response = await fetch(`${cleanUrl}/api/notifications/user/${targetUserId}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron cargar las notificaciones.`);
      }

      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch error:', error);
      if (!isRefresh) {
        Alert.alert('Error', 'No se pudieron actualizar las notificaciones en tiempo real.');
      }
    } finally {
      setRefreshing(false);
      setNotifLoading(false);
    }
  }, [user, apiUrl]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Polling for real-time updates every 10 seconds
      const interval = setInterval(() => fetchNotifications(true), 10000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    try {
      const cleanUrl = apiUrl.replace(/\/$/, '');
      const targetUserId = user.role === 'ADMIN' ? 'ADMIN_NOTIFICATIONS' : user.id;
      await fetch(`${cleanUrl}/api/notifications/user/${targetUserId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
    } catch (error) {
      Alert.alert('Error', 'No se pudieron marcar como leídas.');
    }
  };

  // Logout
  const handleLogout = () => {
    setUser(null);
    setNotifications([]);
  };

  // Filtered Notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'UNREAD') return n.status === 'SENT';
    if (filter === 'READ') return n.status === 'READ';
    return true;
  });

  const unreadCount = notifications.filter(n => n.status === 'SENT').length;

  // Render Notification Item
  const renderItem = ({ item }) => {
    const isUnread = item.status === 'SENT';
    const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString('es-ES', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'Reciente';

    let icon = '🔔';
    if (item.type === 'LOAN_CREATED') icon = '📖';
    else if (item.type === 'LOAN_RETURNED') icon = '✅';
    else if (item.type === 'FINE_CREATED') icon = '⚠️';
    else if (item.type === 'RESERVATION_READY') icon = '🎯';

    return (
      <View style={[styles.card, isUnread && styles.cardUnread]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{icon}</Text>
          <Text style={styles.cardType}>{item.type || 'ALERTA UCE'}</Text>
          <Text style={styles.cardDate}>{dateStr}</Text>
        </View>
        <Text style={styles.cardMessage}>{item.message}</Text>
        {isUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>NUEVO</Text>
          </View>
        )}
      </View>
    );
  };

  // LOGIN SCREEN RENDER
  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#1e1b4b" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.loginContainer}
        >
          <View style={styles.loginHeader}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>📚</Text>
            </View>
            <Text style={styles.loginTitle}>UCE Library</Text>
            <Text style={styles.loginSubtitle}>Centro de Notificaciones Móvil</Text>
          </View>

          <View style={styles.loginForm}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="ejemplo@uce.edu.ec"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.loginBtn, loginLoading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsToggle}
              onPress={() => setShowSettings(!showSettings)}
            >
              <Text style={styles.settingsToggleText}>
                {showSettings ? '▲ Ocultar Servidor API' : '▼ Configurar Servidor API'}
              </Text>
            </TouchableOpacity>

            {showSettings && (
              <View style={styles.settingsBox}>
                <Text style={styles.settingsLabel}>URL del Servidor Backend / API Gateway:</Text>
                <TextInput
                  style={styles.settingsInput}
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  autoCapitalize="none"
                  placeholder="http://kleberchiliqingaqa1.distribuidauce.org"
                  placeholderTextColor="#64748b"
                />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // NOTIFICATIONS SCREEN RENDER
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1e1b4b" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notificaciones UCE</Text>
          <Text style={styles.headerSubtitle}>
            Hola, {user.firstName || user.email.split('@')[0]} ({user.role})
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{notifications.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#ef4444' }]}>{unreadCount}</Text>
          <Text style={styles.statLabel}>Sin leer</Text>
        </View>
        <TouchableOpacity style={styles.readAllBtn} onPress={markAllAsRead}>
          <Text style={styles.readAllText}>✓ Marcar leídas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        {['ALL', 'UNREAD', 'READ'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'ALL' ? 'Todas' : f === 'UNREAD' ? 'Nuevas' : 'Leídas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {notifLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Cargando alertas en tiempo real...</Text>
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>No tienes notificaciones</Text>
          <Text style={styles.emptySubtitle}>
            Cuando realices préstamos, devoluciones o tengas multas, aparecerán aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item, idx) => item.id || idx.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(true)}
              colors={['#6366f1']}
              tintColor="#6366f1"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  // LOGIN STYLES
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#312e81',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  logoEmoji: {
    fontSize: 40,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  loginForm: {
    backgroundColor: '#1e293b',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsToggle: {
    marginTop: 20,
    alignItems: 'center',
  },
  settingsToggleText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '600',
  },
  settingsBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  settingsLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
  },
  settingsInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#38bdf8',
  },
  // HEADER STYLES
  header: {
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#312e81',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#a5b4fc',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#ef444420',
    borderWidth: 1,
    borderColor: '#ef444450',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#f87171',
    fontWeight: '600',
    fontSize: 13,
  },
  // STATS BAR
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  statBox: {
    marginRight: 24,
  },
  statNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  readAllBtn: {
    marginLeft: 'auto',
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  readAllText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  // FILTER BAR
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  filterTabActive: {
    backgroundColor: '#312e81',
  },
  filterText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#818cf8',
  },
  // LIST STYLES
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardUnread: {
    borderColor: '#6366f1',
    backgroundColor: '#1e1b4b50',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  cardType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#818cf8',
    textTransform: 'uppercase',
    flex: 1,
  },
  cardDate: {
    fontSize: 11,
    color: '#64748b',
  },
  cardMessage: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
  },
  unreadBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#6366f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  // EMPTY & LOADING
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});
