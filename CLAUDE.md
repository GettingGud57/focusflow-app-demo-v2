# FocusFlow

A **composable routine engine**, not a Pomodoro app. Tasks have durations,
workflows are ordered sequences of tasks, and **workflows can nest inside
workflows** with loop counts. That recursion is why `client/src/lib/dagValidation.ts`
exists — nesting makes cycles possible.

Single-user. Built and used by one person; there is no auth yet.

## Stack

One Express process serves **both** the API and the built React SPA on a single
port. Originally scaffolded on Replit (hence the leftover `@replit/vite-plugin-*`
devDeps).

- **Frontend** React 18 + TS, Vite, **wouter** (not react-router), TanStack
  **Query** (not TanStack Router), shadcn/ui on Radix + Tailwind 3
- **Backend** Express 4, Drizzle ORM → `node-postgres`, hosted Postgres (Neon)
- **Native** Capacitor 8 (Android only), `@capacitor/local-notifications`
- **Build** `script/build.ts` — Vite for the client, esbuild bundles the server
  into one `dist/index.cjs`

```
client/src/{pages,components,hooks,lib}
server/{index,routes,storage,db,static,vite}.ts
shared/{schema,routes}.ts     ← imported by BOTH client and server
android/                      ← Capacitor, generated but committed
```

`shared/` is the best thing in here: client and server both import
`@shared/routes`, so endpoint paths and Zod validation cannot drift apart.

## Running it

```bash
npm run dev      # Express + Vite-in-middleware-mode on one port
npm run build    # client -> dist/public, server -> dist/index.cjs
npm run db:push  # drizzle-kit, reads shared/schema.ts
npm run check    # tsc
```

- **`npm run dev` does NOT watch the server.** It's `tsx server/index.ts` with no
  `--watch`, so changes to `server/`, `shared/schema.ts` or `shared/routes.ts`
  need a manual restart. Only the client hot-reloads.
- **Vite runs in middleware mode inside Express** (`server/vite.ts`), so there is
  no second dev port and no proxy config. `npm run client` would start a bare
  Vite on 5173 with no API — don't use it.
- **`PORT=3000` in `.env`** because macOS AirPlay Receiver squats on 5000.

## Architecture decisions worth not re-litigating

- **Same-origin by design.** One process serves the SPA and the API, so there is
  no CORS anywhere and `cors` isn't even installed. Keep it that way unless
  bundling assets into the APK forces otherwise.
- **The timer computes from the wall clock**, never by counting ticks.
  `activeTimer` stores `{ taskId, startTime, totalDuration }` and remaining time
  is `total - (now - startTime)`. This is why sleeping the phone doesn't drift it.
- **Overtime replaced a grace period.** At zero the timer keeps counting *up*
  indefinitely; nothing auto-completes. `Done` = completed, `Reset` = abandoned.
  The app signals the boundary and never decides for you. There is no
  `Math.max(0, …)` on remaining time — negative *is* overtime.
- **Flow mode** (`autoAdvance` in DataContext) auto-starts the next step at zero.
  Mutually exclusive with overtime by construction.
- **Shared state lives in `DataContext`**, not in `useSession`. `useSession` holds
  `useState`, so calling it from two places creates two independent copies
  fighting over the same localStorage key. `autoAdvance` and `activeTimer` are in
  DataContext precisely because `TimerDisplay` and `useAlarm` both need them.
- **`useAlarm` is mounted above the router** in `App.tsx`, not in `TimerDisplay`,
  so the alarm fires on any page.
- **Chat history is one table with a `jsonb` messages column**, not a child table.
  A message has no independent query pattern — you always read or replace a whole
  thread.

## Landmines

Each of these cost real debugging time.

**Build / deploy**
- **Never set `NODE_ENV=production` as a host env var.** Vite is a devDependency,
  npm skips devDeps when that's set, and the build dies with `vite: not found`.
  `npm start` already sets it inline.

**CSS / Tailwind**
- **`calc()` needs whitespace around `+`, and Tailwind arbitrary values can't
  contain a literal space — use `_`.** `pb-[calc(5rem+env(...))]` is invalid and
  silently dropped; `pb-[calc(5rem_+_env(...))]` works.
- **`button.tsx` has `[&_svg]:size-4`**, a descendant selector that outranks an
  icon's own `w-6`/`w-8`. Every icon inside a `<Button>` renders at 16px unless
  you use `!w-8 !h-8`. `w-4 h-4` coincidentally matches, which is why it hides.
- SVG rings need a `viewBox` or their user units are CSS pixels and they clip.
- `env(safe-area-inset-*)` is 0 unless `viewport-fit=cover` is in the viewport meta.

**React**
- **StrictMode double-invokes state updaters.** Never put a side effect inside
  `setState(prev => …)` — it fires twice in dev. Compute from a ref outside.
- **Radix `Select` doesn't fire `onValueChange` when you pick the already-selected
  value.** `ItemSelect` catches that with `onPointerUp` to support "restart".
- Latches keyed on a prop that can repeat will stick. `hasCompletedRef` keyed on
  `taskId` stalled any workflow with the same task in two consecutive steps —
  it's keyed on `activeTimer.startTime` (the run) now.

**Web platform**
- **`crypto.randomUUID()` is secure-context only** — undefined over plain http
  from a LAN IP. Use `lib/newId.ts`. Same rule blocks service workers and the
  Notification API, so PWA install needs HTTPS.
- Background tabs get their intervals throttled; check `visibilitychange` to
  resync promptly.
- An `AudioContext` can only be resumed **inside a user gesture**. `unlockAudio()`
  is called from `startTimer` because that's the only guaranteed gesture path.

**Drizzle / Postgres**
- **`notNull()` columns with no default become REQUIRED in `createInsertSchema`**,
  and validation runs before storage's `?? DEFAULT_USER_ID` fallback. Mark
  `userId` optional in insert schemas rather than posting a placeholder from the
  client.
- `duration` is `real`, not `integer`, on purpose — see the escape hatch below.
- Use Neon's **direct** connection string, not the pooled one. `drizzle-kit push`
  needs direct, and one long-lived Express process doesn't need a second pooler.

**Capacitor / Android**
- **Capacitor 8 plugins need a Java 21 toolchain.** Android Studio's bundled JBR
  may be 17. `android/gradle.properties` points Gradle at a Homebrew
  `openjdk@21` — that path is machine-specific.
- `SCHEDULE_EXACT_ALARM` is **already merged in** from the plugin's own manifest;
  the docs telling you to add it by hand are stale for 8.3.x. `USE_EXACT_ALARM`
  was added by hand.
- **`allowWhileIdle` notifications fire at most once per 9 minutes per app.** This
  is why the flow-mode chain can't be fully pre-scheduled for short steps.
- **Honor (MagicOS) freezes background apps** ("AppFastHibernation" in
  logcat). AlarmManager still fires on time, but the broadcast to the frozen
  process is held until the app is reopened, so the notification arrives late
  in a pile with the in-app catch-up. Exempting the app from battery
  optimisation fixed it on the dev phone. If it regresses, the real fix is a
  foreground service during a run (what Forest does), not more alarm flags.
- The plugin's `default` channel is IMPORTANCE_DEFAULT with no sound of ours —
  silent in practice. The timer uses its own `timer_done_v1` channel; channel
  sound/importance are frozen once created, so bump the id to change them.
- Notification sounds must live in `android/app/src/main/res/raw/` (lowercase,
  `.wav` preferred) and need a notification channel on Android 8+. Web assets in
  `client/public/sounds/` are invisible to a notification.

## Quirks

- **`-404` in a task's duration field** is a debug escape hatch: it becomes `0.1`
  minutes (6 seconds) for testing timers. See `client/src/lib/schemas.ts`.
- `DataContext.tsx` contains a ~250-line commented-out legacy provider (the old
  localStorage-only version). The live one is the first `DataProvider`.
- `advance()` in `use-session.ts` is the single choke point for all progression —
  step, cycle, workflow end, single task, Done and Skip. Any per-completion side
  effect belongs there and nowhere else.
- `onComplete` and `onSkip` are currently **the same function**. They should
  become `advance(wasSkipped)`, and the call sites must be wrapped in arrow
  functions or React passes the MouseEvent as the first argument.

## Known gaps

- **Auth is one shared token, not accounts.** `server/auth.ts` requires
  `Authorization: Bearer $ACCESS_TOKEN` on every `/api` route and fails closed
  (503) if the env var is unset — set it on the host *before* deploying.
  `lib/accessToken.ts` wraps `window.fetch` to attach it, and `AccessGate` asks
  for it once per device; any 401 clears it. Data is still all `"default-user"` /
  `"system_seed"`; `passport`, `express-session` and `connect-pg-simple` are
  installed and unused. Keep it a **bearer token, not a cookie** — the Capacitor
  WebView goes cross-origin if assets are ever bundled.
- **`/api/ai/generate` is unthrottled** (only gated by the token), and falls back
  to the server's Groq key.
- **Nothing records completions.** `advance()` fires confetti and writes nothing,
  so "did this help me finish things" is unanswerable. A `sessions` table with
  one row per step is the planned fix.
- **Pause corrupts planned duration.** `toggleTimer` calls
  `startTimer(taskId, timeLeft / 60)`, overwriting `totalDuration` with the
  *remaining* time. Needs a `pausedMs` accumulator before session logging can be
  trusted.
- Nested workflow loops are expanded at flatten time (static) while the top-level
  loop is dynamic state — an inconsistency in the model.
