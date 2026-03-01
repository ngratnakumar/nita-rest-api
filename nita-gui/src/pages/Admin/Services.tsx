import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { PlusCircle, Globe, Trash2, Edit2, X, Save, ShieldCheck } from 'lucide-react';
import IconPicker from '../../components/Admin/IconPicker';

interface Role { id: number; name: string; }

interface Service { 
    id?: number; 
    name: string; 
    slug: string; 
    url: string; 
    category: string; 
    icon: string; 
    roles?: Role[]; 
}

export default function ServicesAdmin() {
    const [services, setServices] = useState<Service[]>([]);
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [form, setForm] = useState<Service>({ 
        name: '', slug: '', url: '', category: 'General', icon: '' 
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const categories = ["General", "Authentication & Access", "Compute", "TIFR", "Firewalls", "Network", "Inventory", "HPC", "GMRT"];

    const fetchData = async () => {
        try {
            const [sRes, rRes] = await Promise.all([
                api.get('/services'),
                api.get('/roles') 
            ]);
            setServices(sRes.data);
            setAvailableRoles(rRes.data);
        } catch (err) { console.error("Fetch error", err); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleNameChange = (name: string) => {
        const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
        setForm({ ...form, name, slug });
    };

    // FIX 1: Hydrate selectedRoleIds when editing starts
    const startEdit = (s: Service) => {
        setForm(s);
        const roleIds = s.roles ? s.roles.map(r => r.id) : [];
        setSelectedRoleIds(roleIds); 
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setForm({ name: '', slug: '', url: '', category: 'General', icon: '' });
        setSelectedRoleIds([]);
        setIsEditing(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // FIX 2: Explicitly package the roles in the payload
        const payload = {
            name: form.name,
            slug: form.slug,
            url: form.url,
            category: form.category,
            icon: form.icon,
            roles: selectedRoleIds 
        };

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
        setSelectedRoleIds(prev => prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 bg-slate-50 min-h-screen">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit lg:sticky lg:top-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 uppercase">
                        {isEditing ? <Edit2 className="text-amber-500" size={20}/> : <PlusCircle className="text-blue-500" size={20}/>}
                        {isEditing ? 'Update Tool' : 'New Tool'}
                    </h2>
                    {isEditing && <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>}
                </div>

                <form onSubmit={handleSave} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Name</label>
                        <input className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500" 
                               value={form.name} onChange={e => handleNameChange(e.target.value)} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                            <select className="w-full border border-slate-200 p-2.5 rounded-xl bg-white"
                                value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slug</label>
                            <input className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 font-mono text-[10px]" value={form.slug} readOnly />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL</label>
                        <input className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500" 
                               value={form.url} onChange={e => setForm({...form, url: e.target.value})} required />
                    </div>

                    <IconPicker selectedIcon={form.icon} onSelect={(iconName) => setForm({ ...form, icon: iconName })} />

                    <div className="pt-4 border-t border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 mb-3">
                            <ShieldCheck size={14}/> Access Permissions
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableRoles.map(role => (
                                <button key={role.id} type="button" onClick={() => toggleRole(role.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                        selectedRoleIds.includes(role.id) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'
                                    }`}>
                                    {role.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button className={`w-full p-4 rounded-xl font-black text-sm uppercase text-white shadow-lg ${isEditing ? 'bg-amber-500 shadow-amber-100' : 'bg-blue-600 shadow-blue-100'}`}>
                        {isEditing ? 'Update Registry' : 'Register Service'}
                    </button>
                </form>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold text-slate-800 uppercase">Active Registry</h2>
                <div className="grid gap-4">
                    {services.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden">
                                    {s.icon && s.icon.includes('.') ? (
                                        <img src={`${API_URL}/storage/icons/${s.icon}`} className="w-full h-full object-contain p-2" />
                                    ) : ( <Globe size={28} className="text-slate-200"/> )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-slate-800 text-lg uppercase">{s.name}</span>
                                        <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{s.category}</span>
                                    </div>
                                    <div className="flex gap-1.5 mt-2">
                                        {s.roles?.map(r => (
                                            <span key={r.id} className="text-[8px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded font-black uppercase border border-blue-100">{r.name}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => startEdit(s)} className="p-3 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"><Edit2 size={18}/></button>
                                <button onClick={() => s.id && api.delete(`/admin/services/${s.id}`).then(fetchData)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}