// This page displays the settings for the app
// It will display the settings in a list

import React, { useState, useEffect } from 'react';
import BaseLayout from '../../layout/BaseLayout';
import '../../global.css';
import './Settings.css';
import getSpeechServiceInstance from '../../speech/SpeechService';
import getSpeechSettings from '../../speech/SpeechSettings';

function SettingsLandingPage() {
    const [voice, setVoice] = useState("");
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        async function fetchData() {
            const speechService = getSpeechServiceInstance();
            const voices = speechService.getVoices();
            console.log(voices);
            setVoices(voices);
            const speechSettings = getSpeechSettings();
            await speechSettings.getVoice((voice: SpeechSynthesisVoice | null) => (
                setVoice(voice?.name || "")
            ));
        }
        fetchData();
    }, []);

    async function handleVoiceChange(event: React.ChangeEvent<HTMLSelectElement>) {
        setVoice(event.target.value);
        const speechSettings = getSpeechSettings();
        await speechSettings.setVoice(event.target.value);
        await getSpeechServiceInstance().speak("This is a test");
    }

    function voiceOptions() {
        return voices.map((voice) => {
            return (
                <option key={voice.name} value={voice.name}>{voice.name}</option>
            );
        });
    }

    return (
        <BaseLayout>
            <div className="container">
                <h1>Settings</h1>
                <div className="settings-list">
                    <div className="settings-item">
                        <label>Speech Voice</label>
                        <select value={voice} onChange={handleVoiceChange}>
                            {voiceOptions()}
                        </select>
                    </div>
                </div>
            </div>
        </BaseLayout>
    );
}

export default SettingsLandingPage;