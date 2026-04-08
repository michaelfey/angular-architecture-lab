import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { EnrollmentSession } from '../domain/enrollment.models';

@Component({
  selector: 'app-enrollment-session-card',
  standalone: true,
  template: `
    <article class="card">
      <div class="meta">
        <span>{{ session().track }}</span>
        <span>{{ session().dayLabel }} {{ session().startTime }}</span>
        <span>{{ seatsLeft() }} seats left</span>
      </div>

      <h3>{{ session().title }}</h3>
      <p>{{ session().summary }}</p>

      <dl>
        <div>
          <dt>Coach</dt>
          <dd>{{ session().coach }}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{{ session().isEnrolled ? 'Enrolled' : 'Not enrolled' }}</dd>
        </div>
      </dl>

      <footer>
        <button type="button" [disabled]="pending()" (click)="toggleRequested.emit(session().id)">
          {{ pending() ? 'Updating...' : session().isEnrolled ? 'Leave session' : 'Reserve seat' }}
        </button>
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
      footer,
      dl {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
        align-items: center;
      }

      .meta span,
      dd {
        margin: 0;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        background: rgba(20, 34, 53, 0.06);
        color: var(--page-soft-ink);
        font-size: 0.86rem;
      }

      h3,
      dt {
        margin: 0;
      }

      p {
        margin: 0;
        color: var(--page-soft-ink);
        line-height: 1.65;
      }

      dt {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--page-accent-strong);
      }

      footer {
        margin-top: auto;
      }

      button {
        padding: 0.8rem 1rem;
        border: none;
        border-radius: 999px;
        background: linear-gradient(135deg, var(--page-secondary), var(--page-accent));
        color: white;
      }

      button:disabled {
        opacity: 0.68;
        cursor: wait;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnrollmentSessionCardComponent {
  readonly session = input.required<EnrollmentSession>();
  readonly pending = input(false);
  readonly toggleRequested = output<string>();

  seatsLeft(): number {
    return Math.max(this.session().capacity - this.session().reservedSeats, 0);
  }
}
