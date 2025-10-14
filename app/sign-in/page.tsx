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
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto p-4 pt-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Sign In</h1>
        <div className="bg-surface rounded-xl shadow-lg p-8">
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
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <div className="flex items-center justify-between">
              <Link
                href="/reset-password"
                className="text-sm text-text-secondary hover:text-foreground transition-colors duration-200"
              >
              Forgot password?
              </Link>
              <Link
                href="/sign-up"
                className="text-sm text-text-secondary hover:text-foreground transition-colors duration-200"
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
