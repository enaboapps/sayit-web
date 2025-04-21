'use client';

import { useSettings } from '../contexts/SettingsContext';

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Settings</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Text Size</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
            <div>
              <h3 className="font-medium text-gray-900">Typing Area Text Size</h3>
              <p className="text-gray-600">Adjust the size of text in the typing area</p>
            </div>
            <select
              value={settings.textSize}
              onChange={(e) => updateSetting('textSize', e.target.value as 'small' | 'medium' | 'large' | 'xlarge')}
              className="px-4 py-2 border rounded bg-white text-gray-900"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra Large</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
} 