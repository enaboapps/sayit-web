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
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Reset Password</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        {success ? (
          <div className="text-center">
            <p className="text-green-600 mb-4">
              Password reset email sent! Please check your inbox.
            </p>
            <Link
              href="/sign-in"
              className="text-blue-600 hover:text-blue-800"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="text-blue-600 hover:text-blue-800"
                >
                  Sign in
                </Link>
              </p>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Send Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  )
} 