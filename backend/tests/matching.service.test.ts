import { describe, expect, it } from '@jest/globals';
import { buildRankedMatches, calculateCompatibility, MATCHING_ALGORITHM_VERSION, MatchCandidate, MatchingProfile } from '../src/modules/matching/matching.service';

const compatibleA: MatchingProfile = {
  city: 'Hyderabad',
  area: 'Madhapur',
  budgetMin: 8000,
  budgetMax: 12000,
  moveInDate: '2026-10-15T00:00:00.000Z',
  roomType: 'DOUBLE',
  smokingPreference: 'NON_SMOKER',
  drinkingPreference: 'NO_PREFERENCE',
  foodPreference: 'VEG',
  sleepSchedule: 'EARLY',
  cleanlinessPreference: 'HIGH',
  genderPreference: 'ANY',
  gender: 'FEMALE',
};

const compatibleB: MatchingProfile = {
  ...compatibleA,
  area: 'Madhapur',
  budgetMin: 10000,
  budgetMax: 15000,
  moveInDate: '2026-10-17T00:00:00.000Z',
  gender: 'FEMALE',
};

describe('roommate compatibility scoring', () => {
  it('returns versioned weighted components and complete coverage', () => {
    const result = calculateCompatibility(compatibleA, compatibleB);

    expect(result.eligible).toBe(true);
    expect(result.algorithmVersion).toBe(MATCHING_ALGORITHM_VERSION);
    expect(result.comparedCount).toBe(9);
    expect(result.coveragePercent).toBe(100);
    expect(result.breakdown.find((component) => component.key === 'budget')).toMatchObject({
      score: 29,
      weight: 25,
    });
    expect(result.breakdown.find((component) => component.key === 'moveInDate')?.score).toBe(90);
  });

  it('scores different cities by distance instead of rejecting them', () => {
    const result = calculateCompatibility(compatibleA, { ...compatibleB, city: 'Pune', area: 'Kothrud' });

    // Location is no longer a hard gate — nobody is badged "Not a match" for
    // living in another city; they get a low provisional location score.
    expect(result.eligible).toBe(true);
    expect(result.incompatibilityReasons).toEqual([]);
    expect(result.locationDistanceKm).toBeNull();
    expect(result.breakdown.find((component) => component.key === 'location')).toMatchObject({ score: 20 });
    expect(result.breakdown.find((component) => component.key === 'location')?.explanation).toContain('Different cities');
  });

  it('scores two pinned places by real distance and reports the distance', () => {
    // ~1.6 km apart on the latitude axis, both inside Hyderabad.
    const result = calculateCompatibility(
      { ...compatibleA, latitude: 17.4467, longitude: 78.3489 },
      { ...compatibleB, latitude: 17.4326, longitude: 78.3489 },
    );

    expect(result.eligible).toBe(true);
    expect(result.locationDistanceKm).toBeGreaterThan(1);
    expect(result.locationDistanceKm).toBeLessThan(2.5);
    const location = result.breakdown.find((component) => component.key === 'location');
    expect(location?.score).toBe(100);
    expect(location?.explanation).toMatch(/km apart — walking distance\./);
  });

  it('scores far-apart pins low but keeps both people eligible', () => {
    // Hyderabad -> Pune is several hundred km.
    const result = calculateCompatibility(
      { ...compatibleA, latitude: 17.4467, longitude: 78.3489 },
      { ...compatibleB, city: 'Pune', area: 'Kothrud', latitude: 18.5074, longitude: 73.8077 },
    );

    expect(result.eligible).toBe(true);
    expect(result.locationDistanceKm!).toBeGreaterThan(100);
    expect(result.breakdown.find((component) => component.key === 'location')?.score).toBe(10);
    expect(result.breakdown.find((component) => component.key === 'location')?.explanation).toContain('far apart');
  });

  it('rejects budgets with no shared feasible range', () => {
    const result = calculateCompatibility(compatibleA, { ...compatibleB, budgetMin: 13000, budgetMax: 18000 });

    expect(result.eligible).toBe(false);
    expect(result.incompatibilityReasons).toContain('Budget ranges do not overlap.');
  });

  it('applies explicit roommate gender requirements symmetrically', () => {
    const result = calculateCompatibility(
      { ...compatibleA, genderPreference: 'MALE' },
      { ...compatibleB, genderPreference: 'ANY', gender: 'FEMALE' },
    );

    expect(result.eligible).toBe(false);
    expect(result.incompatibilityReasons).toContain('A stated roommate gender requirement is not met.');
  });

  it('does not block on a missing profile gender; records an unverifiable note instead', () => {
    const result = calculateCompatibility(
      { ...compatibleA, genderPreference: 'FEMALE' },
      { ...compatibleB, gender: undefined },
    );

    // Absence of data is not incompatibility: the candidate stays eligible and
    // keeps a real score, with the unverifiable requirement shown as a note.
    expect(result.eligible).toBe(true);
    expect(result.incompatibilityReasons).toHaveLength(0);
    expect(result.compatibilityScore).not.toBeNull();
    expect(result.notes).toContain(
      'A stated roommate gender requirement could not be verified because a profile gender is missing; it was not treated as a blocker.',
    );
  });

  it('normalizes over answered preferences and reports missing-data coverage', () => {
    const result = calculateCompatibility(
      { ...compatibleA, sleepSchedule: undefined },
      { ...compatibleB, sleepSchedule: undefined },
    );

    expect(result.eligible).toBe(true);
    expect(result.compatibilityScore).not.toBeNull();
    expect(result.comparedCount).toBe(8);
    expect(result.coveragePercent).toBe(89);
    expect(result.breakdown.find((component) => component.key === 'sleep')?.score).toBeNull();
  });

  it('does not claim locality distance when only city equality is known', () => {
    const result = calculateCompatibility(compatibleA, { ...compatibleB, area: 'Banjara Hills' });

    expect(result.eligible).toBe(true);
    expect(result.breakdown.find((component) => component.key === 'location')).toMatchObject({ score: 60 });
    expect(result.notes).toContain('Locality compatibility is provisional because area-to-area distance is not geocoded.');
  });

  it('allows backend weights to be overridden through MATCHING_WEIGHTS_JSON', () => {
    const previousWeights = process.env.MATCHING_WEIGHTS_JSON;
    process.env.MATCHING_WEIGHTS_JSON = JSON.stringify({
      budget: 100,
      location: 0,
      moveInDate: 0,
      roomType: 0,
      smoking: 0,
      cleanliness: 0,
      drinking: 0,
      food: 0,
      sleep: 0,
    });

    try {
      const result = calculateCompatibility(compatibleA, compatibleB);
      expect(result.compatibilityScore).toBe(29);
      expect(result.breakdown.find((component) => component.key === 'budget')?.weight).toBe(100);
    } finally {
      if (previousWeights === undefined) delete process.env.MATCHING_WEIGHTS_JSON;
      else process.env.MATCHING_WEIGHTS_JSON = previousWeights;
    }
  });
});

describe('buildRankedMatches', () => {
  const current: MatchingProfile = { ...compatibleA };

  function candidate(id: string, name: string, preference: Partial<MatchingProfile>, gender?: string): MatchCandidate {
    return {
      userId: id,
      userName: name,
      preference: { ...compatibleB, ...preference },
      gender,
    };
  }

  it('keeps every candidate, including far-away and budget-gated ones', () => {
    const results = buildRankedMatches(current, [
      candidate('u1', 'Strong Match', {}, 'FEMALE'),
      candidate('u2', 'Different City', { city: 'Pune', area: 'Kothrud' }, 'FEMALE'),
      candidate('u3', 'No Budget Overlap', { budgetMin: 13000, budgetMax: 18000 }, 'FEMALE'),
    ]);

    // Nobody is dropped.
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.user.name).sort()).toEqual(['Different City', 'No Budget Overlap', 'Strong Match']);
    // A far-away person is no longer a hard "Not a match": they stay eligible
    // with a low distance-based location score, ranked below the local match.
    const differentCity = results.find((r) => r.user.name === 'Different City');
    expect(differentCity?.eligible).toBe(true);
    expect(differentCity?.incompatibilityReasons).toEqual([]);
    expect(differentCity?.breakdown.find((c) => c.key === 'location')?.score).toBe(20);
    // The budget gate still hard-blocks.
    const noBudget = results.find((r) => r.user.name === 'No Budget Overlap');
    expect(noBudget?.eligible).toBe(false);
    expect(noBudget?.incompatibilityReasons).toContain('Budget ranges do not overlap.');
  });

  it('ranks eligible matches ahead of unscored or gated people', () => {
    const emptyCandidate = candidate('u3', 'No Data', {
      city: undefined,
      area: undefined,
      budgetMin: undefined,
      budgetMax: undefined,
      moveInDate: undefined,
      roomType: undefined,
      smokingPreference: undefined,
      drinkingPreference: undefined,
      foodPreference: undefined,
      sleepSchedule: undefined,
      cleanlinessPreference: undefined,
      genderPreference: undefined,
      gender: undefined,
    } as any, undefined);

    const results = buildRankedMatches(current, [
      candidate('u2', 'Different City', { city: 'Pune', area: 'Kothrud' }, 'FEMALE'),
      emptyCandidate,
      candidate('u4', 'No Budget Overlap', { budgetMin: 13000, budgetMax: 18000 }, 'FEMALE'),
      candidate('u1', 'Strong Match', {}, 'FEMALE'),
    ]);

    // The eligible, fully scored candidate comes first.
    expect(results[0].user.name).toBe('Strong Match');
    expect(results[0].eligible).toBe(true);
    expect(results[0].compatibilityScore).not.toBeNull();
    // The fully-empty person is eligible but unscored (null score).
    const noData = results.find((r) => r.user.name === 'No Data');
    expect(noData?.compatibilityScore).toBeNull();
    // Nobody dropped; ordering: eligible by score (Strong Match, Different
    // City, No Data with null score), then the budget-gated person.
    expect(results.map((r) => r.user.name)).toEqual(['Strong Match', 'Different City', 'No Data', 'No Budget Overlap']);
    expect(results.find((r) => r.user.name === 'Different City')?.eligible).toBe(true);
    expect(results.find((r) => r.user.name === 'No Budget Overlap')?.eligible).toBe(false);
  });

  it('sorts eligible candidates by descending compatibility score', () => {
    const results = buildRankedMatches(current, [
      candidate('u1', 'Same Locality', { area: 'Madhapur' }, 'FEMALE'),
      candidate('u2', 'Different Locality', { area: 'Banjara Hills' }, 'FEMALE'),
    ]);

    const eligible = results.filter((r) => r.eligible);
    expect(eligible).toHaveLength(2);
    expect(eligible[0].compatibilityScore!).toBeGreaterThanOrEqual(eligible[1].compatibilityScore!);
  });
});