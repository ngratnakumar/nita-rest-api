import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Trash2, Upload, Loader2, Image as ImageIcon, CheckCircle } from 'lucide-react';

export default function IconManager() {
    const [icons, setIcons] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const fetchIcons = async () => {
        try {
            const res = await api.get('/admin/media/icons');
            setIcons(res.data);
        } catch (err) {
            console.error("Failed to fetch icons");
        }
    };

    useEffect(() => { fetchIcons(); }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

    const formData = new FormData();
        formData.append('file', file);

    setUploading(true);
        try {
            const response = await api.post('/admin/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log("Server Response:", response.data);
            fetchIcons(); // Refresh the list
        } catch (err: any) {
            // Detailed error alerting
            const errorMsg = err.response?.data?.message || err.message;
            const status = err.response?.status;
            alert(`Upload Failed (${status}): ${errorMsg}`);
            console.error("Upload Error:", err.response);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (name: string) => {
        // 1. Confirm with user
        if (!confirm(`Permanently delete ${name}? This may break services using this icon.`)) return;

        try {
            // 2. Send delete request with the filename
            await api.delete(`/admin/media/icons/${name}`);
            
            // 3. Update local state so it vanishes from UI immediately
            setIcons(prev => prev.filter(icon => icon !== name));
            
            alert("Icon deleted.");
        } catch (err: any) {
            console.error("Delete error:", err.response);
            alert(err.response?.data?.message || "Failed to delete icon.");
        }
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Icon Library</h1>
                        <p className="text-slate-500 text-sm">Manage assets for the NITA Service Registry</p>
                    </div>
                    
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-blue-200 font-bold text-sm">
                        {uploading ? <Loader2 className="animate-spin" size={18}/> : <Upload size={18}/>}
                        {uploading ? 'Uploading...' : 'Add New Icon'}
                        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="image/*" />
                    </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {icons.map(icon => (
                        <div key={icon} className="group relative bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md">
                            <div className="aspect-square flex items-center justify-center mb-3">
                                <img 
                                    src={`${API_URL}/storage/icons/${icon}`} 
                                    className="max-w-full max-h-full object-contain" 
                                    alt={icon} 
                                    onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/100?text=Error"; }}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 truncate text-center font-mono bg-slate-50 py-1 rounded">{icon}</p>
                            
                            <button 
                                onClick={() => handleDelete(icon)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {icons.length === 0 && !uploading && (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <ImageIcon size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-medium">No icons uploaded yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}