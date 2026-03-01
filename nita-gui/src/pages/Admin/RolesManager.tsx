import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { ShieldPlus, Edit3, Trash2, X } from 'lucide-react';

interface Role {
    id: number;
    name: string;
    services?: { id: number; name: string }[]; 
}

export default function RolesManager() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [roleName, setRoleName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setRoles(res.data);
        } catch (err) {
            console.error("Failed to fetch roles", err);
        }
    };

    useEffect(() => { 
        fetchRoles(); 
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.patch(`/admin/roles/${editingId}`, { name: roleName.toLowerCase().trim() });
            } else {
                await api.post('/admin/roles', { name: roleName.toLowerCase().trim() });
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
        if (!confirm(`Are you sure? All users assigned to '${name}' will lose associated permissions.`)) return;
        
        try {
            await api.delete(`/admin/roles/${id}`);
            fetchRoles();
        } catch (err) {
            alert("Delete failed.");
        }
    };

    // Corrected togglePermission with proper typing and function name
    // const togglePermission = async (role: Role, serviceId: number) => {
    //     const currentServiceIds = role.services?.map((s: { id: number }) => s.id) || [];
    //     let newServiceIds: number[];

    //     if (currentServiceIds.includes(serviceId)) {
    //         newServiceIds = currentServiceIds.filter(id => id !== serviceId);
    //     } else {
    //         newServiceIds = [...currentServiceIds, serviceId];
    //     }

    //     try {
    //         await api.put(`/admin/roles/${role.id}/services`, {
    //             service_ids: newServiceIds
    //         });
    //         fetchRoles(); // Standardized from fetchData()
    //     } catch (err) {
    //         console.error("Failed to sync permissions", err);
    //         alert("Update failed. Check console.");
    //     }
    // };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">System Roles</h2>
                    <p className="text-slate-500 text-sm">Define access levels for LDAP and Local identities</p>
                </div>
            </div>

            {/* Role Input Form */}
            <form onSubmit={handleSubmit} className="mb-8 flex gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex-1 relative">
                    <input 
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Enter role name (e.g. researcher)"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        required
                    />
                    <ShieldPlus className="absolute left-3 top-3 text-slate-400" size={18} />
                </div>
                <button className={`px-6 py-2 rounded-lg font-black text-xs uppercase text-white shadow-md transition-all active:scale-95 ${editingId ? 'bg-amber-500 shadow-amber-100' : 'bg-blue-600 shadow-blue-100'}`}>
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
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-black tracking-widest">
                        <tr>
                            <th className="p-4">Role Name</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {roles.map(role => (
                            <tr key={role.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 rounded-full ${role.name === 'admin' ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                                        <span className="font-mono font-bold text-slate-700 uppercase">{role.name}</span>
                                        {role.name === 'admin' && (
                                            <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-black uppercase tracking-tighter">System Protected</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-right space-x-1">
                                    {role.name !== 'admin' ? (
                                        <>
                                            <button 
                                                onClick={() => {setEditingId(role.id); setRoleName(role.name);}}
                                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                title="Edit Role Name"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(role.id, role.name)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Role"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-[10px] text-slate-300 font-bold uppercase p-2">Immutable</span>
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