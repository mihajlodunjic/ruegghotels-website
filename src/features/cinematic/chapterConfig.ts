import type { PlayingScene, StaticChapter } from './cinematicMachine'

export const CHECKPOINTS = { reception: 10, hallway: 17.125, finale: 23.375 } as const
const base = (import.meta.env.VITE_MEDIA_BASE_URL || '').replace(/\/$/, '')
export const poster = (chapter: StaticChapter) => `${base}/posters/${({ invitation: 'hero', welcome: 'reception', hallway: 'hallway', room: 'room', finale: 'finale' })[chapter]}.v1.webp`
export const mediaUrl = (kind: 'master' | 'room-forward' | 'room-reverse', mobile: boolean) => `${base}/media/${kind}-${mobile ? '720' : '1080'}.v1.mp4`
export const playback: Record<PlayingScene, { video: 'master' | 'branch'; source: 'master' | 'room-forward' | 'room-reverse'; start: number; stop?: number; event: 'WELCOME_REACHED' | 'HALLWAY_REACHED' | 'ROOM_FINISHED' | 'REVERSE_FINISHED' | 'MASTER_FINISHED' }> = {
  MASTER_TO_WELCOME: { video: 'master', source: 'master', start: 0, stop: CHECKPOINTS.reception, event: 'WELCOME_REACHED' },
  MASTER_TO_HALLWAY: { video: 'master', source: 'master', start: CHECKPOINTS.reception, stop: CHECKPOINTS.hallway, event: 'HALLWAY_REACHED' },
  MASTER_TO_FINALE: { video: 'master', source: 'master', start: CHECKPOINTS.hallway, stop: CHECKPOINTS.finale, event: 'MASTER_FINISHED' },
  ROOM_ENTERING: { video: 'branch', source: 'room-forward', start: 0, event: 'ROOM_FINISHED' },
  ROOM_EXITING: { video: 'branch', source: 'room-reverse', start: 0, event: 'REVERSE_FINISHED' },
}

export const chapterDescriptions: Record<StaticChapter, string> = {
  invitation: 'An alpine timber house at dusk, with mountains to the left and a warmly lit entrance.',
  welcome: 'A timber reception with a central portrait and open book, green armchair and carved counter.',
  hallway: 'A warm walnut hallway. The near door on the right opens into the optional room journey.',
  room: 'An alpine bedroom, with a timber bed and a window looking towards the mountains.',
  finale: 'A communal table on the left, with candlelight, flowers and an alpine lounge beyond.',
}
