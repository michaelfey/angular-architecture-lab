# Learning Path

Use this project as a sequence of small investigations rather than trying to understand every file at once.

## Step 1: Trace the boundaries

Read these files in order:

1. `src/app/app.routes.ts`
2. `src/app/features/workshops/workshops.routes.ts`
3. `src/app/features/workshops/data-access/workshops.repository.ts`
4. `src/app/features/workshops/state/workshops.facade.ts`

Questions to answer:

- Which dependencies are app-wide and which are feature-local?
- Why does the repository expose a snapshot instead of raw loading streams and data streams separately?
- Which state belongs to the facade and which state belongs to the form?

## Step 2: Understand the RxJS flow

Focus on the workshops feature:

- `WorkshopsApiService` simulates the async backend.
- `WorkshopsRepository` converts refresh commands into a cached snapshot stream.
- `WorkshopsFacade` combines repository changes with UI mutations.
- `CatalogPageComponent` converts form control streams into facade commands.

Pay attention to:

- `ReplaySubject` for imperative refresh commands
- `switchMap` to replace in-flight loads
- `scan` to build state over time
- `shareReplay` so late subscribers receive the latest snapshot
- `combineLatest` to compose route params or form streams with data

## Step 3: Do guided extensions

1. Add a new field to `Workshop` named `deliveryMode`.
2. Add a `deliveryMode` filter to the catalog form.
3. Extend the facade reducer and selector logic.
4. Add a unit test for the new filter.

Then try a second exercise:

1. Persist `savedIds` in local storage.
2. Decide whether that belongs in the repository, facade, or a separate storage service.
3. Explain the tradeoff before writing code.

## Step 4: Refactor with intent

After you understand the current implementation, try one of these:

- Replace the facade reducer stream with `ComponentStore` and compare the ergonomics.
- Replace the mock API with `HttpClient`.
- Introduce optimistic enrollment and handle rollback on failure.
- Split the catalog page into a container component and a separate filter form component.

## Coaching Loop

When you want the next lesson, ask for one of these:

- "quiz me on the repository pattern in this app"
- "give me a refactor exercise for the facade"
- "walk me through the RxJS flow from form control to view model"
- "review my architecture change after I extend the filters"
