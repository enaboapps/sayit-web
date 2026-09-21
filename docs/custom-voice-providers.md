# Custom voice providers

Signed-in users can add their own ElevenLabs-compatible HTTPS server in Voice settings → Custom provider. Add a connection name, server address **without `/v1`**, and API key. Test it, save it, load voices, and select a voice. Connections and the selected voice sync with the account. SayIt does not require a subscription for these voices; the external provider may charge for synthesis.

The saved key is never returned to the browser. Leave the masked key field blank when editing to retain it. Changing the server address requires entering a key again. Removing a connection deletes its encrypted credential. A removed or unavailable voice produces an error, never a substitute voice. Shared typing viewers use browser speech and receive no custom connection identifiers or credentials.

## Supported protocol

- `GET <server>/v1/voices`, header `xi-api-key`, response `{"voices":[{"voice_id":"stable-id","name":"Voice name"}]}`.
- `POST <server>/v1/text-to-speech/<encoded-voice-id>`, same header, JSON `{"text":"Hello"}`. Maximum 500 characters. Return binary WAV, MP3, Ogg, MP4 audio or FLAC with its correct audio content type.
- No model/settings parameters, PCM negotiation, progressive streaming or automatic server startup. Stop aborts the browser request and playback; it cannot guarantee cancellation of provider computation or charges.
- Audio responses are limited to 4 MiB and 110 seconds; voice lists to 512 KiB, 1,000 entries and 15 seconds. Only public HTTPS destinations on port 443 are supported. Redirects and private network destinations are rejected. Each request resolves and pins a validated public address for TLS connection.

## Deployment

Deploy the additive Convex schema/functions before deploying the web client. Existing settings remain valid; no record migration is required.

Set `CUSTOM_PROVIDER_BRIDGE_SECRET` to the same randomly generated secret of at least 32 characters in **both Next.js and Convex**. This server bridge is checked alongside the forwarded user's Clerk identity for every database operation; knowing a connection ID alone never grants access. Use a Clerk JWT template named `convex`, as with the existing app integration.

Set `CUSTOM_PROVIDER_ENCRYPTION_KEYS` in **Next.js only** to a JSON object mapping version strings to base64-encoded 32-byte random AES keys. Set `CUSTOM_PROVIDER_KEY_VERSION` to the active version, initially `1`. Generate secrets with a cryptographic random generator and store them directly in the deployment's secret manager. Never place them in client-visible variables, logs, tickets, Git, or screenshots. Local Next.js variables belong in `apps/web/.env.local` (ignored).

Keys use AES-256-GCM with a fresh nonce and the authenticated owner ID as associated data. To rotate, retain previous versions in the map, add a new version and select it as active. Existing records remain readable and are re-encrypted with the active key on the next save. Removing a still-used encryption key requires affected users to enter their provider credentials again. Back up the encryption key map securely alongside database backups; ciphertext alone is not recoverable.

Own Voice requires its separate `VOICE_SPEECH_API_KEY` and compatibility gateway deployment. Add that speech key to the owner's connection, never the Own Voice sign-in password, worker token, or Runpod key. Ensure the voice is already ready before synthesis.

## Validation and rollout

Run `pnpm test` and `pnpm build`; server tests exercise ownership, secret handling, destination validation and compatibility errors. Verify in preview with two signed-in sessions for one account and a second account denied access; test playback, browser-blocked autoplay, Stop and shared typing. Release through the normal milestone workflow after PR approval. Rollback the web deployment first; the additive table/functions can remain without affecting older clients. Do not remove encryption secrets while saved connections still need them.
