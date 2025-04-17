'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/hooks/useAuth'
import { Phrase } from '../lib/models/Phrase'
import { PhraseBoard } from '../lib/models/PhraseBoard'
import phraseStore from '../lib/stores/PhraseStore'
import PhraseTile from '../components/phrases/PhraseTile'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function PhrasesPage() {
  const { user, loading: authLoading } = useAuth()
  const [boards, setBoards] = useState<PhraseBoard[]>([])
  const [selectedBoard, setSelectedBoard] = useState<PhraseBoard | null>(null)
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

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
    phraseStore.getAllPhraseBoards(user.uid)
      .then((fetchedBoards) => {
        console.log('Boards fetched successfully:', fetchedBoards)
        setBoards(fetchedBoards)
        if (fetchedBoards.length > 0) {
          setSelectedBoard(fetchedBoards[0])
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching boards:', err)
        setError('Failed to load phrase boards')
        setLoading(false)
      })
  }, [user, authLoading])

  useEffect(() => {
    if (!user || !selectedBoard) return

    console.log('Fetching phrases for board:', selectedBoard.id)
    phraseStore.getPhrases(user.uid, selectedBoard.id)
      .then((fetchedPhrases) => {
        console.log('Phrases fetched successfully:', fetchedPhrases)
        setPhrases(fetchedPhrases)
      })
      .catch((err) => {
        console.error('Error fetching phrases:', err)
        setError('Failed to load phrases')
      })
  }, [user, selectedBoard])

  const handlePhrasePress = (phrase: Phrase) => {
    console.log('Phrase pressed:', phrase)
    // Handle phrase press (e.g., speak the phrase)
  }

  const handleAddPhrase = async () => {
    if (!user || !selectedBoard) {
      console.error('Cannot add phrase: no user or board selected')
      return
    }
    
    console.log('Adding new phrase to board:', selectedBoard.id)
    try {
      await phraseStore.createPhrase(user.uid, selectedBoard.id, 'New phrase text')
      const updatedPhrases = await phraseStore.getPhrases(user.uid, selectedBoard.id)
      setPhrases(updatedPhrases)
    } catch (err) {
      console.error('Error adding phrase:', err)
      setError('Failed to add phrase')
    }
  }

  const handleDeletePhrase = async (phrase: Phrase) => {
    if (!user || !selectedBoard || !phrase.id) {
      console.error('Cannot delete phrase: no user, board, or phrase ID')
      return
    }
    
    console.log('Deleting phrase:', phrase.id)
    try {
      await phraseStore.deletePhrase(user.uid, selectedBoard.id, phrase.id)
      const updatedPhrases = await phraseStore.getPhrases(user.uid, selectedBoard.id)
      setPhrases(updatedPhrases)
    } catch (err) {
      console.error('Error deleting phrase:', err)
      setError('Failed to delete phrase')
    }
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
    return <div>Loading...</div>
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  if (!user) {
    return <div>Please log in to view your phrases</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Phrases</h1>
        <button
          onClick={handleAddPhrase}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
        >
          Add Phrase
        </button>
      </div>

      {boards.length > 0 && (
        <div className="flex items-center space-x-2 mb-6">
          <button
            onClick={prevBoard}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
            aria-label="Previous board"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex-1 flex items-center justify-between bg-white rounded-lg shadow-sm p-3 min-h-[60px]">
            <div className="flex items-center space-x-3">
              {selectedBoard?.symbol && (
                <img 
                  src={selectedBoard.symbol.url} 
                  alt={selectedBoard.symbol.name}
                  className="w-8 h-8 object-contain"
                />
              )}
              <div>
                <h2 className="font-medium">{selectedBoard?.name}</h2>
                <p className="text-sm text-gray-500">
                  {phrases.length} {phrases.length === 1 ? 'phrase' : 'phrases'}
                </p>
              </div>
            </div>
            <div className="flex space-x-1">
              {boards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index)
                    setSelectedBoard(boards[index])
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                    index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to board ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={nextBoard}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
            aria-label="Next board"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {phrases.map((phrase) => (
          <PhraseTile
            key={phrase.id}
            phrase={phrase}
            onPress={() => handlePhrasePress(phrase)}
            onDelete={() => handleDeletePhrase(phrase)}
          />
        ))}
      </div>
    </div>
  )
} 