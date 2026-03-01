import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import { Search, Shield, UserCheck, RefreshCw, Database } from 'lucide-react';

const UsersAdmin = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [ldapType, setLdapType] = useState('1'); 
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [uRes, rRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/roles') 
            ]);
            setUsers(uRes.data);
            setRoles(rRes.data);
        } catch (err) {
            console.error("Management data fetch failed", err);
        } finally {
            setInitialLoad(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        
        setLoading(true);
        try {
            // Path matches your api.php: Route::post('/users/sync') inside 'admin' prefix
            await api.post('/admin/users/sync', {
                username: searchTerm.trim(),
                type: ldapType
            });
            
            setSearchTerm('');
            await fetchData(); // Refresh list to show new user
            alert("User discovered and synced successfully!");
        } catch (err: any) {
            const msg = err.response?.data?.message || "LDAP Discovery failed. Check if user exists.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId: number, roleIds: number[]) => {
        setUpdatingId(userId);
        try {
            await api.put(`/admin/users/${userId}/roles`, { roles: roleIds });
            
            // Optimistic Update
            setUsers(prev => prev.map(u => 
                u.id === userId ? { ...u, roles: roles.filter(r => roleIds.includes(r.id)) } : u
            ));
        } catch (err) {
            alert("Failed to update roles.");
            fetchData(); 
        } finally {
            setUpdatingId(null);
        }
    };

    if (initialLoad) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-4">
            <RefreshCw className="animate-spin text-blue-500" size={32} />
            <p className="font-medium">Loading NCRA User Directory...</p>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
                    <p className="text-slate-500">Bridge OpenLDAP/FreeIPA accounts to NITA system roles.</p>
                </div>
                <div className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    Local Cache: {users.length} Users
                </div>
            </header>
            
            {/* DISCOVERY CARD */}
            <section className="mb-10 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4 text-blue-600">
                    <Search size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-wider">LDAP Discovery</h3>
                </div>
                <form onSubmit={handleImport} className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-48">
                        <select 
                            value={ldapType} 
                            onChange={(e) => setLdapType(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                        >
                            <option value="1">OpenLDAP</option>
                            <option value="2">FreeIPA</option>
                        </select>
                    </div>
                    <div className="flex-1 relative">
                        <input 
                            type="text" 
                            placeholder="Exact username (e.g., rpatil)" 
                            className="w-full p-2.5 pl-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            required
                        />
                    </div>
                    <button 
                        disabled={loading}
                        className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 transition-all flex items-center gap-2 justify-center"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={18} /> : <UserCheck size={18} />}
                        {loading ? 'Discovering...' : 'Sync User'}
                    </button>
                </form>
            </section>

            {/* USERS TABLE */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-bold">
                            <th className="p-4">User Identity</th>
                            <th className="p-4">Authority</th>
                            <th className="p-4">Assigned Roles</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-12 text-center">
                                    <Database className="mx-auto text-slate-200 mb-2" size={48} />
                                    <p className="text-slate-400">No synchronized users found.</p>
                                </td>
                            </tr>
                        ) : users.map(user => (
                            <tr key={user.id} className={`transition-colors ${updatingId === user.id ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                                <td className="p-4">
                                    <div className="font-bold text-slate-900">{user.name}</div>
                                    <div className="text-xs font-mono text-blue-500">uid: {user.username}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        user.type === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'
                                    }`}>
                                        {user.type === 1 ? 'OpenLDAP' : 'FreeIPA'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {roles.map(role => {
                                            const isActive = user.roles?.some((r: any) => r.id === role.id);
                                            return (
                                                <button
                                                    key={role.id}
                                                    disabled={updatingId === user.id}
                                                    onClick={() => {
                                                        const currentIds = user.roles.map((r: any) => r.id);
                                                        const newIds = isActive 
                                                            ? currentIds.filter((id: number) => id !== role.id)
                                                            : [...currentIds, role.id];
                                                        handleRoleUpdate(user.id, newIds);
                                                    }}
                                                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 border ${
                                                        isActive 
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                                                    }`}
                                                >
                                                    <Shield size={10} />
                                                    {role.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersAdmin;