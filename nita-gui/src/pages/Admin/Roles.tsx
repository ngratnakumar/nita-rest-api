import { useEffect, useMemo, useState } from 'react';
import axios from '../../api/axios';
import { ShieldCheck, ShieldAlert, Loader2, Filter, Grid, Table, Search } from 'lucide-react';

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
    const [serviceQuery, setServiceQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<number[]>([]);
    const [onlyWithAccess, setOnlyWithAccess] = useState(false);
    const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');

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

    const toggleRoleFilter = (roleId: number) => {
        setRoleFilter((prev) =>
            prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
        );
    };

    const visibleRoles = useMemo(() => {
        if (!roleFilter.length) return roles;
        return roles.filter((r) => roleFilter.includes(r.id));
    }, [roles, roleFilter]);

    const filteredServices = useMemo(() => {
        const q = serviceQuery.trim().toLowerCase();
        let result = services;
        if (q) {
            result = result.filter(
                (s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
            );
        }
        if (onlyWithAccess && visibleRoles.length) {
            result = result.filter((s) =>
                visibleRoles.some((r) => r.services?.some((svc) => svc.id === s.id))
            );
        }
        return result;
    }, [services, serviceQuery, onlyWithAccess, visibleRoles]);

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

            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                        <Search size={16} className="text-slate-400" />
                        <input
                            value={serviceQuery}
                            onChange={(e) => setServiceQuery(e.target.value)}
                            className="bg-transparent outline-none text-sm text-slate-700"
                            placeholder="Filter services by name or slug"
                        />
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                        <input
                            type="checkbox"
                            checked={onlyWithAccess}
                            onChange={(e) => setOnlyWithAccess(e.target.checked)}
                        />
                        Show only services with access
                    </label>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                        <Filter size={16} className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-600">Roles:</span>
                        <div className="flex flex-wrap gap-2">
                            {roles.map((role) => {
                                const active = roleFilter.includes(role.id);
                                return (
                                    <button
                                        key={role.id}
                                        onClick={() => toggleRoleFilter(role.id)}
                                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                            active
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200'
                                        }`}
                                    >
                                        {role.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl">
                        <button
                            onClick={() => setViewMode('matrix')}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                                viewMode === 'matrix'
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-700 border-slate-200'
                            }`}
                        >
                            <Table size={14} /> Matrix
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                                viewMode === 'cards'
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-700 border-slate-200'
                            }`}
                        >
                            <Grid size={14} /> Card view
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'matrix' ? (
                <div className="overflow-hidden shadow-sm border border-slate-200 rounded-2xl bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="p-5 text-left font-black uppercase tracking-widest text-[10px] border-b border-slate-700 sticky left-0 bg-slate-900 z-10 shadow-sm">Services</th>
                                    {visibleRoles.map(role => (
                                        <th key={role.id} className="p-5 text-center font-black uppercase tracking-widest text-[10px] border-b border-slate-700">
                                            {role.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredServices.map(service => (
                                    <tr key={service.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 border-r border-slate-50 sticky left-0 bg-white z-10 shadow-[4px_0_8px_-6px_rgba(0,0,0,0.2)]">
                                            <div className="font-bold text-slate-700">{service.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">{service.slug}</div>
                                        </td>
                                        {visibleRoles.map(role => {
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
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredServices.map((service) => {
                        const rolesWithAccess = visibleRoles.filter((r) =>
                            r.services?.some((svc) => svc.id === service.id)
                        );
                        return (
                            <div key={service.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div>
                                        <div className="font-black text-slate-800 uppercase text-sm">{service.name}</div>
                                        <div className="text-[11px] text-slate-400 font-mono uppercase">{service.slug}</div>
                                    </div>
                                </div>
                                <div className="text-[11px] text-slate-500 font-semibold mb-2">Roles with access</div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {rolesWithAccess.length ? (
                                        rolesWithAccess.map((r) => (
                                            <span key={r.id} className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                                                {r.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[11px] text-slate-400">No roles currently mapped</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {visibleRoles.map((r) => {
                                        const hasAccess = r.services?.some((svc) => svc.id === service.id);
                                        const isSyncing = syncing === `${r.id}-${service.id}`;
                                        return (
                                            <button
                                                key={r.id}
                                                onClick={() => handleTogglePermission(r, service.id)}
                                                disabled={!!syncing}
                                                className={`px-3 py-2 rounded-lg text-[11px] font-bold border transition-all ${
                                                    hasAccess
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-200'
                                                } ${isSyncing ? 'opacity-50 cursor-wait' : ''}`}
                                            >
                                                {r.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
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