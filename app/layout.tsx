'use client'

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import Sidebar from "./components/Sidebar";
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
          <div className="min-h-screen flex">
            <Sidebar />
            <div className="flex-1 pl-16">
              <main className="px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
