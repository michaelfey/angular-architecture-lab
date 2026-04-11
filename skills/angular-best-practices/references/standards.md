# Angular Best Practices Standards

Target stack: Angular 21+ and current `angular.dev` guidance as of 2026-04-11.

Use standard IDs in reviews.

## ABP-01: Structure by feature and keep naming predictable

Use feature-first folders. Keep one main concept per file. Match file names to primary exported symbol with hyphen-case file names and same stem for component `.ts`, `.html`, and `.css`.

Prefer:

```text
src/app/features/workshops/
  data-access/workshops-api.service.ts
  pages/catalog-page.component.ts
  state/workshops.facade.ts
  ui/workshop-card.component.ts
```

Avoid:

```text
src/app/components/WorkshopCard.ts
src/app/services/api.ts
src/app/misc/helpers.ts
```

## ABP-02: Default to standalone building blocks and lazy routes

Use standalone components, directives, and pipes for new code. Lazy-load routes with `loadComponent` or `loadChildren`.

Prefer:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-patterns-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './patterns-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatternsPageComponent {}
```

```ts
export const routes = [
  {
    path: 'patterns',
    loadComponent: () =>
      import('./features/patterns/patterns-page.component').then((m) => m.PatternsPageComponent)
  }
];
```

Avoid:

```ts
@NgModule({
  declarations: [PatternsPageComponent]
})
export class PatternsModule {}
```

## ABP-03: Use function-based component APIs in new code

Use `input()`, `output()`, and `model()` for component contracts in new code. Keep names clear and domain-specific.

Prefer:

```ts
import { Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-enrollment-card',
  standalone: true,
  template: `...`
})
export class EnrollmentCardComponent {
  readonly workshopId = input.required<string>();
  readonly selected = model(false);
  readonly removed = output<string>();

  remove(): void {
    this.removed.emit(this.workshopId());
  }
}
```

Avoid:

```ts
@Input() workshopId!: string;
@Input() selected = false;
@Output() removed = new EventEmitter<string>();
```

## ABP-04: Prefer signals for local synchronous state and derived view models

Use `signal()` for writable local state and `computed()` for derivations. Keep impure work at boundaries.

Prefer:

```ts
import { computed, signal } from '@angular/core';

const query = signal('');
const savedIds = signal<string[]>([]);

const hasFilters = computed(() => query().length > 0 || savedIds().length > 0);
```

When data starts as an Observable, bridge once:

```ts
import { toSignal } from '@angular/core/rxjs-interop';

readonly snapshot = toSignal(this.repository.snapshot$, { initialValue: INITIAL_SNAPSHOT });
```

Avoid:

```ts
readonly query$ = new BehaviorSubject('');
readonly hasFilters$ = this.query$.pipe(map((query) => query.length > 0));
```

Use RxJS when stream composition is primary. Use signals when view state is primary.

## ABP-05: Prefer `inject()` and tree-shakable providers

Use `inject()` in Angular-managed classes. Use `@Injectable({ providedIn: 'root' })` for most app-wide services.

Prefer:

```ts
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WorkshopsRepository {
  private readonly api = inject(WorkshopsApiService);
}
```

Avoid:

```ts
@Injectable()
export class WorkshopsRepository {
  constructor(private readonly api: WorkshopsApiService) {}
}
```

Constructor injection is still valid, but `inject()` is default for new Angular code.

## ABP-06: Use modern template syntax, `@let`, and stable list tracking

Prefer `@if`, `@for`, `@switch`, and `@let` in touched templates. Use `@let` to avoid repeating long signal reads, async-derived values, or nested property access. Always provide a stable `track` expression for `@for`.

Prefer:

```html
@let viewModel = vm();

@if (viewModel.loading) {
  <p>Loading...</p>
} @else {
  <ul>
    @for (workshop of viewModel.visibleWorkshops; track workshop.id) {
      <li>{{ workshop.title }}</li>
    } @empty {
      <li>No workshops found.</li>
    }
  </ul>
}
```

Avoid:

```html
<div *ngIf="vm().loading; else list">Loading...</div>
<ng-template #list>
  <li *ngFor="let workshop of vm().visibleWorkshops">{{ workshop.title }}</li>
</ng-template>
```

Also avoid repeated expensive-looking or noisy expressions:

```html
<h2>{{ vm().workshop.title }}</h2>
<p>{{ vm().workshop.summary }}</p>
<span>{{ vm().workshop.track }}</span>
```

Prefer:

```html
@let workshop = vm().workshop;

<h2>{{ workshop.title }}</h2>
<p>{{ workshop.summary }}</p>
<span>{{ workshop.track }}</span>
```

## ABP-07: Use `OnPush`, small templates, and template-safe member visibility

Default components to `ChangeDetectionStrategy.OnPush`. Expose only what templates need. Mark members used only by template as `protected`. Mark Angular-initialized properties `readonly` when they should not be reassigned.

Prefer:

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  templateUrl: './catalog-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogPageComponent {
  protected readonly facade = inject(WorkshopsFacade);
  protected readonly vm = this.facade.vm;
}
```

Avoid:

```ts
export class CatalogPageComponent {
  public facade = inject(WorkshopsFacade);
  public vm = this.facade.vm;
}
```

## ABP-08: Keep side effects at edges and clean up RxJS automatically

Do not scatter subscriptions across helpers or models. Subscribe at integration points and use `takeUntilDestroyed()` for component-lifetime cleanup.

Prefer:

```ts
this.filters.controls.query.valueChanges
  .pipe(
    startWith(this.filters.controls.query.value),
    debounceTime(180),
    distinctUntilChanged(),
    takeUntilDestroyed()
  )
  .subscribe((query) => this.facade.setQuery(query));
```

Avoid:

```ts
private subscription = new Subscription();

ngOnInit(): void {
  this.subscription.add(
    this.filters.controls.query.valueChanges.subscribe((query) => this.facade.setQuery(query))
  );
}

ngOnDestroy(): void {
  this.subscription.unsubscribe();
}
```

Avoid nested subscriptions. Flatten streams or bridge once into signals.

## ABP-09: Prefer typed reactive forms for non-trivial forms

Use typed `FormGroup` and `FormControl` definitions for complex or shared forms. Keep defaults non-null when possible.

Prefer:

```ts
type FiltersForm = FormGroup<{
  query: FormControl<string>;
  showSavedOnly: FormControl<boolean>;
}>;

readonly filters: FiltersForm = new FormGroup({
  query: new FormControl('', { nonNullable: true }),
  showSavedOnly: new FormControl(false, { nonNullable: true })
});
```

Avoid:

```ts
readonly filters = new FormGroup({
  query: new FormControl(),
  showSavedOnly: new FormControl()
});
```

## ABP-10: Prefer functional providers and HTTP setup close to bootstrap

Register platform services with provider functions such as `provideRouter()` and `provideHttpClient()`. Prefer functional interceptors for predictable ordering.

Prefer:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        (req, next) => next(req.clone({ setHeaders: { 'X-App-Version': '1' } }))
      ])
    )
  ]
};
```

Avoid:

```ts
@NgModule({
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AppInterceptor, multi: true }
  ]
})
export class CoreModule {}
```

## ABP-11: Load non-critical UI lazily and optimize images

Use `@defer` for below-the-fold or secondary UI. Use `NgOptimizedImage` for important images and include real dimensions.

Prefer:

```html
@defer (on viewport) {
  <app-recommendations-panel />
} @placeholder {
  <p>Loading recommendations...</p>
}
```

```html
<img
  ngSrc="/assets/workshops/hero.webp"
  width="1200"
  height="630"
  priority
  alt="Workshop overview" />
```

Avoid:

```html
<app-recommendations-panel />
<img src="/assets/workshops/hero.webp" alt="Workshop overview" />
```

## ABP-12: Keep Angular security model intact

Treat template values as untrusted. Let Angular sanitize HTML, style, and URL contexts. Avoid direct DOM APIs and avoid `bypassSecurityTrust*` unless there is a documented, reviewed reason.

Prefer:

```ts
readonly safePreviewHtml = computed(() => this.previewHtml());
```

```html
<article [innerHTML]="safePreviewHtml()"></article>
```

Avoid:

```ts
readonly html = this.sanitizer.bypassSecurityTrustHtml(userSuppliedHtml);
elementRef.nativeElement.innerHTML = userSuppliedHtml;
```

If bypass is unavoidable, isolate it in one reviewed adapter and document trust boundary.

## ABP-13: Keep strict template checks and extended diagnostics on

Do not weaken `strictTemplates` to silence template issues. Prefer fixing the binding, import, or type problem.

Prefer:

```json
{
  "angularCompilerOptions": {
    "strictTemplates": true,
    "extendedDiagnostics": {
      "defaultCategory": "warning"
    }
  }
}
```

Avoid:

```json
{
  "angularCompilerOptions": {
    "strictTemplates": false
  }
}
```

## ABP-14: Prefer `class` and `style` bindings over `NgClass` and `NgStyle`

Angular style guide recommends built-in `class` and `style` bindings because they are simpler and avoid directive overhead.

Prefer:

```html
<article
  [class.is-selected]="selected()"
  [class.is-featured]="workshop.featured"
  [style.background-color]="accentColor()">
</article>
```

Avoid:

```html
<article
  [ngClass]="{ 'is-selected': selected(), 'is-featured': workshop.featured }"
  [ngStyle]="{ 'background-color': accentColor() }">
</article>
```

## ABP-15: Prefer `host` metadata over `@HostBinding` and `@HostListener`

Angular docs mark `@HostBinding` and `@HostListener` as backwards-compatibility APIs. Prefer the `host` property in new components and directives.

Prefer:

```ts
@Directive({
  selector: '[appFocusableCard]',
  host: {
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[class.is-disabled]': 'disabled()',
    '(keydown.enter)': 'activate()'
  }
})
export class FocusableCardDirective {
  readonly disabled = input(false);

  activate(): void {}
}
```

Avoid:

```ts
export class FocusableCardDirective {
  @HostBinding('attr.tabindex') get tabIndex() {
    return this.disabled ? -1 : 0;
  }

  @HostListener('keydown.enter')
  activate(): void {}
}
```

## ABP-16: Prefer route-to-input binding over manual `ActivatedRoute` plumbing when possible

When route params, query params, or resolved data map directly to component inputs, enable router component input binding and consume them as inputs.

Prefer:

```ts
provideRouter(routes, withComponentInputBinding());
```

```ts
@Component({
  standalone: true,
  template: `...`
})
export class WorkshopDetailPageComponent {
  readonly id = input.required<string>();
}
```

Avoid:

```ts
export class WorkshopDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly id = signal('');

  constructor() {
    this.route.params.subscribe((params) => this.id.set(params['id']));
  }
}
```

Use manual `ActivatedRoute` access only when route composition is more complex than direct input binding.

## ABP-17: Generate and colocate focused tests

Angular style guide recommends colocating unit tests with code-under-test. Current Angular testing docs use Vitest by default in CLI projects. Generate tests for stateful services, facades, and components that contain interaction or rendering logic.

Prefer:

```text
src/app/features/workshops/state/workshops.facade.ts
src/app/features/workshops/state/workshops.facade.spec.ts
src/app/features/workshops/pages/catalog-page.component.ts
src/app/features/workshops/pages/catalog-page.component.spec.ts
```

Testing defaults:

- Test services and facades with `TestBed`
- Test routed flows with `RouterTestingHarness`
- Create component harnesses for shared interactive UI used in many places
- Avoid brittle DOM-selector assertions when a harness or public behavior assertion is clearer

## ABP-18: Build accessibility into template generation

Use native elements first, then ARIA where semantics need augmentation. When using `@defer`, consider whether loaded content must be announced to assistive technologies.

Prefer:

```html
<button type="button" (click)="save()">Save</button>

<section aria-live="polite">
  @defer (on viewport) {
    <app-search-results />
  } @placeholder {
    <p>Loading results...</p>
  }
</section>
```

Avoid:

```html
<div role="button" (click)="save()">Save</div>

@defer (on viewport) {
  <app-search-results />
}
```

Accessibility is not polish. Treat missing semantics, focus management, and unread announced state changes as real defects.

## ABP-19: Prefer SSR plus hydration for public or performance-sensitive apps

Angular recommends SSR and hydration when performance, Core Web Vitals, or SEO matter. If an app or route is public-facing, content-heavy, or slow on first load, prefer SSR-capable architecture.

Prefer:

- SSR or hybrid rendering for public pages
- hydration-safe templates and valid HTML
- no direct DOM writes that break hydration
- explicit `<tbody>` in tables
- consistent whitespace configuration between client and server builds

If SSR is out of scope, still keep code hydration-safe so migration stays cheap.

## ABP-20: Prefer native CSS animations with `animate.enter` and `animate.leave`

Angular deprecated `@angular/animations` for new work. Prefer native CSS animations and the compiler-supported `animate.enter` and `animate.leave` features.

Prefer:

```html
@if (isOpen()) {
  <aside class="drawer" animate.enter="drawer-enter" animate.leave="drawer-leave">
    ...
  </aside>
}
```

Avoid:

```ts
import { animate, style, transition, trigger } from '@angular/animations';
```

Use legacy animation APIs only when touching existing animation-heavy code that is not being migrated in this task.

## Selection Guidance

- Component contract work: `ABP-03`, `ABP-06`, `ABP-07`
- Facades, stores, and view models: `ABP-04`, `ABP-05`, `ABP-08`
- Routing and bootstrap: `ABP-02`, `ABP-10`, `ABP-11`, `ABP-16`, `ABP-19`
- Forms: `ABP-09`
- Security-sensitive rendering: `ABP-12`, `ABP-18`
- Styling and host integration: `ABP-14`, `ABP-15`, `ABP-20`
- Testing and CI hygiene: `ABP-13`, `ABP-17`
