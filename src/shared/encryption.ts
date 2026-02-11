import type { EncryptedData } from './types';

async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  const stored = await chrome.storage.local.get('encKey');
  if (stored.encKey) {
    return crypto.subtle.importKey(
      'raw',
      new Uint8Array(stored.encKey),
      'AES-GCM',
      false,
      ['encrypt', 'decrypt'],
    );
  }
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
  const exported = await crypto.subtle.exportKey('raw', key);
  await chrome.storage.local.set({ encKey: Array.from(new Uint8Array(exported)) });
  return key;
}

export async function encryptApiKey(plaintext: string): Promise<EncryptedData> {
  const key = await getOrCreateEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return { iv: Array.from(iv), data: Array.from(new Uint8Array(ciphertext)) };
}

export async function decryptApiKey(encrypted: EncryptedData): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(encrypted.iv) },
    key,
    new Uint8Array(encrypted.data),
  );
  return new TextDecoder().decode(decrypted);
}
