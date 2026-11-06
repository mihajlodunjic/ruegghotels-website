import type { HotelId } from '../features/cinematic/cinematicMachine'
export type ExperienceCategory = 'walks' | 'cycling' | 'winter' | 'culture'
export const experienceCategories: { id: ExperienceCategory; label: string }[] = [{ id: 'walks', label: 'Walks & trails' }, { id: 'cycling', label: 'On two wheels' }, { id: 'winter', label: 'Winter days' }, { id: 'culture', label: 'Food & culture' }]
export interface Experience { id: string; hotelId: HotelId; category: ExperienceCategory; title: string; description: string; detail: string; season: string; rhythm: string; provenance: 'illustrative' }
// Curated example itineraries, not named providers, contracts or guaranteed excursions.
export const experiences: Experience[] = [
  { id: 'slow-morning', hotelId: 'agnes', category: 'walks', title: 'The unhurried mountain morning', description: 'A gentle start, a path through the valley and plenty of time to stop and look around.', detail: 'Begin with breakfast, choose a walk that matches your pace and leave space in the day for the unexpected. Ask about seasonal trail conditions before setting out.', season: 'Spring to autumn', rhythm: 'At your own pace', provenance: 'illustrative' },
  { id: 'valley-ride', hotelId: 'agnes', category: 'cycling', title: 'A day on two wheels', description: 'Follow the valley’s quieter corners, with a picnic stop somewhere along the way.', detail: 'Build an easy-going day around the distance you enjoy. A local route conversation is a good place to begin; equipment and route arrangements can be discussed separately.', season: 'Late spring to autumn', rhythm: 'An easy-going day', provenance: 'illustrative' },
  { id: 'winter-morning', hotelId: 'agnes', category: 'winter', title: 'Fresh air, quieter trails', description: 'Crisp mornings, a winter walk and the welcome of a warm room at the end of the day.', detail: 'Keep the plan flexible around the weather. Winter paths and access change with conditions, so start with a conversation about a suitable outing.', season: 'Winter', rhythm: 'A gentle winter day', provenance: 'illustrative' },
  { id: 'village-walk', hotelId: 'spalloni', category: 'walks', title: 'From village lanes to open air', description: 'Let a slow village stroll become a little more of an adventure.', detail: 'There is no need to fill every hour. Explore on foot, pause for something warm and choose how far you would like the day to take you.', season: 'Spring to autumn', rhythm: 'Half a day, or longer', provenance: 'illustrative' },
  { id: 'snow-day', hotelId: 'spalloni', category: 'winter', title: 'Your kind of snow day', description: 'An active morning outside, a slower afternoon and stories to bring back to the table.', detail: 'Whether your preference is walking or winter sport, shape the day around your experience and the conditions. Activity arrangements are considered individually.', season: 'Winter', rhythm: 'Active or unhurried', provenance: 'illustrative' },
  { id: 'regional-table', hotelId: 'spalloni', category: 'culture', title: 'A taste of the region', description: 'Discover the everyday flavours and small traditions that give a place its character.', detail: 'Make time for a local food stop and the pleasure of exploring village life. Follow your appetite and curiosity, and leave enough time to enjoy the small discoveries along the way.', season: 'All year', rhythm: 'A leisurely afternoon', provenance: 'illustrative' },
  { id: 'forest-path', hotelId: 'schiebel', category: 'walks', title: 'A path through the trees', description: 'A little shade, a little birdsong and a different way to spend the morning.', detail: 'Choose a route suited to the day and your group. Leave room for a pause, a photograph or simply a few quiet minutes outdoors.', season: 'Spring to autumn', rhythm: 'Slow exploration', provenance: 'illustrative' },
  { id: 'cycling-together', hotelId: 'schiebel', category: 'cycling', title: 'The shared adventure', description: 'Set out together, find your own rhythm and return with a story worth sharing.', detail: 'A cycling day can be as gentle or as active as you make it. Discuss route choices and equipment needs when planning your stay.', season: 'Late spring to autumn', rhythm: 'Make a day of it', provenance: 'illustrative' },
  { id: 'small-discoveries', hotelId: 'schiebel', category: 'culture', title: 'The pleasure of small discoveries', description: 'Local food, a browse around the village and a day with nothing to hurry towards.', detail: 'Step away from the itinerary for a while. Follow your curiosity, enjoy the everyday details and take the long way back.', season: 'All year', rhythm: 'No timetable needed', provenance: 'illustrative' },
]
export function filterExperiences(destination: HotelId | 'all', category: ExperienceCategory | 'all') { return experiences.filter((experience) => (destination === 'all' || experience.hotelId === destination) && (category === 'all' || experience.category === category)) }

export type Interest = 'scenic' | 'hiking' | 'cycling' | 'winter' | 'culture' | 'quiet' | 'photography'
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type Intensity = 'relaxed' | 'balanced' | 'active'
export type ExperienceDuration = 'short' | 'half' | 'full'
export const planningInterests: { id: Interest; label: string; description: string }[] = [
  { id: 'scenic', label: 'Nature & scenic walks', description: 'Fresh air, wide views, a little room to breathe.' },
  { id: 'hiking', label: 'Hiking', description: 'Follow a path and see where the day takes you.' },
  { id: 'cycling', label: 'Cycling', description: 'Find your rhythm on two wheels.' },
  { id: 'winter', label: 'Winter activities', description: 'Crisp air and a different kind of quiet.' },
  { id: 'culture', label: 'Food & local culture', description: 'The everyday pleasures that make a place.' },
  { id: 'quiet', label: 'Quiet exploration', description: 'Less hurry. More time for small discoveries.' },
  { id: 'photography', label: 'Photography & landscapes', description: 'Pause for the light, stay for the view.' },
]
export const categoryInterests: Record<ExperienceCategory, Interest[]> = { walks: ['scenic', 'hiking'], cycling: ['cycling'], winter: ['winter'], culture: ['culture'] }
export interface ExperienceProfile {
  interests: Interest[]; seasons: Season[]; intensity: Intensity[]; durations: ExperienceDuration[]; family: boolean
  transport: 'walking' | 'cycling'; adultBaseCents: number; preparation: string
  stops: { title: string; description: string }[]
}
// Planning metadata extends the same nine editorial records. Prices and route outlines are illustrative.
export const experienceProfiles: Record<string, ExperienceProfile> = {
  'slow-morning': { interests: ['scenic', 'hiking', 'quiet', 'photography'], seasons: ['spring', 'summer', 'autumn'], intensity: ['relaxed', 'balanced'], durations: ['short', 'half'], family: true, transport: 'walking', adultBaseCents: 2400, preparation: 'Comfortable walking shoes, a water bottle and a layer for changing temperatures.', stops: [
    { title: 'A gentle beginning', description: 'Start near your alpine home and choose a valley path after checking local conditions.' },
    { title: 'Follow the valley', description: 'Let the landscape set the pace, with time to notice the small details along the way.' },
    { title: 'A view worth keeping', description: 'Find a comfortable place to pause, take a photograph or simply look around.' },
  ] },
  'valley-ride': { interests: ['cycling', 'photography'], seasons: ['spring', 'summer', 'autumn'], intensity: ['balanced', 'active'], durations: ['half', 'full'], family: false, transport: 'cycling', adultBaseCents: 3800, preparation: 'Arrange a suitable bicycle and helmet separately; check route conditions and bring water.', stops: [
    { title: 'Find your rhythm', description: 'Begin with a bicycle check and a discussion of a route suited to your experience.' },
    { title: 'The quieter valley', description: 'Ride towards open views, keeping the distance flexible around the day.' },
    { title: 'A picnic pause', description: 'Leave time for a food stop of your choosing. Food and equipment are arranged separately.' },
  ] },
  'winter-morning': { interests: ['winter', 'scenic', 'quiet'], seasons: ['winter'], intensity: ['relaxed', 'balanced'], durations: ['short', 'half'], family: true, transport: 'walking', adultBaseCents: 3200, preparation: 'Warm layers and suitable winter footwear. Confirm a maintained path and conditions locally before setting out.', stops: [
    { title: 'A warm beginning', description: 'Check the day’s local winter-path information before choosing a gentle outing.' },
    { title: 'Quiet winter paths', description: 'Follow a suitable maintained path at a comfortable pace, adjusting the plan to conditions.' },
    { title: 'Something warm', description: 'Make room for a warm drink and a moment together before turning towards home.' },
  ] },
  'village-walk': { interests: ['scenic', 'culture', 'quiet', 'photography'], seasons: ['spring', 'summer', 'autumn'], intensity: ['relaxed', 'balanced'], durations: ['short', 'half'], family: true, transport: 'walking', adultBaseCents: 2200, preparation: 'Comfortable shoes and a light layer. Choose your walking distance after checking local access.', stops: [
    { title: 'Village beginnings', description: 'Start with a slow wander through the village, noticing its everyday details.' },
    { title: 'A little more open air', description: 'Continue towards a suitable nearby path, keeping the route flexible.' },
    { title: 'The long way back', description: 'Pause for a photograph or a small refreshment before returning through the lanes.' },
  ] },
  'snow-day': { interests: ['winter', 'hiking', 'photography'], seasons: ['winter'], intensity: ['balanced', 'active'], durations: ['half', 'full'], family: true, transport: 'walking', adultBaseCents: 4200, preparation: 'Discuss suitable winter equipment and conditions locally. Any equipment or activity transport is arranged separately.', stops: [
    { title: 'Shape your snow day', description: 'Start with a conversation about experience, equipment and the day’s conditions.' },
    { title: 'Time in the winter air', description: 'Choose a suitable winter outing, with distance and activity adjusted before departure.' },
    { title: 'A slower afternoon', description: 'Make time for a sheltered pause and something warm before returning.' },
  ] },
  'regional-table': { interests: ['culture', 'quiet'], seasons: ['spring', 'summer', 'autumn', 'winter'], intensity: ['relaxed', 'balanced'], durations: ['short', 'half'], family: true, transport: 'walking', adultBaseCents: 2800, preparation: 'Comfortable shoes and an appetite for discovery. Food purchases and venue arrangements are separate.', stops: [
    { title: 'Meet the everyday village', description: 'Begin with a gentle stroll and a little curiosity about local life.' },
    { title: 'Follow your appetite', description: 'Leave room for a regional food stop of your choosing, subject to local opening hours.' },
    { title: 'Small traditions', description: 'Spend a little time browsing and enjoying the details that give the village its character.' },
  ] },
  'forest-path': { interests: ['scenic', 'hiking', 'quiet', 'photography'], seasons: ['spring', 'summer', 'autumn'], intensity: ['relaxed', 'balanced'], durations: ['short', 'half', 'full'], family: true, transport: 'walking', adultBaseCents: 2400, preparation: 'Walking shoes, water and a weather-appropriate layer. Confirm suitable trail access locally.', stops: [
    { title: 'Into a quieter world', description: 'Begin at a suitable local path, after agreeing a distance that feels comfortable.' },
    { title: 'Follow the trees', description: 'Enjoy the shade and the changing light, with space to explore at your own pace.' },
    { title: 'A clearing, a little time', description: 'Pause for a snack, a photograph or a few quiet minutes before the return.' },
  ] },
  'cycling-together': { interests: ['cycling', 'scenic', 'photography'], seasons: ['spring', 'summer', 'autumn'], intensity: ['balanced', 'active'], durations: ['half', 'full'], family: true, transport: 'cycling', adultBaseCents: 3600, preparation: 'Agree a route and suitable equipment for every participant. Bicycle hire, helmets and transport are arranged separately.', stops: [
    { title: 'Set out together', description: 'Check bicycles and agree a route that suits everyone’s confidence and energy.' },
    { title: 'A shared adventure', description: 'Ride at the group’s pace, leaving room for the views and the unexpected.' },
    { title: 'A well-earned pause', description: 'Stop for a snack and a little time off the saddle before the ride home.' },
  ] },
  'small-discoveries': { interests: ['culture', 'quiet', 'photography'], seasons: ['spring', 'summer', 'autumn', 'winter'], intensity: ['relaxed', 'balanced'], durations: ['short', 'half'], family: true, transport: 'walking', adultBaseCents: 2600, preparation: 'Comfortable everyday shoes. Local opening hours and food arrangements should be checked separately.', stops: [
    { title: 'A day without hurry', description: 'Begin in the village and let curiosity decide the first turn.' },
    { title: 'The pleasure of browsing', description: 'Leave time for everyday shops, village details and a food stop of your choosing.' },
    { title: 'A story to bring home', description: 'Take the slower way back, with time for a photograph and one last discovery.' },
  ] },
}
