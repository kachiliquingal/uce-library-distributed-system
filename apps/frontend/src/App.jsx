import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { LoginPage } from "./pages/LoginPage";
import { LandingPage } from "./pages/LandingPage";
import { UserCatalog } from "./pages/user/UserCatalog";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { Layout } from "./components/Layout";
import { UserLoans } from "./pages/user/UserLoans";
import { AdminLoans } from "./pages/admin/AdminLoans";
import { AdminInventory } from "./pages/admin/AdminInventory";

// Protected Route for any authenticated user
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Protected Route strictly for ADMIN
const AdminRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "ADMIN") return <Navigate to="/catalog" replace />;
  
  return children;
};

function App() {
  const { isAuthenticated, user, validateSession, isLoading } = useAuthStore();

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Helper to determine home path based on role
  const getHomePath = () => {
    return user?.role === "ADMIN" ? "/admin" : "/catalog";
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to={getHomePath()} replace />
              ) : (
                <LandingPage />
              )
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to={getHomePath()} replace />
              ) : (
                <LoginPage />
              )
            }
          />

          {/* User Routes */}
          <Route
            path="/catalog"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserCatalog />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-loans"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserLoans />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/loans"
            element={
              <AdminRoute>
                <Layout>
                  <AdminLoans />
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <AdminRoute>
                <Layout>
                  <AdminInventory />
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <Layout>
                  <div className="text-xl">Admin Users View Coming Soon...</div>
                </Layout>
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route
            path="*"
            element={
              <Navigate to={isAuthenticated ? getHomePath() : "/"} replace />
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
