import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { OptimisticLab } from '../domain/optimistic-updates.models';

@Component({
  selector: 'app-optimistic-lab-card',
  standalone: true,
  template: `
    <article class="card" [class.rolled-back]="rolledBack()">
      <div class="meta">
        <span>{{ lab().track }}</span>
        <span>{{ lab().reservedSeats }}/{{ lab().capacity }} seats</span>
        <span>{{ seatsLeft() }} left</span>
      </div>

      <h3>{{ lab().title }}</h3>
      <p>{{ lab().summary }}</p>

      <dl>
        <div>
          <dt>Coach</dt>
          <dd>{{ lab().coach }}</dd>
        </div>
        <div>
          <dt>State</dt>
          <dd>
            @if (pending()) {
              Pending confirmation
            } @else if (lab().joined) {
              Joined
            } @else {
              Not joined
            }
          </dd>
        </div>
      </dl>

      @if (rolledBack()) {
        <p class="warning">Last write was rolled back by the server.</p>
      }

      <footer>
        <button
          type="button"
          [disabled]="pending() || isJoinBlocked()"
          (click)="reservationToggled.emit(lab().id)"
        >
          {{ buttonLabel() }}
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

      .rolled-back {
        border-color: rgba(187, 79, 63, 0.38);
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

      .warning {
        color: var(--page-danger);
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
        cursor: not-allowed;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimisticLabCardComponent {
  readonly lab = input.required<OptimisticLab>();
  readonly pending = input(false);
  readonly rolledBack = input(false);
  readonly reservationToggled = output<string>();

  buttonLabel(): string {
    if (this.pending()) {
      return 'Waiting for server...';
    }

    if (this.lab().joined) {
      return 'Leave lab';
    }

    return this.isJoinBlocked() ? 'Lab full' : 'Reserve seat';
  }

  seatsLeft(): number {
    return Math.max(this.lab().capacity - this.lab().reservedSeats, 0);
  }

  isJoinBlocked(): boolean {
    return !this.lab().joined && this.lab().reservedSeats >= this.lab().capacity;
  }
}
