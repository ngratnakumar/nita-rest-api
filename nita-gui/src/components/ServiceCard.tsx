import * as Icons from 'lucide-react';

// 1. Define the Interface
interface Service {
    name: string;
    icon: string;
    category: string;
    url: string;
}

interface ServiceCardProps {
    service: Service;
    viewMode: 'grid' | 'list' | 'compact'; // Added 'compact' to avoid TS error
}

export default function ServiceCard({ service, viewMode }: ServiceCardProps) {
    // Backend URL for assets (icons/images)
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    /**
     * Resolve which icon to show: 
     * Handles both uploaded images (png/svg) and Lucide Icon names
     */
    const renderIcon = (size: number) => {
        const isUploadedImage = service.icon && service.icon.includes('.');

        if (isUploadedImage) {
            return (
                <img 
                    src={`${API_URL}/storage/icons/${service.icon}`} 
                    alt={service.name} 
                    className="object-contain" 
                    style={{ width: size, height: size }}
                    onError={(e) => {
                        // Fallback placeholder if image fails to load
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${service.name}&background=f1f5f9&color=64748b&size=${size}`;
                    }}
                />
            );
        }

        // Fallback to Lucide Icons if it's just a name string (e.g., "Globe")
        const IconComponent = (Icons as any)[service.icon] || Icons.HelpCircle;
        return <IconComponent size={size} className="text-blue-600 group-hover:scale-110 transition-transform" />;
    };

    // --- COMPACT VIEW ---
    if (viewMode === 'compact') {
        return (
            <a href={service.url} target="_blank" rel="noopener noreferrer" 
               className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-blue-500 hover:bg-blue-50/30 transition-all group">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded overflow-hidden">
                        {renderIcon(18)}
                    </div>
                    <span className="font-bold text-sm text-slate-700">{service.name}</span>
                </div>
                <Icons.ExternalLink size={14} className="text-slate-300 group-hover:text-blue-500" />
            </a>
        );
    }

    // --- LIST VIEW ---
    if (viewMode === 'list') {
        return (
            <a href={service.url} target="_blank" rel="noopener noreferrer" 
               className="flex items-center p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group">
                <div className="w-16 h-16 flex items-center justify-center bg-blue-50 rounded-lg mr-6 overflow-hidden flex-shrink-0">
                    {renderIcon(32)}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 uppercase">{service.name}</h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{service.category}</span>
                    </div>
                    <p className="text-sm text-slate-500">Access the centralized {service.name} infrastructure portal.</p>
                </div>
                <div className="px-4 py-2 bg-slate-50 text-slate-400 text-xs font-black uppercase rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                    Launch
                </div>
            </a>
        );
    }

    // --- DEFAULT GRID VIEW ---
    return (
        <a href={service.url} target="_blank" rel="noopener noreferrer" 
           className="block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 transition-all group">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden border border-slate-100 group-hover:bg-white transition-colors">
                    {renderIcon(40)}
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 uppercase leading-none">{service.name}</h3>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase tracking-wider mt-1 inline-block">
                        {service.category}
                    </span>
                </div>
            </div>
            <p className="text-sm text-slate-500 line-clamp-2">Access the {service.name} administrative and management tool for NCRA.</p>
        </a>
    );
}