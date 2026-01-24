'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useSubscription } from '@/app/hooks/useSubscription';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isActive = (tab: TabItem) => {
    if (tab.matchPaths) {
      return tab.matchPaths.some(path =>
        path === '/' ? pathname === '/' : pathname?.startsWith(path)
      );
    }
    return pathname === tab.href;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ duration: 0.2 }}
        >
          <div className="border-t border-border shadow-2xl" style={{ backgroundColor: '#242424' }}>
            {/* Safe area padding for notched devices */}
            <div className="flex justify-around items-center px-2 pb-safe">
              {tabs.map((tab) => {
                const active = isActive(tab);

                return (
                  <Link
                    key={tab.label}
                    href={tab.href}
                    className={`flex flex-col items-center justify-center min-w-[64px] min-h-[56px] py-2 px-3 rounded-2xl transition-all duration-200 ${
                      active
                        ? 'text-primary-500'
                        : 'text-text-tertiary hover:text-text-secondary'
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
                      {active && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute -inset-2 bg-surface-hover rounded-2xl -z-10"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
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
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
