import { describe, expect, it } from 'vitest'
import { chapterOf, cinematicReducer as reduce, initialState, isPlaying, type CinematicEvent, type CinematicState, type Scene } from './cinematicMachine'

const step = (state: CinematicState, ...types: CinematicEvent['type'][]) => types.reduce((current, type) => reduce(current, { type } as CinematicEvent), state)
const hallway = () => step(initialState(), 'START', 'WELCOME_REACHED', 'CONTINUE', 'HALLWAY_REACHED')

describe('approved cinematic journey', () => {
  it('requires a gesture, welcome and the hallway before the finale', () => {
    let state = initialState()
    for (const [event, mode] of [['START', 'MASTER_TO_WELCOME'], ['WELCOME_REACHED', 'WELCOME_PAUSED'], ['CONTINUE', 'MASTER_TO_HALLWAY'], ['HALLWAY_REACHED', 'HALLWAY_PAUSED'], ['CONTINUE', 'MASTER_TO_FINALE'], ['MASTER_FINISHED', 'FINALE']] as const) {
      state = reduce(state, { type: event })
      expect(state.view.mode).toBe(mode)
    }
    expect(step(state, 'REPLAY').view.mode).toBe('INVITATION')
  })
  it('holds B3 before optional info and reverses to hallway without auto-continuing', () => {
    let state = step(hallway(), 'ENTER_ROOM', 'ROOM_FINISHED')
    expect(state.view.mode).toBe('ROOM_AT_B3')
    state = step(state, 'OPEN_ROOM_INFO', 'CLOSE_ROOM_INFO', 'OPEN_ROOM_INFO', 'BACK_TO_HALLWAY')
    expect(state.view.mode).toBe('ROOM_EXITING')
    expect(step(state, 'CONTINUE')).toBe(state)
    state = step(state, 'REVERSE_FINISHED')
    expect(state.view.mode).toBe('HALLWAY_PAUSED')
    expect(step(state, 'CONTINUE').view.mode).toBe('MASTER_TO_FINALE')
  })
  it.each(['MASTER_TO_WELCOME', 'MASTER_TO_HALLWAY', 'ROOM_ENTERING', 'ROOM_EXITING', 'MASTER_TO_FINALE'] as const)('preserves playing context for %s', (mode) => {
    const state = { ...initialState(), view: { mode } }
    expect(step(state, 'PAUSE').view).toEqual({ mode: 'USER_PAUSED', resumeState: mode })
    expect(step(state, 'PAUSE', 'RESUME').view).toEqual({ mode })
    const menu = step(state, 'OPEN_MENU')
    expect(menu.view).toEqual({ mode: 'MENU_OPEN', resumeState: { mode }, wasPlayingBeforeMenu: true })
    expect(step(menu, 'ROOM_FINISHED')).toBe(menu)
    expect(step(menu, 'CLOSE_MENU').view).toEqual({ mode })
  })
  it.each(['INVITATION', 'WELCOME_PAUSED', 'HALLWAY_PAUSED', 'ROOM_AT_B3', 'ROOM_INFO_OPEN', 'FINALE'] as Scene[])('does not autoplay after a menu over %s', (mode) => {
    const state = { ...initialState(), view: { mode } }
    const menu = step(state, 'OPEN_MENU')
    expect(menu.view.mode === 'MENU_OPEN' && menu.view.wasPlayingBeforeMenu).toBe(false)
    expect(step(menu, 'CLOSE_MENU').view.mode).toBe(mode)
  })
  it('keeps a user pause and errors through menu open/close', () => {
    const paused = step(initialState(), 'START', 'PAUSE')
    expect(step(paused, 'OPEN_MENU', 'CLOSE_MENU').view).toEqual(paused.view)
    const failed = reduce(step(initialState(), 'START'), { type: 'PLAY_FAILED', errorCode: 'rejected' })
    expect(step(failed, 'OPEN_MENU', 'CLOSE_MENU').view).toEqual(failed.view)
    expect(step(failed, 'RETRY').view.mode).toBe('MASTER_TO_WELCOME')
  })
  it('ignores rapid, duplicate and out-of-order events', () => {
    const start = step(initialState(), 'START')
    expect(step(start, 'START', 'ENTER_ROOM', 'REVERSE_FINISHED', 'MASTER_FINISHED')).toBe(start)
    const room = step(hallway(), 'ENTER_ROOM')
    expect(step(room, 'CONTINUE', 'ENTER_ROOM', 'BACK_TO_HALLWAY')).toBe(room)
    expect(step(initialState(), 'RESUME', 'ROOM_FINISHED', 'CONTINUE')).toEqual(initialState())
  })
  it('provides all chapters in reduced motion without ever entering a playing state', () => {
    let state = initialState(true)
    for (const [event, chapter] of [['START', 'welcome'], ['CONTINUE', 'hallway'], ['ENTER_ROOM', 'room'], ['BACK_TO_HALLWAY', 'hallway'], ['CONTINUE', 'finale'], ['REPLAY', 'invitation']] as const) {
      state = reduce(state, { type: event })
      expect(state.view).toEqual({ mode: 'STATIC_FALLBACK', chapter })
      expect(isPlaying(state.view.mode)).toBe(false)
    }
  })
  it('can skip or enter still images from a failed branch', () => {
    const failed = reduce(step(hallway(), 'ENTER_ROOM'), { type: 'MEDIA_STALLED', errorCode: 'timeout' })
    expect(chapterOf(failed.view)).toBe('hallway')
    expect(step(failed, 'ENTER_STATIC_MODE').view).toEqual({ mode: 'STATIC_FALLBACK', chapter: 'hallway' })
    expect(step(failed, 'SKIP').view.mode).toBe('FINALE')
  })
  it.each(['MASTER_TO_WELCOME', 'MASTER_TO_HALLWAY', 'ROOM_ENTERING', 'ROOM_AT_B3', 'ROOM_INFO_OPEN', 'ROOM_EXITING', 'MASTER_TO_FINALE', 'FINALE'] as Scene[])('resets %s and its menu context without autoplay or stale chapter events', (mode) => {
    const state: CinematicState = { ...initialState(), view: { mode }, videoReady: true, activeHotel: 'agnes' }
    for (const source of [state, step(state, 'OPEN_MENU')]) {
      const reset = step(source, 'REPLAY', 'REPLAY', 'ROOM_FINISHED', 'REVERSE_FINISHED', 'MASTER_FINISHED', 'WELCOME_REACHED')
      expect(reset).toEqual(initialState())
    }
    expect(step({ ...state, reducedMotion: true }, 'REPLAY')).toEqual(initialState(true))
  })
  it('selects only validated hotel IDs and resets readiness between media scenes', () => {
    let state = step(initialState(), 'START', 'FRAME_READY')
    expect(state.videoReady).toBe(true)
    state = reduce(state, { type: 'SELECT_HOTEL', hotel: 'agnes' })
    expect(state.activeHotel).toBe('agnes')
    expect(step(state, 'WELCOME_REACHED').videoReady).toBe(false)
  })
})
