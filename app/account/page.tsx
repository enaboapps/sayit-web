'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { useAuth } from '../contexts/AuthContext';

export default function AccountPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignOut = async () => {
    setError(null);
    setSuccess(null);

    try {
      await authService.signOut();
      router.push('/');
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setSuccess(null);

    if (!user?.email) return;

    try {
      await authService.sendPasswordResetEmail(user.email);
      setSuccess('Password reset email sent! Please check your inbox.');
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Account Settings</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Email</h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900">Password</h2>
            <p className="text-gray-600 mb-2">
              Change your password to keep your account secure.
            </p>
            <button
              onClick={handleResetPassword}
              className="text-gray-600 hover:text-gray-800"
            >
              Reset Password
            </button>
          </div>

          {error && (
            <div className="text-red-600">{error}</div>
          )}

          {success && (
            <div className="text-green-600">{success}</div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
