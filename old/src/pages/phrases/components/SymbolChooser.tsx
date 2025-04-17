// This component will be used in the add and edit phrase/phrase board views
// It will contain a SymbolView with the symbol of the phrase/phrase board
// It will contain a button to change the symbol (if the symbol is not set, it will say "Add Symbol")
// This button will open a popover with a SymbolSearchView
// If the user clicks on a symbol in the SymbolSearchView, the popover will close and the symbol will be set
// If the symbol is set, there will be a button to remove the symbol

import React, { useState } from 'react';
import SymbolSearchView from './SymbolSearchView';
import SymbolView from './SymbolView';
import { Symbol } from '../../../business-logic/symbols/models/Symbol';
import { Popover } from '@mui/material';
import '../../../global.css';
import getSymbolsManager from '../../../business-logic/symbols/SymbolManager';
import './styles/SymbolChooser.css';

type SymbolChooserProps = {
    symbolId?: number;
    onSymbolChange?: (symbol: Symbol) => void;
    onSymbolRemove?: () => void;
};

function SymbolChooser(props: SymbolChooserProps) {
    const { symbolId, onSymbolChange, onSymbolRemove } = props;
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [symbol, setSymbol] = useState<Symbol | undefined>(undefined);
    const [popoverOpen, setPopoverOpen] = useState<boolean>(false);
    const symbolsManager = getSymbolsManager();

    React.useEffect(() => {
        const getSymbol = async () => {
            if (symbolId) {
                const url = await symbolsManager.getImageURL(symbolId);
                const symbol = await symbolsManager.getSymbol(symbolId);
                console.log(symbol);
                if (url && symbol) {
                    symbol.setURL(url);
                    setSymbol(symbol);
                }
            }
        }
        getSymbol();
    }, [symbolId]);

    const handleSymbolClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        setPopoverOpen(true);
    }

    const handleSymbolChange = (symbol: Symbol) => {
        setSymbol(symbol);
        if (onSymbolChange) {
            onSymbolChange(symbol);
            addSymbol(symbol);
        }
        setPopoverOpen(false);
    }

    const addSymbol = async (symbol: Symbol) => {
        await getSymbolsManager().addSymbol(symbol.id, symbol.imageURL || '');
    }

    const handleSymbolRemove = () => {
        setSymbol(undefined);
        if (onSymbolRemove) {
            onSymbolRemove();
        }
    }

    return (
        <div className="form-group">
            <label>Symbol (optional)</label>
            <div className="symbol-chooser">
                <button className="btn-default" onClick={handleSymbolClick}>
                    {symbolId && symbol ? <SymbolView symbol={symbol} /> : 'Add Symbol'}
                </button>
                <Popover
                    open={popoverOpen}
                    anchorEl={anchorEl}
                    onClose={() => setPopoverOpen(false)}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}>
                    <SymbolSearchView onClick={handleSymbolChange} />
                </Popover>
                {symbolId && symbol &&
                    <button className="btn-default" onClick={handleSymbolRemove}>Remove Symbol</button>
                }
            </div>
        </div>
    );
}

export default SymbolChooser;