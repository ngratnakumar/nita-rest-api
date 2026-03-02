import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import { Search, Shield, UserCheck, RefreshCw, Database, AlertCircle, Filter, CheckSquare, Square, Users, Eye } from 'lucide-react';
import Pagination from '../../components/Pagination';

const UsersAdmin = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [listSearchTerm, setListSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [bulkUpdating, setBulkUpdating] = useState(false);
    const [discoveredUser, setDiscoveredUser] = useState<any>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [roleFilters, setRoleFilters] = useState<number[]>([]);
    const [providerFilter, setProviderFilter] = useState<'all' | 'local' | 'openldap' | 'freeipa'>('all');
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [bulkRoleIds, setBulkRoleIds] = useState<number[]>([]);
    const [masqueradingId, setMasqueradingId] = useState<number | null>(null);

    const currentUser = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch (err) {
            return {};
        }
    }, []);

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
        let result = users.filter(user =>
            user.name.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(listSearchTerm.toLowerCase())
        );

        if (roleFilters.length) {
            result = result.filter(user => user.roles?.some((r: any) => roleFilters.includes(r.id)));
        }

        if (providerFilter !== 'all') {
            const map: Record<string, number> = { local: 0, openldap: 1, freeipa: 2 };
            result = result.filter(user => user.type === map[providerFilter]);
        }

        return result;
    }, [users, listSearchTerm, roleFilters, providerFilter]);

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

    const toggleRoleFilter = (roleId: number) => {
        setRoleFilters(prev => prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]);
    };

    const toggleUserSelect = (userId: number) => {
        setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const toggleSelectAllPage = (usersOnPage: any[]) => {
        const ids = usersOnPage.map(u => u.id);
        const allSelected = ids.every(id => selectedUserIds.includes(id));
        if (allSelected) {
            setSelectedUserIds(prev => prev.filter(id => !ids.includes(id)));
        } else {
            setSelectedUserIds(prev => Array.from(new Set([...prev, ...ids])));
        }
    };

    const toggleBulkRole = (roleId: number) => {
        setBulkRoleIds(prev => prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]);
    };

    const handleMasquerade = async (user: any) => {
        setMasqueradingId(user.id);
        setErrorMessage('');
        try {
            const res = await api.post(`/admin/masquerade/${user.id}`);

            const originRaw = localStorage.getItem('masquerade_origin');
            const origin = originRaw ? JSON.parse(originRaw) : {
                token: localStorage.getItem('token'),
                user: currentUser,
            };

            localStorage.setItem('masquerade_origin', JSON.stringify(origin));
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            window.location.href = '/dashboard';
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to masquerade as user.';
            setErrorMessage(msg);
        } finally {
            setMasqueradingId(null);
        }
    };

    const applyBulkRoles = async () => {
        if (!selectedUserIds.length) {
            setErrorMessage('Select at least one user to apply roles.');
            return;
        }
        setBulkUpdating(true);
        setErrorMessage('');
        try {
            await Promise.all(selectedUserIds.map(userId => api.put(`/admin/users/${userId}/roles`, { roles: bulkRoleIds })));
            await fetchData();
        } catch (err) {
            setErrorMessage('Bulk update failed.');
        } finally {
            setBulkUpdating(false);
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
            <header className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">User Management</h2>
                    <p className="text-slate-500 dark:text-slate-400">Discover LDAP users and assign NITA system roles. ({filteredUsers.length} / {users.length} total)</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded">
                        Synced Users: <strong>{users.length}</strong>
                    </div>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded">
                        Selected: <strong>{selectedUserIds.length}</strong>
                    </div>
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

            {/* FILTERS + BULK BAR */}
            <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl mb-4">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <Search size={16} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filter users by name or username"
                                className="bg-transparent outline-none text-sm text-slate-700 dark:text-slate-100"
                                value={listSearchTerm}
                                onChange={(e) => {
                                    setListSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <Filter size={16} className="text-slate-400" />
                            <select
                                className="bg-transparent text-sm text-slate-700 dark:text-slate-100 outline-none"
                                value={providerFilter}
                                onChange={(e) => setProviderFilter(e.target.value as any)}
                            >
                                <option value="all">All sources</option>
                                <option value="local">Local</option>
                                <option value="openldap">OpenLDAP</option>
                                <option value="freeipa">FreeIPA</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        {roles.map((role: any) => {
                            const active = roleFilters.includes(role.id);
                            return (
                                <button
                                    key={role.id}
                                    onClick={() => toggleRoleFilter(role.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                        active
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-200'
                                    }`}
                                >
                                    {role.name}
                                </button>
                            );
                        })}
                        {roles.length === 0 && (
                            <span className="text-xs text-slate-400">No roles found</span>
                        )}
                    </div>
                </div>

                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 font-semibold">
                        <Users size={16} /> Bulk apply roles to selected users
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        {roles.map((role: any) => {
                            const active = bulkRoleIds.includes(role.id);
                            return (
                                <button
                                    key={`bulk-${role.id}`}
                                    onClick={() => toggleBulkRole(role.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                        active
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-200'
                                    }`}
                                >
                                    {role.name}
                                </button>
                            );
                        })}
                        <button
                            onClick={applyBulkRoles}
                            disabled={bulkUpdating}
                            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-black border border-emerald-600 shadow-sm disabled:opacity-50"
                        >
                            {bulkUpdating ? 'Applying...' : 'Apply to selected'}
                        </button>
                        <button
                            onClick={() => setSelectedUserIds([])}
                            className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800"
                        >
                            Clear selection
                        </button>
                    </div>
                </div>
            </div>

            {/* USERS TABLE */}
            <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs uppercase font-bold">
                                <th className="p-4 w-10 text-center">
                                    <button
                                        onClick={() => toggleSelectAllPage(paginatedUsers)}
                                        className="inline-flex items-center justify-center"
                                        aria-label="Select all on page"
                                    >
                                        {paginatedUsers.length && paginatedUsers.every(u => selectedUserIds.includes(u.id)) ? (
                                            <CheckSquare size={16} />
                                        ) : (
                                            <Square size={16} />
                                        )}
                                    </button>
                                </th>
                                <th className="p-4 w-1/3 sticky left-10 bg-slate-50 dark:bg-slate-800 z-10">User Identity</th>
                                <th className="p-4 w-1/6">Source</th>
                                <th className="p-4 flex-1">Assigned Roles</th>
                                <th className="p-4 w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <Database className="mx-auto text-slate-200 dark:text-slate-700 mb-3" size={48} />
                                        <p className="text-slate-400 dark:text-slate-400 font-medium">No users synced yet.</p>
                                        <p className="text-slate-400 dark:text-slate-400 text-sm mt-1">Use the discovery form above to add LDAP users.</p>
                                    </td>
                                </tr>
                            ) : paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <p className="text-slate-400 dark:text-slate-400 font-medium">No users match your filters.</p>
                                    </td>
                                </tr>
                            ) : paginatedUsers.map(user => {
                                const isSelected = selectedUserIds.includes(user.id);
                                return (
                                    <tr key={user.id} className={`transition-colors ${updatingId === user.id ? 'bg-blue-50/40 dark:bg-blue-900/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}`}>
                                        <td className="p-4 text-center align-top">
                                            <button onClick={() => toggleUserSelect(user.id)} aria-label="Select user" className="inline-flex items-center justify-center">
                                                {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                            </button>
                                        </td>
                                        <td className="p-4 sticky left-10 bg-white dark:bg-slate-900 z-10 shadow-[4px_0_8px_-6px_rgba(0,0,0,0.2)]">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">@{user.username}</div>
                                        </td>
                                        <td className="p-4 align-top">
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
                                                                disabled={updatingId === user.id || bulkUpdating}
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
                                                                } ${(updatingId === user.id || bulkUpdating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            >
                                                                <Shield size={12} />
                                                                {role.name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 align-top">
                                            <button
                                                onClick={() => handleMasquerade(user)}
                                                disabled={masqueradingId === user.id}
                                                className="w-full px-3 py-2 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center gap-1"
                                            >
                                                <Eye size={14} />
                                                Masquerade
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
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