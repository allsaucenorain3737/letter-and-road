import { useEffect, useState } from 'react'
import {
  analyticsEnabled,
  getConsentChoice,
  setConsentChoice,
  type ConsentChoice,
} from '../lib/analytics'

export function ConsentBanner() {
  const [choice, setChoice] = useState<ConsentChoice>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setChoice(getConsentChoice())
    setReady(true)
  }, [])

  if (!ready || !analyticsEnabled() || choice !== null) return null

  return (
    <div className="consent-banner" role="dialog" aria-label="Analytics cookies">
      <p>
        We use Google Analytics to understand aggregate visits (pages opened, not profiles). Choose
        whether to allow analytics cookies. See{' '}
        <a href="#/about">About — Privacy</a>.
      </p>
      <div className="consent-actions">
        <button
          type="button"
          className="primary-btn"
          onClick={() => {
            setConsentChoice('accepted')
            setChoice('accepted')
          }}
        >
          Accept analytics
        </button>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => {
            setConsentChoice('declined')
            setChoice('declined')
          }}
        >
          Decline
        </button>
      </div>
    </div>
  )
}
