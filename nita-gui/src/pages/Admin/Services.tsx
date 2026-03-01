import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { PlusCircle, Globe, Trash2, Edit2, X, ShieldCheck, Tag, AlertTriangle } from 'lucide-react';
import IconPicker from '../../components/Admin/IconPicker';
import CategoryManager from '../../components/Admin/CategoryManager';

interface Role { id: number; name: string; }
interface Category { id: number; name: string; }

interface Service { 
    id?: number; 
    name: string; 
    slug: string; 
    url: string; 
    category: string; 
    icon: string; 
    roles?: Role[]; 
    is_maintenance?: boolean;
    maintenance_message?: string;
}

export default function ServicesAdmin() {
    const [services, setServices] = useState<Service[]>([]);
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [dynamicCats, setDynamicCats] = useState<Category[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [showCatManager, setShowCatManager] = useState(false);
    const [maintenanceServiceId, setMaintenanceServiceId] = useState<number | null>(null);
    const [maintenanceMessage, setMaintenanceMessage] = useState('');
    const [form, setForm] = useState<Service>({ 
        name: '', slug: '', url: '', category: '', icon: '' 
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const ASSET_BASE_URL = API_URL.replace(/\/?api$/, '');

    // Fetch Services, Roles, and Dynamic Categories
    const fetchData = async () => {
        try {
            const [sRes, rRes, cRes] = await Promise.all([
                api.get('/services'),
                api.get('/roles'),
                api.get('/admin/categories') // Fetching from the new endpoint
            ]);
            setServices(sRes.data);
            setAvailableRoles(rRes.data);
            setDynamicCats(cRes.data);
        } catch (err) { 
            console.error("Fetch error", err); 
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleNameChange = (name: string) => {
        const slug = name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        setForm({ ...form, name, slug });
    };

    const startEdit = (s: Service) => {
        setForm(s);
        const roleIds = s.roles ? s.roles.map(r => r.id) : [];
        setSelectedRoleIds(roleIds); 
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setForm({ name: '', slug: '', url: '', category: '', icon: '' });
        setSelectedRoleIds([]);
        setIsEditing(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...form, roles: selectedRoleIds };

        try {
            if (isEditing && form.id) {
                await api.patch(`/admin/services/${form.id}`, payload);
            } else {
                await api.post('/admin/services', payload);
            }
            resetForm();
            fetchData();
            alert("Registry Updated Successfully!");
        } catch (err: any) {
            alert("Update Failed: " + (err.response?.data?.message || "Check Console"));
        }
    };

    const toggleRole = (roleId: number) => {
        setSelectedRoleIds(prev => 
            prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
        );
    };

    const deleteService = async (id: number) => {
        if (!window.confirm("Delete this service?")) return;
        try {
            await api.delete(`/admin/services/${id}`);
            fetchData();
        } catch (err) { alert("Delete failed"); }
    };

    const toggleMaintenanceModal = (serviceId: number | null, message: string = '') => {
        setMaintenanceServiceId(serviceId);
        setMaintenanceMessage(message);
    };

    const handleMaintenanceToggle = async (serviceId: number) => {
        const service = services.find(s => s.id === serviceId);
        if (!service) return;

        const newStatus = !service.is_maintenance;
        try {
            await api.patch(`/admin/services/${serviceId}/maintenance`, {
                is_maintenance: newStatus,
                maintenance_message: newStatus ? maintenanceMessage : null
            });
            fetchData();
            toggleMaintenanceModal(null);
        } catch (err) {
            alert("Failed to update maintenance status");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
            {/* Side Form */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit lg:sticky lg:top-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 uppercase">
                        {isEditing ? <Edit2 className="text-amber-500" size={20}/> : <PlusCircle className="text-blue-500" size={20}/>}
                        {isEditing ? 'Update Tool' : 'New Tool'}
                    </h2>
                    {isEditing && <button onClick={resetForm} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"><X size={20}/></button>}
                </div>

                <form onSubmit={handleSave} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Service Name</label>
                        <input className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 p-2.5 rounded-xl outline-none focus:border-blue-500 shadow-sm" 
                               value={form.name} onChange={e => handleNameChange(e.target.value)} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex justify-between items-center mb-0.5">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Category</label>
                                <button 
                                    type="button" 
                                    onClick={() => setShowCatManager(true)}
                                    className="text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                                >
                                    <Tag size={10}/> EDIT
                                </button>
                            </div>
                            <select 
                                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 p-2.5 rounded-xl bg-white text-sm"
                                value={form.category} 
                                onChange={e => setForm({...form, category: e.target.value})}
                                required
                            >
                                <option value="">Select...</option>
                                {dynamicCats.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Slug</label>
                            <input className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-[10px]" value={form.slug} readOnly />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">URL</label>
                        <input className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 p-2.5 rounded-xl outline-none focus:border-blue-500 shadow-sm" 
                               value={form.url} onChange={e => setForm({...form, url: e.target.value})} required />
                    </div>

                    <IconPicker selectedIcon={form.icon} onSelect={(iconName) => setForm({ ...form, icon: iconName })} />

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1 mb-3">
                            <ShieldCheck size={14}/> Access Permissions
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableRoles.map(role => (
                                <button key={role.id} type="button" onClick={() => toggleRole(role.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                        selectedRoleIds.includes(role.id) ? 'bg-blue-600 dark:bg-blue-700 border-blue-600 dark:border-blue-700 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                    }`}>
                                    {role.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button className={`w-full p-4 rounded-xl font-black text-sm uppercase text-white shadow-lg transition-transform active:scale-95 ${isEditing ? 'bg-amber-500 dark:bg-amber-600 shadow-amber-100 dark:shadow-amber-900' : 'bg-blue-600 dark:bg-blue-700 shadow-blue-100 dark:shadow-blue-900'}`}>
                        {isEditing ? 'Update Registry' : 'Register Service'}
                    </button>
                </form>
            </div>

            {/* List View */}
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Active Registry</h2>
                <div className="grid gap-4">
                    {services.map(s => (
                        <div key={s.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center group hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                            <div className="flex items-center gap-5 flex-1">
                                <div className="relative">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 overflow-hidden shadow-inner">
                                        {s.icon && s.icon.includes('.') ? (
                                            <img src={`${ASSET_BASE_URL}/storage/icons/${s.icon}`} className="w-full h-full object-contain p-2" />
                                        ) : ( <Globe size={28} className="text-slate-200 dark:text-slate-600"/> )}
                                    </div>
                                    {s.is_maintenance && (
                                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full p-1 shadow-lg">
                                            <AlertTriangle size={14} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-slate-800 dark:text-slate-100 text-lg uppercase leading-none">{s.name}</span>
                                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase">{s.category}</span>
                                        {s.is_maintenance && (
                                            <span className="text-[9px] bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 px-2 py-0.5 rounded-full font-bold uppercase">Under Maintenance</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {s.roles?.map(r => (
                                            <span key={r.id} className="text-[8px] bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded font-black uppercase border border-blue-100 dark:border-blue-800">{r.name}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => toggleMaintenanceModal(s.id!, s.maintenance_message || '')}
                                    className={`p-3 rounded-xl transition-all ${s.is_maintenance ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'text-slate-400 dark:text-slate-500 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
                                    title="Toggle maintenance status"
                                >
                                    <AlertTriangle size={18}/>
                                </button>
                                <button onClick={() => startEdit(s)} className="p-3 text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all"><Edit2 size={18}/></button>
                                <button onClick={() => s.id && deleteService(s.id)} className="p-3 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Maintenance Modal */}
            {maintenanceServiceId !== null && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                                <AlertTriangle className="text-orange-600 dark:text-orange-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Maintenance Status</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{services.find(s => s.id === maintenanceServiceId)?.name}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                                    Maintenance Message
                                </label>
                                <textarea
                                    value={maintenanceMessage}
                                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                                    placeholder="Describe the maintenance work (e.g., 'Server updates and security patches')"
                                    className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm resize-none"
                                    rows={3}
                                />
                            </div>

                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                <p className="text-sm text-orange-800 dark:text-orange-300">
                                    ⚠️ Users with this service in their roles will see an "Under Maintenance" notice on their dashboard.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => toggleMaintenanceModal(null)}
                                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => maintenanceServiceId && handleMaintenanceToggle(maintenanceServiceId)}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-white font-semibold transition-colors ${
                                    services.find(s => s.id === maintenanceServiceId)?.is_maintenance
                                        ? 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600'
                                        : 'bg-orange-600 dark:bg-orange-700 hover:bg-orange-700 dark:hover:bg-orange-600'
                                }`}
                            >
                                {services.find(s => s.id === maintenanceServiceId)?.is_maintenance ? 'Mark As Operational' : 'Mark As Maintenance'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Component */}
            {showCatManager && (
                <CategoryManager 
                    onClose={() => {
                        setShowCatManager(false);
                        fetchData(); // This ensures the dropdown updates immediately
                    }} 
                />
            )}
        </div>
    );
}