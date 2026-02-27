import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { PlusCircle, Globe, Trash2 } from 'lucide-react';

interface Service {
    id?: number;
    name: string;
    slug: string;
    url: string;
    category: string;
    icon: string;
}

export default function ServicesAdmin() {

    const [services, setServices] = useState<Service[]>([]);
    const [form, setForm] = useState<Service>({ name: '', slug: '', url: '', category: 'General', icon: 'Globe' });

    const fetchServices = async () => {
        const res = await api.get('/services');
        setServices(res.data);
    };    

    const [formData, setFormData] = useState({ name: '', slug: '', url: '', category: '', icon: 'Globe' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/services', formData);
            alert("Service Added Successfully!");
        } catch (err) {
            alert("Error adding service. Check if slug is unique.");
        }
    };

    useEffect(() => { fetchServices(); }, []);

    const handleSaveService = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/services', form);
            setForm({ name: '', slug: '', url: '', category: 'General', icon: 'Globe' });
            fetchServices();
            alert("Service created!");
        } catch (err) {
            alert("Error saving service");
        }
    };

    const deleteService = async (id: number) => {
        if (!confirm("Delete this service?")) return;
        await api.delete(`/admin/services/${id}`);
        fetchServices();
    };

return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* FORM */}
            <div className="bg-white p-6 rounded-lg shadow-md h-fit">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <PlusCircle size={20}/> New Service
                </h2>
                <form onSubmit={handleSaveService} className="space-y-4">
                    <input className="w-full border p-2 rounded" placeholder="Service Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                    <input className="w-full border p-2 rounded" placeholder="Slug (e.g. gitlab)" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} required />
                    <input className="w-full border p-2 rounded" placeholder="URL" value={form.url} onChange={e => setForm({...form, url: e.target.value})} required />
                    <input className="w-full border p-2 rounded" placeholder="Icon (Lucide name)" value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} />
                    <button className="w-full bg-blue-600 text-white p-2 rounded font-bold">Save Service</button>
                </form>
            </div>

            {/* LIST */}
            <div className="md:col-span-2 space-y-4">
                <h2 className="text-xl font-bold">Active Services</h2>
                {services.map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-50 p-2 rounded text-blue-600"><Globe size={20}/></div>
                            <div>
                                <div className="font-bold">{s.name}</div>
                                <div className="text-xs text-gray-500">{s.url}</div>
                            </div>
                        </div>
                        <button onClick={() => s.id && deleteService(s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                            <Trash2 size={18}/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}