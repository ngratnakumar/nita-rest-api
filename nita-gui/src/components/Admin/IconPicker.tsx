import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Loader2, Image as ImageIcon } from 'lucide-react';

interface IconPickerProps {
    selectedIcon: string;
    onSelect: (iconName: string) => void;
}

export default function IconPicker({ selectedIcon, onSelect }: IconPickerProps) {
    const [icons, setIcons] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Get the base URL for images from your env or use a fallback
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        const fetchIcons = async () => {
            try {
                const res = await api.get('/admin/media/icons');
                setIcons(res.data); // Expecting an array of strings (filenames)
            } catch (err) {
                console.error("Failed to load icons", err);
            } finally {
                setLoading(false);
            }
        };
        fetchIcons();
    }, []);

    return (
        <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                Select Service Icon
            </label>
            
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-3 border border-slate-700 rounded-xl bg-slate-900/50">
                {loading ? (
                    <div className="col-span-4 flex justify-center py-4">
                        <Loader2 className="animate-spin text-blue-500" size={20} />
                    </div>
                ) : icons.length === 0 ? (
                    <div className="col-span-4 text-center py-4 text-slate-500 text-xs">
                        No icons found. Upload one in the sidebar.
                    </div>
                ) : (
                    icons.map((icon) => (
                        <button
                            key={icon}
                            type="button"
                            onClick={() => onSelect(icon)}
                            className={`relative aspect-square flex items-center justify-center p-2 rounded-lg border-2 transition-all ${
                                selectedIcon === icon 
                                ? 'border-blue-500 bg-blue-500/10' 
                                : 'border-slate-800 hover:border-slate-600 bg-slate-800/30'
                            }`}
                        >
                            <img 
                                src={`${API_BASE_URL}/storage/icons/${icon}`} 
                                alt={icon} 
                                className="w-full h-full object-contain"
                                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')}
                            />
                            {selectedIcon === icon && (
                                <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                                    <ImageIcon size={10} className="text-white" />
                                </div>
                            )}
                        </button>
                    ))
                )}
            </div>
            {selectedIcon && (
                <p className="text-[10px] text-blue-400 font-medium">Selected: {selectedIcon}</p>
            )}
        </div>
    );
}