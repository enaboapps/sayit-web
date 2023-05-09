// This class manages the settings for the app speech

import getSettingsManager from '../settings/SettingsManager';
import getSpeechServiceInstance from './SpeechService';

class SpeechSettings {
    voiceKey = "voice";
    currentVoice = null;

    async getVoice(callback) {
        if (!this.currentVoice) {
            const settingsManager = getSettingsManager();
            await settingsManager.getSettingByName(this.voiceKey, (voice) => {
                this.currentVoice = voice.value;
                console.log(`Current voice: ${this.currentVoice}`);
            });
        }
        const speechService = getSpeechServiceInstance();
        const voices = speechService.getVoices();
        if (voices.length === 0) {
            return;
        }
        if (!this.currentVoice) {
            this.currentVoice = voices[0];
            callback(this.currentVoice);
            return;
        }
        const voice = voices.find((voice) => {
            return voice.name === this.currentVoice;
        });
        callback(voice);
    }

    async setVoice(voice) {
        const settingsManager = getSettingsManager();
        await settingsManager.updateSettingByName(this.voiceKey, voice);
        this.currentVoice = voice;
    }
}

let speechSettings = null;

function getSpeechSettings() {
    if (!speechSettings) {
        speechSettings = new SpeechSettings();
    }
    return speechSettings;
}

export default getSpeechSettings;