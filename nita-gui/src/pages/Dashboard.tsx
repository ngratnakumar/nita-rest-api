import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import ServiceCard from '../components/ServiceCard';
import { LayoutGrid, List, AlignJustify, Search, X, ArrowUpDown } from 'lucide-react';

type ViewMode = 'grid' | 'list' | 'compact';
type SortBy = 'name' | 'category';

// Category color schema
const categoryColorMap: { [key: string]: { bg: string; text: string; border: string } } = {
    'astronomy': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'computing': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'software': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    'communication': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    'data': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'infrastructure': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'administration': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    'monitoring': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    'security': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    'development': { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
    'other': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

const getCategoryColors = (category: string) => {
    const key = category?.toLowerCase() || 'general';
    return categoryColorMap[key] || categoryColorMap['other'];
};

export default function Dashboard() {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('category');
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
    // 3. Sort by selected option
    const groupedServices = useMemo(() => {
        const filtered = services.filter(service => 
            service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        const grouped = filtered.reduce((groups: any, service) => {
            const category = service.category || 'General';
            if (!groups[category]) groups[category] = [];
            groups[category].push(service);
            return groups;
        }, {});

        // Sort categories
        let sortedCategories = Object.keys(grouped);
        if (sortBy === 'name') {
            sortedCategories.sort();
        }

        // Create sorted result maintaining order
        const result: any = {};
        sortedCategories.forEach(cat => {
            result[cat] = grouped[cat];
        });
        return result;
    }, [services, searchQuery, sortBy]);

    const changeView = (mode: ViewMode) => {
        setViewMode(mode);
        localStorage.setItem('dashboard-view', mode);
    };

    if (loading) return (
        <div className="p-8 text-center text-slate-500">
            <div className="text-lg font-semibold">Loading Infrastructure Services...</div>
        </div>
    );

    const categories = Object.keys(groupedServices);
    const filteredServices = categories.reduce((sum, cat) => sum + groupedServices[cat].length, 0);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header and Controls */}
            <div className="mb-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Services</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {filteredServices > 0 
                                ? `${filteredServices} service${filteredServices !== 1 ? 's' : ''} available for your roles`
                                : `No services match your search`
                            }
                        </p>
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
                                    title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} view`}
                                    className={`p-2 rounded transition-colors ${viewMode === mode ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {mode === 'grid' && <LayoutGrid size={20} />}
                                    {mode === 'list' && <List size={20} />}
                                    {mode === 'compact' && <AlignJustify size={20} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sort options */}
                <div className="flex items-center gap-2">
                    <ArrowUpDown size={16} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase">Sort by:</span>
                    <div className="flex gap-2">
                        {(['category', 'name'] as SortBy[]).map((option) => (
                            <button
                                key={option}
                                onClick={() => setSortBy(option)}
                                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                                    sortBy === option
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grouped Services Display */}
            {categories.length > 0 ? (
                <div className="space-y-12">
                    {categories.map(category => {
                        const colors = getCategoryColors(category);
                        const catServices = groupedServices[category];
                        return (
                            <section key={category} className={`${colors.bg} border-2 ${colors.border} rounded-xl p-8`}>
                                <div className="flex items-center gap-4 mb-8">
                                    <div>
                                        <h2 className={`text-lg font-bold uppercase tracking-wider ${colors.text}`}>
                                            {category}
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {catServices.length} service{catServices.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
                                </div>
                                
                                <div className={`grid gap-6 ${
                                    viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                                }`}>
                                    {catServices.map((service: any) => (
                                        <ServiceCard 
                                            key={service.id} 
                                            service={service} 
                                            viewMode={viewMode} 
                                        />
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-20 text-center">
                    <Search size={48} className="text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">No services found</h3>
                    <p className="text-slate-500 mt-2">Check your spelling or try a different category.</p>
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}