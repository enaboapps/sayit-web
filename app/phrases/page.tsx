'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { phraseStore } from '@/lib/stores/phraseStore'
import { Phrase } from '@/lib/models/Phrase'
import { PhraseBoard } from '@/lib/models/PhraseBoard'
import PhraseTile from '@/app/components/phrases/PhraseTile'
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon } from '@heroicons/react/24/outline'
import PhrasesBottomBar from '@/app/components/phrases/PhrasesBottomBar'
import BoardCarousel from '@/app/components/phrases/BoardCarousel'
import PhrasesSkeleton from '@/app/components/phrases/PhrasesSkeleton'

export default function PhrasesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [boards, setBoards] = useState<PhraseBoard[]>([])
  const [selectedBoard, setSelectedBoard] = useState<PhraseBoard | null>(null)
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPhrases, setLoadingPhrases] = useState(false)
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
  }, [user, authLoading])

  useEffect(() => {
    if (!user || !selectedBoard) return

    console.log('Fetching phrases for board:', selectedBoard.id)
    setLoadingPhrases(true)
    setPhrases([]) // Clear existing phrases while loading
    phraseStore.getState().fetchPhrases(user.uid)
      .then(() => {
        const allPhrases = phraseStore.getState().phrases
        const boardPhrases = allPhrases.filter((phrase: Phrase) => phrase.boardId === selectedBoard.id)
        setPhrases(boardPhrases)
        setLoadingPhrases(false)
      })
      .catch((err: Error) => {
        console.error('Error fetching phrases:', err)
        setError('Failed to load phrases')
        setLoadingPhrases(false)
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

  const handleSettings = () => {
    // TODO: Implement settings functionality
    console.log('Settings clicked')
  }

  const handleAddBoard = () => {
    router.push('/phrases/boards/add')
  }

  const handleEdit = () => {
    setIsEditMode(!isEditMode)
  }

  if (authLoading || loading) {
    return <PhrasesSkeleton />
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  if (!user) {
    return <div className="text-black">Please log in to view your phrases</div>
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Phrases</h1>
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-gray-900 mb-4">No boards yet</h2>
            <p className="text-gray-600 mb-6">Create your first board to start adding phrases</p>
          </div>
        ) : (
          <>
            <BoardCarousel
              boards={boards}
              selectedBoard={selectedBoard}
              currentIndex={currentIndex}
              isEditMode={isEditMode}
              phrasesCount={phrases.length}
              isLoadingPhrases={loadingPhrases}
              onPrevBoard={prevBoard}
              onNextBoard={nextBoard}
              onSelectBoard={(index) => {
                setCurrentIndex(index)
                setSelectedBoard(boards[index])
              }}
              onEditBoard={(boardId) => router.push(`/phrases/boards/edit/${boardId}`)}
            />

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
      <PhrasesBottomBar
        onAddPhrase={handleAddPhrase}
        onAddBoard={handleAddBoard}
        onEdit={handleEdit}
        isEditMode={isEditMode}
      />
    </div>
  )
} 