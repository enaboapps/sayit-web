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
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';
import { UserButton } from '@clerk/nextjs';

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const profile = useQuery(api.profiles.getProfile);
  const { isActive: hasSubscription } = useSubscription();

  const isCaregiver = profile?.role === 'caregiver';

  return (
    <aside className="fixed left-0 top-0 h-full w-16 bg-surface z-50 shadow-2xl hidden md:flex flex-col">
      <div className="p-4 flex justify-center items-center">
        <div className="rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
          <Image
            src="/icons/app-icon.png"
            alt="Logo"
            width={32}
            height={32}
          />
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-3">
        <SidebarItem
          href="/"
          icon={<HomeIcon className="w-6 h-6" />}
          title="Home"
          isActive={pathname === '/'}
        />

        {user && isCaregiver && (
          <SidebarItem
            href="/dashboard"
            icon={
              hasSubscription ? (
                <UsersIcon className="w-6 h-6" />
              ) : (
                <div className="relative">
                  <UsersIcon className="w-6 h-6" />
                  <LockClosedIcon className="w-3 h-3 absolute -bottom-1 -right-1 text-text-tertiary" />
                </div>
              )
            }
            title={hasSubscription ? 'Clients' : 'Clients (Pro)'}
            isActive={pathname?.startsWith('/dashboard') ?? false}
          />
        )}

        {user && (
          <SidebarItem
            href="/settings"
            icon={<Cog6ToothIcon className="w-6 h-6" />}
            title="Settings"
            isActive={pathname === '/settings'}
          />
        )}

        <SidebarItem
          href="/support"
          icon={<QuestionMarkCircleIcon className="w-6 h-6" />}
          title="Support"
          isActive={pathname === '/support'}
        />
      </nav>

      <div className="p-3 flex items-center justify-center">
        {user ? (
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-10 h-10 rounded-full hover:scale-110 transition-transform duration-300'
              }
            }}
          />
        ) : (
          <Link
            href="/sign-in"
            className="flex items-center justify-center p-2 rounded-3xl transition-all duration-300 shadow-md hover:shadow-xl hover:scale-110 bg-surface-hover text-text-secondary hover:bg-primary-500/10 hover:text-primary-500"
            data-tooltip-id="sidebar-tooltip-sign-in"
            data-tooltip-content="Sign In"
          >
            <ArrowRightStartOnRectangleIcon className="w-6 h-6" />
            <Tooltip
              id="sidebar-tooltip-sign-in"
              place="right"
              className="z-50"
            />
          </Link>
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
}

function SidebarItem({ href, icon, title, isActive }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-center p-2 rounded-3xl transition-all duration-300 shadow-md hover:shadow-xl hover:scale-110 ${
        isActive
          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
          : 'bg-surface-hover text-text-secondary hover:bg-primary-500/10 hover:text-primary-500'
      }`}
      data-tooltip-id={`sidebar-tooltip-${title}`}
      data-tooltip-content={title}
    >
      {icon}
      <Tooltip
        id={`sidebar-tooltip-${title}`}
        place="right"
        className="z-50"
      />
    </Link>
  );
}