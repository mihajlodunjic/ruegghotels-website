import { describe, expect, it } from 'vitest'
import { rewindPlan, ROOM_LAST } from './rewind'
import { cinematicReducer as reduce, initialState, type JourneyView } from './cinematicMachine'

describe('rewind routing and reverse timeline', () => {
  it.each([
    ['WELCOME_PAUSED', 13.375], ['HALLWAY_PAUSED', 6.25], ['FINALE', 0],
  ] as const)('maps the genuine %s frame into reverse PTS', (mode, start) => {
    expect(rewindPlan({ mode }, 0, 0)).toEqual([{ source: 'master-reverse', start, last: 23.375 }])
  })
  it('uses the actual active or paused master position rather than a chapter anchor', () => {
    for (const origin of [{ mode: 'MASTER_TO_HALLWAY' }, { mode: 'USER_PAUSED', resumeState: 'MASTER_TO_HALLWAY' }] as JourneyView[]) {
      expect(rewindPlan(origin, 12.5, 0)[0].start).toBe(10.875)
    }
  })
  it('exits from partial forward, B3/info, or partial reverse room position before the hallway rewind', () => {
    for (const [origin, time, start] of [
      [{ mode: 'ROOM_ENTERING' }, 2, ROOM_LAST - 2],
      [{ mode: 'ROOM_EXITING' }, 1.5, 1.5],
      [{ mode: 'USER_PAUSED', resumeState: 'ROOM_EXITING' }, 2, 2],
      [{ mode: 'ROOM_AT_B3' }, 0, 0], [{ mode: 'ROOM_INFO_OPEN' }, 0, 0],
    ] as [JourneyView, number, number][]) {
      expect(rewindPlan(origin, 10, time)).toEqual([
        { source: 'room-reverse', start, last: ROOM_LAST },
        { source: 'master-reverse', start: 6.25, last: 23.375 },
      ])
    }
  })
  it('clamps clocks to valid decoded frame ranges', () => {
    expect(rewindPlan({ mode: 'MASTER_TO_WELCOME' }, NaN, 0)[0].start).toBe(23.375)
    expect(rewindPlan({ mode: 'MASTER_TO_FINALE' }, 30, 0)[0].start).toBe(0)
  })
  it('dismisses menu, ignores duplicates and stale forward callbacks, and resets only explicitly', () => {
    const origin = { mode: 'ROOM_INFO_OPEN' } as const
    let state = { ...initialState(), view: origin }
    const menu = reduce(state, { type: 'OPEN_MENU' })
    const rewind = reduce(menu, { type: 'REWIND' })
    expect(rewind.view).toEqual({ mode: 'REWINDING', origin })
    for (const type of ['REWIND', 'ROOM_FINISHED', 'REVERSE_FINISHED', 'MASTER_FINISHED', 'WELCOME_REACHED', 'CONTINUE', 'FRAME_READY'] as const) expect(reduce(rewind, { type })).toBe(rewind)
    expect(reduce(rewind, { type: 'REPLAY' })).toEqual(initialState())
    expect(reduce(rewind, { type: 'PAUSE' })).toEqual(initialState())
    expect(reduce(rewind, { type: 'ENTER_STATIC_MODE' })).toEqual(initialState(true))
    state = { ...state, reducedMotion: true }
    expect(reduce(state, { type: 'REWIND' })).toEqual(initialState(true))
  })
})
