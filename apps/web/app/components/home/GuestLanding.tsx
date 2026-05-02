'use client';

import Hero from '@/app/components/home/landing/Hero';
import ValueCallouts from '@/app/components/home/landing/ValueCallouts';
import TryWithoutSigningInLink from '@/app/components/home/landing/TryWithoutSigningInLink';
import LandingFooter from '@/app/components/home/landing/LandingFooter';

export default function GuestLanding() {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 md:px-12 py-16 md:py-24 flex flex-col gap-12">
      <Hero />
      <TryWithoutSigningInLink />
      <div className="border-t border-border" aria-hidden="true" />
      <ValueCallouts />
      <LandingFooter />
    </div>
  );
}
