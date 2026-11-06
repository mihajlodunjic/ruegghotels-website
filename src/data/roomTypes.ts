import type { HotelId } from '../features/cinematic/cinematicMachine'
export type RoomId = 'classic' | 'comfort' | 'mountain'
export interface RoomType { id: RoomId; name: string; eyebrow: string; description: string; occupancy: number; amenities: string[]; minimumNights: number; provenance: 'illustrative' }
// Owner-authorized simulation data. These are not verified property room categories or rates.
export const roomTypes: RoomType[] = [
  { id: 'classic', name: 'Classic Double', eyebrow: 'SIMPLE COMFORT', description: 'A calm, comfortable place to put down your bags and settle into the mountain rhythm.', occupancy: 2, amenities: ['Breakfast', 'Wi-Fi', 'Private bathroom'], minimumNights: 1, provenance: 'illustrative' },
  { id: 'comfort', name: 'Alpine Comfort', eyebrow: 'A LITTLE MORE ROOM', description: 'Space to linger over a good book, plan tomorrow’s walk and enjoy an unhurried evening.', occupancy: 3, amenities: ['Breakfast', 'Wi-Fi', 'Sitting corner'], minimumNights: 1, provenance: 'illustrative' },
  { id: 'mountain', name: 'Mountain View', eyebrow: 'WAKE UP SLOWLY', description: 'An airy retreat for shared mountain days, quiet mornings and a little time together.', occupancy: 4, amenities: ['Breakfast', 'Wi-Fi', 'Window seating'], minimumNights: 2, provenance: 'illustrative' },
]
export const mockNightlyRates: Record<HotelId, Record<RoomId, number>> = {
  agnes: { classic: 14600, comfort: 17800, mountain: 21400 },
  spalloni: { classic: 13800, comfort: 16400, mountain: 19800 },
  schiebel: { classic: 12400, comfort: 15200, mountain: 18600 },
}
export const sampleAvailabilityRules = { maximumNights: 21, bookingWindowDays: 365, maximumAdults: 4, maximumChildren: 2, maximumGuests: 4, closedMonthDays: ['12-24', '12-25'] } as const
