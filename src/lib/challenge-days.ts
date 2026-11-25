export function isChallengeDay(day: number, length: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= length;
}

export function nextUnmarkedDay(days: readonly number[], length: number): number | undefined {
  const marked = new Set(days);
  for (let day = 1; day <= length; day++) {
    if (!marked.has(day)) return day;
  }
}
