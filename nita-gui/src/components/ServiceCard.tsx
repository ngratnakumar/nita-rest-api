import * as Icons from 'lucide-react';

// 1. Define the Interface
interface Service {
    name: string;
    icon: string;
    category: string;
    url: string;
    is_maintenance?: boolean;
    maintenance_message?: string;
}

interface ServiceCardProps {
    service: Service;
    viewMode: 'grid' | 'list' | 'compact'; // Added 'compact' to avoid TS error
}

// Category color schema
const categoryColorMap: { [key: string]: { bg: string; darkBg: string; text: string; darkText: string; badge: string; darkBadge: string; border: string; darkBorder: string } } = {
    'astronomy': { bg: 'bg-purple-50', darkBg: 'dark:bg-purple-900/20', text: 'text-purple-700', darkText: 'dark:text-purple-400', badge: 'bg-purple-100', darkBadge: 'dark:bg-purple-900', border: 'border-purple-200', darkBorder: 'dark:border-purple-800' },
    'computing': { bg: 'bg-blue-50', darkBg: 'dark:bg-blue-900/20', text: 'text-blue-700', darkText: 'dark:text-blue-400', badge: 'bg-blue-100', darkBadge: 'dark:bg-blue-900', border: 'border-blue-200', darkBorder: 'dark:border-blue-800' },
    'software': { bg: 'bg-cyan-50', darkBg: 'dark:bg-cyan-900/20', text: 'text-cyan-700', darkText: 'dark:text-cyan-400', badge: 'bg-cyan-100', darkBadge: 'dark:bg-cyan-900', border: 'border-cyan-200', darkBorder: 'dark:border-cyan-800' },
    'communication': { bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/20', text: 'text-emerald-700', darkText: 'dark:text-emerald-400', badge: 'bg-emerald-100', darkBadge: 'dark:bg-emerald-900', border: 'border-emerald-200', darkBorder: 'dark:border-emerald-800' },
    'data': { bg: 'bg-orange-50', darkBg: 'dark:bg-orange-900/20', text: 'text-orange-700', darkText: 'dark:text-orange-400', badge: 'bg-orange-100', darkBadge: 'dark:bg-orange-900', border: 'border-orange-200', darkBorder: 'dark:border-orange-800' },
    'infrastructure': { bg: 'bg-red-50', darkBg: 'dark:bg-red-900/20', text: 'text-red-700', darkText: 'dark:text-red-400', badge: 'bg-red-100', darkBadge: 'dark:bg-red-900', border: 'border-red-200', darkBorder: 'dark:border-red-800' },
    'administration': { bg: 'bg-indigo-50', darkBg: 'dark:bg-indigo-900/20', text: 'text-indigo-700', darkText: 'dark:text-indigo-400', badge: 'bg-indigo-100', darkBadge: 'dark:bg-indigo-900', border: 'border-indigo-200', darkBorder: 'dark:border-indigo-800' },
    'monitoring': { bg: 'bg-pink-50', darkBg: 'dark:bg-pink-900/20', text: 'text-pink-700', darkText: 'dark:text-pink-400', badge: 'bg-pink-100', darkBadge: 'dark:bg-pink-900', border: 'border-pink-200', darkBorder: 'dark:border-pink-800' },
    'security': { bg: 'bg-rose-50', darkBg: 'dark:bg-rose-900/20', text: 'text-rose-700', darkText: 'dark:text-rose-400', badge: 'bg-rose-100', darkBadge: 'dark:bg-rose-900', border: 'border-rose-200', darkBorder: 'dark:border-rose-800' },
    'development': { bg: 'bg-lime-50', darkBg: 'dark:bg-lime-900/20', text: 'text-lime-700', darkText: 'dark:text-lime-400', badge: 'bg-lime-100', darkBadge: 'dark:bg-lime-900', border: 'border-lime-200', darkBorder: 'dark:border-lime-800' },
    'other': { bg: 'bg-slate-50', darkBg: 'dark:bg-slate-800', text: 'text-slate-700', darkText: 'dark:text-slate-400', badge: 'bg-slate-100', darkBadge: 'dark:bg-slate-700', border: 'border-slate-200', darkBorder: 'dark:border-slate-700' },
};

const getCategoryColors = (category: string) => {
    const key = category?.toLowerCase() || 'other';
    return categoryColorMap[key] || categoryColorMap['other'];
};

export default function ServiceCard({ service, viewMode }: ServiceCardProps) {
    // Backend URL for assets (icons/images). Strip trailing /api if present so /storage resolves correctly.
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const ASSET_BASE_URL = API_URL.replace(/\/?api$/, '');
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
                    src={`${ASSET_BASE_URL}/storage/icons/${service.icon}`} 
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
        return <IconComponent size={size} className={`${colors.text} ${colors.darkText} group-hover:scale-110 transition-transform`} />;
    };

    // --- COMPACT VIEW ---
    if (viewMode === 'compact') {
        return (
            <a href={service.url} target="_blank" rel="noopener noreferrer" 
               className={`flex items-center justify-between p-3 ${colors.bg} ${colors.darkBg} border ${colors.border} ${colors.darkBorder} rounded-lg hover:shadow-md dark:shadow-lg transition-all group`}>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 flex items-center justify-center ${colors.badge} ${colors.darkBadge} rounded overflow-hidden`}>
                        {renderIcon(18)}
                    </div>
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{service.name}</span>
                    {service.is_maintenance && (
                        <span className="text-[8px] px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 rounded font-bold">MAINTENANCE</span>
                    )}
                </div>
                <Icons.ExternalLink size={14} className={`${colors.text} ${colors.darkText} opacity-50 group-hover:opacity-100`} />
            </a>
        );
    }

    // --- LIST VIEW ---
    if (viewMode === 'list') {
        return (
            <a href={service.url} target="_blank" rel="noopener noreferrer" 
               className={`flex items-center p-4 ${colors.bg} ${colors.darkBg} border ${colors.border} ${colors.darkBorder} rounded-xl hover:shadow-md dark:shadow-lg transition-all group`}>
                <div className={`w-16 h-16 flex items-center justify-center ${colors.badge} ${colors.darkBadge} rounded-lg mr-6 overflow-hidden flex-shrink-0`}>
                    {renderIcon(32)}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 uppercase">{service.name}</h3>
                        <span className={`text-[10px] font-black ${colors.text} ${colors.darkText} ${colors.badge} ${colors.darkBadge} px-2 py-1 rounded uppercase tracking-widest`}>
                            {service.category}
                        </span>
                        {service.is_maintenance && (
                            <span className="text-[9px] px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 rounded font-bold uppercase">Under Maintenance</span>
                        )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{service.maintenance_message || `Access the centralized ${service.name} infrastructure portal.`}</p>
                </div>
                <div className={`px-4 py-2 ${colors.badge} ${colors.darkBadge} ${colors.text} ${colors.darkText} text-xs font-black uppercase rounded-lg group-hover:${colors.badge} transition-all`}>
                    Launch
                </div>
            </a>
        );
    }

    // --- DEFAULT GRID VIEW ---
    return (
        <a href={service.url} target="_blank" rel="noopener noreferrer" 
           className={`block p-6 ${colors.bg} ${colors.darkBg} rounded-2xl shadow-sm border ${colors.border} ${colors.darkBorder} hover:shadow-xl dark:shadow-lg hover:-translate-y-1 transition-all group relative`}>
            {service.is_maintenance && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 text-[8px] font-bold uppercase rounded">
                    Maintenance
                </div>
            )}
            <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 flex items-center justify-center ${colors.badge} ${colors.darkBadge} rounded-xl overflow-hidden border ${colors.border} ${colors.darkBorder}`}>
                    {renderIcon(40)}
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase leading-none">{service.name}</h3>
                    <span className={`text-[9px] ${colors.badge} ${colors.darkBadge} ${colors.text} ${colors.darkText} px-2 py-0.5 rounded font-black uppercase tracking-wider mt-1 inline-block`}>
                        {service.category}
                    </span>
                </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {service.is_maintenance ? service.maintenance_message : `Access the ${service.name} administrative and management tool for NCRA.`}
            </p>
        </a>
    );
}