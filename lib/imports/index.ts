// Data Import Hub
// Central place for all import functionality

export * from './whatsapp';
export * from './discord';
export * from './email';

import type { ImportedContact, Person } from '../types';
import { parseWhatsAppExport, toImportedContact as whatsappToContact, extractContactContext as whatsappContext } from './whatsapp';
import { parseDiscordChatPaste, toImportedContact as discordToContact } from './discord';
import { parseMboxFile, parseEmlFile, groupEmailsByContact, toImportedContact as emailToContact } from './email';

// Auto-detect file type and parse
export async function parseImportFile(
  fileName: string,
  content: string,
  myEmail?: string
): Promise<{ contacts: ImportedContact[]; contexts: Map<string, string> }> {
  const contacts: ImportedContact[] = [];
  const contexts = new Map<string, string>();
  
  const ext = fileName.toLowerCase().split('.').pop();
  
  switch (ext) {
    case 'txt': {
      // Likely WhatsApp export
      const result = parseWhatsAppExport(content);
      if (result.messageCount > 0) {
        contacts.push(whatsappToContact(result));
        contexts.set(result.contactName, whatsappContext(result));
      }
      break;
    }
    
    case 'eml': {
      // Single email
      const msg = parseEmlFile(content);
      if (msg && myEmail) {
        const grouped = groupEmailsByContact([msg], myEmail);
        for (const [, summary] of grouped) {
          contacts.push(emailToContact(summary));
        }
      }
      break;
    }
    
    case 'mbox': {
      // Multiple emails
      if (myEmail) {
        const messages = parseMboxFile(content);
        const grouped = groupEmailsByContact(messages, myEmail);
        for (const [, summary] of grouped) {
          contacts.push(emailToContact(summary));
        }
      }
      break;
    }
    
    case 'json': {
      // Could be Discord export or generic JSON
      try {
        const data = JSON.parse(content);
        // Check if it looks like Discord
        if (Array.isArray(data) && data[0]?.author?.username) {
          // It's Discord messages
          // We'd need the channel.json too - for now, skip
          console.log('Discord JSON detected but needs channel.json');
        }
      } catch {
        console.error('Failed to parse JSON import');
      }
      break;
    }
    
    default:
      console.log(`Unknown file type: ${ext}`);
  }
  
  return { contacts, contexts };
}

// Convert ImportedContact to partial Person (for creating new people)
export function importedContactToPerson(
  imported: ImportedContact,
  userId: string,
  extraNotes?: string
): Partial<Person> {
  return {
    user_id: userId,
    name: imported.name,
    relationship: 'acquaintance', // Default, user can change
    notes: extraNotes || '',
    tags: [imported.source], // Tag with source
    last_contacted_at: imported.last_message_date,
  };
}

// Merge imported contact with existing person
export function mergeImportedContact(
  existing: Person,
  imported: ImportedContact,
  newContext?: string
): Partial<Person> {
  const updates: Partial<Person> = {};
  
  // Update last contacted if import is more recent
  if (imported.last_message_date) {
    if (!existing.last_contacted_at || 
        new Date(imported.last_message_date) > new Date(existing.last_contacted_at)) {
      updates.last_contacted_at = imported.last_message_date;
    }
  }
  
  // Add source tag if not present
  if (!existing.tags.includes(imported.source)) {
    updates.tags = [...existing.tags, imported.source];
  }
  
  // Append context to notes if provided
  if (newContext && existing.notes) {
    if (!existing.notes.includes(newContext)) {
      updates.notes = existing.notes + '\n\n---\nImported context:\n' + newContext;
    }
  } else if (newContext) {
    updates.notes = 'Imported context:\n' + newContext;
  }
  
  return updates;
}

// Find potential matches between imported contacts and existing people
export function findPotentialMatches(
  imported: ImportedContact[],
  existing: Person[]
): Map<ImportedContact, Person | null> {
  const matches = new Map<ImportedContact, Person | null>();
  
  for (const contact of imported) {
    let bestMatch: Person | null = null;
    let bestScore = 0;
    
    for (const person of existing) {
      const score = matchScore(contact, person);
      if (score > bestScore && score >= 0.6) { // 60% threshold
        bestScore = score;
        bestMatch = person;
      }
    }
    
    matches.set(contact, bestMatch);
  }
  
  return matches;
}

// Calculate match score between imported contact and existing person
function matchScore(contact: ImportedContact, person: Person): number {
  let score = 0;
  let factors = 0;
  
  // Name similarity (most important)
  const nameSimilarity = stringSimilarity(
    contact.name.toLowerCase(),
    person.name.toLowerCase()
  );
  score += nameSimilarity * 2;
  factors += 2;
  
  // Email match (if available)
  if (contact.email && person.notes?.toLowerCase().includes(contact.email.toLowerCase())) {
    score += 1;
  }
  factors += 1;
  
  // Phone match (if available)
  if (contact.phone && person.notes?.includes(contact.phone)) {
    score += 1;
  }
  factors += 1;
  
  return score / factors;
}

// Simple string similarity (Dice coefficient)
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  
  const bigramsA = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) {
    bigramsA.add(a.substring(i, i + 2));
  }
  
  let matches = 0;
  for (let i = 0; i < b.length - 1; i++) {
    if (bigramsA.has(b.substring(i, i + 2))) {
      matches++;
    }
  }
  
  return (2 * matches) / (a.length + b.length - 2);
}
