import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import ServiceCard from '../components/ServiceCard';
import { LayoutGrid, List, AlignJustify, Search, X } from 'lucide-react';

type ViewMode = 'grid' | 'list' | 'compact';

export default function Dashboard() {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>(
        (localStorage.getItem('dashboard-view') as ViewMode) || 'grid'
    );

    useEffect(() => {
        api.get('/services')
            .then(res => {
                setServices(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // 1. Filter services based on search
    // 2. Group them by category
    const groupedServices = useMemo(() => {
        const filtered = services.filter(service => 
            service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        return filtered.reduce((groups: any, service) => {
            const category = service.category || 'General';
            if (!groups[category]) groups[category] = [];
            groups[category].push(service);
            return groups;
        }, {});
    }, [services, searchQuery]);

    const changeView = (mode: ViewMode) => {
        setViewMode(mode);
        localStorage.setItem('dashboard-view', mode);
    };

    if (loading) return <div className="p-8 text-slate-500">Loading Infrastructure Services...</div>;

    const categories = Object.keys(groupedServices);

    return (
        <div className="p-8">
            {/* Header and Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Your Services</h1>
                    <p className="text-sm text-slate-500">Authorized tools for your NCRA-TIFR roles</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Search services..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                        {(['grid', 'list', 'compact'] as ViewMode[]).map((mode) => (
                            <button 
                                key={mode}
                                onClick={() => changeView(mode)}
                                className={`p-2 rounded transition-colors ${viewMode === mode ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {mode === 'grid' && <LayoutGrid size={20} />}
                                {mode === 'list' && <List size={20} />}
                                {mode === 'compact' && <AlignJustify size={20} />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grouped Services Display */}
            {categories.length > 0 ? (
                categories.map(category => (
                    <section key={category} className="mb-12">
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{category}</h2>
                            <div className="h-px bg-slate-100 flex-1"></div>
                        </div>
                        
                        <div className={`grid gap-6 ${
                            viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                        }`}>
                            {groupedServices[category].map((service: any) => (
                                <ServiceCard 
                                    key={service.id} 
                                    service={service} 
                                    viewMode={viewMode} 
                                />
                            ))}
                        </div>
                    </section>
                ))
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-20 text-center">
                    <Search size={32} className="text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">No services found</h3>
                    <p className="text-slate-500">Check your spelling or try a different category.</p>
                </div>
            )}
        </div>
    );
}