'use client'

import { useState } from 'react'
import Link from 'next/link'
import Auth from '../lib/auth'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const result = await Auth.sendPasswordResetEmail(email)
    if (result === null) {
      setSuccess(true)
    } else {
      setError(result)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Reset Password</h1>
      <div className="bg-white rounded-xl shadow-lg p-8">
        {success ? (
          <div className="text-center">
            <p className="text-green-600 mb-6">
              Password reset email sent! Please check your inbox.
            </p>
            <Link
              href="/sign-in"
              className="inline-block bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transform hover:-translate-y-0.5 transition-all duration-200 font-medium"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link
                  href="/sign-in"
                  className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transform hover:-translate-y-0.5 transition-all duration-200 font-medium"
            >
              Send Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  )
} 