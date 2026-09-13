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

const PLAY_MS = 2 * 60 * 1000

function timed(events: StoryEvent[]): StoryEvent[] {
  const total = events.reduce((sum, event) => sum + event.duration, 0)
  const factor = PLAY_MS / total
  return events.map((event) => ({ ...event, duration: Math.round(event.duration * factor) }))
}

/** Consensus order: Acts travel, then letters written from that stop. Scaled to ~2 minutes. */
export const STORY: StoryEvent[] = timed([
  {
    type: 'travel',
    id: 'damascus-call',
    mode: 'land',
    waypoints: ['jerusalem', 'damascus_road', 'damascus'],
    year: 34,
    dates: 'AD 33–35',
    duration: 3800,
    caption: 'The road to Damascus · Acts 9 · where Paul’s road begins',
    acts: 'Acts 9:1-8',
  },
  {
    type: 'travel',
    id: 'to-antioch',
    mode: 'land',
    waypoints: ['damascus', 'tarsus', 'antioch'],
    year: 37,
    dates: 'AD 35–43',
    duration: 3200,
    caption: 'On the road · Damascus → Tarsus → Antioch · Acts 9:30; 11:25–26',
    acts: 'Acts 11:25-26',
  },
  {
    type: 'travel',
    id: 'first-sea',
    mode: 'sea',
    waypoints: ['antioch', 'salamis', 'cyprus', 'perga'],
    year: 47,
    dates: 'AD 46–48',
    duration: 3200,
    caption: 'At sea · First journey · Antioch → Cyprus → Perga · Acts 13:4–13',
    acts: 'Acts 13:4-13',
  },
  {
    type: 'travel',
    id: 'first-land',
    mode: 'land',
    waypoints: [
      'perga',
      'pisidian_antioch',
      'iconium',
      'lystra',
      'derbe',
      'lystra',
      'iconium',
      'pisidian_antioch',
      'perga',
    ],
    year: 47,
    dates: 'AD 46–48',
    duration: 5000,
    caption: 'On the road · First journey · south Galatia · Acts 13–14',
    acts: 'Acts 13:13-14:26',
  },
  {
    type: 'travel',
    id: 'first-home',
    mode: 'sea',
    waypoints: ['perga', 'antioch'],
    year: 48,
    dates: 'AD 46–48',
    duration: 2400,
    caption: 'At sea · home to Antioch · Acts 14:26',
    acts: 'Acts 14:26',
  },
  {
    type: 'letter',
    id: 'galatians',
    letterId: 'galatians',
    year: 48,
    dates: 'AD 48–49',
    duration: 2400,
    caption: 'A letter is sent · Antioch → churches of Galatia · Galatians',
  },
  {
    type: 'travel',
    id: 'second-overland',
    mode: 'land',
    waypoints: ['antioch', 'tarsus', 'derbe', 'lystra', 'iconium', 'galatia', 'troas'],
    year: 50,
    dates: 'AD 49–52',
    duration: 5200,
    caption: 'On the road · Second journey · Antioch through Galatia to Troas · Acts 15:36–16:8',
    acts: 'Acts 16:1-8',
  },
  {
    type: 'travel',
    id: 'second-crossing',
    mode: 'sea',
    waypoints: ['troas', 'philippi'],
    year: 50,
    dates: 'AD 49–52',
    duration: 2800,
    caption: 'At sea · Troas → Philippi · the Macedonian crossing · Acts 16:9–12',
    acts: 'Acts 16:9-12',
  },
  {
    type: 'travel',
    id: 'second-greece',
    mode: 'land',
    waypoints: ['philippi', 'thessalonica', 'berea', 'athens', 'corinth'],
    year: 50,
    dates: 'AD 49–52',
    duration: 5000,
    caption: 'On the road · Philippi → Thessalonica → Athens → Corinth · Acts 16–18',
    acts: 'Acts 17:1-18:1',
  },
  {
    type: 'letter',
    id: '1thessalonians',
    letterId: '1thessalonians',
    year: 51,
    dates: 'AD 50–51',
    duration: 2200,
    caption: 'A letter is sent · Corinth → Thessalonica · 1 Thessalonians',
  },
  {
    type: 'letter',
    id: '2thessalonians',
    letterId: '2thessalonians',
    year: 51,
    dates: 'AD 51–52',
    duration: 2200,
    caption: 'A letter is sent · Corinth → Thessalonica · 2 Thessalonians',
  },
  {
    type: 'travel',
    id: 'second-home',
    mode: 'sea',
    waypoints: ['corinth', 'ephesus', 'caesarea', 'jerusalem', 'antioch'],
    year: 52,
    dates: 'AD 49–52',
    duration: 4200,
    caption: 'At sea · Corinth home by Ephesus and Caesarea · Acts 18:18–22',
    acts: 'Acts 18:18-22',
  },
  {
    type: 'travel',
    id: 'third-ephesus',
    mode: 'land',
    waypoints: ['antioch', 'galatia', 'ephesus'],
    year: 53,
    dates: 'AD 53–57',
    duration: 4000,
    caption: 'On the road · Third journey · to Ephesus for a long stay · Acts 19',
    acts: 'Acts 19:1-10',
  },
  {
    type: 'letter',
    id: '1corinthians',
    letterId: '1corinthians',
    year: 54,
    dates: 'AD 54–55',
    duration: 2200,
    caption: 'A letter is sent · Ephesus → Corinth · 1 Corinthians',
  },
  {
    type: 'travel',
    id: 'third-macedonia',
    mode: 'land',
    waypoints: ['ephesus', 'troas', 'macedonia'],
    year: 55,
    dates: 'AD 53–57',
    duration: 3200,
    caption: 'On the road · Ephesus → Macedonia · Acts 20:1',
    acts: 'Acts 20:1',
  },
  {
    type: 'letter',
    id: '2corinthians',
    letterId: '2corinthians',
    year: 55,
    dates: 'AD 55–56',
    duration: 2200,
    caption: 'A letter is sent · Macedonia → Corinth · 2 Corinthians',
  },
  {
    type: 'travel',
    id: 'third-corinth',
    mode: 'land',
    waypoints: ['macedonia', 'corinth'],
    year: 56,
    dates: 'AD 53–57',
    duration: 2400,
    caption: 'On the road · Macedonia → Corinth · three months in Greece · Acts 20:2–3',
    acts: 'Acts 20:2-3',
  },
  {
    type: 'letter',
    id: 'romans',
    letterId: 'romans',
    year: 57,
    dates: 'AD 56–57',
    duration: 2600,
    caption: 'A letter is sent · Corinth → Rome · Romans',
  },
  {
    type: 'travel',
    id: 'third-jerusalem',
    mode: 'sea',
    waypoints: ['corinth', 'philippi', 'troas', 'miletus', 'tyre', 'caesarea', 'jerusalem'],
    year: 57,
    dates: 'AD 57',
    duration: 6000,
    caption: 'On the road and at sea · up to Jerusalem · Acts 20–21',
    acts: 'Acts 20:6-21:17',
  },
  {
    type: 'stay',
    id: 'caesarea-custody',
    cityId: 'caesarea',
    year: 58,
    dates: 'AD 57–59',
    duration: 2200,
    caption: 'Held in Caesarea · Acts 24–26 · no letter is securely placed here',
    acts: 'Acts 24:27',
  },
  {
    type: 'travel',
    id: 'rome-voyage',
    mode: 'sea',
    waypoints: [
      'caesarea',
      'sidon',
      'myra',
      'fair_havens',
      'malta',
      'syracuse',
      'rhegium',
      'puteoli',
      'rome',
    ],
    year: 60,
    dates: 'AD 59–60',
    duration: 8000,
    caption: 'At sea · the voyage to Rome · storm, shipwreck, Malta · Acts 27–28',
    acts: 'Acts 27:1-28:16',
  },
  {
    type: 'letter',
    id: 'philemon',
    letterId: 'philemon',
    year: 61,
    dates: 'AD 60–62',
    duration: 2000,
    caption: 'A letter is sent · Rome → Colossae · Philemon',
  },
  {
    type: 'letter',
    id: 'colossians',
    letterId: 'colossians',
    year: 61,
    dates: 'AD 60–62',
    duration: 2000,
    caption: 'A letter is sent · Rome → Colossae · Colossians',
  },
  {
    type: 'letter',
    id: 'ephesians',
    letterId: 'ephesians',
    year: 61,
    dates: 'AD 60–62',
    duration: 2000,
    caption: 'A letter is sent · Rome → Ephesus / Asia · Ephesians',
  },
  {
    type: 'letter',
    id: 'philippians',
    letterId: 'philippians',
    year: 61,
    dates: 'AD 60–62',
    duration: 2000,
    caption: 'A letter is sent · Rome → Philippi · Philippians',
  },
  {
    type: 'letter',
    id: '1timothy',
    letterId: '1timothy',
    year: 63,
    dates: 'AD 62–64',
    duration: 2200,
    caption: 'A letter is sent · Macedonia → Timothy in Ephesus · 1 Timothy',
  },
  {
    type: 'letter',
    id: 'titus',
    letterId: 'titus',
    year: 63,
    dates: 'AD 62–64',
    duration: 2200,
    caption: 'A letter is sent · toward Nicopolis → Titus on Crete · Titus',
  },
  {
    type: 'letter',
    id: '2timothy',
    letterId: '2timothy',
    year: 66,
    dates: 'AD 64–67',
    duration: 2600,
    caption: 'A letter is sent · Rome → Timothy · 2 Timothy · a last dispatch',
  },
])

export const START_LABEL_IDS = new Set([
  'rome',
  'corinth',
  'ephesus',
  'philippi',
  'thessalonica',
  'colossae',
  'galatia',
  'derbe',
  'perga',
  'antioch',
  'jerusalem',
  'damascus_road',
  'damascus',
  'caesarea',
  'macedonia',
  'crete',
  'nicopolis',
  'athens',
  'cyprus',
  'tarsus',
  'malta',
])
