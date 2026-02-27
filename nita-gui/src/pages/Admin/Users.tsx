import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

interface Role { id: number; name: string; }
interface User { id: number; username: string; type: number; roles: Role[]; }

export default function UsersAdmin() {
    const [users, setUsers] = useState<User[]>([]);
    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [search, setSearch] = useState('');

    const fetchData = async () => {
        const [uRes, rRes] = await Promise.all([
            api.get('/admin/users'),
            api.get('/roles')
        ]);
        setUsers(uRes.data);
        setAllRoles(rRes.data);
    };

    useEffect(() => { fetchData(); }, []);

    const handleImport = async () => {
        if (!search) return;
        try {
            await api.post('/admin/users/sync', { username: search });
            setSearch('');
            fetchData();
        } catch (err) { alert("User not found in external directory."); }
    };

    const toggleRole = async (userId: number, roleId: number, currentRoles: Role[]) => {
        const isAssigned = currentRoles.some(r => r.id === roleId);
        const newRoleIds = isAssigned 
            ? currentRoles.filter(r => r.id !== roleId).map(r => r.id)
            : [...currentRoles.map(r => r.id), roleId];

        try {
            await api.put(`/admin/users/${userId}/roles`, { role_ids: newRoleIds });
            fetchData();
        } catch (err) { alert("Update failed."); }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">User Access Management</h1>
            <div className="flex gap-2 bg-white p-4 rounded shadow-sm">
                <input className="border p-2 rounded flex-1" placeholder="Sync LDAP/IPA username..." value={search} onChange={e => setSearch(e.target.value)} />
                <button onClick={handleImport} className="bg-blue-600 text-white px-6 py-2 rounded font-bold">Import User</button>
            </div>
            <div className="bg-white rounded-lg shadow">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr><th className="p-4">Username</th><th className="p-4">Roles (Toggle)</th></tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b">
                                <td className="p-4 font-medium">{user.username} <span className="text-xs text-gray-400">{user.type === 1 ? '(External)' : '(Local)'}</span></td>
                                <td className="p-4 flex gap-2">
                                    {allRoles.map(role => (
                                        <button key={role.id} onClick={() => toggleRole(user.id, role.id, user.roles)}
                                            className={`px-3 py-1 text-xs rounded-full ${user.roles.some(r => r.id === role.id) ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                                            {role.name}
                                        </button>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}