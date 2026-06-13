import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { LoginPage } from "./pages/LoginPage";
import { UserCatalog } from "./pages/user/UserCatalog";
import { AdminUserManagement } from "./pages/admin/AdminUserManagement";

// Component to protect private routes
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          {/* If you are already logged in and go to login, we send you to the catalog */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/catalog" replace />
              ) : (
                <LoginPage />
              )
            }
          />

          {/* Private Routes */}
          <Route
            path="/catalog"
            element={
              <ProtectedRoute>
                <UserCatalog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUserManagement />
              </ProtectedRoute>
            }
          />

          {/* Default Redirection */}
          <Route
            path="*"
            element={
              <Navigate to={isAuthenticated ? "/catalog" : "/login"} replace />
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
