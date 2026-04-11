# Angular Generation Playbook

Use this file when creating new Angular code, not only when reviewing existing code.

## Default Generation Shape

When user asks for a new feature, prefer feature slice structure:

```text
src/app/features/feature-name/
  data-access/
  domain/
  pages/
  state/
  ui/
  feature-name.routes.ts
```

Generate only folders needed for task. Do not create empty layers for show.

## Default Choices For New Code

- Standalone components
- `ChangeDetectionStrategy.OnPush`
- `inject()` over constructor injection
- Signals for local and facade state
- `computed()` for view models
- Typed reactive forms for non-trivial forms
- `@if`, `@for`, `@switch`, `@let`, and `@defer` in templates where relevant
- Lazy routes via `loadComponent` or `loadChildren`
- Provider functions at bootstrap boundaries
- `class` and `style` bindings instead of `NgClass` and `NgStyle`
- `host` metadata instead of `@HostBinding` and `@HostListener`
- colocated tests for meaningful component, facade, and service logic

## Recipe: New Page

Generate:

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeatureFacade } from '../state/feature.facade';

@Component({
  selector: 'app-feature-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './feature-page.component.html',
  styleUrl: './feature-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturePageComponent {
  protected readonly facade = inject(FeatureFacade);
  protected readonly vm = this.facade.vm;
}
```

Template default:

```html
@let viewModel = vm();

@if (viewModel.loading) {
  <p>Loading...</p>
} @else if (viewModel.error; as error) {
  <p>{{ error }}</p>
} @else {
  @for (item of viewModel.items; track item.id) {
    <app-feature-card [item]="item" />
  } @empty {
    <p>No items yet.</p>
  }
}
```

## Recipe: New Facade

Prefer facade for feature-local orchestration and view model derivation.

```ts
import { computed, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FeatureRepository, INITIAL_SNAPSHOT } from '../data-access/feature.repository';

type LocalState = {
  readonly query: string;
};

const INITIAL_LOCAL_STATE: LocalState = {
  query: ''
};

@Injectable()
export class FeatureFacade {
  private readonly repository = inject(FeatureRepository);
  private readonly snapshot = toSignal(this.repository.snapshot$, {
    initialValue: INITIAL_SNAPSHOT
  });
  private readonly localState = signal(INITIAL_LOCAL_STATE);

  readonly state = computed(() => ({
    ...this.snapshot(),
    ...this.localState()
  }));

  readonly vm = computed(() => {
    const state = this.state();

    return {
      ...state,
      hasQuery: state.query.length > 0
    };
  });

  setQuery(query: string): void {
    this.localState.update((state) => ({
      ...state,
      query: query.trim()
    }));
  }

  refresh(): void {
    this.repository.refresh();
  }
}
```

## Recipe: Typed Reactive Form

```ts
type FeatureForm = FormGroup<{
  title: FormControl<string>;
  published: FormControl<boolean>;
}>;

readonly form: FeatureForm = new FormGroup({
  title: new FormControl('', { nonNullable: true }),
  published: new FormControl(false, { nonNullable: true })
});
```

Bridge into facade with `takeUntilDestroyed()` when form stream drives state.

## Recipe: Data Access Service

Keep HTTP and transport mapping in data-access layer. Keep UI formatting out.

```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FeatureApiService {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<FeatureDto[]>('/api/features');
  }
}
```

## Recipe: Route File

```ts
import { Route } from '@angular/router';
import { FeatureFacade } from './state/feature.facade';

export const FEATURE_ROUTES: Route[] = [
  {
    path: '',
    providers: [FeatureFacade],
    loadComponent: () =>
      import('./pages/feature-page.component').then((m) => m.FeaturePageComponent)
  }
];
```

If params map directly to component state, prefer router component input binding at bootstrap:

```ts
provideRouter(routes, withComponentInputBinding());
```

Then consume route data with `input()` in routed components instead of manual `ActivatedRoute` subscriptions.

## Recipe: Host Bindings

Prefer `host` metadata:

```ts
@Component({
  selector: 'app-pill',
  standalone: true,
  template: `{{ label() }}`,
  host: {
    '[class.is-active]': 'active()',
    '[attr.aria-pressed]': 'active()',
    '(click)': 'toggle()'
  }
})
export class PillComponent {
  readonly label = input.required<string>();
  readonly active = model(false);

  toggle(): void {
    this.active.update((value) => !value);
  }
}
```

## Recipe: Test Generation

Generate tests when code contains behavior worth protecting.

- Component tests: rendering, inputs/outputs, user interactions
- Facade tests: derived view models and mutations
- Service tests: transport mapping and edge cases
- Routed page tests: `RouterTestingHarness`
- Shared reusable UI: component harness if many consumers depend on it

For tiny presentational components with trivial markup, skip test generation unless user asked for full coverage.

## Anti-Patterns To Avoid While Generating

- New NgModule boilerplate for normal feature work
- Untracked `@for` loops
- Repeating `vm()` or deep property chains many times instead of introducing `@let`
- `any` in form or HTTP contracts
- Manual subscription cleanup with `Subscription` bags in components
- Large smart templates with business logic inline
- Direct DOM writes for rendered HTML
- `NgClass` and `NgStyle` when normal `class` or `style` bindings are enough
- `@HostBinding` and `@HostListener` in brand-new code
- Eager top-level route imports when lazy loading fits

## When To Bend These Defaults

- Match old style inside file when user asked for minimal patch only
- Use RxJS streams directly when async stream composition is core behavior
- Skip facade layer for tiny leaf components with no orchestration
- Keep decorator-based inputs or outputs when touching stable legacy code only lightly
