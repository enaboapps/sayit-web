'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-white z-50">
      <div className="p-4 border-b border-gray-200 flex justify-center">
        <Image src="/icons/app-icon.png" alt="Logo" width={32} height={32} />
      </div>

      <nav className="p-4 space-y-4">
        <Link
          href="/"
          className={`flex items-center justify-center p-2 rounded-md transition-colors ${
            pathname === '/'
              ? 'bg-gray-50 text-gray-600'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Home"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>

        {user ? (
          <>
            <Link
              href="/account"
              className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                pathname === '/account'
                  ? 'bg-gray-50 text-gray-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Account"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>

            <Link
              href="/settings"
              className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                pathname === '/settings'
                  ? 'bg-gray-50 text-gray-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </>
        ) : (
          <Link
            href="/sign-in"
            className={`flex items-center justify-center p-2 rounded-md transition-colors ${
              pathname === '/sign-in'
                ? 'bg-gray-50 text-gray-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Sign In"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </Link>
        )}
      </nav>
    </div>
  );
}
