import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import { Search, Shield, UserCheck, RefreshCw, Database, AlertCircle } from 'lucide-react';
import Pagination from '../../components/Pagination';

const UsersAdmin = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [listSearchTerm, setListSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [discoveredUser, setDiscoveredUser] = useState<any>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = useCallback(async () => {
        try {
            const [uRes, rRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/roles') 
            ]);
            setUsers(uRes.data);
            setRoles(rRes.data);
            setErrorMessage('');
        } catch (err) {
            console.error("Management data fetch failed", err);
            setErrorMessage('Failed to load users and roles');
        } finally {
            setInitialLoad(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter and paginate users
    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.name.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(listSearchTerm.toLowerCase())
        );
    }, [users, listSearchTerm]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredUsers, currentPage, itemsPerPage]);

    const handleDiscover = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        
        setLoading(true);
        setErrorMessage('');
        try {
            const res = await api.post('/admin/ldap/discover', {
                username: searchTerm.trim()
            });
            setDiscoveredUser(res.data);
            setShowConfirm(true);
        } catch (err: any) {
            const msg = err.response?.data?.message || "User not found in OpenLDAP or FreeIPA. Please check the username.";
            setErrorMessage(msg);
            setDiscoveredUser(null);
            setShowConfirm(false);
        } finally {
            setLoading(false);
        }
    };

    const confirmSync = async () => {
        if (!discoveredUser) return;
        setLoading(true);
        setErrorMessage('');
        try {
            await api.post('/admin/ldap/sync', discoveredUser);
            setSearchTerm('');
            setDiscoveredUser(null);
            setShowConfirm(false);
            await fetchData();
            setErrorMessage(''); // Clear errors on success
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to sync user. Please try again.";
            setErrorMessage(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId: number, roleIds: number[]) => {
        setUpdatingId(userId);
        setErrorMessage('');
        try {
            await api.put(`/admin/users/${userId}/roles`, { roles: roleIds });
            
            // Optimistic Update
            setUsers(prev => prev.map(u => 
                u.id === userId ? { ...u, roles: roles.filter(r => roleIds.includes(r.id)) } : u
            ));
        } catch (err) {
            setErrorMessage('Failed to update roles.');
            fetchData(); 
        } finally {
            setUpdatingId(null);
        }
    };

    const getProviderBadge = (type: number) => {
        const providers: { [key: number]: { label: string; bg: string; text: string } } = {
            0: { label: 'Local', bg: 'bg-slate-100', text: 'text-slate-700' },
            1: { label: 'OpenLDAP', bg: 'bg-emerald-100', text: 'text-emerald-700' },
            2: { label: 'FreeIPA', bg: 'bg-violet-100', text: 'text-violet-700' }
        };
        const provider = providers[type] || providers[0];
        return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${provider.bg} ${provider.text}`}>{provider.label}</span>;
    };

    if (initialLoad) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 dark:text-slate-400 gap-4">
            <RefreshCw className="animate-spin text-blue-500 dark:text-blue-400" size={32} />
            <p className="font-medium">Loading NCRA User Directory...</p>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">User Management</h2>
                    <p className="text-slate-500 dark:text-slate-400">Discover LDAP users and assign NITA system roles. ({filteredUsers.length} / {users.length} total)</p>
                </div>
                <div className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded">
                    Synced Users: <strong>{users.length}</strong>
                </div>
            </header>
            
            {/* ERROR MESSAGE */}
            {errorMessage && (
                <div className="mb-6 p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <div className="font-semibold text-red-900 dark:text-red-300">Error</div>
                        <div className="text-sm text-red-700 dark:text-red-400 mt-0.5">{errorMessage}</div>
                    </div>
                </div>
            )}
            
            {/* DISCOVERY CARD */}
            <section className="mb-10 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                    <Search size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Discover LDAP User</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">Search for a user in OpenLDAP or FreeIPA by their username. We'll automatically check both directories.</p>
                <form onSubmit={handleDiscover} className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                        <input 
                            type="text" 
                            placeholder="Enter username (e.g., meshram)" 
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
                    <button 
                        disabled={loading || !searchTerm.trim()}
                        className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-all flex items-center gap-2 justify-center whitespace-nowrap"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {showConfirm && discoveredUser && (
                    <div className="mt-6 p-5 border-2 border-emerald-200 bg-emerald-50 rounded-lg">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <div className="text-lg font-bold text-emerald-900">{discoveredUser.name}</div>
                                <div className="text-sm text-emerald-700 mt-1">{discoveredUser.email}</div>
                                <div className="text-xs text-emerald-600 mt-2">Found in: <span className="font-bold">{discoveredUser.provider}</span></div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button 
                                    onClick={confirmSync}
                                    disabled={loading}
                                    className="flex-1 md:flex-none bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-emerald-700 disabled:bg-emerald-300 transition-colors flex items-center justify-center gap-2"
                                >
                                    <UserCheck size={16} />
                                    Sync User
                                </button>
                                <button 
                                    onClick={() => { setShowConfirm(false); setDiscoveredUser(null); }}
                                    disabled={loading}
                                    className="flex-1 md:flex-none bg-slate-200 text-slate-700 px-5 py-2 rounded-lg font-bold hover:bg-slate-300 disabled:opacity-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* USERS TABLE */}
            <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <input
                        type="text"
                        placeholder="Filter users by name or username..."
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all"
                        value={listSearchTerm}
                        onChange={(e) => {
                            setListSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs uppercase font-bold">
                            <th className="p-4 w-1/3">User Identity</th>
                            <th className="p-4 w-1/6">Source</th>
                            <th className="p-4 flex-1">Assigned Roles</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-12 text-center">
                                    <Database className="mx-auto text-slate-200 dark:text-slate-700 mb-3" size={48} />
                                    <p className="text-slate-400 dark:text-slate-400 font-medium">No users synced yet.</p>
                                    <p className="text-slate-400 dark:text-slate-400 text-sm mt-1">Use the discovery form above to add LDAP users.</p>
                                </td>
                            </tr>
                        ) : paginatedUsers.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-12 text-center">
                                    <p className="text-slate-400 dark:text-slate-400 font-medium">No users match your search.</p>
                                </td>
                            </tr>
                        ) : paginatedUsers.map(user => (
                            <tr key={user.id} className={`transition-colors ${updatingId === user.id ? 'bg-blue-50/40 dark:bg-blue-900/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}`}>
                                <td className="p-4">
                                    <div className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">@{user.username}</div>
                                </td>
                                <td className="p-4">
                                    {getProviderBadge(user.type)}
                                </td>
                                <td className="p-4">
                                    {!roles || roles.length === 0 ? (
                                        <span className="text-slate-400 dark:text-slate-500 text-sm">No roles available</span>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {roles.map(role => {
                                                const isActive = user.roles?.some((r: any) => r.id === role.id);
                                                return (
                                                    <button
                                                        key={role.id}
                                                        disabled={updatingId === user.id}
                                                        onClick={() => {
                                                            const currentIds = user.roles?.map((r: any) => r.id) || [];
                                                            const newIds = isActive 
                                                                ? currentIds.filter((id: number) => id !== role.id)
                                                                : [...currentIds, role.id];
                                                            handleRoleUpdate(user.id, newIds);
                                                        }}
                                                        className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                                                            isActive 
                                                            ? 'bg-blue-600 dark:bg-blue-700 border-blue-600 dark:border-blue-700 text-white shadow-sm' 
                                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                        } ${updatingId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <Shield size={12} />
                                                        {role.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {users.length > 0 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(count) => {
                            setItemsPerPage(count);
                            setCurrentPage(1);
                        }}
                        totalItems={filteredUsers.length}
                    />
                </div>
            )}
        </div>
    );
};

export default UsersAdmin;