# Angular Architecture Lab

This project is a training workspace for learning modern Angular architecture with a strong RxJS focus.

The codebase is intentionally organized around a few patterns you will see in larger Angular applications:

- route-level feature providers to keep dependencies scoped to a feature
- a repository layer that owns async data loading and caching
- a facade layer that turns events and server snapshots into a view model
- presentational components that stay dumb and receive inputs or emit events
- reactive forms wired to RxJS streams instead of ad hoc event handlers

## Run It

```bash
npm install
npm start
```

`npm start` now launches both the Angular dev server and the Express API. The app runs on
`http://localhost:4200` and proxies `/api/*` requests to the configured Express port.

By default the API runs on `3001`. To override it for both the server and Angular proxy, set
`API_PORT` before starting the app:

```bash
API_PORT=3100 npm start
```

## Build It

```bash
npm run build
```

The production output is written to `dist/angular-architecture-lab`.

## Architecture Map

- `src/app/core/layout`: app shell and top-level navigation
- `src/app/features/workshops`: the main learning feature with facade, repository, routes, and UI components
- `src/app/features/enrollment-effects`: a feature that models separate intent streams, API effects, and reducer events
- `src/app/features/optimistic-updates`: a feature that demonstrates optimistic writes, server confirmation, and rollback
- `src/app/features/patterns`: a second feature page that explains the architecture decisions
- `docs/learning-path.md`: the coaching roadmap and follow-up exercises

## Suggested Study Order

1. Start in `src/app/app.routes.ts` and `src/app/core/layout`.
2. Move to `src/app/features/workshops/workshops.routes.ts`.
3. Trace `WorkshopsRepository` and then `WorkshopsFacade`.
4. Inspect how `CatalogPageComponent` turns form control streams into facade updates.
5. Extend the feature by adding another filter, command, or derived view model.

## First Exercises

1. Add a new `deliveryMode` filter from end to end.
2. Persist saved workshops in local storage without leaking that concern into the UI.
3. Replace the mock API with a real HTTP endpoint and keep the facade unchanged.
4. Add optimistic updates for enrollment requests and reason about rollback behavior.

## Future Learning Features

These are good candidates for separate features so the repo can keep teaching one architectural pressure at a time.

- `draft-editor`: local component state vs facade state vs persisted state, plus autosave, dirty tracking, and navigation guards.
- `dashboard-composition`: composing multiple repositories or facades into one page-level view model.
- `polling-and-staleness`: refresh intervals, stale banners, cache age, and background revalidation.
- `master-detail-selection`: URL state vs UI selection state vs feature state.
- `wizard-flow`: multi-step route-scoped state, validation, progress, and resumable drafts.
- `permissions-aware-feature`: role and capability-based UI composition without leaking auth logic into every component.
- `realtime-feed`: merging server-push events with user commands while handling ordering and idempotency.
- `offline-queue`: queued writes, retries, backoff, and sync status.
- `plugin-style-feature-shell`: extension points, feature registration, and isolating feature ownership behind contracts.

Suggested next order:

1. `dashboard-composition`
2. `draft-editor`
3. `polling-and-staleness`
4. `master-detail-selection`
