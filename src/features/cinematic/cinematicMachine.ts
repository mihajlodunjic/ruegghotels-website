export type HotelId = 'agnes' | 'spalloni' | 'schiebel'
export type PlayingScene = 'MASTER_TO_WELCOME' | 'MASTER_TO_HALLWAY' | 'ROOM_ENTERING' | 'ROOM_EXITING' | 'MASTER_TO_FINALE'
export type Scene = PlayingScene | 'INVITATION' | 'WELCOME_PAUSED' | 'HALLWAY_PAUSED' | 'ROOM_AT_B3' | 'ROOM_INFO_OPEN' | 'FINALE'
export type StaticChapter = 'invitation' | 'welcome' | 'hallway' | 'room' | 'finale'
export type JourneyView = { mode: Scene } | { mode: 'USER_PAUSED'; resumeState: PlayingScene } | { mode: 'MEDIA_ERROR'; resumeState: PlayingScene; errorCode: string } | { mode: 'STATIC_FALLBACK'; chapter: StaticChapter }
type NonMenuView = JourneyView | { mode: 'REWINDING'; origin: JourneyView }
export type View = NonMenuView | { mode: 'MENU_OPEN'; resumeState: NonMenuView; wasPlayingBeforeMenu: boolean }
export interface CinematicState {
  view: View
  reducedMotion: boolean
  userHasInteracted: boolean
  videoReady: boolean
  activeHotel: HotelId | null
}
export type CinematicEvent =
  | { type: 'START' | 'WELCOME_REACHED' | 'CONTINUE' | 'HALLWAY_REACHED' | 'ENTER_ROOM' | 'ROOM_FINISHED' | 'OPEN_ROOM_INFO' | 'CLOSE_ROOM_INFO' | 'BACK_TO_HALLWAY' | 'REVERSE_FINISHED' | 'MASTER_FINISHED' | 'PAUSE' | 'RESUME' | 'OPEN_MENU' | 'CLOSE_MENU' | 'SKIP' | 'REPLAY' | 'RETRY' | 'ENTER_STATIC_MODE' | 'FRAME_READY' | 'REWIND' }
  | { type: 'PLAY_FAILED' | 'MEDIA_STALLED'; errorCode: string }
  | { type: 'SELECT_HOTEL'; hotel: HotelId }

export const isPlaying = (mode: string): mode is PlayingScene => ['MASTER_TO_WELCOME', 'MASTER_TO_HALLWAY', 'ROOM_ENTERING', 'ROOM_EXITING', 'MASTER_TO_FINALE'].includes(mode)
export function initialState(staticMode = false): CinematicState {
  return { view: staticMode ? { mode: 'STATIC_FALLBACK', chapter: 'invitation' } : { mode: 'INVITATION' }, reducedMotion: staticMode, userHasInteracted: false, videoReady: false, activeHotel: null }
}
export function underlyingView(view: View): NonMenuView { return view.mode === 'MENU_OPEN' ? view.resumeState : view }
export function chapterOf(view: View): StaticChapter {
  const underlying = underlyingView(view)
  const v = underlying.mode === 'REWINDING' ? underlying.origin : underlying
  if (v.mode === 'STATIC_FALLBACK') return v.chapter
  const mode = v.mode === 'USER_PAUSED' || v.mode === 'MEDIA_ERROR' ? v.resumeState : v.mode
  if (mode === 'INVITATION' || mode === 'MASTER_TO_WELCOME') return 'invitation'
  if (mode === 'WELCOME_PAUSED' || mode === 'MASTER_TO_HALLWAY') return 'welcome'
  if (mode === 'HALLWAY_PAUSED' || mode === 'ROOM_ENTERING' || mode === 'MASTER_TO_FINALE') return 'hallway'
  if (mode === 'ROOM_AT_B3' || mode === 'ROOM_INFO_OPEN' || mode === 'ROOM_EXITING') return 'room'
  return 'finale'
}
export function cinematicReducer(state: CinematicState, event: CinematicEvent): CinematicState {
  const v = state.view
  if (event.type === 'REPLAY') return initialState(state.reducedMotion)
  if (event.type === 'REWIND') {
    const origin = underlyingView(v)
    if (origin.mode === 'REWINDING') return state
    if (state.reducedMotion || ['INVITATION', 'STATIC_FALLBACK', 'MEDIA_ERROR'].includes(origin.mode)) return initialState(state.reducedMotion)
    return { ...state, view: { mode: 'REWINDING', origin }, videoReady: false }
  }
  if (v.mode === 'REWINDING') {
    if (event.type === 'OPEN_MENU') return { ...initialState(state.reducedMotion), view: { mode: 'MENU_OPEN', resumeState: { mode: 'INVITATION' }, wasPlayingBeforeMenu: false } }
    if (event.type === 'ENTER_STATIC_MODE') return initialState(true)
    if (event.type === 'PAUSE') return initialState(state.reducedMotion)
    return state // Ignore late forward checkpoints, errors and duplicate commands.
  }
  const go = (view: View, interacted = state.userHasInteracted): CinematicState => ({ ...state, view, userHasInteracted: interacted, videoReady: false })
  if (event.type === 'ENTER_STATIC_MODE') return { ...go({ mode: 'STATIC_FALLBACK', chapter: chapterOf(v) }), reducedMotion: true }
  if (event.type === 'OPEN_MENU' && v.mode !== 'MENU_OPEN') return go({ mode: 'MENU_OPEN', resumeState: v, wasPlayingBeforeMenu: isPlaying(v.mode) })
  if (event.type === 'CLOSE_MENU' && v.mode === 'MENU_OPEN') return go(v.resumeState)
  if (v.mode === 'MENU_OPEN') return state
  if (event.type === 'SKIP') return go(state.reducedMotion ? { mode: 'STATIC_FALLBACK', chapter: 'finale' } : { mode: 'FINALE' }, true)
  if (event.type === 'SELECT_HOTEL') return { ...state, activeHotel: event.hotel }
  if (event.type === 'FRAME_READY' && isPlaying(v.mode)) return { ...state, videoReady: true }
  if ((event.type === 'PLAY_FAILED' || event.type === 'MEDIA_STALLED') && isPlaying(v.mode)) return go({ mode: 'MEDIA_ERROR', resumeState: v.mode, errorCode: event.errorCode })
  if (event.type === 'PAUSE' && isPlaying(v.mode)) return go({ mode: 'USER_PAUSED', resumeState: v.mode })
  if (event.type === 'RESUME' && v.mode === 'USER_PAUSED') return go({ mode: v.resumeState }, true)
  if (event.type === 'RETRY' && v.mode === 'MEDIA_ERROR') return go({ mode: v.resumeState }, true)
  if (v.mode === 'STATIC_FALLBACK') {
    const next: Partial<Record<StaticChapter, StaticChapter>> = { invitation: 'welcome', welcome: 'hallway', hallway: 'finale' }
    if ((event.type === 'START' || event.type === 'CONTINUE') && next[v.chapter]) return go({ mode: 'STATIC_FALLBACK', chapter: next[v.chapter]! }, true)
    if (event.type === 'ENTER_ROOM' && v.chapter === 'hallway') return go({ mode: 'STATIC_FALLBACK', chapter: 'room' }, true)
    if (event.type === 'BACK_TO_HALLWAY' && v.chapter === 'room') return go({ mode: 'STATIC_FALLBACK', chapter: 'hallway' }, true)
    return state
  }
  const transitions: Partial<Record<Scene, Partial<Record<CinematicEvent['type'], Scene>>>> = {
    INVITATION: { START: 'MASTER_TO_WELCOME' },
    MASTER_TO_WELCOME: { WELCOME_REACHED: 'WELCOME_PAUSED' },
    WELCOME_PAUSED: { CONTINUE: 'MASTER_TO_HALLWAY' },
    MASTER_TO_HALLWAY: { HALLWAY_REACHED: 'HALLWAY_PAUSED' },
    HALLWAY_PAUSED: { ENTER_ROOM: 'ROOM_ENTERING', CONTINUE: 'MASTER_TO_FINALE' },
    ROOM_ENTERING: { ROOM_FINISHED: 'ROOM_AT_B3' },
    ROOM_AT_B3: { OPEN_ROOM_INFO: 'ROOM_INFO_OPEN', BACK_TO_HALLWAY: 'ROOM_EXITING' },
    ROOM_INFO_OPEN: { CLOSE_ROOM_INFO: 'ROOM_AT_B3', BACK_TO_HALLWAY: 'ROOM_EXITING' },
    ROOM_EXITING: { REVERSE_FINISHED: 'HALLWAY_PAUSED' },
    MASTER_TO_FINALE: { MASTER_FINISHED: 'FINALE' },
  }
  if (v.mode === 'USER_PAUSED' || v.mode === 'MEDIA_ERROR') return state
  const target = transitions[v.mode]?.[event.type]
  return target ? go({ mode: target }, true) : state
}
