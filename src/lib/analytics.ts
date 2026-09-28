/**
 * Google Analytics 4 (gtag). Measurement IDs are public by design.
 * Set GA_MEASUREMENT_ID below (or VITE_GA_MEASUREMENT_ID at build time).
 */

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/** Prefer build-time env; fall back to committed production ID. */
const ENV_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim()
/** Filled once Admin yields the stream Measurement ID. */
const FALLBACK_ID = 'G-BDDS3372C2'

const MEASUREMENT_ID = (ENV_ID && ENV_ID.startsWith('G-') ? ENV_ID : FALLBACK_ID) || ''

let initialized = false

export function initAnalytics(): void {
  if (initialized || !MEASUREMENT_ID || typeof document === 'undefined') return
  initialized = true

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false,
    anonymize_ip: true,
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)
}

/** Track SPA hash routes as page views (path includes hash). */
export function trackPageView(pagePath?: string): void {
  if (!MEASUREMENT_ID || !window.gtag) return
  const path = pagePath ?? `${window.location.pathname}${window.location.search}${window.location.hash}`
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  })
}

export function analyticsEnabled(): boolean {
  return Boolean(MEASUREMENT_ID)
}
