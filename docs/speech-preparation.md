# Prepare speech while typing

Signed-in users can enable **Prepare speech while typing** in voice settings when using a custom provider. It is off by default and follows the user's account across devices.

After a two-second pause, the active message is sent to the selected custom provider. This sends unfinished drafts and can consume provider usage. Audio never plays until Speak is pressed. Speak uses an exact matching prepared message or waits for generation. Editing or clearing after Speak leaves the submitted message intact.

Only one request runs at a time, with the most recent draft replacing pending preparation. Preparation pauses during composition, offline use, hidden pages, and playback. Stop discards pending preparation and playback; another edit enables preparation again. Stopping does not shut down a server or cancel work already running at the provider.

Prepared audio is kept only in browser memory. Account, voice, connection, or typing-tab changes discard it. Shared viewers continue using browser speech and cannot access the owner's prepared audio. Background errors are quiet; Speak retries explicitly and shows actionable errors. Custom-provider messages retain the 500-character limit.
