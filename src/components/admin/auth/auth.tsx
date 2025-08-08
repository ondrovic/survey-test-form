import { Button, PasswordInput } from '@/components/common';
import { useAuth } from '@/contexts/auth-context/index';
import { Lock } from 'lucide-react';
import React, { useState } from 'react';

interface AdminAuthProps {
    onAuthenticated: () => void;
}

export const AdminAuth: React.FC<AdminAuthProps> = ({ onAuthenticated }) => {
    const { login, isLoading, error } = useAuth();
    const [password, setPassword] = useState('');

    console.log("🔐 AdminAuth - Component rendered:", { isLoading, error });

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("🔐 AdminAuth - Password submit attempted");
        const success = await login(password);
        console.log("🔐 AdminAuth - Login result:", { success });
        if (success) {
            console.log("🔐 AdminAuth - Login successful, calling onAuthenticated");
            onAuthenticated();
        }
    };



    return (
        <div className="min-h-screen bg-amber-50/30 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <div className="text-center mb-6">
                    <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
                    <p className="text-gray-600 mt-2">Enter admin password to continue</p>
                </div>

                <form onSubmit={handlePasswordSubmit}>
                    <PasswordInput
                        name="adminPassword"
                        label="Admin Password"
                        value={password}
                        onChange={(value) => setPassword(value)}
                        placeholder="Enter admin password"
                        required
                        autocomplete="current-password"
                    />

                    {error && (
                        <p className="text-red-500 text-sm mt-2">{error}</p>
                    )}

                    <div className="mt-6 flex gap-3">
                        <Button
                            type="submit"
                            className="flex-1"
                            loading={isLoading}
                        >
                            Access Admin Panel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};