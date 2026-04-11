# Angular Review Checklist

Use this for code reviews, migrations, and architecture passes.

## Fast Review Order

1. Check file placement and naming consistency against `ABP-01`.
2. Check whether new Angular code is standalone and lazily loaded where appropriate: `ABP-02`.
3. Check component contracts and state model: `ABP-03` to `ABP-05`.
4. Check template control flow, `track`, and `OnPush`: `ABP-06` and `ABP-07`.
5. Check subscriptions, form typing, providers, and route-input binding: `ABP-08` to `ABP-10`, `ABP-16`.
6. Check performance, accessibility, and security edges: `ABP-11`, `ABP-12`, `ABP-18`, `ABP-19`, `ABP-20`.
7. Check compiler strictness, tests, and directive/style usage: `ABP-13`, `ABP-14`, `ABP-15`, `ABP-17`.

## Repo-Specific Notes

- Preserve feature slices under `src/app/features/*`.
- Favor facade services for feature view models when that pattern already exists.
- Keep route definitions close to each feature and lazy-load them from app routes.
- Existing project already uses signals, `inject()`, `takeUntilDestroyed()`, and `OnPush`. Treat regressions away from those patterns as real findings.
- Current test stack already uses Vitest. Keep generated tests aligned with Angular's current Vitest-first docs.

## Review Prompts

- Can this state move from manual subscription plumbing to signals or one boundary `toSignal()` bridge?
- Does any `@for` loop miss a stable `track` key?
- Does any new service need `providedIn: 'root'` or a smaller provider scope?
- Could route params map directly to `input()` instead of `ActivatedRoute` plumbing?
- Is `NgClass` or `NgStyle` used where normal bindings would be clearer and cheaper?
- Is `@HostBinding` or `@HostListener` used in new code where `host` metadata fits better?
- Is any template using untrusted HTML, URL, or style values unsafely?
- Does deferred content need an `aria-live` region or focus management?
- Is new animation code using deprecated `@angular/animations` instead of native CSS plus `animate.enter` / `animate.leave`?
- Is any non-critical UI eagerly loaded when `@defer` or lazy routing would be better?
- Would this route benefit from SSR or hydration later, and does current code keep that path open?
- Did a change weaken strictness instead of fixing types?

## Official Source Map

- Angular style guide: `https://angular.dev/style-guide`
- Signals guide: `https://angular.dev/guide/signals`
- Inputs guide: `https://angular.dev/guide/components/inputs`
- Outputs guide: `https://angular.dev/guide/components/outputs`
- Services and `inject()`: `https://angular.dev/guide/di/creating-and-using-services`
- Security best practices: `https://angular.dev/best-practices/security`
- Routing guide: `https://angular.dev/guide/routing`
- Read route state: `https://angular.dev/guide/routing/read-route-state`
- HTTP guide and interceptors: `https://angular.dev/guide/http`
- Extended diagnostics: `https://angular.dev/extended-diagnostics`
- NgOptimizedImage guide: `https://angular.dev/guide/image-optimization`
- Deferred loading with `@defer`: `https://angular.dev/guide/templates/defer`
- HostBinding API note: `https://angular.dev/api/core/HostBinding`
- NgClass API note: `https://angular.dev/api/common/NgClass`
- Testing guide: `https://angular.dev/guide/testing`
- Component harnesses: `https://angular.dev/guide/testing/using-component-harnesses`
- SSR guide: `https://v19.angular.dev/guide/ssr`
- Hydration guide: `https://v18.angular.dev/guide/hydration`
