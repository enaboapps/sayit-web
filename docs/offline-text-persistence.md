# Offline Text Persistence

The offline text communication milestone uses `localStorage` for device-local persistence of typing drafts, typing tabs, the active tab id, and a short recent-message history.

## Why `localStorage`

- The current offline scope is small: one active typing experience plus a short history.
- Draft restore has to work immediately on app startup without waiting for network or a larger client-side sync layer.
- The app already stores typing tabs in `localStorage`, so extending that path keeps the release small and consistent.

## Tradeoffs

- Pros: simple, synchronous startup restore, no schema migration layer, no new dependency surface.
- Cons: storage is smaller than IndexedDB, writes are synchronous, and the data remains device-local with no background sync.

## Boundaries

- This is intentionally not a Convex replacement.
- App shell assets still belong in the service worker cache.
- Cloud data such as boards, phrases, and account state remain server-backed.
- If offline board editing or queued sync becomes a requirement later, IndexedDB becomes the more appropriate store for that larger workload.
