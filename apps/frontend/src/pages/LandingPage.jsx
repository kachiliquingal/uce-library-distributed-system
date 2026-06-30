import { useNavigate } from "react-router-dom";
import { BookOpen, ArrowRight, Library, Globe, Layers, Bell } from "lucide-react";

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-200">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">
                Sistema Bibliotecario <span className="text-blue-600">UCE</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/login")}
                className="hidden sm:inline-flex px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
              >
                Ingresar
              </button>
              <button
                onClick={() => navigate("/login?mode=register")}
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
              >
                Crear Cuenta
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-[100%] blur-3xl -z-10 opacity-70"></div>
        <div className="absolute top-40 -right-20 w-[400px] h-[400px] bg-gradient-to-br from-purple-100 to-pink-50 rounded-full blur-3xl -z-10 opacity-60"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8 animate-fade-in-up">
            <Globe className="h-4 w-4" />
            <span>Uniendo el conocimiento de toda la comunidad universitaria</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            El conocimiento de la UCE, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              a tu alcance
            </span>
          </h1>
          
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-600 leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Accede al catálogo centralizado, descubre nuevos recursos académicos, gestiona tus préstamos y recibe notificaciones en tiempo real desde un solo lugar.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-full shadow-xl shadow-gray-200 transition-all hover:-translate-y-1 gap-2"
            >
              Iniciar Sesión <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate("/login?mode=register")}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-900 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-full shadow-sm transition-all hover:-translate-y-1"
            >
              Únete a la comunidad
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Un ecosistema diseñado para ti</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:shadow-lg transition-shadow duration-300 group">
              <div className="bg-blue-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Library className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Catálogo Centralizado</h3>
              <p className="text-gray-600 leading-relaxed">
                Explora miles de libros de todas las 21 facultades de la universidad con un potente motor de búsqueda en tiempo real.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:shadow-lg transition-shadow duration-300 group">
              <div className="bg-indigo-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Layers className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Préstamos Ágiles</h3>
              <p className="text-gray-600 leading-relaxed">
                Solicita, renueva o devuelve libros con un solo clic. Nuestro sistema automatizado se encarga de todo el papeleo por ti.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:shadow-lg transition-shadow duration-300 group">
              <div className="bg-purple-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Bell className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Notificaciones Inteligentes</h3>
              <p className="text-gray-600 leading-relaxed">
                Mantente al día. Recibe alertas instantáneas sobre la disponibilidad de tus libros favoritos y recordatorios de devolución.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Global simple animations CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
      `}} />
    </div>
  );
};
