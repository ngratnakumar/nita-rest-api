import { User, Shield, LogOut, LayoutDashboard, Users, Server, Key, ShieldCheck } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Parse user from storage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // The logic check
    const isAdmin = Array.isArray(user.roles) && user.roles.some((r: any) => r.name === 'admin');
    
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0 border-r border-slate-800">
            {/* User Profile & Role Badge */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                        <User className="text-blue-400" size={20} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{user.username || 'Guest'}</p>
                        {/* THE ROLE BADGE */}
                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold tracking-wider ${
                            isAdmin ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        }`}>
                            {isAdmin ? 'System Admin' : 'Staff User'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase px-3 mb-2 tracking-widest">Main Menu</p>
                <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-slate-800 ${location.pathname === '/dashboard' ? 'bg-blue-600 text-white' : ''}`}>
                    <LayoutDashboard size={18} />
                    <span className="text-sm">My Services</span>
                </Link>
                <NavLink to="/admin/roles-config" className={({ isActive }) => `flex items-center gap-2 p-2 rounded ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>
                <ShieldCheck size={20} />
                    <span>Role Settings</span>
                </NavLink>

                {/* ADMIN TOOLS - Only rendered if isAdmin is true */}
                {isAdmin && (
                    <div className="mt-8">
                        <p className="text-[10px] font-bold text-slate-500 uppercase px-3 mb-2 tracking-widest">Management</p>
                        <Link to="/admin/users" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-slate-800 ${location.pathname === '/admin/users' ? 'bg-blue-600 text-white' : ''}`}>
                            <Users size={18} />
                            <span className="text-sm">Users & Roles</span>
                        </Link>
                        <Link to="/admin/services" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-slate-800 ${location.pathname === '/admin/services' ? 'bg-blue-600 text-white' : ''}`}>
                            <Server size={18} />
                            <span className="text-sm">Service Registry</span>
                        </Link>
                        <Link to="/admin/roles" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-slate-800 ${location.pathname === '/admin/roles' ? 'bg-blue-600 text-white' : ''}`}>
                            <Key size={18} />
                            <span className="text-sm">Access Matrix</span>
                        </Link>
                    </div>
                )}
            </nav>

            {/* Logout */}
            <button onClick={handleLogout} className="p-4 flex items-center gap-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all border-t border-slate-800">
                <LogOut size={18} />
                <span className="text-sm font-medium">Sign Out</span>
            </button>
        </div>
    );
}