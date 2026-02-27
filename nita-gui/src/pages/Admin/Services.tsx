import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { PlusCircle, Globe, Trash2, Edit2, X, Save, ShieldCheck } from 'lucide-react';

interface Role { id: number; name: string; }
interface Service { 
    id?: number; 
    name: string; 
    slug: string; 
    url: string; 
    category: string; 
    icon: string; 
    roles?: Role[]; // Added to track which roles have this service
}

export default function ServicesAdmin() {
    const [services, setServices] = useState<Service[]>([]);
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [form, setForm] = useState<Service>({ 
        name: '', slug: '', url: '', category: 'General', icon: 'Globe' 
    });

    const fetchData = async () => {
        try {
            // Path alignment with your api.php
            const [sRes, rRes] = await Promise.all([
                api.get('/services'),
                api.get('/roles') 
            ]);
            setServices(sRes.data);
            setAvailableRoles(rRes.data);
        } catch (err) {
            console.error("Fetch error", err);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Auto-generate slug from name
    const handleNameChange = (name: string) => {
        const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
        setForm({ ...form, name, slug });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let serviceId = form.id;

            if (isEditing && serviceId) {
                // Remove /api prefix from string
                await api.patch(`/admin/services/${serviceId}`, form);
            } else {
                const res = await api.post('/admin/services', form);
                serviceId = res.data.id;
            }

            // After saving service, update its Role Mappings
            if (serviceId) {
                // Assuming you have a backend endpoint to sync roles for a service
                // If not, we can handle it via the Roles Matrix, but this makes it convenient here
                await api.put(`/admin/services/${serviceId}/roles`, { roles: selectedRoleIds });
            }

            resetForm();
            fetchData();
            alert("Service saved and mapped successfully!");
        } catch (err: any) { 
            const msg = err.response?.data?.message || "Check if slug is unique.";
            alert("Error: " + msg); 
        }
    };

    const resetForm = () => {
        setForm({ name: '', slug: '', url: '', category: 'General', icon: 'Globe' });
        setSelectedRoleIds([]);
        setIsEditing(false);
    };

    const startEdit = (s: Service) => {
        setForm(s);
        setSelectedRoleIds(s.roles?.map(r => r.id) || []);
        setIsEditing(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete service? This will remove access for all assigned roles.")) return;
        await api.delete(`/admin/services/${id}`);
        fetchData();
    };

    const toggleRole = (roleId: number) => {
        setSelectedRoleIds(prev => 
            prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4">
            {/* FORM PANEL */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit sticky top-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        {isEditing ? <Edit2 className="text-amber-500" /> : <PlusCircle className="text-blue-500" />}
                        {isEditing ? 'Edit Service' : 'Register Service'}
                    </h2>
                    {isEditing && (
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                    )}
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Service Name</label>
                        <input className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                               value={form.name} onChange={e => handleNameChange(e.target.value)} required placeholder="e.g. NCRA Gitlab" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Slug (Auto-generated)</label>
                        <input className="w-full border p-2 rounded mt-1 bg-gray-50" value={form.slug} readOnly />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Redirect URL</label>
                        <input className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                               value={form.url} onChange={e => setForm({...form, url: e.target.value})} required placeholder="https://..." />
                    </div>

                    {/* ROLE MAPPING SECTION */}
                    <div className="pt-4 border-t">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2">
                            <ShieldCheck size={14}/> Assign to Roles
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableRoles.map(role => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => toggleRole(role.id)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                                        selectedRoleIds.includes(role.id)
                                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {role.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button className={`w-full p-3 rounded-lg font-bold text-white transition-all flex justify-center gap-2 items-center shadow-lg ${isEditing ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {isEditing ? <Save size={18}/> : <PlusCircle size={18}/>}
                        {isEditing ? 'Save Changes' : 'Create Service'}
                    </button>
                </form>
            </div>

            {/* LIST PANEL */}
            <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-end">
                    <h2 className="text-xl font-bold text-gray-800">Service Registry</h2>
                    <span className="text-sm text-gray-500">{services.length} services active</span>
                </div>
                <div className="grid gap-4">
                    {services.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-blue-200 transition-all">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="bg-blue-50 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Globe size={24}/>
                                </div>
                                <div className="overflow-hidden">
                                    <div className="font-bold text-gray-800 flex items-center gap-2">
                                        {s.name}
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono uppercase">{s.slug}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 truncate max-w-xs">{s.url}</div>
                                    <div className="flex gap-1 mt-1">
                                        {s.roles?.map(r => (
                                            <span key={r.id} className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded">
                                                {r.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1 ml-4">
                                <button onClick={() => startEdit(s)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"><Edit2 size={18}/></button>
                                <button onClick={() => s.id && handleDelete(s.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}