// Email Import Parser
// For Gmail: Users authorize with OAuth, we fetch relevant emails
// For other providers: Users can export and upload .mbox or .eml files

import type { ImportedContact } from '../types';

export interface EmailMessage {
  id: string;
  from: {
    name: string;
    email: string;
  };
  to: {
    name: string;
    email: string;
  }[];
  subject: string;
  date: Date;
  snippet: string; // First ~100 chars of body
  body?: string;
}

export interface EmailContactSummary {
  name: string;
  email: string;
  messageCount: number;
  lastEmailDate: Date | null;
  subjects: string[]; // Recent email subjects for context
}

// Parse email address with name: "John Doe <john@example.com>"
export function parseEmailAddress(str: string): { name: string; email: string } {
  const match = str.match(/^(?:"?([^"<]+)"?\s*)?<?([^>]+@[^>]+)>?$/);
  if (match) {
    return {
      name: match[1]?.trim() || match[2].split('@')[0],
      email: match[2].trim().toLowerCase(),
    };
  }
  
  // Fallback: treat whole thing as email
  return { name: str.split('@')[0], email: str.toLowerCase() };
}

// Parse .eml file content
export function parseEmlFile(content: string): EmailMessage | null {
  try {
    const lines = content.split('\n');
    const headers: Record<string, string> = {};
    let bodyStart = 0;
    
    // Parse headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim() === '') {
        bodyStart = i + 1;
        break;
      }
      
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).toLowerCase();
        const value = line.substring(colonIndex + 1).trim();
        headers[key] = value;
      }
    }
    
    // Get body (simplified - doesn't handle MIME properly)
    const bodyLines = lines.slice(bodyStart);
    const body = bodyLines.join('\n');
    
    const from = parseEmailAddress(headers['from'] || '');
    const toStr = headers['to'] || '';
    const to = toStr.split(',').map(s => parseEmailAddress(s.trim()));
    
    // Parse date
    let date = new Date();
    if (headers['date']) {
      const parsed = new Date(headers['date']);
      if (!isNaN(parsed.getTime())) {
        date = parsed;
      }
    }
    
    return {
      id: headers['message-id'] || `eml-${Date.now()}`,
      from,
      to,
      subject: headers['subject'] || '(No Subject)',
      date,
      snippet: body.substring(0, 200).replace(/\s+/g, ' ').trim(),
      body,
    };
  } catch (error) {
    console.error('Failed to parse .eml file:', error);
    return null;
  }
}

// Parse .mbox file (multiple emails)
export function parseMboxFile(content: string): EmailMessage[] {
  const messages: EmailMessage[] = [];
  
  // Split by "From " lines at start of line (mbox format)
  const parts = content.split(/^From /m).filter(p => p.trim());
  
  for (const part of parts) {
    // Reconstruct as if it was an eml
    const firstNewline = part.indexOf('\n');
    const emlContent = part.substring(firstNewline + 1);
    const msg = parseEmlFile(emlContent);
    if (msg) {
      messages.push(msg);
    }
  }
  
  return messages;
}

// Group emails by contact
export function groupEmailsByContact(
  messages: EmailMessage[],
  myEmail: string
): Map<string, EmailContactSummary> {
  const contacts = new Map<string, EmailContactSummary>();
  const myEmailLower = myEmail.toLowerCase();
  
  for (const msg of messages) {
    // Determine the "other" person
    let contact: { name: string; email: string };
    
    if (msg.from.email.toLowerCase() === myEmailLower) {
      // I sent this - use first recipient
      if (msg.to.length > 0) {
        contact = msg.to[0];
      } else {
        continue;
      }
    } else {
      // I received this - use sender
      contact = msg.from;
    }
    
    const existing = contacts.get(contact.email);
    if (existing) {
      existing.messageCount++;
      if (!existing.lastEmailDate || msg.date > existing.lastEmailDate) {
        existing.lastEmailDate = msg.date;
      }
      if (existing.subjects.length < 10) {
        existing.subjects.push(msg.subject);
      }
      // Update name if we got a better one
      if (contact.name && contact.name.length > existing.name.length) {
        existing.name = contact.name;
      }
    } else {
      contacts.set(contact.email, {
        name: contact.name,
        email: contact.email,
        messageCount: 1,
        lastEmailDate: msg.date,
        subjects: [msg.subject],
      });
    }
  }
  
  return contacts;
}

// Convert to ImportedContact
export function toImportedContact(summary: EmailContactSummary): ImportedContact {
  return {
    name: summary.name,
    email: summary.email,
    last_message_date: summary.lastEmailDate?.toISOString(),
    message_count: summary.messageCount,
    source: 'email',
  };
}

// Extract context from email subjects
export function extractEmailContext(summary: EmailContactSummary): string {
  if (summary.subjects.length === 0) return '';
  
  // Join recent subjects as context
  return 'Recent topics: ' + summary.subjects.slice(0, 5).join(', ');
}

// Gmail API helpers (for when OAuth is set up)
// These would be called with the Gmail API access token

export interface GmailApiMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: { name: string; value: string }[];
    body?: { data?: string };
    parts?: { body?: { data?: string } }[];
  };
  internalDate: string;
}

// Parse Gmail API message response
export function parseGmailApiMessage(msg: GmailApiMessage): EmailMessage | null {
  try {
    const getHeader = (name: string) => 
      msg.payload.headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
    
    return {
      id: msg.id,
      from: parseEmailAddress(getHeader('From')),
      to: getHeader('To').split(',').map(s => parseEmailAddress(s.trim())),
      subject: getHeader('Subject'),
      date: new Date(parseInt(msg.internalDate)),
      snippet: msg.snippet,
    };
  } catch {
    return null;
  }
}
