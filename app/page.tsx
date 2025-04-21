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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto px-4">
          <Link
            href="/phrases"
            className="group bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 text-gray-900"
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 group-hover:text-gray-700 transition-colors">Phrases</h2>
              <p className="text-gray-600 mb-6">
                Access your saved phrases and boards
              </p>
              <div className="inline-block bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transform hover:-translate-y-0.5 transition-all duration-200">
                View Phrases
              </div>
            </div>
          </Link>
          <Link
            href="/account"
            className="group bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 text-gray-900"
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 group-hover:text-gray-700 transition-colors">Account</h2>
              <p className="text-gray-600 mb-6">
                Manage your account settings and preferences
              </p>
              <div className="inline-block bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transform hover:-translate-y-0.5 transition-all duration-200">
                Account Settings
              </div>
            </div>
          </Link>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md mx-auto border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get Started</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access all features of SayIt!
          </p>
          <div className="space-x-4">
            <Link
              href="/sign-in"
              className="inline-block bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-block bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
