'use client'

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import FlyoutMenu from "./components/FlyoutMenu";
import AnimatedBackground from "./components/AnimatedBackground";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AnimatedBackground />
          <div className="min-h-screen">
            <header className="bg-white shadow">
              <div className="px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold text-gray-900">SayIt!</h1>
                  <FlyoutMenu />
                </div>
              </div>
            </header>
            <main className="px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
