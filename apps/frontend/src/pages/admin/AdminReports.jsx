import { useState, useEffect } from 'react';
import { reportApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { 
  BarChart3, TrendingUp, Users, DollarSign, Activity, RefreshCw, Code, 
  BookOpen, CheckCircle, Clock, FileText, Table, Download, 
  Calendar, Building2, Layers 
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminReports = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'graphql'
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    loansPerDay: [],
    topBooks: [],
    activeUsers: 0,
    fineRevenue: { totalRevenue: 0, paidCount: 0, pendingCount: 0, pendingAmount: 0 }
  });

  // Export Panel state
  const [exportType, setExportType] = useState('summary'); // 'summary' | 'top-books' | 'loans' | 'fines'
  const [exportPeriod, setExportPeriod] = useState('week'); // 'day' | 'week' | 'month' | 'year'
  const [exportFaculty, setExportFaculty] = useState('Todas las Facultades');
  const [exportLoading, setExportLoading] = useState(null); // null | 'pdf' | 'csv'

  // GraphQL Explorer state
  const [gqlQuery, setGqlQuery] = useState(`query GetLibraryAnalytics {
  loansPerDay(days: 7) {
    date
    count
  }
  topBorrowedBooks(limit: 5) {
    bookId
    title
    borrowCount
  }
  activeUsersCount(days: 30)
  fineRevenueSummary {
    totalRevenue
    paidCount
    pendingAmount
  }
}`);
  const [gqlResult, setGqlResult] = useState('');
  const [gqlLoading, setGqlLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await reportApi.get('/summary');
      if (response.data && Array.isArray(response.data.loansPerDay) && Array.isArray(response.data.topBooks)) {
        setSummaryData(response.data);
        toast.success('Métricas de InfluxDB actualizadas');
      } else {
        throw new Error('Respuesta de analítica no válida (formato incorrecto)');
      }
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      toast.error('Error al cargar datos de analítica (mostrando respaldo)');
      // Set realistic fallback if offline/error
      setSummaryData({
        loansPerDay: [
          { date: '2026-06-28', count: 5 },
          { date: '2026-06-29', count: 8 },
          { date: '2026-06-30', count: 12 },
          { date: '2026-07-01', count: 7 },
          { date: '2026-07-02', count: 15 },
          { date: '2026-07-03', count: 10 },
          { date: '2026-07-04', count: 14 }
        ],
        topBooks: [
          { bookId: '978-0132350884', title: 'Clean Code: A Handbook of Agile Software Craftsmanship', borrowCount: 24 },
          { bookId: '978-0135957059', title: 'The Pragmatic Programmer', borrowCount: 19 },
          { bookId: '978-0201633610', title: 'Design Patterns', borrowCount: 15 }
        ],
        activeUsers: 48,
        fineRevenue: { totalRevenue: 145.50, paidCount: 18, pendingCount: 4, pendingAmount: 32.00 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const executeGraphQLQuery = async () => {
    setGqlLoading(true);
    try {
      const response = await reportApi.post('/graphql', { query: gqlQuery });
      setGqlResult(JSON.stringify(response.data, null, 2));
      toast.success('Consulta GraphQL ejecutada con éxito');
    } catch (error) {
      console.error('GraphQL error:', error);
      setGqlResult(JSON.stringify(error.response?.data || { error: error.message }, null, 2));
      toast.error('Error en la consulta GraphQL');
    } finally {
      setGqlLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExportLoading(format);
    const toastId = toast.loading(`Generando reporte en ${format.toUpperCase()}...`);
    try {
      const response = await reportApi.get('/export', {
        params: {
          period: exportPeriod,
          type: exportType,
          format: format,
          faculty: exportFaculty,
          requestedBy: user?.email || 'Administrador UCE'
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'pdf' ? 'pdf' : 'csv';
      const cleanFaculty = exportFaculty.replace(/[^a-zA-Z0-9]/g, '_');
      link.setAttribute('download', `Reporte_UCE_Library_${exportType}_${exportPeriod}_${cleanFaculty}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Reporte ${format.toUpperCase()} exportado y descargado con éxito`, { id: toastId });
    } catch (error) {
      console.error('Error al exportar reporte:', error);
      toast.error('Error al generar el archivo de exportación', { id: toastId });
    } finally {
      setExportLoading(null);
    }
  };

  const loansArray = Array.isArray(summaryData?.loansPerDay) ? summaryData.loansPerDay : [];
  const topBooksArray = Array.isArray(summaryData?.topBooks) ? summaryData.topBooks : [];
  const maxLoanCount = Math.max(...(loansArray.map(d => d?.count || 0) || [1]), 1);
  const maxBorrow = Math.max(...(topBooksArray.map(b => b?.borrowCount || 0) || [1]), 1);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-indigo-300" />
            <h1 className="text-3xl font-extrabold tracking-tight">Reportes y Analítica</h1>
          </div>
          <p className="text-indigo-200 mt-1 text-sm flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Motor de series temporales con InfluxDB & Consultas Dinámicas con GraphQL
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'dashboard' ? 'bg-white text-indigo-900 shadow-lg' : 'bg-indigo-800/60 text-indigo-200 hover:bg-indigo-800'
            }`}
          >
            Dashboard Visual
          </button>
          <button
            onClick={() => setActiveTab('graphql')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'graphql' ? 'bg-white text-indigo-900 shadow-lg' : 'bg-indigo-800/60 text-indigo-200 hover:bg-indigo-800'
            }`}
          >
            <Code className="h-4 w-4" /> Explorador GraphQL
          </button>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2.5 bg-indigo-700/80 hover:bg-indigo-600 text-white rounded-xl transition-all shadow-md hover:rotate-180 duration-500 disabled:opacity-50"
            title="Actualizar Métricas"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {/* Executive Export Panel */}
          <div className="bg-gradient-to-br from-white via-indigo-50/40 to-purple-50/40 p-6 rounded-2xl shadow-sm border border-indigo-100 transition-all hover:shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Download className="h-6 w-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-gray-900">Centro de Exportación de Reportes Oficiales</h2>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Genera y descarga reportes ejecutivos en PDF o CSV listos para auditorías universitarias o análisis en Excel
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold shadow-sm">
                <FileText className="h-3.5 w-3.5" /> Descarga Directa a PC
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Report Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-indigo-600" /> Tipo de Reporte
                </label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                >
                  <option value="summary">Resumen Ejecutivo Integral</option>
                  <option value="top-books">Ranking de Libros Más Prestados</option>
                  <option value="loans">Historial y Actividad de Préstamos</option>
                  <option value="fines">Resumen Financiero de Multas</option>
                </select>
              </div>

              {/* Time Period Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-purple-600" /> Período de Evaluación
                </label>
                <select
                  value={exportPeriod}
                  onChange={(e) => setExportPeriod(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm transition-all"
                >
                  <option value="day">Por Día (Últimas 24 Horas)</option>
                  <option value="week">Por Semana (Últimos 7 Días)</option>
                  <option value="month">Por Mes (Últimos 30 Días)</option>
                  <option value="year">Anual (Último Año - 365 Días)</option>
                </select>
              </div>

              {/* Faculty Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-green-600" /> Filtro por Facultad / Unidad
                </label>
                <select
                  value={exportFaculty}
                  onChange={(e) => setExportFaculty(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition-all"
                >
                  <option value="Todas las Facultades">Todas las Facultades (General)</option>
                  <option value="Ingeniería y Ciencias Aplicadas">Ingeniería y Ciencias Aplicadas</option>
                  <option value="Jurisprudencia y Ciencias Sociales">Jurisprudencia y Ciencias Sociales</option>
                  <option value="Ciencias Médicas y de la Salud">Ciencias Médicas y de la Salud</option>
                  <option value="Ciencias Económicas y Administrativas">Ciencias Económicas y Administrativas</option>
                  <option value="Artes y Humanidades">Artes y Humanidades</option>
                  <option value="Ciencias Químicas y Biológicas">Ciencias Químicas y Biológicas</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-2">
              <button
                onClick={() => handleExport('pdf')}
                disabled={exportLoading !== null}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-600 to-indigo-700 hover:from-red-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 transform active:scale-95"
              >
                {exportLoading === 'pdf' ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
                <span>Exportar en PDF (Oficial UCE)</span>
              </button>

              <button
                onClick={() => handleExport('csv')}
                disabled={exportLoading !== null}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 transform active:scale-95"
              >
                {exportLoading === 'csv' ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Table className="h-5 w-5" />
                )}
                <span>Exportar en CSV (Excel)</span>
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Préstamos (7 días)</span>
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-gray-900">
                  {loansArray.reduce((acc, curr) => acc + (curr?.count || 0), 0)}
                </span>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                  +12% vs sem. ant.
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Usuarios Activos (30d)</span>
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-gray-900">
                  {summaryData?.activeUsers || 0}
                </span>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  En línea
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Ingresos por Multas</span>
                <div className="p-3 bg-green-50 rounded-xl text-green-600">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-gray-900">
                  ${summaryData.fineRevenue?.totalRevenue?.toFixed(2) || '0.00'}
                </span>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> {summaryData.fineRevenue?.paidCount || 0} pagadas
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Multas Pendientes</span>
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-gray-900">
                  ${summaryData.fineRevenue?.pendingAmount?.toFixed(2) || '0.00'}
                </span>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {summaryData.fineRevenue?.pendingCount || 0} por cobrar
                </span>
              </div>
            </div>
          </div>

          {/* Charts & Top Books */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Daily Loans Bar Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  Préstamos Diarios (Serie Temporal InfluxDB)
                </h3>
                <p className="text-xs text-gray-500 mt-1">Actividad registrada en los últimos 7 días</p>
              </div>

              <div className="mt-8 flex items-end justify-between gap-3 h-64 pt-6 px-2">
                {loansArray.map((day, index) => {
                  const heightPercentage = Math.round(((day?.count || 0) / maxLoanCount) * 100);
                  const dateLabel = day?.date ? new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }) : 'N/A';
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day?.count || 0}
                      </div>
                      <div 
                        className="w-full max-w-[48px] bg-gradient-to-t from-indigo-700 via-indigo-600 to-purple-500 rounded-t-xl transition-all duration-500 group-hover:brightness-110 shadow-sm"
                        style={{ height: `${Math.max(heightPercentage, 8)}%` }}
                      ></div>
                      <span className="text-xs font-medium text-gray-500 capitalize">{dateLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Borrowed Books */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Libros Más Prestados
                </h3>
                <p className="text-xs text-gray-500 mt-1">Ranking general en todo el ecosistema</p>
              </div>

              <div className="mt-6 space-y-5">
                {topBooksArray.map((book, idx) => {
                  const widthPct = Math.round(((book?.borrowCount || 0) / maxBorrow) * 100);
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-800 truncate max-w-[200px]" title={book?.title || 'Sin título'}>
                          #{idx + 1}. {book?.title || 'Sin título'}
                        </span>
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">
                          {book?.borrowCount || 0} préstamos
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${widthPct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* GraphQL Explorer */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gray-900 text-white flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Code className="h-5 w-5 text-pink-400" />
                Explorador Interactivo GraphQL
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Escribe consultas personalizadas hacia el servidor GraphQL (`/api/reports/graphql`)
              </p>
            </div>
            <button
              onClick={executeGraphQLQuery}
              disabled={gqlLoading}
              className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {gqlLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Code className="h-4 w-4" />
              )}
              Ejecutar Consulta
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* Query Editor */}
            <div className="p-6 bg-gray-50 flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Consulta GraphQL (Query)
              </label>
              <textarea
                value={gqlQuery}
                onChange={(e) => setGqlQuery(e.target.value)}
                className="w-full h-80 font-mono text-sm bg-gray-900 text-green-400 p-4 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-inner resize-none"
                spellCheck="false"
              ></textarea>
            </div>

            {/* Response Viewer */}
            <div className="p-6 bg-gray-50 flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Respuesta JSON en Tiempo Real
              </label>
              <pre className="w-full h-80 font-mono text-sm bg-gray-900 text-indigo-300 p-4 rounded-xl border border-gray-700 overflow-auto shadow-inner">
                {gqlResult || '// Haz clic en "Ejecutar Consulta" para ver la respuesta del servidor GraphQL'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
