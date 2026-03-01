import { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { Plus, Edit2, Trash2, X, Loader2, AlertCircle, Check, Search } from 'lucide-react';
import Pagination from '../../components/Pagination';

interface Role {
    id: number;
    name: string;
    services?: { id: number; name: string }[]; 
    users?: { id: number; username: string }[];
}

export default function RolesManager() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({ name: '' });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [actionLoader, setActionLoader] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setRoles(res.data);
            setCurrentPage(1);
        } catch (err) {
            console.error("Failed to fetch roles", err);
        } finally {
            setLoading(false);
        }
    };

    // Filter and paginate roles
    const filteredRoles = useMemo(() => {
        return roles.filter(role =>
            role.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [roles, searchTerm]);

    const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
    const paginatedRoles = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredRoles.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredRoles, currentPage, itemsPerPage]);

    useEffect(() => { 
        fetchRoles(); 
    }, []);

    const handleAddRole = () => {
        setEditingRole(null);
        setFormData({ name: '' });
        setErrors({});
        setShowForm(true);
    };

    const handleEdit = (role: Role) => {
        if (role.name === 'admin') return;
        setEditingRole(role);
        setFormData({ name: role.name });
        setErrors({});
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setActionLoader('save');

        const trimmedName = formData.name.trim().toLowerCase();
        if (!trimmedName) {
            setErrors({ name: 'Role name is required' });
            setActionLoader(null);
            return;
        }

        try {
            if (editingRole) {
                await api.patch(`/admin/roles/${editingRole.id}`, { name: trimmedName });
            } else {
                await api.post('/admin/roles', { name: trimmedName });
            }
            await fetchRoles();
            setShowForm(false);
            setEditingRole(null);
            setFormData({ name: '' });
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to save role';
            setErrors({ submit: msg });
        } finally {
            setActionLoader(null);
        }
    };

    const handleDelete = async (role: Role) => {
        if (role.name === 'admin') return;
        if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
        
        setActionLoader(`delete-${role.id}`);
        try {
            await api.delete(`/admin/roles/${role.id}`);
            await fetchRoles();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to delete role';
            setErrors({ submit: msg });
        } finally {
            setActionLoader(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Roles Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Create and manage user roles for your system</p>
                </div>

                <button
                    onClick={handleAddRole}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold"
                >
                    <Plus size={18} />
                    New Role
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-3 text-slate-400 dark:text-slate-600" size={20} />
                <input
                    type="text"
                    placeholder="Search roles by name..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-colors"
                />
            </div>

            {/* Error Alert */}
            {errors.submit && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                    <p className="font-semibold text-red-900 dark:text-red-300">{errors.submit}</p>
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {editingRole ? 'Edit Role' : 'Create New Role'}
                        </h2>
                        <button
                            onClick={() => {
                                setShowForm(false);
                                setEditingRole(null);
                            }}
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Role name (e.g., editor, viewer)"
                                value={formData.name}
                                onChange={(e) => setFormData({ name: e.target.value })}
                                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:outline-none transition-colors ${
                                    errors.name
                                        ? 'border-red-500 dark:border-red-600 focus:ring-red-200 dark:focus:ring-red-900'
                                        : 'border-slate-300 dark:border-slate-700 focus:ring-blue-200 dark:focus:ring-blue-900'
                                }`}
                            />
                            {errors.name && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.name}</p>}
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={actionLoader === 'save'}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 disabled:bg-slate-400 dark:disabled:bg-slate-700 text-white rounded-lg flex items-center gap-2 transition-colors font-semibold"
                            >
                                {actionLoader === 'save' ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingRole(null);
                                }}
                                className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 rounded-lg transition-colors font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Roles List */}
            <div className="grid gap-4 mb-6">
                {roles.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <p className="text-lg">No roles created yet. Click "New Role" to get started.</p>
                    </div>
                ) : paginatedRoles.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <p className="text-lg">No roles match your search.</p>
                    </div>
                ) : (
                    paginatedRoles.map((role) => (
                        <div
                            key={role.id}
                            className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md dark:hover:shadow-md dark:hover:shadow-slate-900/50 transition-all"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 uppercase">{role.name}</h3>
                                        {role.name === 'admin' && (
                                            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-full">
                                                SYSTEM ROLE
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                                        <span><strong>{role.services?.length || 0}</strong> services assigned</span>
                                        {role.users && role.users.length > 0 && (
                                            <span><strong>{role.users.length}</strong> users assigned</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(role)}
                                        disabled={role.name === 'admin'}
                                        className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:bg-slate-100 dark:disabled:bg-slate-800 text-blue-700 dark:text-blue-400 disabled:text-slate-400 dark:disabled:text-slate-600 rounded-lg flex items-center gap-2 transition-colors text-sm font-semibold"
                                    >
                                        <Edit2 size={16} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(role)}
                                        disabled={role.name === 'admin' || actionLoader === `delete-${role.id}`}
                                        className="px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:bg-slate-100 dark:disabled:bg-slate-800 text-red-700 dark:text-red-400 disabled:text-slate-400 dark:disabled:text-slate-600 rounded-lg flex items-center gap-2 transition-colors text-sm font-semibold"
                                    >
                                        {actionLoader === `delete-${role.id}` ? (
                                            <Loader2 className="animate-spin" size={16} />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {roles.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(count) => {
                        setItemsPerPage(count);
                        setCurrentPage(1);
                    }}
                    totalItems={filteredRoles.length}
                />
            )}
        </div>
    );
}