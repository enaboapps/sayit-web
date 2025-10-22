'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';

export default function ResetPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in after 5 seconds
    const timeout = setTimeout(() => {
      router.push('/sign-in');
    }, 5000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto p-8">
        <div className="bg-surface rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Password Reset</h1>
          <p className="text-text-secondary mb-6">
            Password reset is now handled through our sign-in page.
            Click "Forgot password?" on the sign-in screen to reset your password.
          </p>
          <p className="text-text-tertiary text-sm mb-6">
            You will be redirected automatically in 5 seconds...
          </p>
          <Button asChild size="lg">
            <Link href="/sign-in">
              Go to Sign In
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
