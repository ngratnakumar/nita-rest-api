import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Activity, Clock, User as UserIcon, Info } from 'lucide-react';

interface AuditLog {
    id: number;
    action: string;
    details: string;
    created_at: string;
    user: { username: string };
}

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/logs')
            .then(res => {
                setLogs(res.data.data || res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const getActionColor = (action: string) => {
        if (action.includes('delete')) return 'text-red-600 bg-red-50';
        if (action.includes('create') || action.includes('sync')) return 'text-green-600 bg-green-50';
        return 'text-blue-600 bg-blue-50';
    };

    if (loading) return <div className="p-10 text-center">Loading Audit Logs...</div>;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">System Audit Trail</h1>
                    <p className="text-gray-500">History of all administrative actions.</p>
                </div>
                <Activity className="text-gray-300" size={40} />
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                        <tr>
                            <th className="p-4">Time</th>
                            <th className="p-4">Admin</th>
                            <th className="p-4">Action</th>
                            <th className="p-4">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50/50">
                                <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                                    <div className="flex items-center gap-2"><Clock size={14}/> {new Date(log.created_at).toLocaleString()}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 font-medium">
                                        <UserIcon size={14} className="text-gray-400" />
                                        {log.user?.username || 'System'}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getActionColor(log.action)}`}>
                                        {log.action.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-600 italic">
                                    <div className="flex items-start gap-2"><Info size={14} className="mt-1 flex-shrink-0 text-gray-300"/> {log.details}</div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}