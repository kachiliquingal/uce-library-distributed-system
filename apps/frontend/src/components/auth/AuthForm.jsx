import { useState } from "react";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export const AuthForm = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  // Extract the status and functions of our global store from Zustand
  const { login, register, isLoading, error, clearError } = useAuthStore();

  const validateForm = () => {
    setValidationError("");
    clearError();

    // Email Shielding using Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError("Por favor ingresa un correo electrónico válido.");
      return false;
    }

    // Password boundary
    if (password.length < 6) {
      setValidationError("La contraseña debe tener al menos 6 caracteres.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isLogin) {
      const success = await login(email, password);
      if (success) onSuccess();
    } else {
      const success = await register(email, password);
      if (success) {
        // Automatic login after successful registration
        const loginSuccess = await login(email, password);
        if (loginSuccess) onSuccess();
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail("");
    setPassword("");
    setValidationError("");
    clearError();
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
        </h2>
        <p className="text-gray-500 mt-2">
          {isLogin
            ? "Ingresa tus credenciales para acceder al catálogo"
            : "Regístrate para solicitar libros en la biblioteca"}
        </p>
      </div>

      {/* Combined error alerts (Frontend validation or backend error) */}
      {(validationError || error) && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {validationError || error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Correo Electrónico
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setValidationError("");
                clearError();
              }}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
              placeholder="alejandro@uce.edu.ec"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Contraseña
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setValidationError("");
                clearError();
              }}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
              Procesando...
            </>
          ) : isLogin ? (
            "Iniciar Sesión"
          ) : (
            "Registrarse"
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}
          <button
            onClick={toggleMode}
            disabled={isLoading}
            className="ml-2 font-bold text-blue-600 hover:text-blue-500 transition-colors disabled:opacity-50"
          >
            {isLogin ? "Regístrate aquí" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
};
