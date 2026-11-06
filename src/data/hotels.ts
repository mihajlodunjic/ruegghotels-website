import type { HotelId } from '../features/cinematic/cinematicMachine'
export interface Hotel {
  id: HotelId
  name: string
  destination: string
  town: string
  country: string
  currency: 'CHF' | 'EUR'
  note: string
  character: string
}
export const hotels: Hotel[] = [
  { id: 'agnes', name: 'Agnes', destination: 'Kandersteg · CH', town: 'Kandersteg', country: 'Switzerland', currency: 'CHF', note: 'For unhurried mornings and days that lead a little further.', character: 'A gentle beginning, close to the mountains.' },
  { id: 'spalloni', name: 'Spalloni', destination: 'Splügen · CH', town: 'Splügen', country: 'Switzerland', currency: 'CHF', note: 'A warm pause between old village streets and open trails.', character: 'An alpine spirit, a welcoming heart.' },
  { id: 'schiebel', name: 'Schiebel', destination: 'Oberstdorf · DE', town: 'Oberstdorf', country: 'Germany', currency: 'EUR', note: 'A familiar place to return to after a day outside.', character: 'Room to explore. Time to belong.' },
]
export const isHotelId = (value: unknown): value is HotelId => hotels.some((hotel) => hotel.id === value)
export const getHotel = (id: HotelId | null) => hotels.find((hotel) => hotel.id === id)
