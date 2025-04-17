'use client'

import { useState } from 'react'

export default function TypePage() {
  const [text, setText] = useState('')

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Type Your Message</h1>
      <div className="bg-white rounded-xl shadow-lg p-8">
        <textarea
          className="w-full h-64 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 resize-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message here..."
        />
        <div className="mt-6 flex justify-between items-center">
          <button
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transform hover:-translate-y-0.5 transition-all duration-200 font-medium"
            onClick={() => setText('')}
          >
            Clear
          </button>
          <div className="text-gray-600 font-medium">
            {text.length} characters
          </div>
        </div>
      </div>
    </div>
  )
} 