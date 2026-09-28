import data from '../../content/story.json' with { type: 'json' }

export type TravelMode = 'land' | 'sea'

export type StoryEvent =
  | {
      type: 'travel'
      id: string
      mode: TravelMode
      waypoints: string[]
      year: number
      dates: string
      duration: number
      caption: string
      acts?: string
    }
  | {
      type: 'letter'
      id: string
      letterId: string
      year: number
      dates: string
      duration: number
      caption: string
    }
  | {
      type: 'stay'
      id: string
      cityId: string
      year: number
      dates: string
      duration: number
      caption: string
      acts?: string
    }

/** Consensus story events with durations already scaled to ~2 minutes of playback. */
export const STORY: StoryEvent[] = data.story as StoryEvent[]

export const START_LABEL_IDS = new Set(data.startLabelIds as string[])
