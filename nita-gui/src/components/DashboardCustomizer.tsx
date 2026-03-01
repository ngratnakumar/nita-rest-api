import { X, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ServiceWidget {
    id: number;
    name: string;
    visible: boolean;
}

interface DashboardCustomizerProps {
    isOpen: boolean;
    onClose: () => void;
    services: ServiceWidget[];
    onSave: (visibleServices: number[]) => void;
}

export default function DashboardCustomizer({
    isOpen,
    onClose,
    services,
    onSave
}: DashboardCustomizerProps) {
    const [localServices, setLocalServices] = useState<ServiceWidget[]>(services);

    useEffect(() => {
        setLocalServices(services);
    }, [services]);

    const handleToggleVisibility = (id: number) => {
        setLocalServices(prev =>
            prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s)
        );
    };

    const handleSave = () => {
        const visibleIds = localServices
            .filter(s => s.visible)
            .map(s => s.id);
        localStorage.setItem('customized-services', JSON.stringify(visibleIds));
        onSave(visibleIds);
        onClose();
    };

    const handleReset = () => {
        const resetServices = localServices.map(s => ({ ...s, visible: true }));
        setLocalServices(resetServices);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            Customize Dashboard
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-3">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Toggle services on/off to customize your dashboard view
                        </p>

                        {localServices.map(service => (
                            <div
                                key={service.id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                            >
                                <GripVertical
                                    size={18}
                                    className="text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
                                />

                                <button
                                    onClick={() => handleToggleVisibility(service.id)}
                                    className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                                        service.visible
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                                    }`}
                                >
                                    {service.visible ? (
                                        <Eye size={18} />
                                    ) : (
                                        <EyeOff size={18} />
                                    )}
                                </button>

                                <span className={`flex-1 font-medium ${
                                    service.visible
                                        ? 'text-slate-900 dark:text-slate-100'
                                        : 'text-slate-500 dark:text-slate-500'
                                }`}>
                                    {service.name}
                                </span>

                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    service.visible
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}>
                                    {service.visible ? 'Visible' : 'Hidden'}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3">
                        <button
                            onClick={handleReset}
                            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Reset All
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
