'use client'

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-white shadow-lg z-50">
      <div className="p-4 border-b border-gray-200 flex justify-center">
        <h2 className="text-xl font-semibold text-gray-800">S</h2>
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
              href="/phrases"
              className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                pathname === '/phrases'
                  ? 'bg-gray-50 text-gray-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Phrases"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </Link>

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