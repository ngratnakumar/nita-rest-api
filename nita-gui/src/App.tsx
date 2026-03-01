import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/Admin/Users';
import ServiceManagement from './pages/Admin/Services';
import RolesManagement from './pages/Admin/Roles'; 
import RolesManager from './pages/Admin/RolesManager'; 
import IconManager from './pages/Admin/IconManager'; // Added Import
import Sidebar from './components/Sidebar';

// 1. Unified Layout Wrapper
const ProtectedLayout = () => {
  const isAuthenticated = !!localStorage.getItem('token');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <Outlet /> {/* This renders the specific page component */}
      </main>
    </div>
  );
};

// 2. Admin Gatekeeper
const AdminRoute = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.roles?.some((role: any) => role.name === 'admin');
  
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes (Require Login) */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Admin-Only Section */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/services" element={<ServiceManagement />} />
            <Route path="/admin/roles" element={<RolesManagement />} />
            <Route path="/admin/roles-config" element={<RolesManager />} />
            <Route path="/admin/icons" element={<IconManager />} />
          </Route>
        </Route>

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;