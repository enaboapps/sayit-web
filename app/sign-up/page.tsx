'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/auth';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!authService.isPasswordStrongEnough(password)) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    try {
      await authService.signUp(email, password);
      router.push('/');
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto p-4 pt-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Create Account</h1>
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
            <Input
              id="confirmPassword"
              type="password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <div className="text-xs text-text-secondary mt-4">
            By creating an account, you agree to our{' '}
              <Link href="/privacy" className="text-text-secondary hover:underline">
              Privacy Policy
              </Link>
            </div>
            <div className="text-center">
              <p className="text-sm text-text-secondary">
              Already have an account?{' '}
                <Link
                  href="/sign-in"
                  className="text-text-secondary hover:text-foreground transition-colors duration-200"
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
            Create Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
