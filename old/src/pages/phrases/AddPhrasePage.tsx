// This page is for adding a new phrase to a phrase board
// It will display a form for the user to enter the phrase
// The user can click a button to add the phrase

import React, { useState } from 'react';
import BaseLayout from '../../layout/BaseLayout';
import '../../global.css';
import { Symbol } from '../../business-logic/symbols/models/Symbol';
import getPhraseStoreInstance from '../../business-logic/phrases/PhraseStore';
import { useNavigate, useParams } from 'react-router-dom';
import SymbolChooser from './components/SymbolChooser';

function AddPhrasePage() {
    const [phrase, setPhrase] = useState("");
    const { id } = useParams();
    const [symbol, setSymbol] = useState(new Symbol(0));

    const navigate = useNavigate();

    function handlePhraseChange(event: { target: { value: React.SetStateAction<string>; }; }) {
        setPhrase(event.target.value);
    }

    async function handleAddPhrase() {
        const phraseStore = getPhraseStoreInstance();
        if (id) {
            await phraseStore.createPhrase(id, phrase, symbol);
            navigate(`/boards/${id}/phrases`);
        }
    }

    function bottomBar() {
        return (
            <div className="bottom-bar">
                <button className="btn-default" onClick={handleAddPhrase}>
                    Save
                </button>
            </div>
        );
    }

    return (
        <BaseLayout>
            <div className="container">
                <h1>Add Phrase</h1>
                <div className="form">
                    <div className="form-group">
                        <label htmlFor="phrase">Phrase</label>
                        <input
                            type="text"
                            id="phrase"
                            name="phrase"
                            value={phrase}
                            onChange={handlePhraseChange}
                        />
                    </div>
                </div>
                <SymbolChooser
                    symbolId={symbol.id}
                    onSymbolChange={(symbol) => {
                        setSymbol(symbol);
                    }}
                    onSymbolRemove={() => {
                        setSymbol(new Symbol(0));
                    }}
                />
            </div>
            {bottomBar()}
        </BaseLayout>
    );
}

export default AddPhrasePage;