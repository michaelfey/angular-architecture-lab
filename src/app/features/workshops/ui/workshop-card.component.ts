import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Workshop } from '../domain/workshop.models';

@Component({
  selector: 'app-workshop-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="card">
      <div class="meta">
        <span>{{ workshop().track }}</span>
        <span>{{ workshop().difficulty }}</span>
        <span>{{ workshop().durationHours }}h</span>
      </div>

      <h3>{{ workshop().title }}</h3>
      <p>{{ workshop().summary }}</p>

      <div class="chips">
        @for (pattern of workshop().patterns; track pattern) {
          <span>{{ pattern }}</span>
        }
      </div>

      <footer>
        <button type="button" class="save" (click)="saveToggled.emit(workshop().id)">
          {{ saved() ? 'Unsave' : 'Save' }}
        </button>
        <a [routerLink]="['/workshops', workshop().id]">Open lesson</a>
      </footer>
    </article>
  `,
  styles: [
    `
      .card {
        display: grid;
        gap: 1rem;
        height: 100%;
        padding: 1.35rem;
        border: 1px solid var(--page-line);
        border-radius: 26px;
        background: var(--page-panel-strong);
        box-shadow: var(--page-shadow);
      }

      .meta,
      .chips,
      footer {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
        align-items: center;
      }

      .meta span,
      .chips span {
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        background: rgba(20, 34, 53, 0.06);
        color: var(--page-soft-ink);
        font-size: 0.86rem;
      }

      h3 {
        margin: 0;
        font-size: 1.32rem;
      }

      p {
        margin: 0;
        color: var(--page-soft-ink);
        line-height: 1.65;
      }

      footer {
        justify-content: space-between;
        margin-top: auto;
      }

      button,
      a {
        padding: 0.8rem 1rem;
        border-radius: 999px;
        border: none;
      }

      .save {
        background: var(--page-accent-soft);
        color: var(--page-accent-strong);
      }

      a {
        background: linear-gradient(135deg, var(--page-secondary), var(--page-accent));
        color: white;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkshopCardComponent {
  readonly workshop = input.required<Workshop>();
  readonly saved = input(false);
  readonly saveToggled = output<string>();
}
