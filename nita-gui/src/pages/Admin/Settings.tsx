import { useState } from 'react';
import api from '../../api/axios';
import { 
    Download, 
    Upload, 
    Database, 
    RefreshCw, 
    ShieldAlert, 
    FileJson 
} from 'lucide-react';

export default function Settings() {
    const [loading, setLoading] = useState(false);

    // 1. Export Data as JSON
    const handleExport = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `nita_registry_backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert("Export failed. Check backend connectivity.");
        } finally {
            setLoading(false);
        }
    };

    // 2. Import Data from JSON
    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm("CRITICAL: This will overwrite existing services and roles. Proceed?")) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const jsonData = JSON.parse(event.target?.result as string);
                await api.post('/admin/import', jsonData);
                alert("NITA Registry Restored Successfully!");
                window.location.reload();
            } catch (err) {
                alert("Import failed. Ensure the JSON file structure is correct.");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="max-w-5xl mx-auto p-8">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">System Settings</h1>
                <p className="text-slate-500">Manage NITA Registry backups and infrastructure synchronization.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Data Portability Card */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileJson size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Data Portability</h2>
                    </div>
                    
                    <p className="text-sm text-slate-500 mb-8">
                        Export all registered services, categories, and role-based permissions into a single portable JSON file.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleExport}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                        >
                            <Download size={18} />
                            Export Registry (JSON)
                        </button>

                        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-blue-400 text-slate-600 py-3 rounded-xl font-bold cursor-pointer transition-all">
                            <Upload size={18} />
                            Import Registry
                            <input type="file" className="hidden" accept=".json" onChange={handleImport} disabled={loading} />
                        </label>
                    </div>
                </div>

                {/* System Maintenance Card */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Database size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Maintenance</h2>
                    </div>

                    <p className="text-sm text-slate-500 mb-8">
                        Force a cache refresh of the NCRA-TIFR service registry or clear storage symlinks.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <p className="font-bold text-slate-700 text-sm">Clear System Cache</p>
                                <p className="text-xs text-slate-400 font-mono">php artisan config:cache</p>
                            </div>
                            <button className="p-2 text-blue-600 hover:bg-white rounded-lg transition-colors">
                                <RefreshCw size={20} />
                            </button>
                        </div>

                        <div className="p-4 border border-amber-100 bg-amber-50/50 rounded-xl flex items-start gap-3">
                            <ShieldAlert className="text-amber-500 mt-1 flex-shrink-0" size={18} />
                            <p className="text-xs text-amber-800">
                                <strong>Warning:</strong> Importing registry data will overwrite your current configuration. Ensure you have a valid backup before proceeding.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}