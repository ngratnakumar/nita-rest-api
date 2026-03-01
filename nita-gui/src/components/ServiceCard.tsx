import * as Icons from 'lucide-react';

export default function ServiceCard({ service, viewMode }) {
    // 1. Define the Backend URL for assets
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // 2. Resolve which icon to show
    const renderIcon = (size) => {
        // Check if the icon field looks like a filename (contains a dot like .png, .svg)
        const isUploadedImage = service.icon && service.icon.includes('.');

        if (isUploadedImage) {
            return (
                <img 
                    src={`${API_URL}/storage/icons/${service.icon}`} 
                    alt="" 
                    className="object-contain" 
                    style={{ width: size, height: size }}
                    onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/40?text=NA";
                    }}
                />
            );
        }

        // Fallback to Lucide Icons if it's just a name (e.g., "Globe")
        const IconComponent = Icons[service.icon] || Icons.HelpCircle;
        return <IconComponent size={size} className="text-blue-600" />;
    };

    // Compact View
    if (viewMode === 'compact') {
        return (
            <a href={service.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-blue-500 transition-all group">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded overflow-hidden">
                        {renderIcon(18)}
                    </div>
                    <span className="font-bold text-slate-700">{service.name}</span>
                </div>
                <Icons.ExternalLink size={14} className="text-slate-300" />
            </a>
        );
    }

    // List View
    if (viewMode === 'list') {
        return (
            <a href={service.url} target="_blank" rel="noopener noreferrer" 
               className="flex items-center p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group">
                <div className="w-16 h-16 flex items-center justify-center bg-blue-50 rounded-lg mr-6 overflow-hidden">
                    {renderIcon(28)}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600">{service.name}</h3>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{service.category}</span>
                    </div>
                    <p className="text-sm text-slate-500">Access the centralized {service.name} portal.</p>
                </div>
                <div className="px-4 py-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    Launch
                </div>
            </a>
        );
    }

    // Default Grid View
    return (
        <a href={service.url} target="_blank" rel="noopener noreferrer" className="block p-6 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-500 transition-all group">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden border border-slate-100 group-hover:bg-white transition-colors">
                    {renderIcon(40)}
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600">{service.name}</h3>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        {service.category}
                    </span>
                </div>
            </div>
            <p className="text-sm text-slate-500 line-clamp-2">Access the {service.name} infrastructure tool.</p>
        </a>
    );
}