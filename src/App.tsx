import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/AppShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useInitialSync } from '@/hooks/useInitialSync'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'

// `basename` is derived from Vite's `base` config (set in
// vite.config.ts). Single source of truth — change the project name
// there and routing follows.
const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '')

/* ── Lazy routes ─────────────────────────────────────────────────────
   Each page is its own JS chunk so the first paint only ships Home +
   the AppShell skeleton. Other pages download on first visit and are
   cached afterwards. Useful on slow links at the fields where users
   may only ever open Home + their personal view.
   ─────────────────────────────────────────────────────────────────── */
const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })))
const Schedule = lazy(() =>
  import('@/pages/Schedule').then((m) => ({ default: m.Schedule })),
)
const Bracket = lazy(() =>
  import('@/pages/Bracket').then((m) => ({ default: m.Bracket })),
)
const Standings = lazy(() =>
  import('@/pages/Standings').then((m) => ({ default: m.Standings })),
)
const Refs = lazy(() => import('@/pages/Refs').then((m) => ({ default: m.Refs })))
const MyGames = lazy(() =>
  import('@/pages/MyGames').then((m) => ({ default: m.MyGames })),
)
const Account = lazy(() =>
  import('@/pages/Account').then((m) => ({ default: m.Account })),
)

function PageFallback() {
  return (
    <div className="text-sm text-muted-foreground p-4" aria-busy>
      Loading…
    </div>
  )
}

export default function App() {
  // One-shot fetch on mount, then subscribe to realtime row-level
  // changes for this tournament. Both no-op when Supabase isn't
  // configured (env vars missing) → pure localStorage mode.
  useInitialSync()
  useRealtimeSync()

  return (
    <ErrorBoundary>
      <BrowserRouter basename={BASENAME}>
        <Routes>
          <Route element={<AppShell />}>
            <Route
              index
              element={
                <Suspense fallback={<PageFallback />}>
                  <Home />
                </Suspense>
              }
            />
            <Route
              path="schedule"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Schedule />
                </Suspense>
              }
            />
            <Route
              path="bracket"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Bracket />
                </Suspense>
              }
            />
            <Route
              path="standings"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Standings />
                </Suspense>
              }
            />
            <Route
              path="refs"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Refs />
                </Suspense>
              }
            />
            <Route
              path="my-games"
              element={
                <Suspense fallback={<PageFallback />}>
                  <MyGames />
                </Suspense>
              }
            />
            <Route
              path="account"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Account />
                </Suspense>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-center" />
    </ErrorBoundary>
  )
}
