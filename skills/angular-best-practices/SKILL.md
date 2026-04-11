---
name: angular-best-practices
description: Modern Angular 21+ code-generation, refactoring, and review guidance for Angular applications. Use when Codex is asked to create, scaffold, implement, rewrite, or review Angular components, templates, services, routes, forms, facades, state, performance improvements, or security-sensitive UI code and should apply current angular.dev best practices with concrete compliant examples.
---

# Angular Best Practices

Use this skill first for Angular code generation, then for refactors, architecture reviews, and standards enforcement.

Default to current Angular guidance, but keep repo consistency inside each file and feature slice.

## Defaults

- Prefer standalone APIs over new NgModule-based code.
- Prefer `inject()` for dependency access in new code.
- Prefer signals for local synchronous state and derived view models.
- Prefer `input()`, `output()`, and `model()` for component APIs in new code.
- Prefer built-in template syntax (`@if`, `@for`, `@switch`, `@let`) over older structural-directive syntax or repeated long expressions in touched templates.
- Prefer `ChangeDetectionStrategy.OnPush` for presentational and container components unless there is a concrete reason not to.
- Prefer route-level lazy loading with `loadComponent` and `loadChildren`.
- Prefer `class` and `style` bindings over `NgClass` and `NgStyle`.
- Prefer `host` metadata over `@HostBinding` and `@HostListener` in new code.
- Preserve existing project conventions when a file already uses an older style and a full migration is out of scope.

## Repo Fit

This repo already leans toward modern Angular:

- feature-first slices under `src/app/features/*`
- facade-style state services
- standalone routes and components
- signals plus RxJS interop in state code
- strict TypeScript and strict Angular template settings in [tsconfig.json](/Users/michaelfeyaerts/IdeaProjects/angular-architecture-lab/tsconfig.json)

Keep those strengths. Modernize locally instead of flattening architecture or forcing a different state pattern.

## Workflow

1. Identify task shape: generate, refactor, review, or migrate.
2. Read [standards.md](./references/standards.md) first.
3. For new code, read [generation-playbook.md](./references/generation-playbook.md) before writing files.
4. For reviews, migrations, performance work, or security-sensitive changes, read [review-checklist.md](./references/review-checklist.md).
5. Apply only standards relevant to touched code. Do not trigger broad rewrites unless user asks.
6. When user asks for "latest", "current", or version-sensitive guidance, verify against official `angular.dev` docs before making claims.

## Review Output

- Findings first.
- Cite violated standard IDs like `ABP-04` or `ABP-09`.
- Give minimal fix path and compliant example when useful.
- Separate hard issues from optional polish.

## Generation Output

- Generate production-ready Angular 21+ code by default.
- Treat generation requests as primary trigger for this skill.
- Keep imports explicit and local.
- Match existing naming and folder conventions in touched feature slice.
- Prefer complete slices over isolated snippets when user asks for a feature.
- Generate code that already follows standards instead of writing legacy Angular then suggesting cleanup.
- Include only comments that explain non-obvious decisions.

## Reference Map

- [standards.md](./references/standards.md): Core Angular standards with examples for each rule.
- [generation-playbook.md](./references/generation-playbook.md): Default generation patterns for components, routes, facades, forms, and data access.
- [review-checklist.md](./references/review-checklist.md): Fast review checklist, repo-specific notes, and official source map.

## Example Requests

- "Use $angular-best-practices to review this standalone component for Angular 21 issues."
- "Use $angular-best-practices to refactor this feature to signals and control-flow blocks."
- "Use $angular-best-practices to generate a typed reactive form and lazy route."
- "Use $angular-best-practices to scaffold a new Angular feature with page, facade, service, routes, and UI component."
