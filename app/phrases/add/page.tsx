'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Symbol } from '@/lib/models/Symbol'
import SymbolModal from '@/app/components/symbols/SymbolModal'
import { phraseStore } from '@/lib/stores/phraseStore'
import { useAuth } from '@/lib/hooks/useAuth'

export default function AddPhrasePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const boardId = searchParams.get('boardId')
  const [text, setText] = useState('')
  const [symbol, setSymbol] = useState<Symbol | null>(null)
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const addPhrase = phraseStore((state) => state.addPhrase)
  const user = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !boardId) return

    setLoading(true)
    setError(null)
    try {
      await addPhrase({
        userId: user.user?.uid || '',
        text,
        symbol: symbol?.id ? parseInt(symbol.id) : null
      }, boardId, symbol?.url ?? null)
      router.back()
    } catch (err) {
      setError('Failed to create phrase')
      console.error('Error creating phrase:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Add New Phrase</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-4">
            <label htmlFor="text" className="block text-gray-700 text-sm font-bold mb-2">
              Phrase Text
            </label>
            <input
              type="text"
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
              placeholder="Enter your phrase"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Symbol
            </label>
            <button
              type="button"
              onClick={() => setIsSymbolModalOpen(true)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-base hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
            >
              {symbol ? `Symbol ${symbol.id} selected` : 'Select a symbol'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !boardId}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Phrase'}
          </button>

          {error && (
            <div className="mt-4 text-red-600 text-sm">
              {error}
            </div>
          )}
        </form>

        <SymbolModal
          isOpen={isSymbolModalOpen}
          onClose={() => setIsSymbolModalOpen(false)}
          onSymbolSelect={setSymbol}
        />
      </div>
    </div>
  )
} 