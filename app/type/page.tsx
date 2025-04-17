'use client'

import { useState } from 'react'

export default function TypePage() {
  const [text, setText] = useState('')

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Type Your Message</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message here..."
        />
        <div className="mt-4 flex justify-between items-center">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            onClick={() => setText('')}
          >
            Clear
          </button>
          <div className="text-gray-600">
            {text.length} characters
          </div>
        </div>
      </div>
    </div>
  )
} 