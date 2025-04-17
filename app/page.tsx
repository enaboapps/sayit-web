'use client'

import { useAuth } from "./contexts/AuthContext";
import Link from "next/link";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to SayIt!
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        A communication app for everyone
      </p>
      {user ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Type</h2>
            <p className="text-gray-600 mb-4">
              Type messages and communicate with others
            </p>
            <Link
              href="/type"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Start Typing
            </Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Phrases</h2>
            <p className="text-gray-600 mb-4">
              Save and manage your favorite phrases
            </p>
            <Link
              href="/phrases"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              View Phrases
            </Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account</h2>
            <p className="text-gray-600 mb-4">
              Manage your account settings and preferences
            </p>
            <Link
              href="/account"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Account Settings
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get Started</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access all features of SayIt!
          </p>
          <div className="space-x-4">
            <Link
              href="/sign-in"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-block bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
