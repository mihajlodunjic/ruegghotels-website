import { getHotel, isHotelId } from '../../data/hotels'
import { mockNightlyRates, roomTypes, sampleAvailabilityRules, type RoomId, type RoomType } from '../../data/roomTypes'
import type { HotelId } from '../cinematic/cinematicMachine'

const DAY = 86400000
export function todayISO(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
export function dateValue(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const time = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time : null
}
export const addDays = (value: string, days: number) => new Date((dateValue(value) ?? 0) + days * DAY).toISOString().slice(0, 10)
export const nightsBetween = (arrival: string, departure: string) => { const a = dateValue(arrival); const b = dateValue(departure); return a !== null && b !== null ? Math.round((b - a) / DAY) : 0 }
export const formatDate = (value: string) => dateValue(value) === null ? 'Choose a date' : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
export const formatMoney = (cents: number, currency: 'CHF' | 'EUR') => new Intl.NumberFormat('en-GB', { style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100)
export interface StayQuery { hotelId: HotelId | null; arrival: string; departure: string; adults: number; children: number }
export type StayErrors = Partial<Record<keyof StayQuery, string>>
export function validateStay(query: StayQuery, today: string): StayErrors {
  const errors: StayErrors = {}
  if (!isHotelId(query.hotelId)) errors.hotelId = 'Choose one of our three alpine homes.'
  const arrival = dateValue(query.arrival); const departure = dateValue(query.departure)
  if (arrival === null) errors.arrival = 'Choose a valid arrival date.'
  else if (query.arrival < today) errors.arrival = 'Arrival cannot be in the past.'
  else if (query.arrival > addDays(today, sampleAvailabilityRules.bookingWindowDays)) errors.arrival = 'Choose an arrival within the next year.'
  if (departure === null) errors.departure = 'Choose a valid departure date.'
  else if (arrival !== null && departure <= arrival) errors.departure = 'Departure must be after arrival.'
  else if (nightsBetween(query.arrival, query.departure) > sampleAvailabilityRules.maximumNights) errors.departure = 'For stays over 21 nights, please contact us.'
  else if (query.departure > addDays(today, sampleAvailabilityRules.bookingWindowDays)) errors.departure = 'Choose a departure within the next year.'
  if (!Number.isInteger(query.adults) || query.adults < 1 || query.adults > 4) errors.adults = 'Choose between 1 and 4 adults.'
  if (!Number.isInteger(query.children) || query.children < 0 || query.children > 2 || query.adults + query.children > 4) errors.children = 'For parties over 4 guests, please contact us to plan together.'
  return errors
}
export interface RoomOffer { room: RoomType; nightlyCents: number; totalCents: number; nights: number; currency: 'CHF' | 'EUR' }
export interface BookingSearch { offers: RoomOffer[]; errors: StayErrors }
export interface BookingProvider { search(query: StayQuery, today: string): BookingSearch }
/** Pure, deterministic simulation. No fetch, payment or external inventory is involved. */
export const demoBookingProvider: BookingProvider = {
  search(query, today) {
    const errors = validateStay(query, today)
    const hotel = getHotel(query.hotelId)
    if (Object.keys(errors).length || !hotel) return { offers: [], errors }
    const nights = nightsBetween(query.arrival, query.departure)
    const closed = Array.from({ length: nights }, (_, index) => addDays(query.arrival, index).slice(5)).some((day) => sampleAvailabilityRules.closedMonthDays.some((closedDay) => closedDay === day))
    if (closed) return { offers: [], errors: {} }
    return { errors: {}, offers: roomTypes.filter((room) => room.occupancy >= query.adults + query.children && nights >= room.minimumNights).map((room) => {
      const nightlyCents = mockNightlyRates[hotel.id][room.id]
      return { room, nightlyCents, totalCents: nightlyCents * nights, nights, currency: hotel.currency }
    }) }
  },
}
export interface BookingState extends StayQuery { step: 'STAY' | 'ROOMS' | 'CHECKOUT' | 'COMPLETE'; selectedRoomId: RoomId | null; completionCount: number }
export function initialBookingState(hotelId: HotelId | null, today: string): BookingState { return { hotelId, arrival: addDays(today, 14), departure: addDays(today, 17), adults: 2, children: 0, step: 'STAY', selectedRoomId: null, completionCount: 0 } }
export type BookingEvent = { type: 'HOTEL'; hotelId: HotelId | null } | { type: 'DATES'; arrival: string; departure: string } | { type: 'GUESTS'; adults: number; children: number } | { type: 'SEARCH'; today: string } | { type: 'SELECT'; roomId: RoomId; today: string } | { type: 'CHECKOUT'; today: string } | { type: 'BACK' } | { type: 'FINISH'; today: string } | { type: 'RESTART'; today: string }
export function bookingReducer(state: BookingState, event: BookingEvent): BookingState {
  if (event.type === 'HOTEL') return state.hotelId === event.hotelId ? state : { ...state, hotelId: event.hotelId, step: 'STAY', selectedRoomId: null }
  if (event.type === 'DATES') return { ...state, arrival: event.arrival, departure: event.departure, step: 'STAY', selectedRoomId: null }
  if (event.type === 'GUESTS') return { ...state, adults: event.adults, children: event.children, step: 'STAY', selectedRoomId: null }
  if (event.type === 'RESTART') return { ...initialBookingState(state.hotelId, event.today), completionCount: state.completionCount }
  if (event.type === 'BACK') return { ...state, step: state.step === 'CHECKOUT' ? 'ROOMS' : 'STAY' }
  if (event.type === 'SEARCH' && state.step === 'STAY') return Object.keys(validateStay(state, event.today)).length ? state : { ...state, step: 'ROOMS', selectedRoomId: null }
  if (event.type === 'SELECT' && state.step === 'ROOMS') return demoBookingProvider.search(state, event.today).offers.some((offer) => offer.room.id === event.roomId) ? { ...state, selectedRoomId: event.roomId } : state
  if (event.type === 'CHECKOUT' && state.step === 'ROOMS') return demoBookingProvider.search(state, event.today).offers.some((offer) => offer.room.id === state.selectedRoomId) ? { ...state, step: 'CHECKOUT' } : state
  if (event.type === 'FINISH' && state.step === 'CHECKOUT') return demoBookingProvider.search(state, event.today).offers.some((offer) => offer.room.id === state.selectedRoomId) ? { ...state, step: 'COMPLETE', completionCount: state.completionCount + 1 } : state
  return state
}
export const demoReference = (count: number) => `DEMO-RG-${String(count).padStart(6, '0')}`
