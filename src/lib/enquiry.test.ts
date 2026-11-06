import { describe, expect, it } from 'vitest'
import { blankEnquiry, validateEnquiry, formatEnquiry } from './enquiry'
import { filterExperiences } from '../data/experiences'
describe('local enquiry and destination guide', () => {
  it('validates required contact fields without a delivery endpoint', () => {
    expect(Object.keys(validateEnquiry(blankEnquiry())).sort()).toEqual(['email', 'message', 'name'])
    expect(validateEnquiry({ ...blankEnquiry(), name: 'Alex', email: 'not-an-email', message: 'A short note' }).email).toBeTruthy()
  })
  it('formats the exact prepared message as plain text', () => {
    const draft = { ...blankEnquiry('spalloni', 'group'), name: ' Alex ', email: ' alex@example.com ', message: ' We would like to plan a mountain stay together. ' }
    expect(validateEnquiry(draft)).toEqual({})
    const text = formatEnquiry(draft)
    expect(text).toContain('Enquiry: Group travel')
    expect(text).toContain('Home: RÜEGG Spalloni, Splügen')
    expect(text).toContain('Email: alex@example.com')
    expect(text).not.toMatch(/sent|delivered|confirmed/i)
  })
  it('handles unknown contact presets gracefully', () => expect(blankEnquiry('unknown', 'other')).toMatchObject({ hotelId: '', category: 'general' }))
  it('applies both guide filters and can produce a meaningful empty state', () => {
    expect(filterExperiences('agnes', 'cycling')).toHaveLength(1)
    expect(filterExperiences('agnes', 'cycling')[0].hotelId).toBe('agnes')
    expect(filterExperiences('schiebel', 'winter')).toEqual([])
    expect(filterExperiences('all', 'all')).toHaveLength(9)
  })
})
