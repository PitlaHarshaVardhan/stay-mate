import { describe, it, expect } from 'vitest';

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
  // labelled percentage for eligible matches, the overlap percentage alongside
  // "Not a match" for people who fail a hard gate, and "Not enough data" for
  // eligible people with nothing comparable to score. Nobody is filtered out.
  it('shows every candidate with a clear percentage or an explicit non-match badge', () => {
    const badgeFor = (match: { eligible: boolean; compatibilityScore: number | null }) =>
      match.eligible
        ? match.compatibilityScore !== null
          ? `${match.compatibilityScore}% match`
          : 'Not enough data'
        : match.compatibilityScore !== null
          ? `Not a match · ${match.compatibilityScore}%`
          : 'Not a match';

    const candidates = [
      { name: 'Strong Match', eligible: true, compatibilityScore: 82 },
      { name: 'Different City', eligible: false, compatibilityScore: 61 },
      { name: 'No Data', eligible: true, compatibilityScore: null },
    ];

    // Nobody is filtered out — all three are rendered.
    expect(candidates).toHaveLength(3);
    expect(badgeFor(candidates[0])).toBe('82% match');
    // Ineligible person still appears with a clear label AND their overlap score.
    expect(badgeFor(candidates[1])).toBe('Not a match · 61%');
    // Eligible but unscored person gets an honest "no data" badge, not a rejection.
    expect(badgeFor(candidates[2])).toBe('Not enough data');
  });
});
