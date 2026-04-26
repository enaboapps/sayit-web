'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import Composer from '@/app/components/composer';
import { useTTS } from '@/lib/hooks/useTTS';

export default function GuestCommunication() {
  const [text, setText] = useState('');
  const router = useRouter();
  const tts = useTTS();

  return (
    <section className="flex flex-col items-center w-full max-w-2xl mx-auto px-4 pt-10 pb-6 gap-8">
      <div className="flex flex-col items-center gap-2 w-full">
        <Button
          onClick={() => router.push('/sign-in')}
          size="lg"
          className="w-full max-w-xs"
        >
          Sign In
        </Button>
        <Link
          href="/sign-up"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Create Account
        </Link>
      </div>

      <div className="w-full">
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
      </div>
    </section>
  );
}
