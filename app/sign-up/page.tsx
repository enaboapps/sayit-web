'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/auth';
import Input from '@/app/components/ui/Input';

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
    <div className="max-w-md mx-auto p-4 pt-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Account</h1>
      <div className="bg-white rounded-xl shadow-lg p-8">
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
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/sign-in"
                className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transform hover:-translate-y-0.5 transition-all duration-200 font-medium"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}
