import type { ReactNode } from 'react'
import { passageUrl } from '../lib/bible'

export function ScriptureLink({
  search,
  children,
  className = 'scripture-link',
}: {
  search: string
  children: ReactNode
  className?: string
}) {
  return (
    <a
      className={className}
      href={passageUrl(search)}
      target="_blank"
      rel="noreferrer"
      title={`Open ${search} on Bible Gateway (ESV)`}
    >
      {children}
    </a>
  )
}
