import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';

const UsersAdmin = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [ldapType, setLdapType] = useState('1'); // 1: OpenLDAP, 2: FreeIPA
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    const fetchInitialData = async () => {
        try {
            // Path Correction: 
            // 1. /admin/users matches Route::prefix('admin')->get('/users')
            // 2. /roles matches the top-level Route::get('/roles')
            const [uRes, rRes] = await Promise.all([
                axios.get('/admin/users'),
                axios.get('/roles') 
            ]);
            setUsers(uRes.data);
            setRoles(rRes.data);
        } catch (err) {
            console.error("Failed to fetch user management data", err);
        } finally {
            setInitialLoad(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Path Correction: Removed /api/ prefix
            await axios.post('/admin/users/sync', {
                username: searchTerm,
                type: ldapType
            });
            alert("User synced successfully!");
            setSearchTerm('');
            fetchInitialData(); 
        } catch (err: any) {
            const msg = err.response?.data?.message || "Sync failed";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId: number, roleIds: number[]) => {
        try {
            // Path Correction: Removed /api/ prefix
            await axios.put(`/admin/users/${userId}/roles`, { roles: roleIds });
            
            // Optimistic Update: Update local state so UI is snappy
            setUsers(prev => prev.map(u => 
                u.id === userId ? { ...u, roles: roles.filter(r => roleIds.includes(r.id)) } : u
            ));
        } catch (err) {
            alert("Role update failed");
            fetchInitialData(); // Revert on failure
        }
    };

    if (initialLoad) return <div className="p-6 text-slate-500">Loading Management Data...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
                <p className="text-slate-500">Import users from LDAP/FreeIPA and assign system roles.</p>
            </header>
            
            {/* LDAP Discovery Section */}
            <section className="mb-10 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Discovery</h3>
                <form onSubmit={handleImport} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-none">
                        <select 
                            value={ldapType} 
                            onChange={(e) => setLdapType(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="1">OpenLDAP</option>
                            <option value="2">FreeIPA</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <input 
                            type="text" 
                            placeholder="Enter exact username (e.g. meshram)" 
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            required
                        />
                    </div>
                    <button 
                        disabled={loading}
                        className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                    >
                        {loading ? 'Searching...' : 'Sync User'}
                    </button>
                </form>
            </section>

            {/* Users List */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-4 font-semibold text-slate-700">User Details</th>
                            <th className="p-4 font-semibold text-slate-700">Source</th>
                            <th className="p-4 font-semibold text-slate-700">Access Roles</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-slate-400">No users found in local database.</td>
                            </tr>
                        ) : users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-slate-900">{user.name}</div>
                                    <div className="text-sm text-slate-500">@{user.username}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        user.type === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-violet-100 text-violet-800'
                                    }`}>
                                        {user.type === 1 ? 'OpenLDAP' : 'FreeIPA'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {roles.map(role => (
                                            <label 
                                                key={role.id} 
                                                className={`inline-flex items-center px-3 py-1 rounded-lg text-sm cursor-pointer transition-all border ${
                                                    user.roles?.some((r: any) => r.id === role.id)
                                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                <input 
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={user.roles?.some((r: any) => r.id === role.id)}
                                                    onChange={(e) => {
                                                        const currentIds = user.roles.map((r: any) => r.id);
                                                        const newIds = e.target.checked 
                                                            ? [...currentIds, role.id]
                                                            : currentIds.filter((id: number) => id !== role.id);
                                                        handleRoleUpdate(user.id, newIds);
                                                    }}
                                                />
                                                {role.name}
                                            </label>
                                        ))}
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