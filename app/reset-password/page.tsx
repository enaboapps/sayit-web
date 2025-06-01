'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/auth';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await authService.sendPasswordResetEmail(email);
      setSuccess(true);
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto p-4 pt-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Reset Password</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          {success ? (
            <div className="text-center">
              <p className="text-green-600 dark:text-green-400 mb-6">
              Password reset email sent! Please check your inbox.
              </p>
              <Button
                asChild
              >
                <Link href="/sign-in" className="w-full">
                Back to Sign In
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                id="email"
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                Remember your password?{' '}
                  <Link
                    href="/sign-in"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                  >
                  Sign in
                  </Link>
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                size="lg"
              >
              Send Reset Link
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
