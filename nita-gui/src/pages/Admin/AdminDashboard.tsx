import { Users, Shield, Server, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const tools = [
    { name: 'User Management', desc: 'Sync LDAP users & assign roles', icon: Users, path: '/admin/users', color: 'bg-blue-500' },
    { name: 'Role Permissions', desc: 'Link services to specific roles', icon: Shield, path: '/admin/roles', color: 'bg-purple-500' },
    { name: 'Service Registry', desc: 'Add/Edit dashboard service cards', icon: Server, path: '/admin/services', color: 'bg-green-500' },
    { name: 'Audit Logs', desc: 'View system activity logs', icon: Activity, path: '/admin/logs', color: 'bg-amber-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">System Administration</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tools.map((tool) => (
          <Link key={tool.path} to={tool.path} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all group">
            <div className={`${tool.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4`}>
              <tool.icon size={24} />
            </div>
            <h3 className="font-bold text-lg group-hover:text-blue-600">{tool.name}</h3>
            <p className="text-gray-500 text-sm mt-1">{tool.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}