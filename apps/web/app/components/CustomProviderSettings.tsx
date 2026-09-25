'use client';
import { useUser } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CustomTTS, customApi, type CustomConnection } from '@/lib/custom-tts';
import { useSettings } from '../contexts/SettingsContext';

const control = 'block w-full rounded-xl border border-border bg-surface p-3 text-foreground focus-visible:outline-2';
export default function CustomProviderSettings() {
  const { settings } = useSettings();
  const { user } = useUser();
  const controller = useRef<AbortController | null>(null);
  const [connections, setConnections] = useState<CustomConnection[]>([]);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const refresh = useCallback(async () => {
    const signal = controller.current?.signal;
    const data = await (await customApi('connections', undefined, signal)).json();
    if (!signal?.aborted) setConnections(data);
  }, []);
  useEffect(() => {
    const current = new AbortController(); controller.current = current;
    setConnections([]); setId(''); setName(''); setBaseUrl(''); setApiKey('');
    setMessage(''); setBusy(false); working.current = false;
    void refresh().catch(error => { if (!current.signal.aborted) setMessage(error.message); });
    return () => current.abort();
  }, [refresh, user?.id]);
  function choose(value: string) {
    setId(value); setApiKey(''); setMessage('');
    const connection = connections.find(c => c.id === value);
    setName(connection?.name || ''); setBaseUrl(connection?.baseUrl || '');
  }
  async function run(action: 'save' | 'test' | 'remove' | 'voices') {
    if (working.current) return;
    const signal = controller.current?.signal;
    working.current = true; setBusy(true); setMessage('');
    try {
      const response = await customApi(action, action === 'remove' || action === 'voices' ? { id } : { id: id || undefined, name, baseUrl, apiKey: apiKey || undefined }, signal);
      const data = await response.json();
      if (signal?.aborted) return;
      if (action === 'save') {
        CustomTTS.getInstance().invalidatePreparation();
        setId(data.id); setApiKey(''); await refresh(); setMessage('Connection saved. Load voices to choose one.');
      } else if (action === 'remove') {
        CustomTTS.getInstance().removeVoices(id);
        // Keep the selected ID so speech reports a removed connection instead of substituting another voice.
        choose(''); await refresh(); setMessage('Connection and its saved key removed.');
      } else {
        setMessage(data.voices.length ? `Connected. Found ${data.voices.length} voice${data.voices.length === 1 ? '' : 's'}.` : 'Connected, but this server returned no voices.');
        if (action === 'voices') CustomTTS.getInstance().setVoices(connections.find(c => c.id === id)!, data.voices);
      }
    } catch (error) { if (!signal?.aborted) setMessage(error instanceof Error ? error.message : 'Connection failed. Try again.'); }
    finally { if (!signal?.aborted) { working.current = false; setBusy(false); } }
  }
  return <section aria-label="Custom provider connections" className="space-y-3 rounded-xl border border-border p-4">
    <p>Connect your own voice service. No SayIt subscription is needed; your provider may charge for usage. Keys sync securely with your account. Shared viewers use browser speech.</p>
    <fieldset disabled={busy} className="space-y-3 disabled:opacity-60">
      <label className="block">Connection<select className={control} value={id} onChange={e => choose(e.target.value)}><option value="">Add a connection</option>{connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="block">Name<input className={control} value={name} maxLength={80} onChange={e => setName(e.target.value)} autoComplete="off" /></label>
      <label className="block">HTTPS server address<input className={control} type="url" value={baseUrl} placeholder="https://voice.example.com" onChange={e => setBaseUrl(e.target.value)} autoComplete="off" /></label>
      <label className="block">API key<input className={control} type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} autoComplete="new-password" placeholder={id ? 'Saved key — leave blank to keep it' : 'Provider API key'} maxLength={4096} /></label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-lg border p-3" onClick={() => void run('test')}>Test connection</button>
        <button type="button" className="rounded-lg border p-3" onClick={() => void run('save')}>Save connection</button>
        {id && <><button type="button" className="rounded-lg border p-3" onClick={() => void run('voices')}>Load voices</button><button type="button" className="rounded-lg border p-3" onClick={() => void run('remove')}>Remove connection</button></>}
      </div>
    </fieldset>
    <p role="status">{busy ? 'Connecting…' : message}</p>
    {settings.ttsProvider === 'custom' && <p className="text-sm">Up to 500 characters per message. Voice style is controlled by your provider.</p>}
  </section>;
}
