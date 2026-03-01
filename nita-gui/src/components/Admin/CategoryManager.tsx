import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Tag, Trash2, Plus, X, Loader2 } from 'lucide-react';

interface Category { id: number; name: string; }

export default function CategoryManager({ onClose }: { onClose: () => void }) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(true);

    const fetch = async () => {
        const res = await api.get('/admin/categories');
        setCategories(res.data);
        setLoading(false);
    };

    useEffect(() => { fetch(); }, []);

    const add = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        try {
            await api.post('/admin/categories', { name: newName });
            setNewName('');
            fetch();
        } catch (err) { alert("Error adding category."); }
    };

    const remove = async (id: number) => {
        try {
            await api.delete(`/admin/categories/${id}`);
            fetch();
        } catch (err: any) {
            alert(err.response?.data?.message || "Delete failed");
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <Tag size={18} className="text-blue-600"/> Category Manager
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors"><X size={20}/></button>
                </div>
                
                <div className="p-6">
                    <form onSubmit={add} className="flex gap-2 mb-6">
                        <input 
                            className="flex-1 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 text-sm shadow-inner"
                            placeholder="e.g., Storage, HPC, VPN"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                        <button className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100"><Plus size={20}/></button>
                    </form>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? <Loader2 className="animate-spin mx-auto text-slate-300 my-10"/> : 
                         categories.map(cat => (
                            <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                <span className="text-xs font-black text-slate-600 uppercase tracking-wide">{cat.name}</span>
                                <button onClick={() => remove(cat.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}