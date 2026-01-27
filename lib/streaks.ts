import { differenceInDays, differenceInWeeks, parseISO, startOfDay, startOfWeek } from 'date-fns';
import type { Streak, Interaction } from './types';

// Streak calculation logic
// Grug brain says: keep it simple, make it positive

// Contact Streak: Days in a row you logged ANY interaction
export function calculateContactStreak(interactions: Interaction[]): number {
  if (interactions.length === 0) return 0;
  
  // Sort by date descending
  const sorted = [...interactions].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
  );
  
  const today = startOfDay(new Date());
  let streak = 0;
  let currentDate = today;
  
  // Group interactions by day
  const interactionsByDay = new Map<string, boolean>();
  for (const interaction of sorted) {
    const day = startOfDay(parseISO(interaction.occurred_at)).toISOString();
    interactionsByDay.set(day, true);
  }
  
  // Count consecutive days going backwards from today
  for (let i = 0; i < 365; i++) { // Max 1 year streak
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dayStr = startOfDay(checkDate).toISOString();
    
    if (interactionsByDay.has(dayStr)) {
      streak++;
    } else if (i === 0) {
      // If no interaction today, that's okay - check if yesterday had one
      continue;
    } else {
      break;
    }
  }
  
  return streak;
}

// Check-in Streak: Weeks in a row you reached out to someone you marked as important
export function calculateCheckinStreak(
  interactions: Interaction[],
  importantPersonIds: string[]
): number {
  if (interactions.length === 0 || importantPersonIds.length === 0) return 0;
  
  // Filter to only important people
  const importantInteractions = interactions.filter(i => 
    importantPersonIds.includes(i.person_id)
  );
  
  if (importantInteractions.length === 0) return 0;
  
  // Group by week
  const interactionsByWeek = new Map<string, boolean>();
  for (const interaction of importantInteractions) {
    const week = startOfWeek(parseISO(interaction.occurred_at)).toISOString();
    interactionsByWeek.set(week, true);
  }
  
  // Count consecutive weeks
  const thisWeek = startOfWeek(new Date());
  let streak = 0;
  
  for (let i = 0; i < 52; i++) { // Max 1 year
    const checkWeek = new Date(thisWeek);
    checkWeek.setDate(checkWeek.getDate() - (i * 7));
    const weekStr = startOfWeek(checkWeek).toISOString();
    
    if (interactionsByWeek.has(weekStr)) {
      streak++;
    } else if (i === 0) {
      continue; // This week might not have interaction yet
    } else {
      break;
    }
  }
  
  return streak;
}

// Remember Streak: Consecutive birthdays/anniversaries you didn't miss
// (tracked separately - you mark when you remembered)
export function calculateRememberStreak(rememberedDates: Date[]): number {
  // This is tracked by the app - when a birthday passes and you logged an interaction
  // that day, it counts as "remembered"
  return rememberedDates.length;
}

// Get streak message - POSITIVE reinforcement
export function getStreakMessage(streakType: string, count: number): string {
  if (count === 0) {
    return "Start your streak today!";
  }
  
  if (streakType === 'contact') {
    if (count < 7) return `${count} day streak! Keep it going!`;
    if (count < 30) return `${count} days! You're building a habit!`;
    if (count < 100) return `${count} days! You're on fire!`;
    return `${count} days! You're a friendship legend!`;
  }
  
  if (streakType === 'checkin') {
    if (count < 4) return `${count} week streak with close friends!`;
    if (count < 12) return `${count} weeks! Your friends are lucky!`;
    return `${count} weeks! You're amazing at staying connected!`;
  }
  
  if (streakType === 'remember') {
    if (count < 5) return `${count} special days remembered!`;
    if (count < 20) return `${count} days remembered! You never forget!`;
    return `${count} days! Memory champion!`;
  }
  
  return `${count} streak!`;
}

// Get emoji for streak (used in UI)
export function getStreakEmoji(count: number): string {
  if (count === 0) return '🌱';
  if (count < 7) return '🔥';
  if (count < 30) return '💪';
  if (count < 100) return '⭐';
  return '🏆';
}

// Check if streak is at risk (didn't log today for contact streak)
export function isStreakAtRisk(lastInteractionDate: string | null): boolean {
  if (!lastInteractionDate) return false;
  
  const lastDate = startOfDay(parseISO(lastInteractionDate));
  const today = startOfDay(new Date());
  const daysDiff = differenceInDays(today, lastDate);
  
  // At risk if last interaction was yesterday (need to log today to continue)
  return daysDiff === 1;
}
