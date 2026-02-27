import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/Admin/Users';
import ServiceManagement from './pages/Admin/Services';
import RolesManagement from './pages/Admin/Roles'; // This is your Access Matrix
import RolesManager from './pages/Admin/RolesManager'; // Add this import
import Sidebar from './components/Sidebar';

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // Check if user has 'admin' role in their roles array
  const isAdmin = user.roles?.some((role: any) => role.name === 'admin');
  return isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />

        {/* Admin Section */}
        <Route path="/admin/users" element={<ProtectedLayout><AdminRoute><UserManagement /></AdminRoute></ProtectedLayout>} />
        <Route path="/admin/services" element={<ProtectedLayout><AdminRoute><ServiceManagement /></AdminRoute></ProtectedLayout>} />
        
        {/* Permission Matrix (Who gets what) */}
        <Route path="/admin/roles" element={<ProtectedLayout><AdminRoute><RolesManagement /></AdminRoute></ProtectedLayout>} />
        
        {/* Role Configuration (Create/Edit Role Names) */}
        <Route path="/admin/roles-config" element={<ProtectedLayout><AdminRoute><RolesManager /></AdminRoute></ProtectedLayout>} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;