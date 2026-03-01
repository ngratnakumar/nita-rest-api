import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { PlusCircle, Globe, Trash2, Edit2, X, ShieldCheck, Tag } from 'lucide-react';
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
}

export default function ServicesAdmin() {
    const [services, setServices] = useState<Service[]>([]);
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [dynamicCats, setDynamicCats] = useState<Category[]>([]); // New state for categories
    const [isEditing, setIsEditing] = useState(false);
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [showCatManager, setShowCatManager] = useState(false); // Modal control
    const [form, setForm] = useState<Service>({ 
        name: '', slug: '', url: '', category: '', icon: '' 
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 bg-slate-50 min-h-screen">
            {/* Side Form */}
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
                        <input className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 shadow-sm" 
                               value={form.name} onChange={e => handleNameChange(e.target.value)} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex justify-between items-center mb-0.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                                <button 
                                    type="button" 
                                    onClick={() => setShowCatManager(true)}
                                    className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                                >
                                    <Tag size={10}/> EDIT
                                </button>
                            </div>
                            <select 
                                className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-sm"
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
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slug</label>
                            <input className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 font-mono text-[10px]" value={form.slug} readOnly />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL</label>
                        <input className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-500 shadow-sm" 
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

                    <button className={`w-full p-4 rounded-xl font-black text-sm uppercase text-white shadow-lg transition-transform active:scale-95 ${isEditing ? 'bg-amber-500 shadow-amber-100' : 'bg-blue-600 shadow-blue-100'}`}>
                        {isEditing ? 'Update Registry' : 'Register Service'}
                    </button>
                </form>
            </div>

            {/* List View */}
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Active Registry</h2>
                <div className="grid gap-4">
                    {services.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-all">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden shadow-inner">
                                    {s.icon && s.icon.includes('.') ? (
                                        <img src={`${API_URL}/storage/icons/${s.icon}`} className="w-full h-full object-contain p-2" />
                                    ) : ( <Globe size={28} className="text-slate-200"/> )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-slate-800 text-lg uppercase leading-none">{s.name}</span>
                                        <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">{s.category}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {s.roles?.map(r => (
                                            <span key={r.id} className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-black uppercase border border-blue-100/50">{r.name}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(s)} className="p-3 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"><Edit2 size={18}/></button>
                                <button onClick={() => s.id && deleteService(s.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

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