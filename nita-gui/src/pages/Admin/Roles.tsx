import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

interface Service {
    id: number;
    name: string;
    slug: string;
}

interface Role {
    id: number;
    name: string;
    services: Service[];
}

const RolesAdmin = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null); // Tracks specific cell being updated

    const fetchData = async () => {
        try {
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

    const handleTogglePermission = async (role: Role, serviceId: number) => {
        const cellId = `${role.id}-${serviceId}`;
        setSyncing(cellId);

        // Calculate current and updated service IDs
        const currentServiceIds = role.services ? role.services.map(s => s.id) : [];
        const updatedServiceIds = currentServiceIds.includes(serviceId)
            ? currentServiceIds.filter(id => id !== serviceId)
            : [...currentServiceIds, serviceId];

        try {
            // Update the pivot table via backend
            await axios.put(`/admin/roles/${role.id}/services`, {
                service_ids: updatedServiceIds // Ensure key matches your Laravel validation
            });
            
            // Refresh to ensure UI reflects database truth
            await fetchData();
        } catch (err) {
            console.error("Sync failed", err);
            alert("Failed to update role permissions.");
        } finally {
            setSyncing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-slate-500 gap-2">
                <Loader2 className="animate-spin" size={24} />
                <span>Loading Access Matrix...</span>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Access Matrix</h2>
                <p className="text-slate-500 text-sm">Control institutional access by mapping tool permissions to user roles.</p>
            </header>

            <div className="overflow-hidden shadow-sm border border-slate-200 rounded-2xl bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-5 text-left font-black uppercase tracking-widest text-[10px] border-b border-slate-700">Services</th>
                                {roles.map(role => (
                                    <th key={role.id} className="p-5 text-center font-black uppercase tracking-widest text-[10px] border-b border-slate-700">
                                        {role.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {services.map(service => (
                                <tr key={service.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 border-r border-slate-50">
                                        <div className="font-bold text-slate-700">{service.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">{service.slug}</div>
                                    </td>
                                    {roles.map(role => {
                                        const hasAccess = role.services?.some(s => s.id === service.id);
                                        const isSyncing = syncing === `${role.id}-${service.id}`;

                                        return (
                                            <td key={`${role.id}-${service.id}`} className="p-4 text-center">
                                                <button
                                                    onClick={() => handleTogglePermission(role, service.id)}
                                                    disabled={!!syncing}
                                                    className={`group relative p-3 rounded-xl transition-all duration-200 ${
                                                        hasAccess 
                                                            ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm' 
                                                            : 'bg-slate-50 text-slate-300 border border-transparent hover:border-slate-200'
                                                    } ${isSyncing ? 'opacity-50 cursor-wait' : ''}`}
                                                >
                                                    {isSyncing ? (
                                                        <Loader2 className="animate-spin" size={20} />
                                                    ) : hasAccess ? (
                                                        <ShieldCheck size={20} className="transform group-active:scale-90 transition-transform" />
                                                    ) : (
                                                        <div className="w-5 h-5 border-2 border-slate-200 rounded-lg mx-auto group-hover:border-slate-300" />
                                                    )}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {services.length === 0 && (
                <div className="mt-6 p-8 text-center bg-white border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl flex flex-col items-center gap-2">
                    <ShieldAlert size={32} className="text-slate-300" />
                    <p className="font-medium">No services registered in the system.</p>
                </div>
            )}
        </div>
    );
};

export default RolesAdmin;