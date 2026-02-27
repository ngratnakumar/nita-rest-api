import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Shield, Trash2, Plus } from 'lucide-react';

interface Role { id: number; name: string; }

export default function RolesAdmin() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [newRole, setNewRole] = useState('');

    const fetchRoles = async () => {
        const res = await api.get('/roles');
        setRoles(res.data);
    };

    useEffect(() => { fetchRoles(); }, []);

    const handleAddRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRole) return;
        await api.post('/admin/roles', { name: newRole.toLowerCase() });
        setNewRole('');
        fetchRoles();
    };

    const deleteRole = async (id: number) => {
        if (confirm("Deleting a role will remove access for all users assigned to it. Proceed?")) {
            await api.delete(`/admin/roles/${id}`);
            fetchRoles();
        }
    };

    return (
        <div className="max-w-4xl space-y-8">
            <h1 className="text-2xl font-bold text-gray-800">Role Management</h1>
            
            <form onSubmit={handleAddRole} className="flex gap-2 bg-white p-4 rounded-lg shadow-sm border">
                <input 
                    className="flex-1 border p-2 rounded" 
                    placeholder="New Role Name (e.g. developer)" 
                    value={newRole} 
                    onChange={e => setNewRole(e.target.value)} 
                />
                <button className="bg-blue-600 text-white px-6 py-2 rounded font-bold flex items-center gap-2">
                    <Plus size={18}/> Add Role
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map(role => (
                    <div key={role.id} className="bg-white p-4 rounded-lg border flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Shield className="text-blue-500" size={20}/>
                            <span className="font-bold capitalize">{role.name}</span>
                        </div>
                        {role.name !== 'admin' && (
                            <button onClick={() => deleteRole(role.id)} className="text-red-400 hover:text-red-600">
                                <Trash2 size={18}/>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}