'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import {
  QuestionMarkCircleIcon,
  HomeIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon
} from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-16 bg-surface z-50 shadow-2xl flex flex-col">
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

        {user ? (
          <>
            <SidebarItem
              href="/account"
              icon={<UserIcon className="w-6 h-6" />}
              title="Account"
              isActive={pathname === '/account'}
            />

            <SidebarItem
              href="/settings"
              icon={<Cog6ToothIcon className="w-6 h-6" />}
              title="Settings"
              isActive={pathname === '/settings'}
            />
          </>
        ) : (
          <SidebarItem
            href="/sign-in"
            icon={<ArrowRightStartOnRectangleIcon className="w-6 h-6" />}
            title="Sign In"
            isActive={pathname === '/sign-in'}
          />
        )}

        <SidebarItem
          href="/support"
          icon={<QuestionMarkCircleIcon className="w-6 h-6" />}
          title="Support"
          isActive={pathname === '/support'}
        />
      </nav>
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