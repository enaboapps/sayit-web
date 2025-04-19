'use client'

import { useState } from 'react'
import { Symbol } from '@/lib/models/Symbol'
import symbolsManager from '@/lib/services/SymbolsManager'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface SymbolSearchProps {
  onSymbolSelect: (symbol: Symbol) => void
}

export default function SymbolSearch({ onSymbolSelect }: SymbolSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [symbols, setSymbols] = useState<Symbol[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      const results = await symbolsManager.search(searchTerm)
      setSymbols(results)
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
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search for symbols..."
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <button
          onClick={handleSearch}
          className="absolute right-2 top-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Search
        </button>
      </div>

      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="w-full aspect-square bg-gray-200 animate-pulse rounded" />
          ))}
        </div>
      )}

      {!isLoading && symbols.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {symbols.map((symbol) => (
            <button
              key={symbol.id}
              onClick={() => onSymbolSelect(symbol)}
              className="w-full aspect-square bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <img
                src={symbol.url ?? ''}
                alt={`Symbol ${symbol.id}`}
                className="w-full h-full object-contain p-2"
              />
            </button>
          ))}
        </div>
      )}

      {!isLoading && symbols.length === 0 && searchTerm && (
        <div className="mt-4 text-center text-gray-500">
          No symbols found
        </div>
      )}
    </div>
  )
} 