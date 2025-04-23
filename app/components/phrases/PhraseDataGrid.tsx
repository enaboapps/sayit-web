'use client';

import { useState } from 'react';

interface Phrase {
  id: string
  text: string
  symbol?: {
    url: string
    name: string
  }
}

interface PhraseDataGridProps {
  data: Phrase[]
  itemsPerPage: number
  renderItem: (item: Phrase) => React.ReactNode
}

export default function PhraseDataGrid({ data, itemsPerPage, renderItem }: PhraseDataGridProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if (!data || !Array.isArray(data)) {
    return null;
  }

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

  const showPreviousButton = currentPage > 1;
  const showNextButton = currentPage < totalPages;

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentItems.map((item) => (
          <div key={item.id}>{renderItem(item)}</div>
        ))}
      </div>
      <div className="mt-4 flex justify-center space-x-4">
        {showPreviousButton && (
          <button
            onClick={goToPreviousPage}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Previous
          </button>
        )}
        {showNextButton && (
          <button
            onClick={goToNextPage}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
