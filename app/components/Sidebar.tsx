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
    <div className="fixed left-0 top-0 h-full w-16 bg-white z-50">
      <div className="p-4 border-b border-gray-200 flex justify-center">
        <Image src="/icons/app-icon.png" alt="Logo" width={32} height={32} />
      </div>

      <nav className="p-4 space-y-4">
        <SidebarItem
          href="/"
          icon={<HomeIcon />}
          title="Home"
          isActive={pathname === '/'}
        />

        {user ? (
          <>
            <SidebarItem
              href="/account"
              icon={<UserIcon />}
              title="Account"
              isActive={pathname === '/account'}
            />

            <SidebarItem
              href="/settings"
              icon={<Cog6ToothIcon />}
              title="Settings"
              isActive={pathname === '/settings'}
            />
          </>
        ) : (
          <SidebarItem
            href="/sign-in"
            icon={<ArrowRightStartOnRectangleIcon />}
            title="Sign In"
            isActive={pathname === '/sign-in'}
          />
        )}

        <SidebarItem
          href="/support"
          icon={<QuestionMarkCircleIcon />}
          title="Support"
          isActive={pathname === '/support'}
        />
      </nav>
    </div>
  );
}

function SidebarItem({ href, icon, title, isActive }: { href: string; icon: React.ReactNode; title: string; isActive: boolean }) {
  return (
    <>
      <Link href={href} className={`flex items-center justify-center p-2 rounded-md transition-colors ${isActive ? 'bg-gray-50 text-gray-600' : 'text-gray-700 hover:bg-gray-100'}`} title={title} data-tooltip-id={title}>
        <div className="w-6 h-6 flex items-center justify-center">
          {icon}
        </div>
      </Link>
      <Tooltip
        id={title}
        place="right"
      >
        {title}
      </Tooltip>
    </>
  );
}