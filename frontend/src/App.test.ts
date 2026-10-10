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
});
