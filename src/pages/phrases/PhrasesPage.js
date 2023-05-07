// This page displays phrases from a phrase board in a grid
// It will display the phrases in a grid
// The user can click on a phrase to hear it spoken

import React, { useState, useEffect } from 'react';
import BaseLayout from '../../layout/BaseLayout';
import PhraseDataGrid from './components/PhraseDataGrid';
import PhraseTile from './components/PhraseTile';
import getPhraseStoreInstance from '../../business-logic/phrases/PhraseStore';
import { useNavigate, useParams } from 'react-router-dom';
import '../../global.css';

function PhrasesPage() {
    const [phrases, setPhrases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editable, setEditable] = useState(false);
    const { id } = useParams();

    useEffect(() => {
        async function fetchData() {
            await getPhraseStoreInstance().getPhrases(id, (phrases) => {
                setPhrases(phrases);
                setLoading(false);
                setEditable(phrases.length > 0);
            });
        }
        fetchData();
    }, [id]);

    const navigate = useNavigate();

    function handlePhraseClick(phrase) {
        if (editing) {
            navigate(`/boards/${id}/phrases/edit/${phrase.id}`);
        } else {
            // TODO: play audio
        }
    }

    function openAddPhrasePage() {
        navigate(`/boards/${id}/phrases/add`);
    }

    function bottomBar() {
        return (
            <div className="bottom-bar">
                <button className="btn-default" onClick={openAddPhrasePage}>
                    Add Phrase
                </button>
                <div className="spacer"></div>
                {editable && (
                    <button className="btn-default" onClick={() => setEditing(!editing)}>
                        {editing ? "Done" : "Edit"}
                    </button>
                )}
            </div>
        );
    }

    return (
        <BaseLayout>
            <div className="container">
                <h1>Phrases</h1>
                {loading && <p>Loading...</p>}
                {!loading && (
                    <PhraseDataGrid
                        data={phrases}
                        itemsPerPage={9}
                        renderItem={(phrase) => (
                            <PhraseTile
                                text={phrase.text}
                                onClick={() => handlePhraseClick(phrase)}
                            />
                        )}
                    />
                )}
                {bottomBar()}
            </div>
        </BaseLayout>
    );
}

export default PhrasesPage;