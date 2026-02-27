import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Server, ClipboardList, LogOut } from 'lucide-react';

export default function Sidebar() {
    const location = useLocation();
    
    // Retrieve user data stored during login in AuthController
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Check if user has the 'admin' role
    const isAdmin = user.roles?.some((role: any) => role.name === 'admin');

    const isActive = (path: string) => location.pathname === path ? 'bg-blue-700' : '';

    return (
        <div className="w-64 h-screen bg-slate-900 text-white flex flex-column p-4 fixed left-0 top-0">
            <div className="mb-8 px-4">
                <h1 className="text-xl font-bold tracking-tight text-blue-400">NITA Console</h1>
            </div>

            <nav className="flex-1 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase px-4 mb-2">General</p>
                <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800 transition ${isActive('/dashboard')}`}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </Link>

                {/* ADMINISTRATIVE SECTION - Only visible to Admins */}
                {isAdmin && (
                    <div className="mt-8 pt-4 border-t border-slate-800">
                        <p className="text-xs font-semibold text-slate-500 uppercase px-4 mb-2">Administration</p>
                        <Link to="/admin/users" className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800 transition ${isActive('/admin/users')}`}>
                            <Users size={20} />
                            <span>User Management</span>
                        </Link>
                        <Link to="/admin/services" className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800 transition ${isActive('/admin/services')}`}>
                            <Server size={20} />
                            <span>Service Registry</span>
                        </Link>
                        <Link to="/admin/logs" className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800 transition ${isActive('/admin/logs')}`}>
                            <ClipboardList size={20} />
                            <span>Audit Logs</span>
                        </Link>
                    </div>
                )}
            </nav>

            <button 
                onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                className="flex items-center gap-3 px-4 py-2 mt-auto text-red-400 hover:bg-red-900/20 rounded-lg transition"
            >
                <LogOut size={20} />
                <span>Sign Out</span>
            </button>
        </div>
    );
}