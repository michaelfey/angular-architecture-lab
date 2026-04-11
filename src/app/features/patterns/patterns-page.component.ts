import { ChangeDetectionStrategy, Component } from '@angular/core';

interface PatternNote {
  readonly title: string;
  readonly reason: string;
  readonly fileAnchor: string;
}

@Component({
  selector: 'app-patterns-page',
  standalone: true,
  template: `
    <section class="page">
      <article class="intro">
        <p class="eyebrow">Why this structure exists</p>
        <h2>Patterns worth practicing until they feel boring.</h2>
        <p>
          Large Angular codebases usually get difficult for the same reasons: async logic leaks into
          components, shared services become global state, and routing concerns spread everywhere. This
          lab is designed to counter those failure modes with explicit seams.
        </p>
      </article>

      <section class="grid">
        @for (note of notes; track note.title) {
          <article class="card">
            <h3>{{ note.title }}</h3>
            <p>{{ note.reason }}</p>
            <small>{{ note.fileAnchor }}</small>
          </article>
        }
      </section>
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.2rem;
      }

      .intro,
      .card {
        border: 1px solid var(--page-line);
        border-radius: 28px;
        background: var(--page-panel);
        box-shadow: var(--page-shadow);
      }

      .intro {
        padding: 1.5rem;
      }

      .eyebrow,
      small {
        color: var(--page-accent-strong);
      }

      .eyebrow {
        margin: 0 0 0.6rem;
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .intro p,
      .card p {
        color: var(--page-soft-ink);
        line-height: 1.7;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }

      .card {
        padding: 1.25rem;
      }

      .card h3 {
        margin-top: 0;
      }

      @media (max-width: 860px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatternsPageComponent {
  readonly notes: readonly PatternNote[] = [
    {
      title: 'Route-Level Providers',
      reason: 'The workshops feature owns its API, repository, and facade. That keeps feature state from becoming app-wide by accident.',
      fileAnchor: 'src/app/features/workshops/workshops.routes.ts'
    },
    {
      title: 'Repository as Server-State Boundary',
      reason: 'Loading, refresh, caching, and error handling live in one place so the rest of the feature consumes a stable snapshot.',
      fileAnchor: 'src/app/features/workshops/data-access/workshops.repository.ts'
    },
    {
      title: 'Facade as Orchestration Layer',
      reason: 'The facade merges repository snapshots with user-intent mutations and emits a view model tailored for the page.',
      fileAnchor: 'src/app/features/workshops/state/workshops.facade.ts'
    },
    {
      title: 'Command Streams for API Effects',
      reason: 'When each intent has different async semantics, separate subjects make the effect policies explicit before their results are reduced back into state.',
      fileAnchor: 'src/app/features/enrollment-effects/state/enrollment.facade.ts'
    },
    {
      title: 'Optimistic Writes with Rollback',
      reason: 'The optimistic updates feature applies a local patch immediately, then either confirms the authoritative server response or restores the previous entity on failure.',
      fileAnchor: 'src/app/features/optimistic-updates/state/optimistic-updates.facade.ts'
    },
    {
      title: 'Page-Level Dashboard Composition',
      reason: 'The dashboard composition feature keeps each repository independent, then merges their snapshots into one route-scoped view model without creating a fake global owner.',
      fileAnchor: 'src/app/features/dashboard-composition/state/dashboard-composition.facade.ts'
    },
    {
      title: 'Reactive Forms as Event Streams',
      reason: 'The catalog page treats form controls as observables, debounces them, and forwards intent instead of storing business state locally.',
      fileAnchor: 'src/app/features/workshops/pages/catalog-page.component.ts'
    }
  ];
}
