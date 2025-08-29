import { Button, PasswordInput } from "@/components/common";
import { useAuth } from "@/contexts/auth-context/index";
import { Lock } from "lucide-react";
import React, { useState } from "react";

interface AdminAuthProps {
  onAuthenticated: () => void;
}

export const AdminAuth: React.FC<AdminAuthProps> = ({ onAuthenticated }) => {
  const { login, isLoading, error } = useAuth();
  const [password, setPassword] = useState("");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(password);
    if (success) {
      onAuthenticated();
    }
  };

  return (
    <div className="min-h-screen bg-blue-50/30 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <Lock className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Survey Admin Access
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Enter admin password to continue</p>
        </div>

        <form onSubmit={handlePasswordSubmit}>
          <input
            type="text"
            name="username"
            value="admin"
            autoComplete="username"
            style={{ display: "none" }}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
          />
          <PasswordInput
            name="adminPassword"
            label="Admin Password"
            value={password}
            onChange={(value) => setPassword(value)}
            placeholder="Enter admin password"
            required
            autocomplete="current-password"
          />

          {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>}

          <div className="mt-6 flex gap-3">
            <Button type="submit" className="flex-1" loading={isLoading}>
              Login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
