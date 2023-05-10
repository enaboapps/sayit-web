// This class manages the settings for the app speech

import getSettingsManager from '../settings/SettingsManager';
import Setting from '../settings/models/Setting';
import getSpeechServiceInstance from './SpeechService';

export type GetVoiceCallback = { (voice: SpeechSynthesisVoice | null): void; };

class SpeechSettings {
    voiceKey = "voice";
    currentVoice: string | SpeechSynthesisVoice | undefined;



    async getVoice(callback: GetVoiceCallback) {
        if (!this.currentVoice) {
            const settingsManager = getSettingsManager();
            await settingsManager.getSettingByName(this.voiceKey, (voice: Setting | null) => {
                if (voice) {
                    this.currentVoice = voice.value;
                }
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
        if (voice) {
            callback(voice);
        }
    }

    async setVoice(voice: string) {
        const settingsManager = getSettingsManager();
        await settingsManager.updateSettingByName(this.voiceKey, voice);
        this.currentVoice = voice;
    }
}

let speechSettings: SpeechSettings | null = null;

function getSpeechSettings() {
    if (!speechSettings) {
        speechSettings = new SpeechSettings();
    }
    return speechSettings;
}

export default getSpeechSettings;