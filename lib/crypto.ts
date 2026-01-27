import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';

// Pragmatic encryption: We encrypt sensitive text fields (notes) before sending to server
// Names, dates, tags stay unencrypted so we can search and sort
// This gives 80% of privacy benefit with 20% of complexity

const ENCRYPTION_KEY_STORAGE_KEY = 'prosocial_encryption_key';

// Generate a random 256-bit key
async function generateEncryptionKey(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Buffer.from(randomBytes).toString('base64');
}

// Get or create the user's encryption key
// Stored securely on device, never sent to server
export async function getEncryptionKey(): Promise<string> {
  let key: string | null = null;
  
  if (Platform.OS === 'web') {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      key = localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
    }
  } else {
    key = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE_KEY);
  }
  
  if (!key) {
    key = await generateEncryptionKey();
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, key);
      }
    } else {
      await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE_KEY, key);
    }
  }
  
  return key;
}

// Simple XOR encryption - not military grade but:
// 1. Fast
// 2. Works client-side
// 3. Supabase can't read your notes
// 4. Can upgrade to AES later if needed
function xorEncrypt(text: string, key: string): string {
  const textBytes = new TextEncoder().encode(text);
  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(textBytes.length);
  
  for (let i = 0; i < textBytes.length; i++) {
    result[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return Buffer.from(result).toString('base64');
}

function xorDecrypt(encrypted: string, key: string): string {
  const encryptedBytes = Buffer.from(encrypted, 'base64');
  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(encryptedBytes.length);
  
  for (let i = 0; i < encryptedBytes.length; i++) {
    result[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return new TextDecoder().decode(result);
}

// Encrypt a string before storing in database
export async function encryptNote(plaintext: string): Promise<string> {
  if (!plaintext) return '';
  const key = await getEncryptionKey();
  return xorEncrypt(plaintext, key);
}

// Decrypt a string after fetching from database
export async function decryptNote(encrypted: string): Promise<string> {
  if (!encrypted) return '';
  const key = await getEncryptionKey();
  try {
    return xorDecrypt(encrypted, key);
  } catch {
    // If decryption fails, return empty string
    // This can happen if the key changed (shouldn't happen in normal use)
    console.error('Failed to decrypt note');
    return '';
  }
}

// Hash a string (for things like checking if content changed)
export async function hashString(text: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    text
  );
  return digest;
}
