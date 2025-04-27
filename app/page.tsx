'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import AnimatedLoading from '@/app/components/phrases/AnimatedLoading';
import HomeFeatures from '@/app/components/home/HomeFeatures';
import PhrasesInterface from '@/app/components/home/PhrasesInterface';

export default function Home() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <AnimatedLoading />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {!user ? (
        <HomeFeatures />
      ) : (
        <PhrasesInterface />
      )}
    </div>
  );
}
