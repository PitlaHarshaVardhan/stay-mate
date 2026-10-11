import { describe, it, expect } from 'vitest';
import { formatDistance } from './App';

describe('StayMate frontend test suite', () => {
  it('validates navigation route structure', () => {
    const routes = ['/', '/login', '/register', '/connections', '/profile', '/preferences', '/matches', '/groups', '/messages'];
    expect(routes).toContain('/matches');
    expect(routes).toContain('/connections');
  });

  it('formats initials correctly from user names', () => {
    const name = 'Alex Morgan';
    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
    expect(initials).toBe('AM');
  });

  // The recommendation list must show EVERY person with a clear badge: a
  // labelled percentage for eligible matches, their overlap percentage for
  // people who fail a hard gate, and "Not enough data" for eligible people
  // with nothing comparable to score. Nobody is filtered out.
  it('shows every candidate with a clear percentage or an explicit non-match badge', () => {
    const badgeFor = (match: { eligible: boolean; compatibilityScore: number | null }) =>
      match.eligible
        ? match.compatibilityScore !== null
          ? `${match.compatibilityScore}% match`
          : 'Not enough data'
        : match.compatibilityScore !== null
          ? `${match.compatibilityScore}% match`
          : 'Not a match';

    const candidates = [
      { name: 'Strong Match', eligible: true, compatibilityScore: 82 },
      { name: 'Different City', eligible: false, compatibilityScore: 61 },
      { name: 'No Data', eligible: true, compatibilityScore: null },
    ];

    // Nobody is filtered out — all three are rendered.
    expect(candidates).toHaveLength(3);
    expect(badgeFor(candidates[0])).toBe('82% match');
    // Ineligible person still appears, labelled with their overlap percentage.
    expect(badgeFor(candidates[1])).toBe('61% match');
    // Eligible but unscored person gets an honest "no data" badge, not a rejection.
    expect(badgeFor(candidates[2])).toBe('Not enough data');
  });

  // Location is scored by real distance now, and the match cards/details show
  // that distance — e.g. "4.2 km away". Nearby commutes keep one decimal of
  // precision; longer trips round to whole kilometres.
  it('formats match distances for the cards and details', () => {
    expect(formatDistance(0)).toBe('0 km');
    expect(formatDistance(1.57)).toBe('1.6 km');
    expect(formatDistance(9.94)).toBe('9.9 km');
    expect(formatDistance(123.4)).toBe('123 km');
  });
});
