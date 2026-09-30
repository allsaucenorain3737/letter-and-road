/**
 * Ko-fi floating-chat overlay — About-page lifecycle only.
 * Injects overlay-widget.js once, draws into a dedicated body root, and
 * removes that root (and any stray overlay nodes) on unmount so the button
 * never floats over the map/explore UI.
 */

declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (
        pageId: string,
        config: Record<string, string>,
        containerId?: string | null,
      ) => void
    }
  }
}

const SCRIPT_SRC = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js'
const SCRIPT_ATTR = 'data-letter-and-road-kofi'
const PAGE_ID = 'tgkoetje'
const CONTAINER_ID = 'letter-and-road-kofi-root'

const WIDGET_CONFIG: Record<string, string> = {
  type: 'floating-chat',
  'floating-chat.donateButton.text': 'Support me',
  // Muted sage — parchment-friendly CTA (not Bootstrap green)
  'floating-chat.donateButton.background-color': '#4a7c59',
  'floating-chat.donateButton.text-color': '#fff',
}

let scriptLoadPromise: Promise<void> | null = null

function ensureScript(): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('Ko-fi requires a document'))
  }
  if (window.kofiWidgetOverlay?.draw) {
    return Promise.resolve()
  }
  if (scriptLoadPromise) return scriptLoadPromise

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[${SCRIPT_ATTR}]`)
    if (existing) {
      if (window.kofiWidgetOverlay?.draw) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => {
          scriptLoadPromise = null
          reject(new Error('Ko-fi script failed to load'))
        },
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.setAttribute(SCRIPT_ATTR, '1')
    script.onload = () => resolve()
    script.onerror = () => {
      scriptLoadPromise = null
      reject(new Error('Ko-fi script failed to load'))
    }
    document.body.appendChild(script)
  })

  return scriptLoadPromise
}

function ensureContainer(): HTMLElement {
  let el = document.getElementById(CONTAINER_ID)
  if (!el) {
    el = document.createElement('div')
    el.id = CONTAINER_ID
    document.body.appendChild(el)
  }
  return el
}

/** Remove floating widget DOM; leave the cached script tag for idempotent remount. */
export function unmountKofiWidget(): void {
  if (typeof document === 'undefined') return

  document.getElementById(CONTAINER_ID)?.remove()

  // Defensive sweep for nodes Ko-fi may attach outside our root
  const stray = document.querySelectorAll(
    '[id^="kofi-widget-overlay-"], [id^="kofi-wo-"], .floatingchat-container-wrap, .floatingchat-container-wrap-mobi, .floating-chat-kofi-popup-iframe, .floating-chat-kofi-popup-iframe-mobi',
  )
  stray.forEach((el) => {
    if (el.tagName === 'SCRIPT' || el.tagName === 'LINK') return
    el.remove()
  })
}

/**
 * Mount the floating “Support me” button. Returns a cleanup that removes DOM
 * on About unmount. Does not auto-open the chat panel.
 */
export function mountKofiWidget(): () => void {
  let cancelled = false

  ensureContainer()
  void ensureScript()
    .then(() => {
      if (cancelled) return
      ensureContainer()
      window.kofiWidgetOverlay?.draw(PAGE_ID, { ...WIDGET_CONFIG }, CONTAINER_ID)
    })
    .catch(() => {
      /* Optional widget; About page keeps a plain Ko-fi <a> fallback. */
    })

  return () => {
    cancelled = true
    unmountKofiWidget()
  }
}
