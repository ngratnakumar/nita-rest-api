import { useEffect, useState } from 'react';
import api from '../api/axios';
import ServiceCard from '../components/ServiceCard';

export default function Dashboard() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch services assigned to the logged-in user
        api.get('/services') // This hits your route: Route::get('/services', fn() => response()->json(Service::all()));
            .then(res => {
                setServices(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading Services...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Your Services</h1>
            {services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {services.map(service => (
                        <ServiceCard key={service.id} service={service} />
                    ))}
                </div>
            ) : (
                <div className="text-gray-500">No services assigned to your role yet.</div>
            )}
        </div>
    );
}