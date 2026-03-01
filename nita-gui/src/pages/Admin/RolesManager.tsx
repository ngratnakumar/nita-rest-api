import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { ShieldPlus, Edit3, Trash2, X, Check } from 'lucide-react';

interface Role { id: number; name: string; users_count?: number; }

export default function RolesManager() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [roleName, setRoleName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchRoles = async () => {
        const res = await api.get('/roles');
        setRoles(res.data);
    };

    useEffect(() => { fetchRoles(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.patch(`/admin/roles/${editingId}`, { name: roleName });
            } else {
                await api.post('/admin/roles', { name: roleName });
            }
            setRoleName('');
            setEditingId(null);
            fetchRoles();
        } catch (err: any) {
            alert(err.response?.data?.message || "Error saving role");
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (name === 'admin') return alert("Cannot delete protected system role: admin");
        if (!confirm(`Are you sure? All users assigned to '${name}' will lose the associated permissions.`)) return;
        
        await api.delete(`/admin/roles/${id}`);
        fetchRoles();
    };

    const togglePermission = async (role: Role, serviceId: number) => {
        // 1. Calculate the new array of service IDs
        const currentServiceIds = role.services?.map(s => s.id) || [];
        let newServiceIds;

        if (currentServiceIds.includes(serviceId)) {
            // Remove service if it was already there
            newServiceIds = currentServiceIds.filter(id => id !== serviceId);
        } else {
            // Add service if it wasn't there
            newServiceIds = [...currentServiceIds, serviceId];
        }

        try {
            // 2. Send the FULL array to the sync endpoint
            await api.put(`/admin/roles/${role.id}/services`, {
                service_ids: newServiceIds
            });

            // 3. Refresh data to see the checkbox update
            fetchData();
        } catch (err) {
            console.error("Failed to sync permissions", err);
            alert("Update failed. Check console.");
        }
    };


    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">System Roles</h2>
                    <p className="text-slate-500 text-sm">Define access levels for LDAP users</p>
                </div>
            </div>

            {/* Role Input Form */}
            <form onSubmit={handleSubmit} className="mb-8 flex gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex-1 relative">
                    <input 
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Enter role name (e.g. researcher)"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        required
                    />
                    <ShieldPlus className="absolute left-3 top-2.5 text-slate-400" size={18} />
                </div>
                <button className={`px-6 py-2 rounded-lg font-bold text-white transition-all ${editingId ? 'bg-amber-500' : 'bg-blue-600'}`}>
                    {editingId ? 'Update Role' : 'Add Role'}
                </button>
                {editingId && (
                    <button type="button" onClick={() => {setEditingId(null); setRoleName('');}} className="p-2 text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                )}
            </form>

            {/* Roles List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-bold">
                        <tr>
                            <th className="p-4">Role Name</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {roles.map(role => (
                            <tr key={role.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                        <span className="font-mono font-bold text-slate-700">{role.name}</span>
                                        {role.name === 'admin' && (
                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">System</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    {role.name !== 'admin' && (
                                        <>
                                            <button 
                                                onClick={() => {setEditingId(role.id); setRoleName(role.name);}}
                                                className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(role.id, role.name)}
                                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}