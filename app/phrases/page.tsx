'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Phrase } from '@/lib/models/Phrase'
import { PhraseBoard } from '@/lib/models/PhraseBoard'
import { phraseStore } from '@/lib/stores/phraseStore'
import PhraseTile from '@/app/components/phrases/PhraseTile'
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon } from '@heroicons/react/24/outline'

export default function PhrasesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [boards, setBoards] = useState<PhraseBoard[]>([])
  const [selectedBoard, setSelectedBoard] = useState<PhraseBoard | null>(null)
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    console.log('Auth state changed:', { user, authLoading })
    
    if (authLoading) {
      console.log('Auth is still loading...')
      return
    }

    if (!user) {
      console.log('No user found, redirecting to login...')
      // TODO: Redirect to login page
      return
    }

    console.log('Fetching phrase boards for user:', user.uid)
    phraseStore.getState().fetchBoards(user.uid)
      .then(() => {
        const boards = phraseStore.getState().boards
        setBoards(boards)
        if (boards.length > 0) {
          setSelectedBoard(boards[0])
        }
        setLoading(false)
      })
      .catch((err: Error) => {
        console.error('Error fetching boards:', err)
        setError('Failed to load phrase boards')
        setLoading(false)
      })
  }, [user])

  useEffect(() => {
    if (!user || !selectedBoard) return

    console.log('Fetching phrases for board:', selectedBoard.id)
    phraseStore.getState().fetchPhrases(user.uid)
      .then(() => {
        const allPhrases = phraseStore.getState().phrases
        const boardPhrases = allPhrases.filter(phrase => phrase.boardId === selectedBoard.id)
        setPhrases(boardPhrases)
      })
      .catch((err: Error) => {
        console.error('Error fetching phrases:', err)
        setError('Failed to load phrases')
      })
  }, [user, selectedBoard])

  const handlePhrasePress = (phrase: Phrase) => {
    console.log('Phrase pressed:', phrase)
  }

  const handleAddPhrase = async () => {
    if (!user || !selectedBoard) {
      console.error('Cannot add phrase: no user or board selected')
      return
    }
    
    router.push(`/phrases/add?boardId=${selectedBoard.id}`)
  }

  const handleEditPhrase = (phrase: Phrase) => {
    if (!selectedBoard) return
    router.push(`/phrases/edit/${phrase.id}?boardId=${selectedBoard.id}`)
  }

  const nextBoard = () => {
    if (boards.length === 0) return
    setCurrentIndex((prevIndex) => (prevIndex + 1) % boards.length)
    setSelectedBoard(boards[(currentIndex + 1) % boards.length])
  }

  const prevBoard = () => {
    if (boards.length === 0) return
    setCurrentIndex((prevIndex) => (prevIndex - 1 + boards.length) % boards.length)
    setSelectedBoard(boards[(currentIndex - 1 + boards.length) % boards.length])
  }

  if (authLoading || loading) {
    return <div className="text-black">Loading...</div>
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  if (!user) {
    return <div className="text-black">Please log in to view your phrases</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Phrases</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/phrases/boards/add')}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transform hover:-translate-y-0.5 transition-all duration-200 font-medium"
            >
              New Board
            </button>
            <button
              onClick={handleAddPhrase}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transform hover:-translate-y-0.5 transition-all duration-200 font-medium"
            >
              Add Phrase
            </button>
            {phrases.length > 0 && (
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transform hover:-translate-y-0.5 transition-all duration-200 font-medium"
              >
                {isEditMode ? 'Done' : 'Edit'}
              </button>
            )}
          </div>
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-gray-900 mb-4">No boards yet</h2>
            <p className="text-gray-600 mb-6">Create your first board to start adding phrases</p>
            <button
              onClick={() => router.push('/phrases/boards/add')}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transform hover:-translate-y-0.5 transition-all duration-200 font-medium"
            >
              Create Board
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2 mb-6">
              <button
                onClick={prevBoard}
                className="p-2 rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-0.5"
                aria-label="Previous board"
              >
                <ChevronLeftIcon className="h-5 w-5 text-black" />
              </button>

              <div className="flex-1 flex items-center justify-between bg-white rounded-xl shadow-md p-4 min-h-[60px] cursor-pointer hover:shadow-lg hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-0.5"
                onClick={() => {
                  if (isEditMode && selectedBoard) {
                    router.push(`/phrases/boards/edit/${selectedBoard.id}`)
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  {selectedBoard?.symbol && (
                    <img 
                      src={selectedBoard.symbol.url ?? ''} 
                      alt={selectedBoard.symbol.name ?? ''}
                      className="w-8 h-8 object-contain"
                    />
                  )}
                  <div>
                    <h2 className="font-medium text-black">{selectedBoard?.name}</h2>
                    <p className="text-sm text-black">
                      {phrases.length} {phrases.length === 1 ? 'phrase' : 'phrases'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isEditMode && (
                    <PencilIcon className="h-5 w-5 text-gray-500" />
                  )}
                  <div className="flex space-x-1">
                    {boards.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentIndex(index)
                          setSelectedBoard(boards[index])
                        }}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          index === currentIndex ? 'bg-gray-600 scale-125' : 'bg-gray-300'
                        }`}
                        aria-label={`Go to board ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={nextBoard}
                className="p-2 rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-0.5"
                aria-label="Next board"
              >
                <ChevronRightIcon className="h-5 w-5 text-black" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {phrases.map((phrase) => (
                <PhraseTile
                  key={phrase.id}
                  phrase={phrase}
                  onPress={() => handlePhrasePress(phrase)}
                  onEdit={isEditMode ? () => handleEditPhrase(phrase) : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
} 