// This is a React component that will be used to display a phrase tile
// It will contain the name of the phrase
// It will contain the symbol of the phrase
// You can pass in a function to be called when the user clicks on the phrase tile
// You can pass props to this component to show that editing is enabled

import React from 'react';
import './styles/PhraseDataTile.css';
import { Symbol } from '../../../business-logic/symbols/models/Symbol';
import SymbolView from './SymbolView';

type PhraseTileProps = {
    text: string;
    symbol?: Symbol;
    onClick?: () => void;
};

function PhraseTile(props: PhraseTileProps) {
    const { text, symbol, onClick } = props;
    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    }
    return (
        <div className="phrase-card" onClick={handleClick}>
            {symbol && <SymbolView symbol={symbol} />}
            <div className="text">
                <p>{text}</p>
            </div>
        </div>
    );
}

export default PhraseTile;