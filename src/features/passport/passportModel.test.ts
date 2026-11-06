import { describe, expect, it } from 'vitest'
import { PASSPORT_KEY, emptyPassport, parsePassport, passportReducer, remainingHotels, rewardUnlocked, readPassport, savePassport } from './passportModel'
describe('non-personal demo passport', () => {
  it('progresses through three valid destinations without duplicates or early rewards', () => {
    let state = emptyPassport()
    expect(remainingHotels(state)).toHaveLength(3)
    for (const [index, hotelId] of (['agnes', 'spalloni', 'schiebel'] as const).entries()) {
      state = passportReducer(state, { type: 'COLLECT', hotelId })
      expect(state.stamps).toHaveLength(index + 1)
      expect(remainingHotels(state)).toHaveLength(2 - index)
      expect(rewardUnlocked(state)).toBe(index === 2)
      expect(passportReducer(state, { type: 'COLLECT', hotelId })).toBe(state)
    }
  })
  it('rejects malformed, unknown, oversized and personal persisted objects', () => {
    for (const raw of ['broken', 'null', '[]', '{"version":2,"stamps":[]}', '{"version":1,"stamps":["unknown"]}', '{"version":1,"stamps":["agnes","agnes","agnes","agnes"]}', '{"version":1,"stamps":["agnes"],"email":"alex@example.com"}']) expect(parsePassport(raw)).toEqual(emptyPassport())
    expect(parsePassport('{"version":1,"stamps":["agnes","agnes"]}').stamps).toEqual(['agnes'])
  })
  it('loads progress and writes only schema version and known stamp IDs', () => {
    const entries = new Map<string, string>()
    const storage = { getItem: (key: string) => entries.get(key) || null, setItem: (key: string, value: string) => { entries.set(key, value) } }
    const state = passportReducer(emptyPassport(), { type: 'COLLECT', hotelId: 'spalloni' })
    expect(savePassport(state, storage)).toBe(true)
    expect([...entries.keys()]).toEqual([PASSPORT_KEY])
    expect(JSON.parse(entries.get(PASSPORT_KEY)!)).toEqual({ version: 1, stamps: ['spalloni'] })
    expect(readPassport(storage)).toEqual({ passport: state, available: true })
  })
  it('works for the current visit when storage is missing or denied', () => {
    const blocked = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } }
    expect(readPassport(blocked)).toEqual({ passport: emptyPassport(), available: false })
    expect(readPassport()).toEqual({ passport: emptyPassport(), available: false })
    expect(savePassport(emptyPassport(), blocked)).toBe(false)
    expect(savePassport(emptyPassport())).toBe(false)
  })
  it('reset locks the reward again and restores all remaining destinations', () => {
    const reset = passportReducer({ version: 1, stamps: ['agnes', 'spalloni', 'schiebel'] }, { type: 'RESET' })
    expect(reset).toEqual(emptyPassport())
    expect(rewardUnlocked(reset)).toBe(false)
    expect(remainingHotels(reset).map((hotel) => hotel.id)).toEqual(['agnes', 'spalloni', 'schiebel'])
  })
})
