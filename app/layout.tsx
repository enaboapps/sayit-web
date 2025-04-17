'use client'

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

function Navigation() {
  const { user } = useAuth();

  return (
    <nav className="flex space-x-4">
      <Link href="/" className="text-gray-600 hover:text-gray-900">
        Home
      </Link>
      {user ? (
        <>
          <Link href="/type" className="text-gray-600 hover:text-gray-900">
            Type
          </Link>
          <Link href="/phrases" className="text-gray-600 hover:text-gray-900">
            Phrases
          </Link>
          <Link href="/account" className="text-gray-600 hover:text-gray-900">
            Account
          </Link>
        </>
      ) : (
        <Link href="/sign-in" className="text-gray-600 hover:text-gray-900">
          Sign In
        </Link>
      )}
    </nav>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold text-gray-900">SayIt!</h1>
                  <Navigation />
                </div>
              </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
