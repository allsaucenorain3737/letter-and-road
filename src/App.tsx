import { lazy, Suspense } from 'react'
import { AboutPage } from './components/AboutPage'
import { CompareView } from './components/CompareView'
import { ConsentBanner } from './components/ConsentBanner'
import { ExploreMenu, MapChrome, PageHeader } from './components/ExploreMenu'
import { CityDrawer } from './components/CityDrawer'
import { InviteOverlay } from './components/InviteOverlay'
import { LetterDrawer } from './components/LetterDrawer'
import { LifeTimeline } from './components/LifeTimeline'
import { StoryTimeline } from './components/StoryTimeline'
import { TimeScrubber } from './components/TimeScrubber'
import { VoicesPage } from './components/VoicesPage'
import { AppProvider, useApp } from './state/AppState'

const MediterraneanMap = lazy(() =>
  import('./components/MediterraneanMap').then((m) => ({ default: m.MediterraneanMap })),
)

function Shell() {
  const app = useApp()
  const atlasExtras =
    app.view === 'atlas' && (app.phase === 'explore' || app.phase === 'playing')

  return (
    <div className={`app-shell${app.view === 'atlas' ? ' is-map' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <PageHeader />
      <MapChrome />
      <ExploreMenu />
      <main id="main" className="stage">
        {app.view === 'atlas' && (
          <>
            <Suspense fallback={<div className="map-loading">Loading map…</div>}>
              <MediterraneanMap />
            </Suspense>
            {atlasExtras && app.phase === 'explore' && app.showTimeline && <StoryTimeline />}
            {atlasExtras && app.phase === 'explore' && app.showLifeTimeline && <LifeTimeline />}
            {atlasExtras && app.showScrubber && <TimeScrubber />}
          </>
        )}
        {app.view === 'compare' && <CompareView />}
        {app.view === 'about' && <AboutPage />}
        {app.view === 'voices' && <VoicesPage />}
      </main>
      <LetterDrawer />
      <CityDrawer />
      <InviteOverlay />
      <ConsentBanner />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
