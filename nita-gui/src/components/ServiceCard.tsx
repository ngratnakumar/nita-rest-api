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

// Category color schema
const categoryColorMap: { [key: string]: { bg: string; text: string; badge: string } } = {
    'astronomy': { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100' },
    'computing': { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100' },
    'software': { bg: 'bg-cyan-50', text: 'text-cyan-700', badge: 'bg-cyan-100' },
    'communication': { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100' },
    'data': { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100' },
    'infrastructure': { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100' },
    'administration': { bg: 'bg-indigo-50', text: 'text-indigo-700', badge: 'bg-indigo-100' },
    'monitoring': { bg: 'bg-pink-50', text: 'text-pink-700', badge: 'bg-pink-100' },
    'security': { bg: 'bg-rose-50', text: 'text-rose-700', badge: 'bg-rose-100' },
    'development': { bg: 'bg-lime-50', text: 'text-lime-700', badge: 'bg-lime-100' },
    'other': { bg: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-100' },
};

const getCategoryColors = (category: string) => {
    const key = category?.toLowerCase() || 'other';
    return categoryColorMap[key] || categoryColorMap['other'];
};

export default function ServiceCard({ service, viewMode }: ServiceCardProps) {
    // Backend URL for assets (icons/images)
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const colors = getCategoryColors(service.category);

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
        return <IconComponent size={size} className={`${colors.text} group-hover:scale-110 transition-transform`} />;
    };

    // --- COMPACT VIEW ---
    if (viewMode === 'compact') {
        return (
            <a href={service.url} target="_blank" rel="noopener noreferrer" 
               className={`flex items-center justify-between p-3 ${colors.bg} border border-slate-200 rounded-lg hover:shadow-md transition-all group`}>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 flex items-center justify-center ${colors.badge} rounded overflow-hidden`}>
                        {renderIcon(18)}
                    </div>
                    <span className="font-bold text-sm text-slate-700">{service.name}</span>
                </div>
                <Icons.ExternalLink size={14} className={`${colors.text} opacity-50 group-hover:opacity-100`} />
            </a>
        );
    }

    // --- LIST VIEW ---
    if (viewMode === 'list') {
        return (
            <a href={service.url} target="_blank" rel="noopener noreferrer" 
               className={`flex items-center p-4 ${colors.bg} border border-slate-200 rounded-xl hover:shadow-md transition-all group`}>
                <div className={`w-16 h-16 flex items-center justify-center ${colors.badge} rounded-lg mr-6 overflow-hidden flex-shrink-0`}>
                    {renderIcon(32)}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-slate-900 uppercase">{service.name}</h3>
                        <span className={`text-[10px] font-black ${colors.text} ${colors.badge} px-2 py-1 rounded uppercase tracking-widest`}>
                            {service.category}
                        </span>
                    </div>
                    <p className="text-sm text-slate-600">Access the centralized {service.name} infrastructure portal.</p>
                </div>
                <div className={`px-4 py-2 ${colors.badge} ${colors.text} text-xs font-black uppercase rounded-lg group-hover:${colors.badge} transition-all`}>
                    Launch
                </div>
            </a>
        );
    }

    // --- DEFAULT GRID VIEW ---
    return (
        <a href={service.url} target="_blank" rel="noopener noreferrer" 
           className={`block p-6 ${colors.bg} rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all group`}>
            <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 flex items-center justify-center ${colors.badge} rounded-xl overflow-hidden border border-slate-200`}>
                    {renderIcon(40)}
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 uppercase leading-none">{service.name}</h3>
                    <span className={`text-[9px] ${colors.badge} ${colors.text} px-2 py-0.5 rounded font-black uppercase tracking-wider mt-1 inline-block`}>
                        {service.category}
                    </span>
                </div>
            </div>
            <p className="text-sm text-slate-600 line-clamp-2">Access the {service.name} administrative and management tool for NCRA.</p>
        </a>
    );
}