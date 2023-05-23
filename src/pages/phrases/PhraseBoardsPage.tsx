// This page displays the user's phrase boards in PhraseDataGrid component
// It will display the phrase boards in a grid

import React, { useState, useEffect } from 'react';
import BaseLayout from '../../layout/BaseLayout';
import PhraseDataGrid from './components/PhraseDataGrid';
import PhraseBoardTile from './components/PhraseBoardTile';
import getPhraseStoreInstance from '../../business-logic/phrases/PhraseStore';
import { useNavigate } from 'react-router-dom';
import '../../global.css';
import PhraseBoard from '../../business-logic/phrases/models/PhraseBoard';


function PhraseBoardsPage() {
    const [phraseBoards, setPhraseBoards] = useState([] as PhraseBoard[]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editable, setEditable] = useState(false);

    useEffect(() => {
        async function fetchData() {
            await getPhraseStoreInstance().getAllPhraseBoards ((phraseBoards) => {
                if (phraseBoards) {
                    setPhraseBoards(phraseBoards);
                    setLoading(false);
                    setEditable(phraseBoards.length > 0);
                }
            });
        }
        fetchData();
    }, []);

    const navigate = useNavigate();

    function handlePhraseBoardClick(phraseBoard: PhraseBoard) {
        if (editing) {
            navigate(`/boards/edit/${phraseBoard.id}`);
        } else {
            navigate(`/boards/${phraseBoard.id}/phrases`);
        }
    }

    function openAddPhraseBoardPage() {
        navigate("/boards/add");
    }

    function editingBanner() {
        return (
            <div>
                <p>Click on a phrase board to edit it</p>
            </div>
        );
    }

    function topBar() {
        return (
            <div className="top-bar">
                <h1>Phrase Boards</h1>
            </div>
        );
    }

    function bottomBar() {
        return (
            <div className="bottom-bar">
                <button className="btn-default" onClick={openAddPhraseBoardPage}>
                    Add Phrase Board
                </button>
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
                {topBar()}
                {loading && <div>Loading...</div>}
                {!loading && (
                    <PhraseDataGrid
                        data={phraseBoards}
                        itemsPerPage={9}
                        renderItem={(item) => (
                            <PhraseBoardTile
                                name={item.name}
                                symbol={item.symbol}
                                onClick={() => handlePhraseBoardClick(item)}
                            />
                        )}
                    />
                )}
                {editing && editingBanner()}
                {bottomBar()}
            </div>
        </BaseLayout>
    );
}

export default PhraseBoardsPage;