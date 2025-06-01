'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/auth';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await authService.signIn(email, password);
      router.push('/');
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto p-4 pt-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Sign In</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
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
            <Input
              id="password"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
            )}
            <div className="flex items-center justify-between">
              <Link
                href="/reset-password"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              >
              Forgot password?
              </Link>
              <Link
                href="/sign-up"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              >
              Create an account
              </Link>
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
            >
            Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
