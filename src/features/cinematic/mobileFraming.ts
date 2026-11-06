import type { StaticChapter } from './cinematicMachine'
export type FilmSource = 'master' | 'room-forward' | 'room-reverse'
// Source-normalized horizontal focal positions. Shared by still/video/hotspot geometry.
export const stillFocus: Record<StaticChapter, number> = { invitation: .55, welcome: .5, hallway: .95, room: .7, finale: .38 }
const masterFocus = [[0, .55], [6, .5], [10, .5], [12.5, .55], [16.5, .95], [17.125, .95], [19.5, .68], [22, .38], [23.375, .38]] as const
const roomFocus = [[0, .95], [.7, .95], [2.5, .75], [4, .7], [5.166667, .7]] as const
function interpolate(points: readonly (readonly [number, number])[], time: number): number {
  for (let i = 1; i < points.length; i++) {
    const [end, to] = points[i]; const [start, from] = points[i - 1]
    if (time <= end) { const progress = Math.max(0, Math.min(1, (time - start) / (end - start))); const ease = progress * progress * (3 - 2 * progress); return from + (to - from) * ease }
  }
  return points.at(-1)![1]
}
export function filmFocus(source: FilmSource, time: number): number { return source === 'master' ? interpolate(masterFocus, time) : interpolate(roomFocus, source === 'room-reverse' ? 5.166667 - time : time) }
