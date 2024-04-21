// This class manages the settings for the app speech

import getSettingsManager from '../settings/SettingsManager';

class SpeechSettings {
    voiceKey = "voice";
    currentVoice = "";

    async getVoice() {
        const settingsManager = getSettingsManager();
        if (this.currentVoice) {
            return this.currentVoice;
        }
        const voiceSetting = await settingsManager.getSettingByName(this.voiceKey);
        if (voiceSetting) {
            this.currentVoice = voiceSetting.value;
            return this.currentVoice;
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