/**
 * Google Analytics 4 (gtag) with Consent Mode v2.
 * Measurement IDs are public by design — not secrets.
 * Prefer VITE_GA_MEASUREMENT_ID at build time; empty disables.
 */

declare global {
  interface Window {
    dataLayer: IArguments[] | unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const CONSENT_KEY = 'letter-and-road:ga-consent'

const ENV_RAW = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
const FALLBACK_ID = 'G-LTV8ZLM4X4'

/**
 * - Env set to a G- id → use it
 * - Env set to empty / non-G → disabled (preview / opt-out builds)
 * - Env unset → production fallback id; disabled in non-prod
 */
function resolveMeasurementId(): string {
  if (ENV_RAW !== undefined) {
    const trimmed = String(ENV_RAW).trim()
    return trimmed.startsWith('G-') ? trimmed : ''
  }
  return import.meta.env.PROD ? FALLBACK_ID : ''
}

const MEASUREMENT_ID = resolveMeasurementId()

let initialized = false
let consentDefaultsSet = false

export type ConsentChoice = 'accepted' | 'declined' | null

export function getConsentChoice(): ConsentChoice {
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    if (v === 'accepted' || v === 'declined') return v
  } catch {
    /* ignore */
  }
  return null
}

function ensureGtagStub() {
  window.dataLayer = window.dataLayer || []
  if (!window.gtag) {
    // Official gtag stub: push the Arguments object (not a rest array).
    // dataLayer.push(args) with rest→array breaks queued command processing.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments)
    }
  }
}

/** Consent Mode defaults before any config — analytics denied until accept. */
export function initConsentDefaults(): void {
  if (consentDefaultsSet || typeof document === 'undefined') return
  consentDefaultsSet = true
  ensureGtagStub()
  window.gtag?.('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  })
}

export function setConsentChoice(choice: 'accepted' | 'declined'): void {
  try {
    localStorage.setItem(CONSENT_KEY, choice)
  } catch {
    /* ignore */
  }
  ensureGtagStub()
  if (choice === 'accepted') {
    window.gtag?.('consent', 'update', {
      analytics_storage: 'granted',
    })
    initAnalytics()
    // Accept alone does not change SPA view state — fire page_view now so
    // the first collect is not deferred until a later route change.
    trackPageView()
  } else {
    window.gtag?.('consent', 'update', {
      analytics_storage: 'denied',
    })
  }
}

export function initAnalytics(): void {
  if (initialized || !MEASUREMENT_ID || typeof document === 'undefined') return
  if (getConsentChoice() !== 'accepted') return
  initialized = true

  ensureGtagStub()
  // Standard order: queue js + config, then inject script so the stub
  // Arguments-queue is drained when gtag.js boots.
  window.gtag?.('js', new Date())
  window.gtag?.('config', MEASUREMENT_ID, {
    // SPA hash routes: send explicit page_view with pathname+hash.
    send_page_view: false,
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  script.onload = () => {
    // Returning visitors (init from main.tsx) and race-safe Accept path:
    // ensure at least one page_view after the library is ready.
    trackPageView()
  }
  document.head.appendChild(script)
}

/** Track SPA hash routes as page views (path includes hash). */
export function trackPageView(pagePath?: string): void {
  if (!MEASUREMENT_ID || !window.gtag || getConsentChoice() !== 'accepted') return
  const path =
    pagePath ?? `${window.location.pathname}${window.location.search}${window.location.hash}`
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  })
}

export function analyticsEnabled(): boolean {
  return Boolean(MEASUREMENT_ID)
}

export function analyticsMeasurementId(): string {
  return MEASUREMENT_ID
}
