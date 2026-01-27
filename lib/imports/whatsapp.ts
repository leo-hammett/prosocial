// WhatsApp Chat Export Parser
// Users export their chats from WhatsApp and upload the .txt file
// We parse it to extract contacts and conversation context

import type { ImportedContact, ParsedWhatsAppChat } from '../types';

// WhatsApp export format example:
// [1/15/24, 9:41:32 AM] John Doe: Hey, how are you?
// [1/15/24, 9:42:15 AM] You: I'm good! How about you?

// Regex to match WhatsApp message lines
// Handles multiple date formats (US, EU, etc.)
const MESSAGE_REGEX = /^\[?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\]?\s*[-:]?\s*([^:]+):\s*(.+)$/i;

export interface WhatsAppMessage {
  date: Date;
  sender: string;
  content: string;
}

export interface WhatsAppParseResult {
  contactName: string;
  messages: WhatsAppMessage[];
  messageCount: number;
  lastMessageDate: Date | null;
  firstMessageDate: Date | null;
  yourMessageCount: number;
  theirMessageCount: number;
}

// Parse a WhatsApp chat export file
export function parseWhatsAppExport(fileContent: string): WhatsAppParseResult {
  const lines = fileContent.split('\n');
  const messages: WhatsAppMessage[] = [];
  const senders = new Set<string>();
  
  for (const line of lines) {
    const match = line.match(MESSAGE_REGEX);
    if (match) {
      const [, dateStr, timeStr, sender, content] = match;
      
      // Skip system messages
      if (sender.includes('Messages and calls are end-to-end encrypted')) continue;
      if (sender.includes('created group')) continue;
      if (sender.includes('added')) continue;
      if (sender.includes('left')) continue;
      if (sender.includes('changed')) continue;
      
      // Parse the date
      const date = parseWhatsAppDate(dateStr, timeStr);
      if (!date) continue;
      
      messages.push({
        date,
        sender: sender.trim(),
        content: content.trim(),
      });
      
      senders.add(sender.trim());
    }
  }
  
  // Figure out who the contact is (not "You")
  const contactName = Array.from(senders).find(s => 
    s.toLowerCase() !== 'you' && !s.includes('You')
  ) || 'Unknown';
  
  // Count messages
  const yourMessages = messages.filter(m => 
    m.sender.toLowerCase() === 'you' || m.sender.includes('You')
  );
  const theirMessages = messages.filter(m => 
    m.sender.toLowerCase() !== 'you' && !m.sender.includes('You')
  );
  
  // Sort by date
  messages.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return {
    contactName,
    messages,
    messageCount: messages.length,
    lastMessageDate: messages.length > 0 ? messages[messages.length - 1].date : null,
    firstMessageDate: messages.length > 0 ? messages[0].date : null,
    yourMessageCount: yourMessages.length,
    theirMessageCount: theirMessages.length,
  };
}

// Parse WhatsApp date formats
function parseWhatsAppDate(dateStr: string, timeStr: string): Date | null {
  try {
    // Try different date formats
    const dateParts = dateStr.split(/[\/\-\.]/);
    if (dateParts.length !== 3) return null;
    
    let day: number, month: number, year: number;
    
    // Guess format based on values
    const [a, b, c] = dateParts.map(p => parseInt(p, 10));
    
    if (c > 31) {
      // Year is last: M/D/Y or D/M/Y
      year = c < 100 ? 2000 + c : c;
      if (a > 12) {
        // D/M/Y
        day = a;
        month = b;
      } else if (b > 12) {
        // M/D/Y
        month = a;
        day = b;
      } else {
        // Assume M/D/Y (US format, most common in exports)
        month = a;
        day = b;
      }
    } else {
      // Year might be first: Y/M/D
      year = a < 100 ? 2000 + a : a;
      month = b;
      day = c;
    }
    
    // Parse time
    const timeParts = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (!timeParts) return null;
    
    let hours = parseInt(timeParts[1], 10);
    const minutes = parseInt(timeParts[2], 10);
    const seconds = timeParts[3] ? parseInt(timeParts[3], 10) : 0;
    const ampm = timeParts[4];
    
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    
    return new Date(year, month - 1, day, hours, minutes, seconds);
  } catch {
    return null;
  }
}

// Extract key info about a contact from their messages
export function extractContactContext(result: WhatsAppParseResult): string {
  // Get their most recent messages for context
  const theirMessages = result.messages
    .filter(m => m.sender === result.contactName)
    .slice(-20); // Last 20 messages from them
  
  if (theirMessages.length === 0) return '';
  
  // Create a summary of recent topics
  const recentContent = theirMessages.map(m => m.content).join(' ');
  
  // This could be enhanced with AI summarization later
  // For now, just return a snippet
  return recentContent.length > 500 
    ? recentContent.substring(0, 500) + '...'
    : recentContent;
}

// Convert parse result to ImportedContact
export function toImportedContact(result: WhatsAppParseResult): ImportedContact {
  return {
    name: result.contactName,
    last_message_date: result.lastMessageDate?.toISOString(),
    message_count: result.messageCount,
    source: 'whatsapp',
  };
}
