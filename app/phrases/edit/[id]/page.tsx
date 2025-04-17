'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/app/contexts/AuthContext'
import { Phrase } from '@/app/lib/models/Phrase'
import phraseStore from '@/app/lib/stores/PhraseStore'
import { use } from 'react'

export default function EditPhrasePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [phrase, setPhrase] = useState<Phrase | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const boardId = searchParams.get('boardId')

  useEffect(() => {
    if (!user) {
      router.push('/sign-in')
      return
    }
    if (!boardId) {
      router.push('/phrases')
      return
    }

    const fetchPhrase = async () => {
      try {
        const fetchedPhrase = await phraseStore.getPhrase(user.uid, boardId, resolvedParams.id)
        setPhrase(fetchedPhrase)
        setText(fetchedPhrase.text)
      } catch (error) {
        console.error('Error fetching phrase:', error)
        setError('Failed to load phrase')
      } finally {
        setLoading(false)
      }
    }

    fetchPhrase()
  }, [resolvedParams.id, user, boardId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !boardId || !phrase) return

    setSaving(true)
    setError(null)

    try {
      await phraseStore.updatePhrase(user.uid, boardId, {
        ...phrase,
        text
      })
      router.push('/phrases')
    } catch (error) {
      console.error('Error updating phrase:', error)
      setError('Failed to update phrase')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !boardId || !phrase) return

    setDeleting(true)
    setError(null)

    try {
      await phraseStore.deletePhrase(user.uid, boardId, phrase.id)
      router.push('/phrases')
    } catch (error) {
      console.error('Error deleting phrase:', error)
      setError('Failed to delete phrase')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!phrase) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-600">Phrase not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/phrases')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Phrases
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Edit Phrase</h1>
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

          {error && (
            <div className="mb-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center text-red-600 hover:text-red-700 transition-colors duration-200"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              {deleting ? 'Deleting...' : 'Delete Phrase'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transform hover:-translate-y-0.5 transition-all duration-200 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 