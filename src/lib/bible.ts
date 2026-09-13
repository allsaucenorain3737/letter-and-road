export const BIBLE_VERSION = 'ESV'

export function passageUrl(search: string): string {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(search)}&version=ESV`
}
