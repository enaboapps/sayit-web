'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTTS } from '@/lib/hooks/useTTS';
import AnimatedLoading from '@/app/components/phrases/AnimatedLoading';
import Composer from '@/app/components/composer';
import { Button } from '@/app/components/ui/Button';

export default function TryPage() {
  const { user, loading: authLoading } = useAuth();
  const profile = useQuery(api.profiles.getProfile);
  const isProfileLoading = !!user && profile === undefined;
  const isStartupPending = authLoading || isProfileLoading;

  const router = useRouter();
  const tts = useTTS();
  const [text, setText] = useState('');

  // Signed-in users belong on /, not on the no-signin tryout. Use replace so
  // back doesn't trap them here.
  useEffect(() => {
    if (!isStartupPending && user) {
      router.replace('/');
    }
  }, [isStartupPending, user, router]);

  if (isStartupPending || user) {
    return <AnimatedLoading />;
  }

  return (
    <div data-testid="try-layout" className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col overflow-hidden bg-background">
      <section className="flex w-full shrink-0 flex-col gap-4 px-4 pb-4 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-8">
        <div className="min-w-0 sm:flex-1">
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">
            Try without signing in
          </h1>
          <p className="mt-1 text-sm text-text-secondary max-w-xl">
            Saved boards, writing help, and premium voices need an account.
          </p>
        </div>
        <Button asChild size="default" className="w-full shrink-0 sm:w-auto">
          <Link href="/sign-up">Create account</Link>
        </Button>
      </section>

      <section data-testid="try-composer-region" className="flex min-h-0 w-full flex-1 px-3 pb-3 sm:px-6 sm:pb-6">
        <Composer
          text={text}
          onChange={setText}
          onSpeak={() => {
            if (!text.trim()) return;
            tts.speak(text);
          }}
          onStop={tts.stop}
          isSpeaking={tts.isSpeaking}
          isAvailable={tts.isAvailable}
          className="min-h-0 flex-1"
        />
      </section>
    </div>
  );
}
