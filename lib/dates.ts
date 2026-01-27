import {
  format,
  formatDistanceToNow,
  differenceInDays,
  differenceInWeeks,
  parseISO,
  isToday,
  isTomorrow,
  isThisWeek,
  addYears,
  isBefore,
  startOfDay,
} from 'date-fns';

// Format a date for display
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

// Format a date relative to now (e.g., "2 days ago")
export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

// Get days until a recurring date (birthday, anniversary)
// Returns negative if the date already passed this year
export function daysUntilNextOccurrence(dateStr: string): number {
  const date = parseISO(dateStr);
  const today = startOfDay(new Date());
  const thisYear = today.getFullYear();
  
  // Set the date to this year
  let nextOccurrence = new Date(thisYear, date.getMonth(), date.getDate());
  
  // If it already passed this year, use next year
  if (isBefore(nextOccurrence, today)) {
    nextOccurrence = addYears(nextOccurrence, 1);
  }
  
  return differenceInDays(nextOccurrence, today);
}

// Get a friendly string for days until event
export function formatDaysUntil(days: number): string {
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  if (days < 14) return 'Next week';
  if (days < 30) return `In ${Math.floor(days / 7)} weeks`;
  return `In ${Math.floor(days / 30)} months`;
}

// Get days since last contact
export function daysSinceContact(lastContactedAt: string | null | undefined): number | null {
  if (!lastContactedAt) return null;
  const date = parseISO(lastContactedAt);
  return differenceInDays(new Date(), date);
}

// Format days since for display
export function formatDaysSince(days: number | null): string {
  if (days === null) return 'Never contacted';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return 'Over a year ago';
}

// Check if someone needs a nudge (configurable threshold)
export function needsNudge(lastContactedAt: string | null | undefined, thresholdDays: number = 30): boolean {
  const days = daysSinceContact(lastContactedAt);
  if (days === null) return true; // Never contacted = needs nudge
  return days >= thresholdDays;
}

// Get nudge urgency level
export function getNudgeUrgency(days: number | null): 'none' | 'low' | 'medium' | 'high' {
  if (days === null) return 'high';
  if (days < 14) return 'none';
  if (days < 30) return 'low';
  if (days < 60) return 'medium';
  return 'high';
}

// Format birthday for display (without year for privacy)
export function formatBirthday(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, 'MMMM d');
}

// Get age from birthday
export function getAge(birthdayStr: string): number {
  const birthday = parseISO(birthdayStr);
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  
  return age;
}
