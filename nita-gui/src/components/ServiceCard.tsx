import * as Icons from 'lucide-react';

export default function ServiceCard({ service }: { service: any }) {
    // Dynamically pick the icon from Lucide library based on the string in DB
    const IconComponent = (Icons as any)[service.icon] || Icons.HelpCircle;

    return (
        <a 
            href={service.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-500 hover:-translate-y-1 transition-all group"
        >
            <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <IconComponent size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {service.name}
                    </h3>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {service.category || 'Service'}
                    </span>
                </div>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2">
                Click to access the {service.name} infrastructure tool.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-blue-600 uppercase">
                Launch Service <Icons.ChevronRight size={14} className="ml-1" />
            </div>
        </a>
    );
}