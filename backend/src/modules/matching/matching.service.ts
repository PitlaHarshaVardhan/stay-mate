// 1.1.0: location is no longer a hard gate — pinned locations are scored by
// real straight-line (haversine) distance, and unpinned pairs fall back to
// city/area string comparison with a low provisional score.
// 1.0.0: initial weighted algorithm with city/budget/gender hard gates.
export const MATCHING_ALGORITHM_VERSION = '1.1.0';

export const DEFAULT_COMPATIBILITY_WEIGHTS = {
  budget: 25,
  location: 20,
  moveInDate: 15,
  roomType: 10,
  smoking: 8,
  cleanliness: 7,
  drinking: 5,
  food: 5,
  sleep: 5,
} as const;

type WeightKey = keyof typeof DEFAULT_COMPATIBILITY_WEIGHTS;
type PreferenceValue = string | number | Date | null | undefined;

export type MatchingProfile = {
  city?: PreferenceValue;
  area?: PreferenceValue;
  latitude?: PreferenceValue;
  longitude?: PreferenceValue;
  budgetMin?: PreferenceValue;
  budgetMax?: PreferenceValue;
  moveInDate?: PreferenceValue;
  roomType?: PreferenceValue;
  smokingPreference?: PreferenceValue;
  drinkingPreference?: PreferenceValue;
  foodPreference?: PreferenceValue;
  sleepSchedule?: PreferenceValue;
  cleanlinessPreference?: PreferenceValue;
  genderPreference?: PreferenceValue;
  gender?: PreferenceValue;
};

export type CompatibilityComponent = {
  key: WeightKey;
  label: string;
  score: number | null;
  weight: number;
  explanation: string;
};

export type CompatibilityResult = {
  eligible: boolean;
  incompatibilityReasons: string[];
  compatibilityScore: number | null;
  // Straight-line distance (km, 1 decimal) between the two pinned locations.
  // null when either side has no map pin saved.
  locationDistanceKm: number | null;
  algorithmVersion: string;
  comparedCount: number;
  totalCriteria: number;
  coveragePercent: number;
  breakdown: CompatibilityComponent[];
  notes: string[];
};

type ComponentInput = {
  key: WeightKey;
  label: string;
  a: PreferenceValue;
  b: PreferenceValue;
  explain: (a: string, b: string) => string;
  score: (a: string, b: string) => number;
};

function getWeights(): Record<WeightKey, number> {
  const raw = process.env.MATCHING_WEIGHTS_JSON;
  if (!raw) return { ...DEFAULT_COMPATIBILITY_WEIGHTS };

  try {
    const overrides = JSON.parse(raw) as Partial<Record<WeightKey, number>>;
    const weights = { ...DEFAULT_COMPATIBILITY_WEIGHTS, ...overrides };
    const values = Object.values(weights);
    if (values.some((weight) => !Number.isFinite(weight) || weight < 0) || values.every((weight) => weight === 0)) {
      return { ...DEFAULT_COMPATIBILITY_WEIGHTS };
    }
    return weights;
  } catch {
    return { ...DEFAULT_COMPATIBILITY_WEIGHTS };
  }
}

function normalized(value: PreferenceValue): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim().toLocaleLowerCase();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function finiteNumber(value: PreferenceValue): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function dateTimestamp(value: PreferenceValue): number | undefined {
  if (!(typeof value === 'string' || value instanceof Date)) return undefined;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function budgetScore(a: string, b: string): number {
  const [aMin, aMax, bMin, bMax] = [a, b].flatMap((range) => range.split(',').map(Number));
  const overlapStart = Math.max(aMin, bMin);
  const overlapEnd = Math.min(aMax, bMax);
  const combinedRange = Math.max(aMax, bMax) - Math.min(aMin, bMin);
  if (combinedRange === 0) return 100;
  return Math.round((Math.max(0, overlapEnd - overlapStart) / combinedRange) * 100);
}

function dateScore(a: string, b: string): number {
  const days = Math.abs(Number(a) - Number(b)) / 86_400_000;
  if (days === 0) return 100;
  if (days <= 3) return 90;
  if (days <= 7) return 75;
  if (days <= 14) return 50;
  return 20;
}

function equalityOrFlexible(a: string, b: string, flexible: string, conflictScore: number): number {
  if (a === b) return 100;
  if (a === flexible || b === flexible) return 75;
  return conflictScore;
}

function cleanlinessScore(a: string, b: string): number {
  const levels: Record<string, number> = { low: 0, medium: 1, high: 2 };
  if (levels[a] === undefined || levels[b] === undefined) return 60;
  const difference = Math.abs(levels[a] - levels[b]);
  return difference === 0 ? 100 : difference === 1 ? 70 : 40;
}

const EARTH_RADIUS_KM = 6371;

// Great-circle (haversine) distance between the two pinned places, in km.
// Returns undefined when either side has no usable pin — e.g. people who saved
// preferences before location pinning existed.
export function distanceKm(a: MatchingProfile, b: MatchingProfile): number | undefined {
  const latA = finiteNumber(a.latitude);
  const lngA = finiteNumber(a.longitude);
  const latB = finiteNumber(b.latitude);
  const lngB = finiteNumber(b.longitude);
  if (latA === undefined || lngA === undefined || latB === undefined || lngB === undefined) return undefined;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(latB - latA);
  const deltaLng = toRadians(lngB - lngA);
  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Location score for a known distance. Closer people share a commute, so the
// percentage falls monotonically as the pins get farther apart. This replaces
// the old behavior where different cities were a hard "Not a match" gate.
export function locationDistanceScore(km: number): number {
  if (km <= 2) return 100;
  if (km <= 5) return 90;
  if (km <= 10) return 80;
  if (km <= 25) return 60;
  if (km <= 50) return 40;
  if (km <= 100) return 25;
  return 10;
}

export function proximityLabel(km: number): string {
  if (km <= 2) return 'walking distance';
  if (km <= 5) return 'nearby';
  if (km <= 15) return 'a short ride away';
  if (km <= 40) return 'across the same wider area';
  if (km <= 100) return 'within commutable range';
  return 'far apart';
}

// Human-readable distance, keeping sub-10 km values precise (commute-relevant)
// and rounding longer trips to whole kilometres.
export function formatDistanceKm(km: number): string {
  const rounded = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
  return `${rounded} km`;
}

function genderEligibilityIssue(preference: string | undefined, otherGender: string | undefined): string | undefined {
  if (!preference || preference === 'any') return undefined;
  // Missing data is not proof of incompatibility. When the other person has not
  // set a profile gender the requirement simply cannot be verified — that is
  // surfaced as a note (see calculateCompatibility), never a hard block.
  // Only a VERIFIED mismatch (both sides stated a gender, and they differ) gates.
  if (!otherGender) return undefined;
  if (preference !== otherGender) return 'A stated roommate gender requirement is not met.';
  return undefined;
}

function calculateComponent(input: ComponentInput, weight: number): CompatibilityComponent {
  const a = normalized(input.a);
  const b = normalized(input.b);
  if (!a || !b) {
    return {
      key: input.key,
      label: input.label,
      score: null,
      weight,
      explanation: 'Not compared because one or both preferences are missing.',
    };
  }
  return {
    key: input.key,
    label: input.label,
    score: input.score(a, b),
    weight,
    explanation: input.explain(a, b),
  };
}

export function calculateCompatibility(a: MatchingProfile, b: MatchingProfile): CompatibilityResult {
  const weights = getWeights();
  const incompatibilityReasons: string[] = [];
  const notes: string[] = [];
  const cityA = normalized(a.city);
  const cityB = normalized(b.city);
  const aMin = finiteNumber(a.budgetMin);
  const aMax = finiteNumber(a.budgetMax);
  const bMin = finiteNumber(b.budgetMin);
  const bMax = finiteNumber(b.budgetMax);

  // Location is deliberately NOT a hard gate: a candidate in another city is
  // scored by distance instead of rejected, so the UI can show how far apart
  // the two people are with a percentage that reflects it.
  if (aMin !== undefined && aMax !== undefined && bMin !== undefined && bMax !== undefined && Math.min(aMax, bMax) < Math.max(aMin, bMin)) {
    incompatibilityReasons.push('Budget ranges do not overlap.');
  }

  const preferredGenderA = normalized(a.genderPreference);
  const preferredGenderB = normalized(b.genderPreference);
  const genderA = normalized(a.gender);
  const genderB = normalized(b.gender);
  const genderIssueA = genderEligibilityIssue(preferredGenderA, genderB);
  const genderIssueB = genderEligibilityIssue(preferredGenderB, genderA);
  if (genderIssueA) incompatibilityReasons.push(genderIssueA);
  if (genderIssueB && genderIssueB !== genderIssueA) incompatibilityReasons.push(genderIssueB);
  // A requirement that cannot be checked (the other side never stated a gender)
  // must not fail closed — otherwise everyone without a profile gender would be
  // badged "Not a match". Surface it as a visible note instead.
  const genderUnverifiableA = Boolean(preferredGenderA && preferredGenderA !== 'any' && !genderB);
  const genderUnverifiableB = Boolean(preferredGenderB && preferredGenderB !== 'any' && !genderA);
  if (genderUnverifiableA || genderUnverifiableB) {
    notes.push('A stated roommate gender requirement could not be verified because a profile gender is missing; it was not treated as a blocker.');
  }

  const areaA = normalized(a.area);
  const areaB = normalized(b.area);

  // Location component: when both people have map pins, score the real
  // straight-line distance and surface it (e.g. "4.2 km apart — nearby") so
  // the UI never has to fall back to a bare "Not a match" for location.
  // Without pins, fall back to the city/area strings with a provisional score.
  const placeDistanceKm = distanceKm(a, b);
  let provisionalLocality = false;
  let locationComponent: CompatibilityComponent;
  if (placeDistanceKm !== undefined) {
    locationComponent = {
      key: 'location',
      label: 'Location',
      score: locationDistanceScore(placeDistanceKm),
      weight: weights.location,
      explanation: `${formatDistanceKm(placeDistanceKm)} apart — ${proximityLabel(placeDistanceKm)}.`,
    };
  } else if (cityA && areaA && cityB && areaB) {
    const sameLocality = areaA === areaB;
    provisionalLocality = cityA === cityB && !sameLocality;
    locationComponent = {
      key: 'location',
      label: 'Location',
      score: cityA !== cityB ? 20 : sameLocality ? 100 : 60,
      weight: weights.location,
      explanation: cityA !== cityB
        ? 'Different cities; the exact distance appears once both people pick their place on the map.'
        : sameLocality
          ? 'Same city and locality.'
          : 'Same city, different localities; the exact distance appears once both people pick their place on the map.',
    };
  } else {
    locationComponent = {
      key: 'location',
      label: 'Location',
      score: null,
      weight: weights.location,
      explanation: 'Not compared because one or both preferences are missing.',
    };
  }

  const components: CompatibilityComponent[] = [
    calculateComponent({
      key: 'budget', label: 'Budget', a: aMin !== undefined && aMax !== undefined ? `${aMin},${aMax}` : undefined,
      b: bMin !== undefined && bMax !== undefined ? `${bMin},${bMax}` : undefined,
      score: budgetScore,
      explain: (left, right) => `Shared budget overlap is ₹${Math.max(Number(left.split(',')[0]), Number(right.split(',')[0]))}–₹${Math.min(Number(left.split(',')[1]), Number(right.split(',')[1]))}.`,
    }, weights.budget),
    locationComponent,
    calculateComponent({
      key: 'moveInDate', label: 'Move-in date', a: dateTimestamp(a.moveInDate), b: dateTimestamp(b.moveInDate),
      score: dateScore,
      explain: (left, right) => `${Math.abs(Number(left) - Number(right)) / 86_400_000} day(s) apart.`,
    }, weights.moveInDate),
    calculateComponent({
      key: 'roomType', label: 'Room sharing', a: a.roomType, b: b.roomType,
      score: (left, right) => equalityOrFlexible(left, right, 'any', 50),
      explain: (left, right) => left === right ? 'Room-sharing preferences match.' : left === 'any' || right === 'any' ? 'One person is flexible on room sharing.' : 'Different room-sharing preferences.',
    }, weights.roomType),
    calculateComponent({
      key: 'smoking', label: 'Smoking', a: a.smokingPreference, b: b.smokingPreference,
      score: (left, right) => equalityOrFlexible(left, right, 'no_preference', 40),
      explain: (left, right) => left === right ? 'Smoking preferences match.' : left === 'no_preference' || right === 'no_preference' ? 'One person has no stated smoking preference.' : 'Smoking preferences differ.',
    }, weights.smoking),
    calculateComponent({
      key: 'cleanliness', label: 'Cleanliness', a: a.cleanlinessPreference, b: b.cleanlinessPreference,
      score: cleanlinessScore,
      explain: (left, right) => left === right ? 'Cleanliness standards match.' : 'Cleanliness standards differ.',
    }, weights.cleanliness),
    calculateComponent({
      key: 'drinking', label: 'Drinking', a: a.drinkingPreference, b: b.drinkingPreference,
      score: (left, right) => equalityOrFlexible(left, right, 'no_preference', 40),
      explain: (left, right) => left === right ? 'Drinking preferences match.' : left === 'no_preference' || right === 'no_preference' ? 'One person has no stated drinking preference.' : 'Drinking preferences differ.',
    }, weights.drinking),
    calculateComponent({
      key: 'food', label: 'Food', a: a.foodPreference, b: b.foodPreference,
      score: (left, right) => equalityOrFlexible(left, right, 'any', 60),
      explain: (left, right) => left === right ? 'Food preferences match.' : left === 'any' || right === 'any' ? 'One person is flexible about food.' : 'Food preferences differ; shared-kitchen expectations may need discussion.',
    }, weights.food),
    calculateComponent({
      key: 'sleep', label: 'Sleep schedule', a: a.sleepSchedule, b: b.sleepSchedule,
      score: (left, right) => equalityOrFlexible(left, right, 'flexible', 40),
      explain: (left, right) => left === right ? 'Sleep schedules match.' : left === 'flexible' || right === 'flexible' ? 'One person is flexible about schedule.' : 'Sleep schedules differ.',
    }, weights.sleep),
  ];

  const comparedComponents = components.filter((component) => component.score !== null);
  const availableWeight = comparedComponents.reduce((total, component) => total + component.weight, 0);
  const weightedTotal = comparedComponents.reduce((total, component) => total + (component.score ?? 0) * component.weight, 0);
  const compatibilityScore = availableWeight > 0 ? Math.round(weightedTotal / availableWeight) : null;

  if (provisionalLocality) {
    notes.push('Locality compatibility is provisional because area-to-area distance is not geocoded.');
  }

  return {
    eligible: incompatibilityReasons.length === 0,
    incompatibilityReasons,
    compatibilityScore,
    locationDistanceKm: placeDistanceKm === undefined ? null : Math.round(placeDistanceKm * 10) / 10,
    algorithmVersion: MATCHING_ALGORITHM_VERSION,
    comparedCount: comparedComponents.length,
    totalCriteria: components.length,
    coveragePercent: Math.round((comparedComponents.length / components.length) * 100),
    breakdown: components,
    notes,
  };
}

export type MatchCandidate = {
  userId: string;
  userName: string;
  preference: MatchingProfile;
  gender?: PreferenceValue;
  profile?: unknown;
};

export type RankedMatch = {
  user: { id: string; name: string };
  profile?: unknown;
  preference: MatchingProfile;
} & CompatibilityResult;

// Builds the recommendation list for the current user from already-fetched
// candidates. Every candidate is kept — including people who fail a hard gate
// (incompatible) or have too little data to score — so nobody is silently
// hidden. Eligible candidates rank above the rest, and within each group the
// higher compatibility score sorts first. People with no comparable data
// (null score) sink to the very bottom.
export function buildRankedMatches(current: MatchingProfile, candidates: MatchCandidate[]): RankedMatch[] {
  return candidates
    .map((candidate) => ({
      user: { id: candidate.userId, name: candidate.userName },
      profile: candidate.profile,
      preference: candidate.preference,
      ...calculateCompatibility(current, { ...candidate.preference, gender: candidate.gender }),
    }))
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      return (b.compatibilityScore ?? -1) - (a.compatibilityScore ?? -1);
    });
}

export function calculateCompatibilityScore(a: MatchingProfile, b: MatchingProfile): number {
  const result = calculateCompatibility(a, b);
  return result.eligible ? result.compatibilityScore ?? 0 : 0;
}
