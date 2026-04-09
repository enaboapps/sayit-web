# Offline Persistence

SayIt now uses two local persistence layers for offline communication:

- `localStorage` for fast startup bootstrap and small device-local typing state
- IndexedDB for cached read-only board and phrase documents

## What lives in `localStorage`

These values must be available immediately on startup, including cold offline launch:

- typing drafts
- typing tabs
- active typing tab id
- short recent-message history
- offline bootstrap metadata

The offline bootstrap record tracks:

- schema version
- whether offline mode is text-only or board-ready
- cached board count
- last sync timestamp
- last known user id
- last selected board id
- sync status

## What lives in IndexedDB

The `sayit-offline` IndexedDB database stores cached board documents per authenticated user.

Each cached board document includes:

- board id and ownership metadata
- board name and sort position
- phrase text for offline browsing and speaking
- cache timestamp

## Why the split

`localStorage` is still the right place for small synchronous startup state. IndexedDB is the better fit for larger AAC payloads such as cached boards and phrases.

This keeps cold launch fast while allowing richer offline rendering after a prior online sync.

## Boundaries

- Offline board content is read-only in this milestone.
- App shell assets still belong in the service worker cache.
- Convex remains the source of truth for cloud data.
- On sign-out or account switch, cached board data must be cleared or isolated per user.
- If offline editing or queued sync is added later, the IndexedDB schema should expand rather than pushing that workload into `localStorage`.
