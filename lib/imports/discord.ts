// Discord Data Export Parser
// Users can request their data from Discord (Settings > Privacy & Safety > Request All of My Data)
// We parse the messages folder to extract DM conversations

import type { ImportedContact } from '../types';

// Discord exports messages as JSON files in the format:
// messages/c{channel_id}/messages.json

export interface DiscordMessage {
  id: string;
  timestamp: string;
  content: string;
  author: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
  };
}

export interface DiscordChannel {
  id: string;
  type: number; // 1 = DM, 3 = Group DM
  recipients?: string[];
  name?: string;
}

export interface DiscordParseResult {
  contactName: string;
  contactId: string;
  messages: DiscordMessage[];
  messageCount: number;
  lastMessageDate: Date | null;
  firstMessageDate: Date | null;
}

// Parse a Discord messages.json file content
export function parseDiscordMessages(
  messagesJson: string,
  channelJson: string
): DiscordParseResult | null {
  try {
    const messages: DiscordMessage[] = JSON.parse(messagesJson);
    const channel: DiscordChannel = JSON.parse(channelJson);
    
    // Only process DMs (type 1)
    if (channel.type !== 1) {
      return null;
    }
    
    // Sort by timestamp
    messages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Find the other person in the DM
    const authors = new Map<string, { username: string; count: number }>();
    for (const msg of messages) {
      const existing = authors.get(msg.author.id);
      if (existing) {
        existing.count++;
      } else {
        authors.set(msg.author.id, { 
          username: msg.author.username, 
          count: 1 
        });
      }
    }
    
    // Get the person who isn't us (assume we sent fewer messages to identify ourselves)
    // This is a heuristic - in practice, we'd know our own user ID
    const sortedAuthors = Array.from(authors.entries())
      .sort((a, b) => b[1].count - a[1].count);
    
    const contactEntry = sortedAuthors[0];
    if (!contactEntry) return null;
    
    return {
      contactName: contactEntry[1].username,
      contactId: contactEntry[0],
      messages,
      messageCount: messages.length,
      lastMessageDate: messages.length > 0 
        ? new Date(messages[messages.length - 1].timestamp) 
        : null,
      firstMessageDate: messages.length > 0 
        ? new Date(messages[0].timestamp) 
        : null,
    };
  } catch (error) {
    console.error('Failed to parse Discord messages:', error);
    return null;
  }
}

// Parse a Discord data package (ZIP contents as file map)
export function parseDiscordDataPackage(
  files: Map<string, string>
): DiscordParseResult[] {
  const results: DiscordParseResult[] = [];
  
  // Find all DM channels
  for (const [path, content] of files) {
    if (path.includes('/messages/') && path.endsWith('/messages.json')) {
      // Get the channel.json for this channel
      const channelPath = path.replace('messages.json', 'channel.json');
      const channelContent = files.get(channelPath);
      
      if (channelContent) {
        const result = parseDiscordMessages(content, channelContent);
        if (result) {
          results.push(result);
        }
      }
    }
  }
  
  return results;
}

// Extract context from Discord DM
export function extractDiscordContext(result: DiscordParseResult): string {
  const theirMessages = result.messages
    .filter(m => m.author.username === result.contactName)
    .slice(-20)
    .map(m => m.content)
    .filter(c => c.length > 0);
  
  const recentContent = theirMessages.join(' ');
  return recentContent.length > 500 
    ? recentContent.substring(0, 500) + '...'
    : recentContent;
}

// Convert to ImportedContact
export function toImportedContact(result: DiscordParseResult): ImportedContact {
  return {
    name: result.contactName,
    last_message_date: result.lastMessageDate?.toISOString(),
    message_count: result.messageCount,
    source: 'discord',
  };
}

// Simple Discord message format parser for manual paste
// Users can copy-paste Discord chat content
export function parseDiscordChatPaste(text: string): { sender: string; content: string; date?: Date }[] {
  const lines = text.split('\n');
  const messages: { sender: string; content: string; date?: Date }[] = [];
  
  // Discord chat format when copied:
  // Username — Today at 10:30 AM
  // Message content
  // or
  // Username — 01/15/2024 10:30 AM
  // Message content
  
  const headerRegex = /^(.+?)\s*[—–-]\s*(.+)$/;
  let currentSender = '';
  let currentContent = '';
  let currentDate: Date | undefined;
  
  for (const line of lines) {
    const headerMatch = line.match(headerRegex);
    
    if (headerMatch) {
      // Save previous message
      if (currentSender && currentContent) {
        messages.push({ sender: currentSender, content: currentContent.trim(), date: currentDate });
      }
      
      currentSender = headerMatch[1].trim();
      currentContent = '';
      
      // Try to parse date
      const dateStr = headerMatch[2].trim();
      if (dateStr.toLowerCase().includes('today')) {
        currentDate = new Date();
      } else if (dateStr.toLowerCase().includes('yesterday')) {
        currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // Try to parse as date
        const parsed = new Date(dateStr);
        currentDate = isNaN(parsed.getTime()) ? undefined : parsed;
      }
    } else if (line.trim() && currentSender) {
      currentContent += (currentContent ? ' ' : '') + line.trim();
    }
  }
  
  // Don't forget the last message
  if (currentSender && currentContent) {
    messages.push({ sender: currentSender, content: currentContent.trim(), date: currentDate });
  }
  
  return messages;
}
