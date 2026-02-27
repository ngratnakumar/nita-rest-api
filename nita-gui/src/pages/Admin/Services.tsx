import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { PlusCircle, Globe, Trash2, Edit2, X } from 'lucide-react';

interface Service { id?: number; name: string; slug: string; url: string; category: string; icon: string; }

export default function ServicesAdmin() {
    const [services, setServices] = useState<Service[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<Service>({ name: '', slug: '', url: '', category: 'General', icon: 'Globe' });

    const fetchServices = async () => {
        const res = await api.get('/services');
        setServices(res.data);
    };

    useEffect(() => { fetchServices(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && form.id) {
                await api.patch(`/admin/services/${form.id}`, form);
            } else {
                await api.post('/admin/services', form);
            }
            resetForm();
            fetchServices();
        } catch (err) { alert("Error saving service. Ensure slug is unique."); }
    };

    const editService = (service: Service) => {
        setForm(service);
        setIsEditing(true);
    };

    const resetForm = () => {
        setForm({ name: '', slug: '', url: '', category: 'General', icon: 'Globe' });
        setIsEditing(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? This will remove access for all roles.")) return;
        await api.delete(`/admin/services/${id}`);
        fetchServices();
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md h-fit sticky top-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        {isEditing ? <Edit2 size={20}/> : <PlusCircle size={20}/>} 
                        {isEditing ? 'Edit Service' : 'New Service'}
                    </h2>
                    {isEditing && <button onClick={resetForm}><X size={20}/></button>}
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <input className="w-full border p-2 rounded" placeholder="Name (e.g. GitLab)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                    <input className="w-full border p-2 rounded" placeholder="Slug (lowercase, no spaces)" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} required />
                    <input className="w-full border p-2 rounded" placeholder="URL (https://...)" value={form.url} onChange={e => setForm({...form, url: e.target.value})} required />
                    <input className="w-full border p-2 rounded" placeholder="Icon name (e.g. Shield)" value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} />
                    <button className={`w-full p-2 rounded font-bold text-white ${isEditing ? 'bg-amber-600' : 'bg-blue-600'}`}>
                        {isEditing ? 'Update Service' : 'Create Service'}
                    </button>
                </form>
            </div>

            <div className="md:col-span-2 space-y-4">
                <h2 className="text-xl font-bold">Service Registry</h2>
                {services.map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center hover:border-blue-300 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-50 p-2 rounded text-blue-600"><Globe size={20}/></div>
                            <div>
                                <div className="font-bold">{s.name}</div>
                                <div className="text-xs text-gray-400">{s.url}</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => editService(s)} className="p-2 text-gray-500 hover:bg-gray-100 rounded"><Edit2 size={18}/></button>
                            <button onClick={() => s.id && handleDelete(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}