import { 
    User, 
    LogOut, 
    LayoutDashboard, 
    ClipboardList,
    Users, 
    Server, 
    Key, 
    Download, 
    Image as ImageIcon,
    Settings,
    Menu,
    X,
    Moon,
    Sun,
    Undo2,
    Bell
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useEffect, useState } from 'react';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);
    
    // Parse user from storage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roleNames: string[] = Array.isArray(user.roles) ? user.roles.map((r: any) => r.name) : [];
    const visibleRoles = roleNames.slice(0, 3);
    const extraRoles = roleNames.length > 3 ? roleNames.slice(3) : [];
    const [masqueradeOrigin, setMasqueradeOrigin] = useState(() => {
        try {
            const raw = localStorage.getItem('masquerade_origin');
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            return null;
        }
    });

    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/notifications');
            const data = res.data?.data ?? res.data ?? [];
            const count = data.filter((n: any) => !n.read_at).length;
            setUnreadCount(count);
        } catch (err) {
            console.error('Failed to fetch notifications count', err);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // 30s poll
        return () => clearInterval(interval);
    }, []);
    
    // Role check
    const isAdmin = Array.isArray(user.roles) && user.roles.some((r: any) => r.name === 'admin');
    
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleExitMasquerade = () => {
        if (!masqueradeOrigin) return;
        localStorage.setItem('token', masqueradeOrigin.token || '');
        if (masqueradeOrigin.user) {
            localStorage.setItem('user', JSON.stringify(masqueradeOrigin.user));
        }
        localStorage.removeItem('masquerade_origin');
        setMasqueradeOrigin(null);
        window.location.reload();
    };

    const handleExportAllData = async () => {
        try {
            const [usersRes, rolesRes, servicesRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/roles'),
                api.get('/services')
            ]);

            const backupData = {
                export_date: new Date().toISOString(),
                users: usersRes.data,
                roles: rolesRes.data,
                services: servicesRes.data
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `nita_backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } catch (err) {
            alert("Export failed. Please check your connection.");
        }
    };

    // Helper function to handle active link styling
    const getLinkClass = (path: string) => 
        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-slate-800 dark:hover:bg-slate-800 ${
            location.pathname === path 
                ? 'bg-blue-600 dark:bg-blue-700 text-white dark:text-white' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-300 dark:hover:text-slate-400'
        }`;

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={onToggle}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="Toggle sidebar"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar Overlay (Mobile) */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <div className={`
                w-64 h-screen bg-slate-900 dark:bg-slate-950 text-slate-300 dark:text-slate-400 flex flex-col fixed left-0 top-0 border-r border-slate-800 dark:border-slate-700 z-40 
                transition-transform duration-300 lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
            
            {/* User Profile Header */}
            <div className="p-6 border-b border-slate-800 dark:border-slate-700 bg-slate-900/50 dark:bg-slate-950/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-blue-600/20 dark:bg-blue-500/20 rounded-lg flex-shrink-0">
                            <User className="text-blue-400 dark:text-blue-300" size={20} />
                        </div>
                        <div className="overflow-hidden text-white dark:text-slate-100">
                            <div className="text-sm font-bold truncate">{user.name || user.username || 'Guest'}</div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">@{user.username || 'unknown'}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {roleNames.length > 0 ? (
                                    <>
                                        {visibleRoles.map((r) => (
                                            <span key={r} className="text-[10px] uppercase px-2 py-0.5 rounded-full font-black border border-slate-700/60 bg-slate-800/80 text-slate-200 dark:border-slate-600 dark:bg-slate-800/80">
                                                {r}
                                            </span>
                                        ))}
                                        {extraRoles.length > 0 && (
                                            <span
                                                className="text-[10px] uppercase px-2 py-0.5 rounded-full font-black border border-amber-500/50 bg-amber-500/15 text-amber-200"
                                                title={extraRoles.join(', ')}
                                            >
                                                +{extraRoles.length} more
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-black border border-slate-700/60 bg-slate-800/80 text-slate-200">Staff</span>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-800 transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-200 dark:hover:text-slate-300"
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </div>

            {masqueradeOrigin && (
                <div className="mx-4 mt-4 p-3 border border-amber-400/60 bg-amber-500/10 rounded-lg text-amber-200">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em]">Impersonating</div>
                    <div className="text-sm font-bold text-white">@{user.username || 'user'}</div>
                    <button
                        onClick={handleExitMasquerade}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors"
                    >
                        <Undo2 size={14} /> Return to {masqueradeOrigin?.user?.username || 'admin'}
                    </button>
                </div>
            )}

            {/* Navigation Section */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase px-3 mb-2 tracking-[0.2em]">Main Menu</p>
                
                <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                    <LayoutDashboard size={18} />
                    <span className="text-sm font-medium">My Dashboard</span>
                </Link>

                <Link to="/tickets" className={getLinkClass('/tickets')}>
                    <ClipboardList size={18} />
                    <span className="text-sm font-medium">Complaints / Tickets</span>
                </Link>

                <Link to="/notifications" className={getLinkClass('/notifications')}>
                    <div className="relative">
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border-2 border-slate-900 leading-none">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                    <span className="text-sm font-medium">Notifications</span>
                </Link>

                {isAdmin && (
                    <div className="pt-6 space-y-1">
                        <p className="text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase px-3 mb-2 tracking-[0.2em]">Management</p>
                        <Link to="/admin/roles-config" className={getLinkClass('/admin/roles-config')}>
                            <Users size={18} />
                            <span className="text-sm font-medium">Roles Management</span>
                        </Link>
                        <Link to="/admin/users" className={getLinkClass('/admin/users')}>
                            <Users size={18} />
                            <span className="text-sm font-medium">Users & Roles Mapping</span>
                        </Link>
                        <Link to="/admin/services" className={getLinkClass('/admin/services')}>
                            <Server size={18} />
                            <span className="text-sm font-medium">Service Registry</span>
                        </Link>
                        <Link to="/admin/roles" className={getLinkClass('/admin/roles')}>
                            <Key size={18} />
                            <span className="text-sm font-medium">Access Matrix</span>
                        </Link>
                        <Link to="/admin/icons" className={getLinkClass('/admin/icons')}>
                            <ImageIcon size={18} />
                            <span className="text-sm font-medium">Icon Library</span>
                        </Link>
                        <div className="pt-4 mt-4 border-t border-slate-800/50 dark:border-slate-700/50">
                            <button 
                                onClick={handleExportAllData}
                                className="w-full flex items-center gap-3 px-3 py-2 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded-lg transition-colors"
                            >
                                <Download size={18} />
                                <span className="text-sm font-medium">Export Backup</span>
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Sign Out Button */}
            <div className="border-t border-slate-800 dark:border-slate-700">
                <Link to="/profile" className={getLinkClass('/profile') + " m-4"}>
                    <Settings size={18} />
                    <span className="text-sm font-medium">Profile Settings</span>
                </Link>
                <button 
                    onClick={handleLogout} 
                    className="w-full p-4 flex items-center gap-3 text-slate-400 dark:text-slate-500 hover:text-red-400 dark:hover:text-red-300 hover:bg-red-400/10 dark:hover:bg-red-500/20 transition-all border-t border-slate-800 dark:border-slate-700"
                >
                    <LogOut size={18} />
                    <span className="text-sm font-bold">Sign Out</span>
                </button>
            </div>
        </div>
        </>
    );
}