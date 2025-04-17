// This page is for editing a phrase in a phrase board
// It will display a form for the user to edit the phrase
// The user can click a button to save the changes
// Or the user can click a button to delete the phrase

import React, { useState, useEffect } from 'react';
import BaseLayout from '../../layout/BaseLayout';
import '../../global.css';
import { Symbol } from '../../business-logic/symbols/models/Symbol';
import getPhraseStoreInstance from '../../business-logic/phrases/PhraseStore';
import { useNavigate, useParams } from 'react-router-dom';
import Phrase from '../../business-logic/phrases/models/Phrase';
import SymbolChooser from './components/SymbolChooser';

function EditPhrasePage() {
    const [phrase, setPhrase] = useState({} as Phrase);
    const [text, setText] = useState("");
    const { id, phraseId } = useParams();
    const [symbol, setSymbol] = useState({} as Symbol | null);

    const navigate = useNavigate();

    useEffect(() => {
        async function fetchData() {
            const phraseStore = getPhraseStoreInstance();
            if (id && phraseId) {
                await phraseStore.getPhrase(id, phraseId, (phrase) => {
                    if (phrase) {
                        setPhrase(phrase);
                        setText(phrase.text);
                        setSymbol(phrase.symbol);
                    }
                });
            }
        }
        fetchData();
    }, [id, phraseId]);

    function handlePhraseChange(event: { target: { value: React.SetStateAction<string>; }; }) {
        setText(event.target.value);
        let ph = phrase;
        ph.text = text;
        setPhrase(ph);
    }

    async function handleSavePhrase() {
        const phraseStore = getPhraseStoreInstance();
        if (id && phraseId && phrase) {
            phrase.symbol = symbol;
            await phraseStore.updatePhrase(id, phraseId, phrase);
            navigate(`/boards/${id}/phrases`);
        }
    }

    async function handleDeletePhrase() {
        const phraseStore = getPhraseStoreInstance();
        if (id && phraseId) {
            await phraseStore.deletePhrase(id, phraseId);
            navigate(`/boards/${id}/phrases`);
        }
    }

    function bottomBar() {
        return (
            <div className="bottom-bar">
                <button className="btn-default" onClick={handleSavePhrase}>
                    Save
                </button>
                <div className="spacer"></div>
                <button className="btn-danger" onClick={handleDeletePhrase}>
                    Delete
                </button>
            </div>
        );
    }

    return (
        <BaseLayout>
            <div className="container">
                <h1>Edit Phrase</h1>
                <div className="form">
                    <div className="form-group">
                        <label htmlFor="phrase">Phrase</label>
                        <input
                            type="text"
                            id="phrase"
                            name="phrase"
                            value={text}
                            onChange={handlePhraseChange}
                        />
                    </div>
                </div>
                <SymbolChooser
                    symbolId={symbol?.id}
                    onSymbolChange={(symbol) => {
                        setSymbol(symbol);
                    }}
                    onSymbolRemove={() => {
                        setSymbol(null);
                    }}
                />
            </div>
            {bottomBar()}
        </BaseLayout>
    );
}

export default EditPhrasePage;