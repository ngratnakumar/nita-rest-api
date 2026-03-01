import React, { useState } from 'react';
import api from '../api/axios';
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const ProfileSettings = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (newPassword !== newPasswordConfirm) {
            setError('New passwords do not match.');
            return;
        }

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters long.');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: newPasswordConfirm
            });

            setSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setNewPasswordConfirm('');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to change password.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-2xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Profile Settings</h1>
                    <p className="text-slate-500 mt-2">Manage your account and change your password.</p>
                </header>

                {/* User Info Section */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Account Information</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-semibold text-slate-600">Full Name</label>
                            <p className="text-slate-900 font-medium">{user.name || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-600">Username</label>
                            <p className="text-slate-900 font-medium">{user.username || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-600">Email</label>
                            <p className="text-slate-900 font-medium">{user.email || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Change Password Section */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Lock size={20} className="text-blue-600" />
                        <h2 className="text-lg font-bold text-slate-800">Change Password</h2>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg flex items-start gap-3">
                            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-semibold text-red-900">Error</div>
                                <div className="text-sm text-red-700 mt-0.5">{error}</div>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 border border-emerald-200 bg-emerald-50 rounded-lg flex items-start gap-3">
                            <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-semibold text-emerald-900">Success</div>
                                <div className="text-sm text-emerald-700 mt-0.5">{success}</div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-5">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    placeholder="Enter your current password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    disabled={loading}
                                    required
                                    className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-100"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('current')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                >
                                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    placeholder="Enter your new password (min 8 characters)"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={loading}
                                    required
                                    className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-100"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('new')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                >
                                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm New Password */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    placeholder="Confirm your new password"
                                    value={newPasswordConfirm}
                                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                    disabled={loading}
                                    required
                                    className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-100"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                >
                                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Password Requirements */}
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs font-semibold text-slate-600 mb-2">Password Requirements:</p>
                            <ul className="text-xs text-slate-600 space-y-1">
                                <li>• At least 8 characters long</li>
                                <li>• New passwords must match in both fields</li>
                            </ul>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Updating Password...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
