import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function UsersAdmin() {
    const [users, setUsers] = useState([]);
    const [allRoles, setAllRoles] = useState([]);
    const [roles, setRoles] = useState([]);
    const [search, setSearch] = useState('');

    const fetchUsers = () => api.get('/admin/users').then(res => setUsers(res.data));
    const fetchRoles = () => api.get('/roles').then(res => setRoles(res.data));

    interface Role {
        id: number;
        name: string;
    }

    interface User {
        id: number;
        username: string;
        email: string | null;
        type: number;
        roles: Role[];
    }

    const fetchData = async () => {
        const [uRes, rRes] = await Promise.all([
            api.get('/admin/users'),
            api.get('/roles')
        ]);
        setUsers(uRes.data);
        setAllRoles(rRes.data);
    };
    
    useEffect(() => { fetchUsers(); fetchRoles(); }, []);

    const handleImport = async () => {
        if (!search) return;
        try {
            await api.post('/admin/users/sync', { username: search });
            setSearch('');
            fetchData();
        } catch (err) { alert("User not found in LDAP/IPA"); }
    };

    const handleSearchAndAdd = async (searchUsername: string) => {
        try {
            const res = await api.post('/admin/users/sync', { username: searchUsername });
            // Refresh your user list
            fetchUsers(); 
            alert("User found and added to management list");
        } catch (err) {
            alert("User not found in LDAP/IPA");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const [uRes, rRes] = await Promise.all([
                api.get('/users'), // You may need to update route to /admin/users
                api.get('/roles')
            ]);
            setUsers(uRes.data);
            setAllRoles(rRes.data);
        };
        fetchData();
    }, []);

    const toggleRole = async (userId: number, roleId: number, currentRoles: Role[]) => {
        const isAssigned = currentRoles.some(r => r.id === roleId);
        const newRoleIds = isAssigned 
            ? currentRoles.filter(r => r.id !== roleId).map(r => r.id)
            : [...currentRoles.map(r => r.id), roleId];

        try {
            await api.put(`/admin/users/${userId}/roles`, { role_ids: newRoleIds });
            fetchData(); // Refresh list
        } catch (err) {
            alert("Failed to update roles");
        }
    };

return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">User & RBAC Management</h1>
            
            {/* Sync External User Bar */}
            <div className="flex gap-2 bg-white p-4 rounded shadow-sm">
                <input 
                    className="border p-2 rounded flex-1" 
                    placeholder="Enter LDAP/FreeIPA username to sync..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                />
                <button onClick={handleImport} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">
                    Import User
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Username</th>
                            <th className="p-4 font-semibold text-gray-600">Roles (Click to toggle)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b hover:bg-gray-50">
                                <td className="p-4">
                                    <span className="font-medium text-gray-800">{user.username}</span>
                                    <div className="text-xs text-gray-400 uppercase">{user.type === 0 ? 'Local' : 'External'}</div>
                                </td>
                                <td className="p-4 flex flex-wrap gap-2">
                                    {allRoles.map(role => {
                                        const isActive = user.roles.some(r => r.id === role.id);
                                        return (
                                            <button
                                                key={role.id}
                                                onClick={() => toggleRole(user.id, role.id, user.roles)}
                                                className={`px-3 py-1 text-xs font-bold rounded-full transition ${
                                                    isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                                                }`}
                                            >
                                                {role.name}
                                            </button>
                                        );
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}