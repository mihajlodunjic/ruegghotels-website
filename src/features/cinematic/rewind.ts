import { CHECKPOINTS } from './chapterConfig'
import type { JourneyView } from './cinematicMachine'

export const REWIND_RATE = 5
export const ROOM_LAST = 124 / 24
export type RewindLeg = { source: 'master-reverse' | 'room-reverse'; start: number; last: number }
const clamp = (time: number, last: number) => Math.max(0, Math.min(last, Number.isFinite(time) ? time : 0))
/** Reverse PTS zero is the last genuine forward frame, not the container duration. */
export function rewindPlan(origin: JourneyView, masterTime: number, roomTime: number): RewindLeg[] {
  const mode = origin.mode === 'USER_PAUSED' || origin.mode === 'MEDIA_ERROR' ? origin.resumeState : origin.mode
  const master = (time: number): RewindLeg => ({ source: 'master-reverse', start: CHECKPOINTS.finale - clamp(time, CHECKPOINTS.finale), last: CHECKPOINTS.finale })
  const room = (time: number): RewindLeg => ({ source: 'room-reverse', start: clamp(time, ROOM_LAST), last: ROOM_LAST })
  if (mode === 'ROOM_ENTERING') return [room(ROOM_LAST - clamp(roomTime, ROOM_LAST)), master(CHECKPOINTS.hallway)]
  if (mode === 'ROOM_EXITING') return [room(roomTime), master(CHECKPOINTS.hallway)]
  if (mode === 'ROOM_AT_B3' || mode === 'ROOM_INFO_OPEN') return [room(0), master(CHECKPOINTS.hallway)]
  if (mode === 'WELCOME_PAUSED') return [master(CHECKPOINTS.reception)]
  if (mode === 'HALLWAY_PAUSED') return [master(CHECKPOINTS.hallway)]
  if (mode === 'FINALE') return [master(CHECKPOINTS.finale)]
  return [master(masterTime)]
}
