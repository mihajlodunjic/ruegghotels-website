import { hotels, isHotelId } from '../../data/hotels'
import type { HotelId } from '../cinematic/cinematicMachine'
export const PASSPORT_KEY = 'ruegg-passport-demo-v1'
export interface Passport { version: 1; stamps: HotelId[] }
export const emptyPassport = (): Passport => ({ version: 1, stamps: [] })
export function parsePassport(raw: string | null): Passport {
  if (!raw) return emptyPassport()
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('stamps' in value) || !Array.isArray(value.stamps) || value.stamps.length > 3 || !value.stamps.every(isHotelId) || Object.keys(value).some((key) => key !== 'version' && key !== 'stamps')) return emptyPassport()
    return { version: 1, stamps: [...new Set(value.stamps as HotelId[])] }
  } catch { return emptyPassport() }
}
export function passportReducer(state: Passport, event: { type: 'COLLECT'; hotelId: HotelId } | { type: 'RESET' }): Passport {
  if (event.type === 'RESET') return emptyPassport()
  if (!isHotelId(event.hotelId) || state.stamps.includes(event.hotelId)) return state
  return { version: 1, stamps: hotels.filter((hotel) => [...state.stamps, event.hotelId].includes(hotel.id)).map((hotel) => hotel.id) }
}
export const remainingHotels = (passport: Passport) => hotels.filter((hotel) => !passport.stamps.includes(hotel.id))
export const rewardUnlocked = (passport: Passport) => hotels.every((hotel) => passport.stamps.includes(hotel.id))
type PassportStorage = Pick<Storage, 'getItem' | 'setItem'>
export function readPassport(storage?: PassportStorage): { passport: Passport; available: boolean } {
  try { return storage ? { passport: parsePassport(storage.getItem(PASSPORT_KEY)), available: true } : { passport: emptyPassport(), available: false } }
  catch { return { passport: emptyPassport(), available: false } }
}
export function savePassport(passport: Passport, storage?: PassportStorage): boolean {
  try { if (!storage) return false; storage.setItem(PASSPORT_KEY, JSON.stringify({ version: 1, stamps: passport.stamps.filter(isHotelId) })); return true }
  catch { return false }
}
export function browserPassportStorage(): Storage | undefined { try { return window.localStorage } catch { return undefined } }
