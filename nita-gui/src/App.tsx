import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/Admin/Users';
import ServiceManagement from './pages/Admin/Services';
import Sidebar from './components/Sidebar';

/**
 * ProtectedLayout Wrapper
 * 1. Checks for authentication token.
 * 2. Renders the Sidebar and Main content area.
 */
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem('token');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar is fixed to the left */}
      <Sidebar />
      
      {/* Main content area shifted right by sidebar width (ml-64) */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
};

/**
 * AdminRoute Wrapper
 * Ensures that only users with the 'admin' role can access specific pages.
 */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.roles?.some((role: any) => role.name === 'admin');

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/login" element={<Login />} />

        {/* --- Authenticated Routes --- */}
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        {/* --- Admin Only Routes --- */}
        <Route
          path="/admin/users"
          element={
            <ProtectedLayout>
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            </ProtectedLayout>
          }
        />

        <Route
          path="/admin/services"
          element={
            <ProtectedLayout>
              <AdminRoute>
                <ServiceManagement />
              </AdminRoute>
            </ProtectedLayout>
          }
        />

        {/* --- Fallback Routes --- */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;