import { getHotel, isHotelId } from '../data/hotels'
import type { HotelId } from '../features/cinematic/cinematicMachine'
export const enquiryCategories = [{ id: 'general', label: 'General enquiry' }, { id: 'existing', label: 'Existing stay question' }, { id: 'group', label: 'Group travel' }, { id: 'activities', label: 'Outdoor activities' }, { id: 'collaboration', label: 'Local collaborations' }] as const
export type EnquiryCategory = typeof enquiryCategories[number]['id']
export interface EnquiryDraft { category: EnquiryCategory; hotelId: HotelId | ''; name: string; email: string; message: string }
export type EnquiryErrors = Partial<Record<keyof EnquiryDraft, string>>
export function blankEnquiry(hotel: unknown = '', category: unknown = 'general'): EnquiryDraft { return { hotelId: isHotelId(hotel) ? hotel : '', category: enquiryCategories.some((item) => item.id === category) ? category as EnquiryCategory : 'general', name: '', email: '', message: '' } }
export function validateEnquiry(draft: EnquiryDraft): EnquiryErrors {
  const errors: EnquiryErrors = {}
  if (draft.name.trim().length < 2 || draft.name.trim().length > 80) errors.name = 'Please add a name between 2 and 80 characters.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()) || draft.email.length > 254) errors.email = 'Please use a valid email address.'
  if (draft.message.trim().length < 20 || draft.message.trim().length > 2000) errors.message = 'Tell us a little more, using 20 to 2,000 characters.'
  if (!enquiryCategories.some((item) => item.id === draft.category)) errors.category = 'Choose an enquiry type.'
  if (draft.hotelId && !isHotelId(draft.hotelId)) errors.hotelId = 'Choose one of our alpine homes, or leave this open.'
  return errors
}
export function formatEnquiry(draft: EnquiryDraft): string {
  const hotel = getHotel(draft.hotelId || null)
  return `RÜEGG HOTELS — ENQUIRY\n\nEnquiry: ${enquiryCategories.find((item) => item.id === draft.category)?.label || 'General enquiry'}\nHome: ${hotel ? `RÜEGG ${hotel.name}, ${hotel.town}` : 'Happy to explore all three homes'}\nName: ${draft.name.trim()}\nEmail: ${draft.email.trim()}\n\n${draft.message.trim()}`
}
