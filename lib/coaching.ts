// AI Coaching for Prosocial
// Uses OpenAI API to generate coaching tips
// Privacy: We only send anonymized patterns, never raw notes

import type { Person, Interaction, CoachingTip } from './types';

// OpenAI API key from environment
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

interface CoachingContext {
  // Anonymized person info
  relationship: string;
  daysSinceContact: number | null;
  hasBirthdaySoon: boolean;
  interactionCount: number;
  recentMoods: string[];
  // General patterns
  totalPeople: number;
  totalInteractions: number;
}

// Generate a pre-meeting tip
export async function generatePreMeetingTip(
  person: Person,
  recentInteractions: Interaction[]
): Promise<string> {
  if (!OPENAI_API_KEY) {
    // Fallback tips when no API key
    return getLocalPreMeetingTip(person, recentInteractions);
  }
  
  try {
    const lastInteraction = recentInteractions[0];
    const prompt = `You are a friendly social coach. Generate a brief, helpful tip for someone about to meet a ${person.relationship}.

${lastInteraction ? `Their last interaction was ${getRelativeTime(lastInteraction.occurred_at)} and went "${lastInteraction.mood}".` : 'They haven\'t logged any recent interactions.'}

Keep it to 1-2 sentences. Be warm and encouraging, not robotic.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || getLocalPreMeetingTip(person, recentInteractions);
  } catch (error) {
    console.error('Coaching API error:', error);
    return getLocalPreMeetingTip(person, recentInteractions);
  }
}

// Generate awkwardness help
export async function generateAwkwardnessHelp(
  mood: 'awkward',
  interactionType: string,
  relationship: string
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return getLocalAwkwardnessHelp();
  }
  
  try {
    const prompt = `Someone just logged an awkward ${interactionType} interaction with a ${relationship}. 

Give them one encouraging tip for next time. Be empathetic, not preachy. Keep it to 1-2 sentences.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || getLocalAwkwardnessHelp();
  } catch (error) {
    console.error('Coaching API error:', error);
    return getLocalAwkwardnessHelp();
  }
}

// Generate conversation starters
export async function generateConversationStarters(
  relationship: string,
  tags: string[]
): Promise<string[]> {
  if (!OPENAI_API_KEY) {
    return getLocalConversationStarters(relationship);
  }
  
  try {
    const prompt = `Generate 3 natural conversation starters for catching up with a ${relationship}${tags.length > 0 ? ` who is interested in ${tags.join(', ')}` : ''}.

Make them feel genuine, not scripted. Return as a JSON array of strings.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    try {
      return JSON.parse(content);
    } catch {
      return getLocalConversationStarters(relationship);
    }
  } catch (error) {
    console.error('Coaching API error:', error);
    return getLocalConversationStarters(relationship);
  }
}

// Get pattern insights based on interaction history
export function getPatternInsights(
  interactions: Interaction[],
  people: Person[]
): CoachingTip[] {
  const tips: CoachingTip[] = [];
  
  // Analyze interaction frequency
  const thisWeek = interactions.filter(i => 
    new Date(i.occurred_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const lastWeek = interactions.filter(i => {
    const date = new Date(i.occurred_at);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    return date <= weekAgo && date > twoWeeksAgo;
  });
  
  if (thisWeek.length > lastWeek.length * 1.5) {
    tips.push({
      id: 'more-social',
      type: 'pattern',
      title: 'More Social This Week',
      content: `You've logged ${thisWeek.length} interactions this week, up from ${lastWeek.length} last week. Keep it up!`,
      created_at: new Date().toISOString(),
    });
  }
  
  // Analyze awkward interactions
  const recentAwkward = thisWeek.filter(i => i.mood === 'awkward');
  if (recentAwkward.length >= 2) {
    tips.push({
      id: 'awkward-pattern',
      type: 'pattern',
      title: 'Tough Week Socially',
      content: 'You\'ve had a few awkward interactions. That\'s normal! Try asking more open-ended questions next time.',
      created_at: new Date().toISOString(),
    });
  }
  
  // Check for neglected relationships
  const neglectedFamily = people.filter(p => {
    if (p.relationship !== 'family') return false;
    const lastContact = p.last_contacted_at ? new Date(p.last_contacted_at) : null;
    if (!lastContact) return true;
    return Date.now() - lastContact.getTime() > 14 * 24 * 60 * 60 * 1000;
  });
  
  if (neglectedFamily.length >= 2) {
    tips.push({
      id: 'family-check',
      type: 'general',
      title: 'Family Check-in',
      content: `You haven't connected with ${neglectedFamily.length} family members in over two weeks. Maybe reach out?`,
      created_at: new Date().toISOString(),
    });
  }
  
  return tips;
}

// Local fallback tips (no API needed)
function getLocalPreMeetingTip(person: Person, interactions: Interaction[]): string {
  const tips = [
    'Remember to ask about what matters to them, not just share your own updates.',
    'A genuine compliment goes a long way. Notice something specific about them.',
    'Put your phone away and be fully present. They\'ll notice the difference.',
    'Ask follow-up questions. It shows you\'re really listening.',
    'It\'s okay if there are silences. Not every moment needs to be filled.',
  ];
  
  const lastInteraction = interactions[0];
  if (lastInteraction?.mood === 'awkward') {
    return 'Last time felt a bit off. Start with something light and let the conversation flow naturally.';
  }
  
  if (person.relationship === 'family') {
    return 'Family time is precious. Try to be curious rather than critical.';
  }
  
  return tips[Math.floor(Math.random() * tips.length)];
}

function getLocalAwkwardnessHelp(): string {
  const tips = [
    'Awkward moments happen to everyone. Don\'t overthink it - they probably didn\'t notice as much as you think.',
    'Next time, try asking a question about them. It takes the pressure off you.',
    'Sometimes conversations just don\'t flow. That\'s okay and doesn\'t reflect on you.',
    'If you ran out of things to say, try commenting on your surroundings or asking about their recent experiences.',
    'Remember: being a good listener is more valuable than being a great talker.',
  ];
  
  return tips[Math.floor(Math.random() * tips.length)];
}

function getLocalConversationStarters(relationship: string): string[] {
  const general = [
    'What\'s been the highlight of your week?',
    'Been watching or reading anything good lately?',
    'Any plans for the weekend?',
  ];
  
  const family = [
    'How\'s everyone doing at home?',
    'Remember when we used to... [share a memory]',
    'What have you been up to lately?',
  ];
  
  const work = [
    'How\'s work been treating you?',
    'Any exciting projects you\'re working on?',
    'How\'s the team doing?',
  ];
  
  switch (relationship) {
    case 'family':
      return family;
    case 'work':
      return work;
    default:
      return general;
  }
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}
