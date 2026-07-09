'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useSubscription } from '@/app/hooks/useSubscription';
import {
  QuestionMarkCircleIcon,
  HomeIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  UsersIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { UserButton } from '@clerk/nextjs';

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const profile = useQuery(api.profiles.getProfile);
  const { isActive: hasSubscription } = useSubscription();
  const isCaregiver = profile?.role === 'caregiver';

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-24 flex-col border-r border-border bg-surface md:flex">
      <Link href="/" aria-label="SayIt! home" className="flex h-20 items-center justify-center">
        <Image src="/icons/app-icon.png" alt="" width={36} height={36} priority />
      </Link>

      <nav aria-label="Primary navigation" className="flex-1 space-y-2 px-2 py-2">
        <SidebarItem
          href="/"
          icon={<HomeIcon className="h-6 w-6" />}
          title="Home"
          isActive={pathname === '/'}
        />

        {user && isCaregiver && (
          <SidebarItem
            href="/dashboard"
            icon={
              <span className="relative">
                <UsersIcon className="h-6 w-6" />
                {!hasSubscription && (
                  <LockClosedIcon className="absolute -bottom-1 -right-1 h-3 w-3 text-text-tertiary" />
                )}
              </span>
            }
            title={hasSubscription ? 'Clients' : 'Clients (Pro)'}
            isActive={pathname?.startsWith('/dashboard') ?? false}
          />
        )}

        {user && (
          <SidebarItem
            href="/settings"
            icon={<Cog6ToothIcon className="h-6 w-6" />}
            title="Settings"
            isActive={pathname === '/settings'}
          />
        )}

        <SidebarItem
          href="/support"
          icon={<QuestionMarkCircleIcon className="h-6 w-6" />}
          title="Support"
          isActive={pathname === '/support'}
        />
      </nav>

      <div className="flex min-h-20 flex-col items-center justify-center gap-1 px-2 py-3 text-xs text-text-secondary">
        {user ? (
          <>
            <UserButton
              appearance={{ elements: { avatarBox: 'h-9 w-9 rounded-full' } }}
            />
            <span>Account</span>
          </>
        ) : (
          <SidebarItem
            href="/sign-in"
            icon={<ArrowRightStartOnRectangleIcon className="h-6 w-6" />}
            title="Sign in"
            isActive={pathname?.startsWith('/sign-in') ?? false}
            compact
          />
        )}
      </div>
    </aside>
  );
}

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  compact?: boolean;
}

function SidebarItem({ href, icon, title, isActive, compact = false }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={`relative flex min-h-[60px] w-full flex-col items-center justify-center gap-1 rounded-[var(--radius-control)] px-1 py-2 text-center transition-colors duration-[var(--motion-duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        isActive
          ? 'bg-[var(--accent-surface)] text-[var(--accent-foreground)]'
          : 'text-text-secondary hover:bg-surface-hover hover:text-foreground'
      } ${compact ? 'min-w-[72px]' : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {isActive && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary-500" />}
      <span aria-hidden="true">{icon}</span>
      <span className="max-w-full text-[11px] font-medium leading-tight">{title}</span>
    </Link>
  );
}
