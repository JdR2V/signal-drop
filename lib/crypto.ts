// ─────────────────────────────────────────────────────────────
// SIGNAL DROP — Cryptographic Helpers
// All encryption/decryption happens in the browser only.
// The server never sees plaintext or keys.
// ─────────────────────────────────────────────────────────────

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256; // bits
const IV_LENGTH = 12; // bytes — standard for GCM

// ── Key Generation ───────────────────────────────────────────

/**
 * Generates a fresh AES-256-GCM key.
 * extractable: true so we can export it to a Base64 string for the URL.
 */
export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true, // extractable
    ["encrypt", "decrypt"],
  );
}

/**
 * Exports a CryptoKey to a URL-safe Base64 string.
 * This string goes in the # fragment of the shareable URL.
 */
export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, ""); // URL-safe Base64 (no +, /, or padding)
}

/**
 * Imports a Base64 string back into a CryptoKey for decryption.
 */
export async function importKeyFromBase64(b64: string): Promise<CryptoKey> {
  // Restore standard Base64 from URL-safe variant
  const standardB64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  const raw = Uint8Array.from(atob(standardB64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: ALGORITHM },
    false, // not extractable once imported (no leaking on recipient side)
    ["decrypt"],
  );
}

// ── Encryption ───────────────────────────────────────────────

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string; // Base64
}

/**
 * Encrypts a plaintext string with the given key.
 * Returns Base64-encoded ciphertext and IV — safe to store in the database.
 */
export async function encryptMessage(
  plaintext: string,
  key: CryptoKey,
): Promise<EncryptedPayload> {
  // Generate a fresh random IV for every encryption
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded,
  );

  return {
    ciphertext: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv),
  };
}

// ── Decryption ───────────────────────────────────────────────

/**
 * Decrypts ciphertext using the given key and IV.
 * Throws if the key is wrong or data is tampered with (GCM authentication).
 */
export async function decryptMessage(
  payload: EncryptedPayload,
  key: CryptoKey,
): Promise<string> {
  const cipherBuffer = base64ToBuffer(payload.ciphertext);
  const iv = base64ToBuffer(payload.iv);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    cipherBuffer,
  );

  return new TextDecoder().decode(plainBuffer);
}

// ── Utilities ────────────────────────────────────────────────

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBuffer(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
