import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';

const RolesAdmin = () => {
    const [roles, setRoles] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            // Corrected Paths based on your api.php:
            // Roles and Services are outside the 'admin' prefix group
            const [rolesRes, servicesRes] = await Promise.all([
                axios.get('/roles'), 
                axios.get('/services')
            ]);
            setRoles(rolesRes.data);
            setServices(servicesRes.data);
        } catch (err) {
            console.error("Data fetch failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSync = async (roleId: number, serviceId: number) => {
        const role = roles.find(r => r.id === roleId);
        if (!role) return;

        // Toggle the service ID
        const currentServiceIds = role.services ? role.services.map((s: any) => s.id) : [];
        const updatedServiceIds = currentServiceIds.includes(serviceId)
            ? currentServiceIds.filter((id: number) => id !== serviceId)
            : [...currentServiceIds, serviceId];

        try {
            // This route IS under the admin prefix in your api.php
            await axios.put(`/admin/roles/${roleId}/services`, {
                services: updatedServiceIds
            });
            
            // Re-fetch to sync the UI with the new pivot table state
            fetchData();
        } catch (err) {
            alert("Failed to update role permissions.");
        }
    };

    if (loading) return <div className="p-6 text-slate-500">Loading Access Matrix...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Access Matrix</h2>
                <p className="text-slate-500 text-sm">Define which roles have access to specific system services.</p>
            </header>

            <div className="overflow-x-auto shadow-sm border border-slate-200 rounded-xl">
                <table className="w-full border-collapse bg-white text-sm">
                    <thead>
                        <tr className="bg-slate-800 text-white">
                            <th className="p-4 text-left font-semibold border-b border-slate-700">Services</th>
                            {roles.map(role => (
                                <th key={role.id} className="p-4 text-center font-semibold border-b border-slate-700 capitalize">
                                    {role.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {services.map(service => (
                            <tr key={service.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 border-r border-slate-100">
                                    <div className="font-bold text-slate-700">{service.name}</div>
                                    <div className="text-xs text-slate-400 font-mono uppercase">{service.slug}</div>
                                </td>
                                {roles.map(role => (
                                    <td key={`${role.id}-${service.id}`} className="p-4 text-center">
                                        <input 
                                            type="checkbox"
                                            className="w-5 h-5 cursor-pointer accent-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                            checked={role.services?.some((s: any) => s.id === service.id)}
                                            onChange={() => handleSync(role.id, service.id)}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {services.length === 0 && (
                <div className="mt-4 p-4 text-center bg-slate-50 text-slate-400 rounded-lg">
                    No services registered. Add services in the Services tab first.
                </div>
            )}
        </div>
    );
};

export default RolesAdmin;