import { AboutPage } from './components/AboutPage'
import { CompareView } from './components/CompareView'
import { ExploreMenu, MapChrome, PageHeader } from './components/ExploreMenu'
import { LetterDrawer } from './components/LetterDrawer'
import { MediterraneanMap } from './components/MediterraneanMap'
import { StoryTimeline } from './components/StoryTimeline'
import { TimeScrubber } from './components/TimeScrubber'
import { AppProvider, useApp } from './state/AppState'

function Shell() {
  const app = useApp()
  const extras = app.phase === 'explore' && app.view === 'atlas'

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
            <MediterraneanMap />
            {extras && app.showTimeline && <StoryTimeline />}
            {extras && app.showScrubber && <TimeScrubber />}
          </>
        )}
        {app.view === 'compare' && <CompareView />}
        {app.view === 'about' && <AboutPage />}
      </main>
      <LetterDrawer />
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
