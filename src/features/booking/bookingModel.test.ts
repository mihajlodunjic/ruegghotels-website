import { describe, expect, it } from 'vitest'
import { addDays, dateValue, nightsBetween, validateStay, demoBookingProvider, bookingReducer, initialBookingState, demoReference, type StayQuery } from './bookingModel'
const today = '2026-11-06'
const query: StayQuery = { hotelId: 'agnes', arrival: '2027-02-10', departure: '2027-02-13', adults: 2, children: 0 }
describe('deterministic reservation simulation', () => {
  it('validates calendar dates and counts nights across DST and leap day', () => {
    expect(dateValue('2027-02-30')).toBeNull()
    expect(dateValue('2028-02-29')).not.toBeNull()
    expect(nightsBetween('2027-03-27', '2027-03-30')).toBe(3)
    expect(addDays('2028-02-28', 2)).toBe('2028-03-01')
  })
  it.each([
    [{ hotelId: null }, 'hotelId'], [{ arrival: '2026-11-05' }, 'arrival'], [{ arrival: '' }, 'arrival'], [{ departure: '2027-02-10' }, 'departure'], [{ departure: '2027-02-09' }, 'departure'], [{ departure: '2027-04-01' }, 'departure'], [{ adults: 0 }, 'adults'], [{ adults: 1.5 }, 'adults'], [{ children: -1 }, 'children'], [{ adults: 4, children: 1 }, 'children'],
  ] as const)('rejects invalid stay input %j', (change, field) => expect(validateStay({ ...query, ...change }, today)[field]).toBeTruthy())
  it('accepts today and enforces the local one-year simulation window', () => {
    expect(validateStay({ ...query, arrival: today, departure: addDays(today, 1) }, today)).toEqual({})
    expect(validateStay({ ...query, arrival: '2027-12-01', departure: '2027-12-03' }, today).arrival).toBeTruthy()
  })
  it('calculates exact CHF and EUR totals in integer cents', () => {
    const swiss = demoBookingProvider.search(query, today).offers[0]
    const german = demoBookingProvider.search({ ...query, hotelId: 'schiebel' }, today).offers[0]
    expect(swiss).toMatchObject({ nightlyCents: 14600, totalCents: 43800, currency: 'CHF', nights: 3 })
    expect(german).toMatchObject({ nightlyCents: 12400, totalCents: 37200, currency: 'EUR' })
    expect(demoBookingProvider.search(query, today)).toEqual(demoBookingProvider.search(query, today))
  })
  it('filters capacity and minimum nights without offering invented live results', () => {
    expect(demoBookingProvider.search({ ...query, children: 1 }, today).offers.map((offer) => offer.room.id)).toEqual(['comfort', 'mountain'])
    expect(demoBookingProvider.search({ ...query, departure: '2027-02-11' }, today).offers.map((offer) => offer.room.id)).toEqual(['classic', 'comfort'])
    expect(demoBookingProvider.search({ ...query, adults: 4 }, today).offers.map((offer) => offer.room.id)).toEqual(['mountain'])
  })
  it('returns an honest empty result for sample calendar closures', () => {
    expect(demoBookingProvider.search({ ...query, arrival: '2026-12-23', departure: '2026-12-27' }, today)).toEqual({ offers: [], errors: {} })
  })
  it('guards booking progression and prevents duplicate completions', () => {
    let state = { ...initialBookingState('agnes', today), ...query }
    expect(bookingReducer(state, { type: 'FINISH', today })).toBe(state)
    state = bookingReducer(state, { type: 'SEARCH', today })
    expect(bookingReducer(state, { type: 'CHECKOUT', today })).toBe(state)
    state = bookingReducer(state, { type: 'SELECT', roomId: 'comfort', today })
    state = bookingReducer(state, { type: 'CHECKOUT', today })
    expect(state.step).toBe('CHECKOUT')
    state = bookingReducer(state, { type: 'FINISH', today })
    expect(state.step).toBe('COMPLETE')
    expect(demoReference(state.completionCount)).toBe('DEMO-RG-000001')
    expect(bookingReducer(state, { type: 'FINISH', today })).toBe(state)
    state = bookingReducer(state, { type: 'RESTART', today })
    expect(state).toMatchObject({ step: 'STAY', selectedRoomId: null, completionCount: 1 })
  })
  it('invalidates room selection on hotel/date/party changes', () => {
    const base = { ...initialBookingState('agnes', today), ...query, step: 'ROOMS' as const, selectedRoomId: 'classic' as const }
    expect(bookingReducer(base, { type: 'HOTEL', hotelId: 'schiebel' })).toMatchObject({ hotelId: 'schiebel', step: 'STAY', selectedRoomId: null, arrival: query.arrival })
    expect(bookingReducer(base, { type: 'GUESTS', adults: 3, children: 0 }).selectedRoomId).toBeNull()
    expect(bookingReducer(base, { type: 'DATES', arrival: query.arrival, departure: query.departure }).selectedRoomId).toBeNull()
  })
})
