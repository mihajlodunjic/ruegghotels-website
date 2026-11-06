import { experiences, experienceProfiles, planningInterests, categoryInterests, type Experience, type ExperienceCategory, type Interest, type Intensity, type ExperienceDuration, type Season } from '../../data/experiences'
import { getHotel, isHotelId } from '../../data/hotels'
import { addDays, dateValue, formatDate, formatMoney } from '../booking/bookingModel'
import type { HotelId } from '../cinematic/cinematicMachine'

export const paceOptions: { id: Intensity; label: string; description: string }[] = [
  { id: 'relaxed', label: 'Relaxed', description: 'Gentle pace and frequent breaks.' },
  { id: 'balanced', label: 'Balanced', description: 'Moderate movement, time to explore.' },
  { id: 'active', label: 'Active', description: 'A more energetic mountain day.' },
]
export const durationOptions: { id: ExperienceDuration; label: string; minutes: number; description: string }[] = [
  { id: 'short', label: 'Short escape', minutes: 150, description: 'About 2–3 hours' },
  { id: 'half', label: 'Half day', minutes: 240, description: 'About 4 hours' },
  { id: 'full', label: 'Full day', minutes: 390, description: 'About 6–7 hours' },
]
export const considerationOptions = [{ id: 'gentle', label: 'Prefer gentle routes' }, { id: 'family', label: 'Travelling with children' }, { id: 'mobility', label: 'Mobility considerations' }, { id: 'rests', label: 'Frequent rest stops' }] as const
export type Consideration = typeof considerationOptions[number]['id']
export interface ExperiencePreferences {
  hotelId: HotelId | null; date: string; arrival: string; departure: string; interests: Interest[]
  adults: number; children: number; intensity: Intensity; duration: ExperienceDuration; considerations: Consideration[]
  guidance: 'self' | 'guided'; language: 'English' | 'German'; start: 'morning' | 'afternoon'; transport: 'walking' | 'cycling' | 'flexible'; budgetCents: number | null; requests: string
}
export type PlannerStep = 'place' | 'interests' | 'party' | 'details' | 'recommendations' | 'itinerary' | 'complete'
export type PlannerErrors = Partial<Record<keyof ExperiencePreferences, string>>
const validInteger = (value: string | null, min: number, max: number) => value !== null && /^\d{1,2}$/.test(value) && Number(value) >= min && Number(value) <= max ? Number(value) : null
export function initialPreferences(params: URLSearchParams, today: string): ExperiencePreferences {
  const hotel = params.get('hotel')
  const arrival = params.get('arrival') || ''; const departure = params.get('departure') || ''
  const validStay = dateValue(arrival) !== null && dateValue(departure) !== null && arrival >= today && departure > arrival && departure <= addDays(today, 365) && (dateValue(departure)! - dateValue(arrival)!) / 86400000 <= 21
  const rawDate = params.get('date') || ''
  const validDate = dateValue(rawDate) !== null && rawDate >= today && rawDate <= addDays(today, 365) && (!validStay || (rawDate >= arrival && rawDate < departure))
  const adults = validInteger(params.get('adults'), 1, 8) ?? 2
  const requestedChildren = validInteger(params.get('children'), 0, 4) ?? 0
  const children = adults + requestedChildren <= 10 ? requestedChildren : 0
  const source = experiences.find((experience) => experience.id === params.get('experience') && experience.hotelId === hotel)
  const rawInterest = params.get('interest')
  const interests = source ? experienceProfiles[source.id].interests : planningInterests.some((item) => item.id === rawInterest) ? [rawInterest as Interest] : rawInterest && Object.hasOwn(categoryInterests, rawInterest) ? categoryInterests[rawInterest as ExperienceCategory] : ['scenic' as Interest, 'quiet' as Interest]
  return { hotelId: isHotelId(hotel) ? hotel : null, date: validDate ? rawDate : validStay ? arrival : addDays(today, 14), arrival: validStay ? arrival : '', departure: validStay ? departure : '', interests: [...interests], adults, children, intensity: 'relaxed', duration: 'half', considerations: children > 0 ? ['family'] : [], guidance: 'self', language: 'English', start: 'morning', transport: 'flexible', budgetCents: null, requests: '' }
}
export function validatePreferences(value: ExperiencePreferences, today: string, step?: PlannerStep): PlannerErrors {
  const errors: PlannerErrors = {}
  const check = (phase: PlannerStep) => !step || step === phase
  if (check('place')) {
    if (!isHotelId(value.hotelId)) errors.hotelId = 'Choose the alpine home where your day will begin.'
    if (dateValue(value.date) === null || value.date < today || value.date > addDays(today, 365)) errors.date = 'Choose an activity date from today through the next year.'
    if (value.arrival || value.departure) {
      if (dateValue(value.arrival) === null || value.arrival < today) errors.arrival = 'Choose a valid arrival from today onwards, or clear your stay dates.'
      if (dateValue(value.departure) === null || value.departure <= value.arrival || value.departure > addDays(today, 365) || (dateValue(value.departure)! - (dateValue(value.arrival) ?? 0)) / 86400000 > 21) errors.departure = 'Choose a departure after arrival, within a stay of 21 nights and the next year.'
      if (!errors.arrival && !errors.departure && (value.date < value.arrival || value.date >= value.departure)) errors.date = 'Choose an activity date within your stay, before departure.'
    }
  }
  if (check('interests') && (!value.interests.length || value.interests.some((id) => !planningInterests.some((item) => item.id === id)))) errors.interests = 'Choose at least one thing you would love to discover.'
  if (check('party')) {
    if (!Number.isInteger(value.adults) || value.adults < 1 || value.adults > 8) errors.adults = 'Choose between 1 and 8 adults.'
    if (!Number.isInteger(value.children) || value.children < 0 || value.children > 4 || value.adults + value.children > 10) errors.children = 'Choose up to 4 children and at most 10 people. For larger groups, get in touch.'
    if (!paceOptions.some((item) => item.id === value.intensity)) errors.intensity = 'Choose a comfortable pace.'
    if (!durationOptions.some((item) => item.id === value.duration)) errors.duration = 'Choose how much time you would like.'
    if (value.considerations.some((id) => !considerationOptions.some((item) => item.id === id))) errors.considerations = 'Choose one of the listed considerations.'
  }
  if (check('details')) {
    if (!['self', 'guided'].includes(value.guidance)) errors.guidance = 'Choose your preferred way to explore.'
    if (!['English', 'German'].includes(value.language)) errors.language = 'Choose English or German.'
    if (!['morning', 'afternoon'].includes(value.start) || value.duration === 'full' && value.start !== 'morning') errors.start = 'A full day begins in the morning. Please choose a morning start.'
    if (!['walking', 'cycling', 'flexible'].includes(value.transport)) errors.transport = 'Choose your preferred way of getting around.'
    if (value.budgetCents !== null && ![10000, 25000, 50000].includes(value.budgetCents)) errors.budgetCents = 'Choose a listed budget or leave this open.'
    if (value.requests.length > 500) errors.requests = 'Keep your special interests to 500 characters.'
  }
  return errors
}
export function seasonFor(date: string): Season { const month = Number(date.slice(5, 7)); return month === 12 || month <= 2 ? 'winter' : month <= 5 ? 'spring' : month <= 8 ? 'summer' : 'autumn' }
export interface ExperienceQuote { currency: 'CHF' | 'EUR'; adultCents: number; childCents: number; participantCents: number; guidanceCents: number; totalCents: number }
export function quoteExperience(experience: Experience, preferences: ExperiencePreferences, duration: ExperienceDuration): ExperienceQuote {
  const hotel = getHotel(experience.hotelId)!
  const factor = { short: 2, half: 3, full: 5 }[duration]
  const adultCents = Math.round(experienceProfiles[experience.id].adultBaseCents * factor / 2 * (hotel.currency === 'EUR' ? .85 : 1))
  const childCents = Math.round(adultCents / 2)
  const participantCents = preferences.adults * adultCents + preferences.children * childCents
  const guidanceCents = preferences.guidance === 'guided' ? Math.round({ short: 8000, half: 12000, full: 18000 }[duration] * (hotel.currency === 'EUR' ? .85 : 1)) : 0
  return { currency: hotel.currency, adultCents, childCents, participantCents, guidanceCents, totalCents: participantCents + guidanceCents }
}
export interface Recommendation { experience: Experience; score: number; reasons: string[]; differences: string[]; duration: ExperienceDuration; intensity: Intensity; quote: ExperienceQuote; closeMatch: boolean }
const durationIndex = (value: ExperienceDuration) => durationOptions.findIndex((option) => option.id === value)
export function recommendExperiences(preferences: ExperiencePreferences): Recommendation[] {
  if (!isHotelId(preferences.hotelId) || dateValue(preferences.date) === null) return []
  const gentle = preferences.considerations.includes('gentle') || preferences.considerations.includes('mobility')
  return experiences.filter((experience) => {
    const profile = experienceProfiles[experience.id]
    return profile && experience.hotelId === preferences.hotelId && profile.seasons.includes(seasonFor(preferences.date)) && (!preferences.children || profile.family) && (!(gentle || preferences.intensity === 'relaxed') || profile.intensity.includes('relaxed'))
  }).map((experience): Recommendation => {
    const profile = experienceProfiles[experience.id]
    const matches = preferences.interests.filter((id) => profile.interests.includes(id))
    const intensity = gentle ? 'relaxed' : profile.intensity.includes(preferences.intensity) ? preferences.intensity : profile.intensity[0]
    const duration = profile.durations.includes(preferences.duration) ? preferences.duration : [...profile.durations].sort((a, b) => Math.abs(durationIndex(a) - durationIndex(preferences.duration)) - Math.abs(durationIndex(b) - durationIndex(preferences.duration)))[0]
    const quote = quoteExperience(experience, preferences, duration)
    const reasons = [`A ${seasonFor(preferences.date)} idea for ${getHotel(experience.hotelId)!.town}.`]
    const differences: string[] = []
    let score = matches.length * 24
    if (matches.length) reasons.push(`Made for your interest in ${matches.map((id) => planningInterests.find((item) => item.id === id)!.label.toLowerCase()).join(' and ')}.`)
    else differences.push('A different interest to consider at this destination.')
    if (intensity === preferences.intensity || gentle && intensity === 'relaxed') { score += 16; reasons.push(`${paceOptions.find((item) => item.id === intensity)!.label} pace${gentle ? ', with your gentler-route preference in mind' : ', at your preferred rhythm'}.`) }
    else differences.push(`A ${intensity} alternative to your ${preferences.intensity} pace.`)
    if (duration === preferences.duration) { score += 12; reasons.push(`${durationOptions.find((item) => item.id === duration)!.label}, just as you asked.`) }
    else differences.push(`${durationOptions.find((item) => item.id === duration)!.label} rather than your preferred ${durationOptions.find((item) => item.id === preferences.duration)!.label.toLowerCase()}.`)
    if (preferences.children && profile.family) { score += 8; reasons.push('A family-oriented outline, with an extra pause for younger explorers.') }
    if (preferences.transport === profile.transport) { score += 10; reasons.push(`Suited to your preference for ${profile.transport}.`) }
    else if (preferences.transport !== 'flexible') { score -= 12; differences.push(`This outline is based on ${profile.transport}, rather than ${preferences.transport}.`) }
    if (preferences.budgetCents !== null) { if (quote.totalCents <= preferences.budgetCents) { score += 10; reasons.push('Within your preferred sample group budget.') } else { score -= 20; differences.push('Above your preferred sample group budget.') } }
    return { experience, score, reasons, differences, duration, intensity, quote, closeMatch: differences.length === 0 }
  }).sort((a, b) => b.score - a.score || a.experience.id.localeCompare(b.experience.id)).slice(0, 3)
}
export interface ItineraryStop { time: string; title: string; description: string }
export interface Itinerary { title: string; startContext: string; stops: ItineraryStop[]; notes: string[]; recommendation: Recommendation }
const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
export function buildItinerary(recommendation: Recommendation, preferences: ExperiencePreferences): Itinerary {
  const profile = experienceProfiles[recommendation.experience.id]
  const duration = durationOptions.find((item) => item.id === recommendation.duration)!
  const start = preferences.start === 'morning' ? 540 : 840
  const segments = [...profile.stops]
  if (preferences.children || preferences.considerations.includes('family') || preferences.considerations.includes('rests')) segments.splice(2, 0, { title: preferences.children || preferences.considerations.includes('family') ? 'A little pause for everyone' : 'Take your time', description: 'A flexible rest stop for a snack, a drink and a little time to enjoy being here.' })
  if (preferences.interests.includes('photography')) segments.push({ title: 'Keep a little of the light', description: 'Leave a few unhurried minutes for photographs and the details you would like to remember.' })
  segments.push({ title: 'A warm return', description: 'Return at your own pace, with a little time left to settle in and share your day.' })
  const stops = segments.map((stop, index) => ({ ...stop, time: timeLabel(start + Math.round(duration.minutes * index / (segments.length - 1) / 5) * 5) }))
  const notes = [profile.preparation, 'Outdoor routes depend on local conditions and appropriate preparation. Times are planning estimates; trail access, weather, food stops and transport need checking locally.', preferences.guidance === 'guided' ? `A guided experience in ${preferences.language} is your preference; no guide or meeting has been assigned. Arrangements need confirmation.` : `A self-guided outline in ${preferences.language}; choose the final route with local advice before setting out.`]
  if (preferences.considerations.includes('mobility') || preferences.considerations.includes('gentle')) notes.push('Gentler options are prioritised. Route accessibility and individual suitability must be discussed before confirming a plan.')
  return { title: `${getHotel(preferences.hotelId)!.town}, at your own rhythm.`, startContext: 'Suggested start: a planning conversation near your RÜEGG home. The exact meeting point and route would be agreed separately.', stops, notes, recommendation }
}
export function formatItinerary(itinerary: Itinerary, preferences: ExperiencePreferences, reference?: string): string {
  const hotel = getHotel(preferences.hotelId)!
  const item = itinerary.recommendation
  return `RÜEGG HOTELS — YOUR ALPINE EXPERIENCE\n${reference ? `${reference}\n` : ''}\n${itinerary.title}\n${hotel.name} — ${hotel.town}, ${hotel.country}\n${formatDate(preferences.date)} · ${preferences.adults} ${preferences.adults === 1 ? 'adult' : 'adults'}, ${preferences.children} ${preferences.children === 1 ? 'child' : 'children'}\n${item.experience.title}\n${durationOptions.find((value) => value.id === item.duration)!.description} · ${item.intensity} pace\n${preferences.guidance === 'guided' ? 'Guided preference' : 'Self-guided'} · ${preferences.language} · ${preferences.transport} transport preference\nInterests: ${preferences.interests.map((id) => planningInterests.find((item) => item.id === id)!.label).join(', ')}\n${preferences.considerations.length ? `Considerations: ${preferences.considerations.map((id) => considerationOptions.find((item) => item.id === id)!.label).join(', ')}\n` : ''}\n${itinerary.startContext}\n\n${itinerary.stops.map((stop) => `${stop.time} — ${stop.title}\n${stop.description}`).join('\n\n')}\n\nPreparation\n${itinerary.notes.join('\n')}\n${preferences.requests ? `\nYour special interests\n${preferences.requests}\n` : ''}\nSample group total: ${formatMoney(item.quote.totalCents, item.quote.currency)}\nSample pricing only. No tour has been reserved, no payment taken and no request sent to a provider.`
}
export interface PlannerState { step: PlannerStep; preferences: ExperiencePreferences; selectedId: string | null; completions: number }
export type PlannerEvent = { type: 'UPDATE'; patch: Partial<ExperiencePreferences> } | { type: 'NEXT'; today: string } | { type: 'BACK' } | { type: 'EDIT'; step?: 'place' | 'interests' | 'party' | 'details' } | { type: 'SELECT'; id: string; today: string } | { type: 'COMPLETE'; today: string } | { type: 'RESTART'; today: string; otherHotel?: boolean }
const configurationSteps: PlannerStep[] = ['place', 'interests', 'party', 'details']
export function plannerReducer(state: PlannerState, event: PlannerEvent): PlannerState {
  if (event.type === 'UPDATE' && configurationSteps.includes(state.step)) return { ...state, preferences: { ...state.preferences, ...event.patch }, selectedId: null }
  if (event.type === 'EDIT') return { ...state, step: event.step || 'place', selectedId: null }
  if (event.type === 'BACK') { const steps: PlannerStep[] = [...configurationSteps, 'recommendations', 'itinerary']; const index = steps.indexOf(state.step); return index > 0 ? { ...state, step: steps[index - 1] } : state }
  if (event.type === 'NEXT' && configurationSteps.includes(state.step) && !Object.keys(validatePreferences(state.preferences, event.today, state.step)).length) { const index = configurationSteps.indexOf(state.step); return index < 3 ? { ...state, step: configurationSteps[index + 1] } : !Object.keys(validatePreferences(state.preferences, event.today)).length ? { ...state, step: 'recommendations' } : state }
  if (event.type === 'SELECT' && state.step === 'recommendations' && !Object.keys(validatePreferences(state.preferences, event.today)).length && recommendExperiences(state.preferences).some((item) => item.experience.id === event.id)) return { ...state, step: 'itinerary', selectedId: event.id }
  if (event.type === 'COMPLETE' && state.step === 'itinerary' && !Object.keys(validatePreferences(state.preferences, event.today)).length && recommendExperiences(state.preferences).some((item) => item.experience.id === state.selectedId)) return { ...state, step: 'complete', completions: state.completions + 1 }
  if (event.type === 'RESTART') return { step: 'place', preferences: initialPreferences(new URLSearchParams(state.preferences.hotelId && !event.otherHotel ? { hotel: state.preferences.hotelId } : {}), event.today), selectedId: null, completions: state.completions }
  return state
}
export const experienceReference = (count: number) => `DEMO-EXP-${String(count).padStart(6, '0')}`
export function bookingExperienceLink(context: { hotelId: HotelId | null; arrival: string; departure: string; adults: number; children: number }): string {
  const params = new URLSearchParams({ arrival: context.arrival, departure: context.departure, adults: String(context.adults), children: String(context.children) })
  if (context.hotelId) params.set('hotel', context.hotelId)
  return `/experiences?${params.toString()}`
}
