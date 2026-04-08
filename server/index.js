const express = require('express');
const { resolveApiPort } = require('../config/api-port.cjs');

const app = express();
const port = resolveApiPort();

app.use(express.json());

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const workshops = [
  {
    id: 'facade-streams',
    title: 'Design Facades Around Streams',
    track: 'rxjs',
    difficulty: 'intermediate',
    durationHours: 6,
    featuredRank: 1,
    cohortSize: 18,
    summary:
      'Model UI events as mutations, merge them with server snapshots, and reduce the whole feature into a stable view model.',
    patterns: ['facade pattern', 'scan reducer', 'derived view models'],
    outcomes: [
      'Structure a facade as the orchestration layer of a feature',
      'Keep components focused on rendering and user intent',
      'Build stable view models that hide internal stream complexity'
    ],
    rxjsFocus: ['scan', 'shareReplay', 'combineLatest']
  },
  {
    id: 'route-scoped-di',
    title: 'Use Route-Level Providers Deliberately',
    track: 'architecture',
    difficulty: 'intermediate',
    durationHours: 4,
    featuredRank: 2,
    cohortSize: 16,
    summary:
      'Scope dependencies to the route tree so features own their services instead of leaking shared mutable state across the app.',
    patterns: ['route providers', 'feature ownership', 'dependency scope'],
    outcomes: [
      'Recognize when app-wide services become accidental global state',
      'Use route providers to keep feature dependencies local',
      'Trace how Angular creates and destroys scoped service graphs'
    ],
    rxjsFocus: ['defer', 'shareReplay']
  },
  {
    id: 'reactive-form-search',
    title: 'Turn Forms into Search Streams',
    track: 'rxjs',
    difficulty: 'intermediate',
    durationHours: 5,
    featuredRank: 3,
    cohortSize: 20,
    summary:
      'Treat form controls as streams, debounce them, and connect them to feature state without manual DOM event plumbing.',
    patterns: ['reactive forms', 'debounce', 'stream composition'],
    outcomes: [
      'Wire form controls to a facade with clear ownership',
      'Prevent over-emitting with debounce and distinct comparison',
      'Keep temporary input handling out of reducers'
    ],
    rxjsFocus: ['debounceTime', 'distinctUntilChanged', 'startWith']
  },
  {
    id: 'repository-caching',
    title: 'Hide Caching Behind a Repository',
    track: 'architecture',
    difficulty: 'advanced',
    durationHours: 5,
    featuredRank: 4,
    cohortSize: 14,
    summary:
      'Hide loading, refresh, and cache policy behind a repository so components and facades consume stable snapshots.',
    patterns: ['repository pattern', 'cache boundary', 'server state'],
    outcomes: [
      'Represent server state as an explicit repository snapshot',
      'Centralize refresh and error handling',
      'Prevent fetch logic from leaking into pages and widgets'
    ],
    rxjsFocus: ['switchMap', 'catchError', 'startWith']
  },
  {
    id: 'perf-budget-lab',
    title: 'Guard Rendering with Performance Budgets',
    track: 'performance',
    difficulty: 'advanced',
    durationHours: 3,
    featuredRank: 5,
    cohortSize: 12,
    summary:
      'Measure where templates and change detection get expensive, then use budgets to defend the fast path.',
    patterns: ['render budgets', 'change detection', 'profiling'],
    outcomes: [
      'Spot expensive reactive chains before they become architecture debt',
      'Frame performance work as an explicit contract',
      'Use budgets to decide where optimization is justified'
    ],
    rxjsFocus: ['auditTime', 'pairwise']
  },
  {
    id: 'contract-testing',
    title: 'Stabilize Features with Contract Tests',
    track: 'testing',
    difficulty: 'advanced',
    durationHours: 4,
    featuredRank: 6,
    cohortSize: 18,
    summary:
      'Write tests around feature boundaries so refactors preserve behavior instead of only preserving implementation details.',
    patterns: ['contract tests', 'boundary testing', 'behavioral specs'],
    outcomes: [
      'Test the facade boundary without over-coupling to internals',
      'Protect route and data seams as architecture evolves',
      'Use tests to document feature behavior'
    ],
    rxjsFocus: ['TestScheduler', 'firstValueFrom']
  }
];

let enrollmentSessions = [
  {
    id: 'arch-state-review',
    title: 'Architecture State Review',
    track: 'architecture',
    coach: 'Elena Park',
    summary: 'Trace a feature boundary, find hidden coupling, and map where state should actually live.',
    dayLabel: 'Monday',
    startTime: '09:00',
    capacity: 16,
    reservedSeats: 11,
    isEnrolled: false
  },
  {
    id: 'rxjs-search-lab',
    title: 'RxJS Search Lab',
    track: 'rxjs',
    coach: 'Marcus Vale',
    summary: 'Build debounced query streams, switch requests safely, and keep stale responses from winning.',
    dayLabel: 'Tuesday',
    startTime: '13:30',
    capacity: 18,
    reservedSeats: 15,
    isEnrolled: true
  },
  {
    id: 'contract-testing-clinic',
    title: 'Contract Testing Clinic',
    track: 'testing',
    coach: 'Nina Laurent',
    summary: 'Turn brittle integration assumptions into explicit contracts and failure-first fixtures.',
    dayLabel: 'Wednesday',
    startTime: '11:00',
    capacity: 14,
    reservedSeats: 9,
    isEnrolled: false
  },
  {
    id: 'render-budget-lab',
    title: 'Render Budget Lab',
    track: 'performance',
    coach: 'Jonas Veen',
    summary: 'Measure rendering cost, isolate the hot path, and set a budget the team can defend.',
    dayLabel: 'Thursday',
    startTime: '15:00',
    capacity: 12,
    reservedSeats: 12,
    isEnrolled: false
  }
];

let optimisticLabs = [
  {
    id: 'pairing-clinic',
    title: 'Pairing Clinic',
    track: 'architecture',
    coach: 'Mina Solberg',
    summary:
      'Pair through a feature boundary refactor and keep state ownership explicit while the shape changes.',
    capacity: 12,
    reservedSeats: 8,
    joined: false,
    behavior: 'stable'
  },
  {
    id: 'stream-debug-room',
    title: 'Stream Debug Room',
    track: 'rxjs',
    coach: 'Arun Sethi',
    summary:
      'Trace timing bugs, replay race conditions, and isolate where duplicate emissions actually begin.',
    capacity: 10,
    reservedSeats: 7,
    joined: true,
    behavior: 'stable'
  },
  {
    id: 'concurrency-clinic',
    title: 'Concurrency Clinic',
    track: 'testing',
    coach: 'Nora Beek',
    summary:
      'This room intentionally demonstrates rollback: the UI thinks one seat is free, but the server rejects the next join.',
    capacity: 8,
    reservedSeats: 7,
    joined: false,
    behavior: 'conflictOnJoin'
  },
  {
    id: 'render-budget-briefing',
    title: 'Render Budget Briefing',
    track: 'performance',
    coach: 'Luis Darzi',
    summary:
      'Reserve a spot to practice performance budgets, flamechart review, and render-cost tradeoffs.',
    capacity: 14,
    reservedSeats: 10,
    joined: false,
    behavior: 'stable'
  }
];

function sendError(response, status, message) {
  response.status(status).json({ message });
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, date: new Date().toISOString() });
});

app.get('/api/workshops', async (_request, response) => {
  await wait(350);
  response.json(workshops);
});

app.get('/api/enrollment-effects/sessions', async (request, response) => {
  const query = String(request.query.query || '').trim().toLowerCase();

  await wait(320);

  const filtered = enrollmentSessions.filter((session) => {
    if (!query) {
      return true;
    }

    return (
      session.title.toLowerCase().includes(query) ||
      session.track.toLowerCase().includes(query) ||
      session.coach.toLowerCase().includes(query) ||
      session.summary.toLowerCase().includes(query)
    );
  });

  response.json(filtered);
});

app.post('/api/enrollment-effects/sessions/:id/toggle', async (request, response) => {
  await wait(540);

  const session = enrollmentSessions.find((candidate) => candidate.id === request.params.id);

  if (!session) {
    sendError(response, 404, 'That session no longer exists.');
    return;
  }

  if (!session.isEnrolled && session.reservedSeats >= session.capacity) {
    sendError(response, 409, 'No seats are available for that session.');
    return;
  }

  const updatedSession = session.isEnrolled
    ? {
        ...session,
        isEnrolled: false,
        reservedSeats: Math.max(session.reservedSeats - 1, 0)
      }
    : {
        ...session,
        isEnrolled: true,
        reservedSeats: session.reservedSeats + 1
      };

  enrollmentSessions = enrollmentSessions.map((candidate) =>
    candidate.id === request.params.id ? updatedSession : candidate
  );

  response.json(updatedSession);
});

app.get('/api/optimistic-updates/labs', async (_request, response) => {
  await wait(320);
  response.json(optimisticLabs.map(({ behavior: _behavior, ...lab }) => lab));
});

app.post('/api/optimistic-updates/labs/:id/toggle', async (request, response) => {
  await wait(540);

  const current = optimisticLabs.find((lab) => lab.id === request.params.id);

  if (!current) {
    sendError(response, 404, 'That lab no longer exists.');
    return;
  }

  if (!current.joined && current.behavior === 'conflictOnJoin') {
    sendError(
      response,
      409,
      'Another participant claimed the last seat. The optimistic change was rolled back.'
    );
    return;
  }

  if (!current.joined && current.reservedSeats >= current.capacity) {
    sendError(response, 409, 'The server reports that the lab is already full.');
    return;
  }

  const updated = current.joined
    ? {
        ...current,
        joined: false,
        reservedSeats: Math.max(current.reservedSeats - 1, 0)
      }
    : {
        ...current,
        joined: true,
        reservedSeats: current.reservedSeats + 1
      };

  optimisticLabs = optimisticLabs.map((lab) => (lab.id === request.params.id ? updated : lab));

  const { behavior: _behavior, ...payload } = updated;
  response.json(payload);
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
