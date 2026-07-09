'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useSubscription } from '@/app/hooks/useSubscription';
import { motion } from 'framer-motion';
import {
  HomeIcon as HomeOutline,
  PlusCircleIcon as PlusOutline,
  Cog6ToothIcon as SettingsOutline,
  UserCircleIcon as ProfileOutline,
  UsersIcon as UsersOutline,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  PlusCircleIcon as PlusSolid,
  Cog6ToothIcon as SettingsSolid,
  UserCircleIcon as ProfileSolid,
  UsersIcon as UsersSolid,
} from '@heroicons/react/24/solid';

interface TabItem {
  href: string;
  label: string;
  iconOutline: React.ReactNode;
  iconSolid: React.ReactNode;
  matchPaths?: string[];
  showLock?: boolean;
}

const homeTab: TabItem = {
  href: '/',
  label: 'Home',
  iconOutline: <HomeOutline className="w-6 h-6" />,
  iconSolid: <HomeSolid className="w-6 h-6" />,
  matchPaths: ['/', '/phrases'],
};

const newTab: TabItem = {
  href: '/phrases/add',
  label: 'New',
  iconOutline: <PlusOutline className="w-6 h-6" />,
  iconSolid: <PlusSolid className="w-6 h-6" />,
  matchPaths: ['/phrases/add'],
};

const settingsTab: TabItem = {
  href: '/settings',
  label: 'Settings',
  iconOutline: <SettingsOutline className="w-6 h-6" />,
  iconSolid: <SettingsSolid className="w-6 h-6" />,
  matchPaths: ['/settings'],
};

const profileTab: TabItem = {
  href: '/sign-in',
  label: 'Profile',
  iconOutline: <ProfileOutline className="w-6 h-6" />,
  iconSolid: <ProfileSolid className="w-6 h-6" />,
  matchPaths: ['/sign-in', '/sign-up'],
};

export default function BottomTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const profile = useQuery(api.profiles.getProfile);
  const { isActive: hasSubscription } = useSubscription();
  const isCaregiver = profile?.role === 'caregiver';

  // Build tabs dynamically based on user state
  const tabs: TabItem[] = [
    homeTab,
    // Only show New and Settings when logged in
    ...(user ? [newTab] : []),
    // Add Clients tab for caregivers (between New and Settings)
    ...(isCaregiver ? [{
      href: '/dashboard',
      label: 'Clients',
      iconOutline: <UsersOutline className="w-6 h-6" />,
      iconSolid: <UsersSolid className="w-6 h-6" />,
      matchPaths: ['/dashboard'],
      showLock: !hasSubscription,
    }] : []),
    ...(user ? [settingsTab] : []),
    // Show Profile tab only when not logged in
    ...(!user ? [profileTab] : []),
  ];

  const isActive = (tab: TabItem) => {
    if (tab.matchPaths) {
      return tab.matchPaths.some(path =>
        path === '/' ? pathname === '/' : pathname?.startsWith(path)
      );
    }
    return pathname === tab.href;
  };

  return (
    <nav aria-label="Bottom navigation" className="border-t border-border bg-surface shadow-[var(--shadow-card)]">
      {/* Safe area padding for notched devices */}
      <div className="flex justify-around items-center px-2 pb-safe">
        {tabs.map((tab) => {
          const active = isActive(tab);

          return (
            <Link
              key={tab.label}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[56px] min-w-[64px] flex-col items-center justify-center rounded-[var(--radius-control)] px-3 py-2 transition-colors duration-[var(--motion-duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                active
                  ? 'bg-primary-950 text-primary-300'
                  : 'text-text-tertiary hover:bg-surface-hover hover:text-text-secondary'
              }`}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                {active ? tab.iconSolid : tab.iconOutline}
                {tab.showLock && (
                  <LockClosedIcon className="w-3 h-3 absolute -top-1 -right-1 text-text-tertiary" />
                )}
              </motion.div>
              <span className={`text-xs mt-1 font-medium ${
                active ? 'opacity-100' : 'opacity-70'
              }`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
