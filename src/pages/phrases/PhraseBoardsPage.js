// This page displays the user's phrase boards in PhraseDataGrid component
// It will display the phrase boards in a grid

import React, { useState, useEffect } from 'react';
import BaseLayout from '../../layout/BaseLayout';
import PhraseDataGrid from './components/PhraseDataGrid';
import PhraseBoardTile from './components/PhraseBoardTile';
import PhraseStore from '../../business-logic/phrases/PhraseStore';

class PhraseBoardsPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            phraseBoards: [],
            loading: true
        };
    }

    async componentDidMount() {
        await PhraseStore.getAllPhraseBoards ((phraseBoards) => {
            this.setState({
                phraseBoards,
                loading: false
            });
        });
    }

    render() {
        return (
            <BaseLayout>
                <div className="container">
                    <h1>Phrase Boards</h1>
                    {this.state.loading && (
                        <div>Loading...</div>
                    )}
                    {!this.state.loading && (
                        <PhraseDataGrid data={this.state.phraseBoards} itemsPerPage={9} renderItem={(item) => (
                            <PhraseBoardTile name={item.name} />
                        )} />
                    )}
                </div>
            </BaseLayout>
        );
    }
}

export default PhraseBoardsPage;