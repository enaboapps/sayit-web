// This view is used to display the symbol in the symbol list or Phrase Board/Phrase tile.

import React, { useEffect, useState } from 'react';
import { Symbol } from '../../../business-logic/symbols/models/Symbol';
import './styles/SymbolView.css';

type SymbolViewProps = {
    symbol: Symbol;
};

function SymbolView(props: SymbolViewProps) {
    const { symbol } = props;
    const [url, setUrl] = useState("");

    useEffect(() => {
        async function fetchData() {
            if (symbol && symbol.id !== 0) {
                const u = await symbol.getImageURL();
                if (u) {
                    setUrl(u);
                }
            }
        }
        fetchData();
    }, [symbol]);

    return (
        <div className="symbol-view">
            <img src={url} alt="" />
        </div>
    );

}

export default SymbolView;