import { useState } from 'react';
import './styles/PhraseDataGrid.css';

function PhraseDataGrid({ data, itemsPerPage, renderItem }) {
    const [currentPage, setCurrentPage] = useState(1);
    
    if (!data) {
        console.log('data is null');
        return null;
    }

    // check if data is an array
    if (!Array.isArray(data)) {
        console.log('data is not an array');
        return null;
    }

    // convert data to an array of items
    const items = data.map((item, index) => {
        return {
            index,
            item
        };
    });
    for (let i = 0; i < items.length; i++) {
        console.log('item: ', items[i]);
    }

    // calculate total pages
    const totalPages = Math.ceil(items.length / itemsPerPage);

    // calculate current items
    const indexOfLastItem = currentPage * itemsPerPage;

    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const currentItems = items.slice(indexOfFirstItem, indexOfLastItem).map((item) => item.item);

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
            <div className="grid">
                {currentItems.map((item, index) => (
                    <div key={index}>{renderItem(item)}</div>
                ))}
            </div>
            <div className="page-controls">
                <button className="btn" onClick={goToPreviousPage} disabled={currentPage === 1}>
                    Previous Page
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button className="btn" onClick={goToNextPage} disabled={currentPage === totalPages}>
                    Next Page
                </button>
            </div>
        </div>
    );
}

export default PhraseDataGrid;