'use client'

import { useState, useRef, useEffect } from 'react'
import { Symbol } from '@/lib/models/Symbol'
import symbolsManager from '@/lib/services/SymbolsManager'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface SymbolSearchProps {
  onSymbolSelect: (symbol: Symbol) => void
}

export default function SymbolSearch({ onSymbolSelect }: SymbolSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [symbols, setSymbols] = useState<Symbol[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSymbols([])
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const results = await symbolsManager.search(searchTerm)
      setSymbols(results)
      setSelectedIndex(-1)
    } catch (err) {
      setError('Failed to search for symbols')
      console.error('Error searching symbols:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, symbols.length - 1))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Escape') {
      setSearchTerm('')
      setSymbols([])
    }
  }

  const handleSymbolClick = (symbol: Symbol) => {
    onSymbolSelect(symbol)
  }

  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < symbols.length) {
      const symbol = symbols[selectedIndex]
      onSymbolSelect(symbol)
    }
  }, [selectedIndex, symbols, onSymbolSelect])

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    searchTimeout.current = setTimeout(handleSearch, 300)
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [searchTerm])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Search for symbols..."
            className="w-full px-4 py-3 pl-10 pr-10 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="w-full aspect-square bg-gray-100 rounded-xl animate-pulse">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && symbols.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {symbols.map((symbol, index) => (
            <button
              key={symbol.id}
              onClick={() => handleSymbolClick(symbol)}
              className={`w-full aspect-square bg-white border-2 rounded-xl transition-all duration-200 ${
                selectedIndex === index
                  ? 'border-blue-500 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={symbol.url ?? ''}
                  alt={`Symbol ${symbol.id}`}
                  className="w-full h-full object-contain"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {!isLoading && symbols.length === 0 && searchTerm && (
        <div className="mt-8 text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <MagnifyingGlassIcon className="h-12 w-12 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg font-medium">No symbols found</p>
          <p className="text-gray-400 mt-1">Try different search terms</p>
        </div>
      )}
    </div>
  )
} 