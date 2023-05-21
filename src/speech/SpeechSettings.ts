// This class manages the settings for the app speech

import getSettingsManager from '../settings/SettingsManager';
import Setting from '../settings/models/Setting';
import getSpeechServiceInstance from './SpeechService';

class SpeechSettings {
    voiceKey = "voice";
    currentVoice = "";

    async getVoice() {
        const settingsManager = getSettingsManager();
        await settingsManager.getSettingByName(this.voiceKey, callback => (v: Setting) => this.currentVoice = v.value);
        return this.currentVoice;
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