// This component will be used as a popover to search for symbols
// It will contain a search bar and a search button
// It will contain a grid of symbols that match the search bar text
// You can pass in a function to be called when the user clicks on a symbol

import React, { useState } from 'react';
import '../../../global.css';
import './styles/SymbolSearchView.css';
import SymbolView from './SymbolView';
import { Symbol } from '../../../business-logic/symbols/models/Symbol';
import getSymbolsManager from '../../../business-logic/symbols/SymbolManager';

type SymbolSearchViewProps = {
    onClick?: (symbol: Symbol) => void;
};

function SymbolSearchView(props: SymbolSearchViewProps) {
    const { onClick } = props;
    const [searchText, setSearchText] = useState<string>('');
    const [symbols, setSymbols] = useState<Symbol[]>([]);
    const symbolsManager = getSymbolsManager();

    const handleSearchButtonClick = async () => {
        const symbols = await symbolsManager.search(searchText);
        setSymbols(symbols);
    }

    const handleSymbolClick = (symbol: Symbol) => {
        if (onClick) {
            onClick(symbol);
        }
    }

    return (
        <div className="symbol-search-view">
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search for symbols"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
                <button className="btn-default" onClick={handleSearchButtonClick}>Search</button>
            </div>
            {symbols.length > 0 &&
                <div className="search-results">
                    {symbols.map((symbol) => (
                        <button className="btn-default" key={symbol.id} onClick={() => handleSymbolClick(symbol)}>
                            <SymbolView symbol={symbol} />
                        </button>
                    ))}
                </div>
            }
        </div>
    );
}

export default SymbolSearchView;