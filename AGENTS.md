# AGENTS.md

## Architecture
- `shared/engine.js` is the single source of truth for simulation logic. Its pure functions take a state object `{ totalMemory, vms, blocks, history }` and return `{ state, events }`. The server and the browser fallback both use it, so results are identical.
- `shared/algorithms/*.js` hold First/Best/Worst Fit. Each is `(holes, size) => { hole, reason }`.
- `shared/stats.js` derives utilization and fragmentation numbers.
- Free holes are never stored. They are computed as the gaps between `blocks`, so coalescing on release happens automatically.
- Requests are rounded up to `ALLOCATION_UNIT` (32 MB). `block.size - block.requested` is the internal fragmentation.
- `netlify/server/index.mjs` is the Express API, deployed as a Netlify Server on `/api/*`. Every mutation runs in this order inside an in-process serial queue: load the state, apply the engine op, call `saveState` (one Postgres transaction: replace blocks, upsert VMs, insert history events, upsert host config), then return the fresh snapshot.
- `netlify/server/store.mjs` is the DB access layer (native `@netlify/database` driver, raw SQL). It seeds the demo configuration on the first request.
- `netlify/database/migrations/` holds hand-written SQL migrations. Never edit an applied migration; add a new numbered file instead.
- `src/api.js` provides the `remote` backend (API) and `local` backend (localStorage fallback, flagged `persisted: false` and shown with a warning banner).
- `src/App.jsx` contains the layout, sidebar, hash routing (`#/` landing page in `src/pages/Landing.jsx`, then `#/dashboard`, `#/vms`, `#/allocate`, `#/analytics`), toasts and the `act()` helper that pages use for all operations.
- `src/pages/` holds the four sections. `src/components/` holds the shared UI (`ui.jsx`), `MemoryMap.jsx` (the RAM bar), the charts and the activity list.

## Conventions
- Plain JavaScript (no TypeScript), Tailwind utility classes, theme tokens in `src/index.css` (`ink`, `muted`, `line`, `canvas`, `accent`).
- Keep scope small: this is a B.Tech OS course project. Do not add auth, real-time infrastructure, page replacement or extra services.
- The user originally asked for MongoDB/Mongoose. The project uses Netlify Database (Postgres) because it is the platform-native store. The tables `virtual_machines`, `allocation_history` and `host_configuration` mirror the requested models, and `memory_blocks` stores the physical layout.
