// This page is for adding a new phrase board
// It will display a form for the user to enter the name of the phrase board

import React, { useState } from 'react';
import BaseLayout from '../../layout/BaseLayout';
import '../../global.css';
import getPhraseStoreInstance from '../../business-logic/phrases/PhraseStore';
import { useNavigate } from 'react-router-dom';
import { Symbol } from '../../business-logic/symbols/models/Symbol';
import SymbolChooser from './components/SymbolChooser';
import getPurchaseManager from '../../business-logic/payments/PurchaseManager';

function AddPhraseBoardPage() {
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState(new Symbol(0));
    const navigate = useNavigate();

    const handleSubmit = async (event: { preventDefault: () => void; }) => {
        event.preventDefault();
        // check if pro and less than 1 board
        const pro = await getPurchaseManager().isPro();
        await getPhraseStoreInstance().getPhraseBoardCount(async (count) => {
            if (!pro && count >= 1) {
                alert("You must be a pro user to create more than one phrase board");
                return;
            }
        });
        const success = await getPhraseStoreInstance().createPhraseBoard(name, symbol);
        if (success) {
            navigate("/boards");
        } else {
            alert("Error creating phrase board");
        }
    };

    function bottomBar() {
        return (
            <div className="bottom-bar">
                <button className="btn-default" type='submit' onClick={handleSubmit}>
                    Save
                </button>
            </div>
        );
    }

    return (
        <BaseLayout>
            <div className="container">
                <h1>Add Phrase Board</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            className="form-control"
                            id="name"
                            name="name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </div>
                </form>
                <SymbolChooser
                    symbolId={symbol?.id}
                    onSymbolChange={(symbol) => {
                        setSymbol(symbol);
                    }}
                    onSymbolRemove={() => {
                        setSymbol(new Symbol(0));
                    }}
                />
                {bottomBar()}
            </div>
        </BaseLayout>
    );
}

export default AddPhraseBoardPage;