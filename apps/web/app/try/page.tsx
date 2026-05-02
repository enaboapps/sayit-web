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
    <div className="flex flex-col bg-background min-h-screen">
      <section className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">
            Try without signing in
          </h1>
          <p className="mt-1 text-sm text-text-secondary max-w-xl">
            Saved boards, writing help, and premium voices need an account.
          </p>
        </div>
        <Button asChild size="default" className="shrink-0">
          <Link href="/sign-up">Create account</Link>
        </Button>
      </section>

      <section className="w-full max-w-3xl mx-auto px-4 sm:px-6 pb-8 flex-1">
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
        />
      </section>
    </div>
  );
}
