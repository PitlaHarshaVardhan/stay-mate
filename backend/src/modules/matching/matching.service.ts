export function calculateCompatibilityScore(a: any, b: any) {
  const locationScore = a.city === b.city ? 1 : 0;
  const budgetOverlap = Math.max(0, Math.min(a.budgetMax, b.budgetMax) - Math.max(a.budgetMin, b.budgetMin));
  const budgetRange = Math.max(1, Math.max(a.budgetMax - a.budgetMin, b.budgetMax - b.budgetMin));
  const budgetScore = budgetOverlap > 0 ? Math.min(1, budgetOverlap / budgetRange) : 0;

  const dateA = new Date(a.moveInDate).getTime();
  const dateB = new Date(b.moveInDate).getTime();
  const diffDays = Math.abs((dateA - dateB) / (1000 * 60 * 60 * 24));
  let moveInScore = 0;
  if (diffDays === 0) moveInScore = 1;
  else if (diffDays <= 3) moveInScore = 0.9;
  else if (diffDays <= 7) moveInScore = 0.7;
  else if (diffDays <= 30) moveInScore = 0.4;

  const roomScore = a.roomType === b.roomType ? 1 : a.roomType === 'ANY' || b.roomType === 'ANY' ? 0.9 : 0.3;

  const lifestyleKeys = ['smokingPreference', 'drinkingPreference', 'foodPreference', 'sleepSchedule', 'cleanlinessPreference'];
  let lifestyleTotal = 0;
  for (const key of lifestyleKeys) {
    const av = a[key];
    const bv = b[key];
    if (av === bv) lifestyleTotal += 1;
    else if (av === 'NO_PREFERENCE' || bv === 'NO_PREFERENCE' || av === 'ANY' || bv === 'ANY') lifestyleTotal += 0.9;
    else lifestyleTotal += 0.2;
  }
  const lifestyleScore = lifestyleTotal / lifestyleKeys.length;

  const occupationScore = a.occupationType === b.occupationType ? 1 : 0.5;
  const roommateScore = 1;

  const total =
    locationScore * 0.3 +
    budgetScore * 0.2 +
    moveInScore * 0.15 +
    roomScore * 0.1 +
    lifestyleScore * 0.15 +
    occupationScore * 0.05 +
    roommateScore * 0.05;

  return Math.round(Math.max(0, Math.min(100, total * 100)));
}
