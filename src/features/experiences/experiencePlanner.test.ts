import { describe, expect, it } from 'vitest'
import { experiences, experienceProfiles } from '../../data/experiences'
import { initialPreferences, validatePreferences, recommendExperiences, quoteExperience, buildItinerary, formatItinerary, plannerReducer, experienceReference, bookingExperienceLink, type ExperiencePreferences, type PlannerState } from './experiencePlanner'
const today = '2026-11-06'
const preferences = (patch: Partial<ExperiencePreferences> = {}): ExperiencePreferences => ({ ...initialPreferences(new URLSearchParams('hotel=agnes'), today), date: '2027-06-12', intensity: 'balanced', ...patch })
describe('personal alpine planning', () => {
  it('validates imported stay and guest context, keeping the activity before departure', () => {
    const value = initialPreferences(new URLSearchParams('hotel=spalloni&arrival=2027-06-12&departure=2027-06-16&adults=3&children=1&date=2027-06-16'), today)
    expect(value).toMatchObject({ hotelId: 'spalloni', date: '2027-06-12', arrival: '2027-06-12', departure: '2027-06-16', adults: 3, children: 1 })
    expect(validatePreferences(value, today)).toEqual({})
    expect(validatePreferences({ ...value, date: '2027-06-16' }, today).date).toBeTruthy()
  })
  it('ignores malformed identifiers, impossible dates, unsafe category keys and invalid guest counts', () => {
    for (const interest of ['constructor', 'toString', '__proto__', 'unknown']) {
      const value = initialPreferences(new URLSearchParams(`hotel=nope&arrival=2027-02-30&departure=garbage&adults=99&children=-1&interest=${interest}`), today)
      expect(value).toMatchObject({ hotelId: null, arrival: '', departure: '', adults: 2, children: 0, interests: ['scenic', 'quiet'] })
    }
    expect(initialPreferences(new URLSearchParams('adults=8&children=4'), today)).toMatchObject({ adults: 8, children: 0, considerations: [] })
  })
  it('preselects a Local Circle interest using the same curated record', () => {
    const value = initialPreferences(new URLSearchParams('hotel=agnes&experience=valley-ride&interest=cycling'), today)
    expect(value.interests).toEqual(experienceProfiles['valley-ride'].interests)
    expect(initialPreferences(new URLSearchParams('hotel=schiebel&interest=walks'), today).interests).toEqual(['scenic', 'hiking'])
    expect(experiences.every((experience) => experienceProfiles[experience.id])).toBe(true)
  })
  it('rejects past dates, incomplete stay ranges, empty interests and invalid parties', () => {
    expect(validatePreferences(preferences({ date: '2026-11-05' }), today).date).toBeTruthy()
    expect(validatePreferences(preferences({ arrival: '2027-06-10' }), today).departure).toBeTruthy()
    expect(validatePreferences(preferences({ interests: [] }), today).interests).toBeTruthy()
    expect(validatePreferences(preferences({ adults: 0, children: 5 }), today)).toMatchObject({ adults: expect.any(String), children: expect.any(String) })
    expect(validatePreferences(preferences({ duration: 'full', start: 'afternoon' }), today).start).toBeTruthy()
  })
  it('holds destination and season as hard constraints', () => {
    const winter = recommendExperiences(preferences({ date: '2027-01-12', intensity: 'relaxed' }))
    expect(winter.map((item) => item.experience.id)).toEqual(['winter-morning'])
    expect(recommendExperiences(preferences()).every((item) => item.experience.hotelId === 'agnes' && !item.experience.id.includes('winter'))).toBe(true)
  })
  it('ranks cycling and quiet interests differently and remains deterministic', () => {
    const cycling = preferences({ interests: ['cycling'], transport: 'cycling' })
    expect(recommendExperiences(cycling)[0].experience.id).toBe('valley-ride')
    expect(recommendExperiences(preferences({ interests: ['quiet'], intensity: 'relaxed' }))[0].experience.id).toBe('slow-morning')
    expect(recommendExperiences(cycling)).toEqual(recommendExperiences(cycling))
  })
  it('honours gentle-route and family constraints, explaining duration alternatives', () => {
    const gentle = recommendExperiences(preferences({ intensity: 'active', considerations: ['mobility'], duration: 'full' }))
    expect(gentle.map((item) => item.experience.id)).toEqual(['slow-morning'])
    expect(gentle[0]).toMatchObject({ duration: 'half', intensity: 'relaxed', closeMatch: false })
    expect(gentle[0].differences.join(' ')).toContain('Half day')
    expect(recommendExperiences(preferences({ children: 1, interests: ['cycling'] })).some((item) => item.experience.id === 'valley-ride')).toBe(false)
  })
  it('provides honest off-interest alternatives and budget explanations', () => {
    const result = recommendExperiences(preferences({ hotelId: 'schiebel', date: '2027-01-12', interests: ['winter'], budgetCents: 10000, guidance: 'guided' }))
    expect(result).toHaveLength(1)
    expect(result[0].closeMatch).toBe(false)
    expect(result[0].differences.join(' ')).toContain('Above your preferred sample group budget')
    expect(recommendExperiences(preferences({ hotelId: null }))).toEqual([])
  })
  it('calculates per-person prices and guided group fees in integer cents and the correct currency', () => {
    const swiss = experiences.find((item) => item.id === 'slow-morning')!
    const german = experiences.find((item) => item.id === 'forest-path')!
    const party = preferences({ children: 1, guidance: 'guided' })
    expect(quoteExperience(swiss, party, 'half')).toEqual({ currency: 'CHF', adultCents: 3600, childCents: 1800, participantCents: 9000, guidanceCents: 12000, totalCents: 21000 })
    expect(quoteExperience(german, party, 'half')).toMatchObject({ currency: 'EUR', totalCents: 17850 })
    expect(quoteExperience(swiss, { ...party, guidance: 'self' }, 'half').totalCents).toBe(9000)
  })
  it('assembles distinct itineraries with requested starts, rest/photo stops and preparation', () => {
    const family = preferences({ children: 1, interests: ['scenic', 'photography'], considerations: ['mobility'], start: 'afternoon', requests: 'Time for a photograph together.' })
    const itinerary = buildItinerary(recommendExperiences(family)[0], family)
    expect(itinerary.stops[0].time).toBe('14:00')
    expect(itinerary.stops.at(-1)?.time).toBe('18:00')
    expect(itinerary.stops.some((stop) => stop.title === 'A little pause for everyone')).toBe(true)
    expect(itinerary.stops.some((stop) => stop.title === 'Keep a little of the light')).toBe(true)
    expect(itinerary.notes.join(' ')).toContain('accessibility')
    expect(formatItinerary(itinerary, family, 'DEMO-EXP-000001')).toContain('No tour has been reserved')
    const culture = preferences({ hotelId: 'spalloni', interests: ['culture'] })
    expect(buildItinerary(recommendExperiences(culture)[0], culture).stops[0].title).not.toBe(itinerary.stops[0].title)
  })
  it('guards selection, completion and duplicate requests, and supports editing/restart', () => {
    let state: PlannerState = { step: 'place', preferences: preferences(), selectedId: null, completions: 0 }
    expect(plannerReducer(state, { type: 'COMPLETE', today })).toBe(state)
    for (let i = 0; i < 4; i++) state = plannerReducer(state, { type: 'NEXT', today })
    expect(state.step).toBe('recommendations')
    expect(plannerReducer(state, { type: 'SELECT', id: 'missing', today })).toBe(state)
    state = plannerReducer(state, { type: 'SELECT', id: recommendExperiences(state.preferences)[0].experience.id, today })
    state = plannerReducer(state, { type: 'COMPLETE', today })
    expect(state.step).toBe('complete')
    expect(experienceReference(state.completions)).toBe('DEMO-EXP-000001')
    expect(plannerReducer(state, { type: 'COMPLETE', today })).toBe(state)
    expect(plannerReducer(state, { type: 'EDIT', step: 'party' })).toMatchObject({ step: 'party', selectedId: null })
    expect(plannerReducer(state, { type: 'RESTART', today, otherHotel: true })).toMatchObject({ step: 'place', preferences: { hotelId: null }, completions: 1 })
  })
  it('passes only non-personal booking context through encoded URL parameters', () => {
    const link = bookingExperienceLink({ hotelId: 'agnes', arrival: '2027-06-12', departure: '2027-06-16', adults: 2, children: 1 })
    const params = new URL(link, 'https://example.test').searchParams
    expect([...params.keys()].sort()).toEqual(['adults', 'arrival', 'children', 'departure', 'hotel'])
    expect(initialPreferences(params, today)).toMatchObject({ hotelId: 'agnes', date: '2027-06-12', adults: 2, children: 1 })
  })
})
