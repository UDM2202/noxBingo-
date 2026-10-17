/**
 * Turns a message signature from a wallet into the raw 64 signature bytes
 * the NoxBingo server checks.
 *
 * Why this exists: Farcaster's wallet returns message signatures as a text
 * string without saying which encoding it uses, and the Farcaster wallet
 * package assumes base64. If the string is actually base58 (Solana's
 * usual format) or hex, that assumption produces garbage bytes and the
 * server correctly rejects the signature every time. This tries each
 * encoding and keeps the one that decodes to a real ed25519 signature.
 *
 * No dependencies: the decoders below are small and self-contained.
 */

const SIGNATURE_LENGTH = 64;
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function decodeBase58(text: string): Uint8Array | null {
  if (!text || /[^1-9A-HJ-NP-Za-km-z]/.test(text)) return null;
  const bytes: number[] = [];
  for (const char of text) {
    let carry = BASE58_ALPHABET.indexOf(char);
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // Each leading '1' stands for a leading zero byte.
  for (const char of text) {
    if (char !== '1') break;
    bytes.push(0);
  }
  return new Uint8Array(bytes.reverse());
}

function decodeBase64(text: string): Uint8Array | null {
  // Accept the URL-safe variant and missing padding too.
  let normalised = text.replace(/-/g, '+').replace(/_/g, '/');
  if (/[^A-Za-z0-9+/=]/.test(normalised)) return null;
  while (normalised.length % 4 !== 0) normalised += '=';
  try {
    const binary = atob(normalised);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function decodeHex(text: string): Uint8Array | null {
  const hex = text.startsWith('0x') ? text.slice(2) : text;
  if (hex.length % 2 !== 0 || /[^0-9a-fA-F]/.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function endsWith(bytes: Uint8Array, tail: Uint8Array): boolean {
  if (tail.length > bytes.length) return false;
  const offset = bytes.length - tail.length;
  for (let i = 0; i < tail.length; i++) {
    if (bytes[offset + i] !== tail[i]) return false;
  }
  return true;
}

/** Returns the 64 signature bytes, or null if nothing decodes to one. */
function pickSignature(candidate: Uint8Array | null, message: Uint8Array): Uint8Array | null {
  if (!candidate) return null;
  if (candidate.length === SIGNATURE_LENGTH) return candidate;
  // Some wallets return the "signed message" form: signature + message.
  if (candidate.length === SIGNATURE_LENGTH + message.length && endsWith(candidate, message)) {
    return candidate.slice(0, SIGNATURE_LENGTH);
  }
  return null;
}

export function normaliseSignature(raw: string | Uint8Array, message: Uint8Array): Uint8Array | null {
  if (raw instanceof Uint8Array) return pickSignature(raw, message);
  const text = raw.trim();
  // Order matters: hex is the most specific, and base58 must be tried
  // before base64 because some base58 strings also parse as base64.
  return (
    pickSignature(decodeHex(text), message) ??
    pickSignature(decodeBase58(text), message) ??
    pickSignature(decodeBase64(text), message)
  );
}

/** Short description of the raw value, for console diagnostics only. */
export function describeSignature(raw: string | Uint8Array): string {
  if (raw instanceof Uint8Array) return `bytes(${raw.length})`;
  return `string(${raw.length}) starting "${raw.slice(0, 6)}"`;
}

// ── On-device signature check ─────────────────────────────────────
// Verifies the wallet's signature locally against the player's public
// key, to find out exactly how the wallet encoded the signature and what
// bytes it actually signed. Uses the browser's built-in Ed25519 support
// (WebCrypto), so no extra packages are needed.

const textEncoder = new TextEncoder();

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function u16le(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff]);
}

// "\xffsolana offchain": the prefix some wallets add before signing text.
const OFFCHAIN_DOMAIN = concatBytes(new Uint8Array([0xff]), textEncoder.encode('solana offchain'));

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/** Every form of the challenge a wallet might plausibly have signed. */
function messageVariants(challenge: string, publicKey: Uint8Array): [string, Uint8Array][] {
  const body = textEncoder.encode(challenge);
  const variants: [string, Uint8Array][] = [['plain', body]];
  for (const format of [0, 1, 2]) {
    // Older off-chain format: domain, version, format, length, message.
    variants.push([`offchain-short-f${format}`, concatBytes(
      OFFCHAIN_DOMAIN, new Uint8Array([0, format]), u16le(body.length), body,
    )]);
    // Newer off-chain format adds an application domain and the signer.
    variants.push([`offchain-full-f${format}`, concatBytes(
      OFFCHAIN_DOMAIN, new Uint8Array([0]), new Uint8Array(32), new Uint8Array([format, 1]),
      publicKey, u16le(body.length), body,
    )]);
  }
  variants.push(['hex-text', textEncoder.encode(bytesToHex(body))]);
  variants.push(['base64-text', textEncoder.encode(bytesToBase64(body))]);
  return variants;
}

export type SignatureCheck = {
  /** Signature bytes that verify against the plain challenge, if any. */
  plainSignature: Uint8Array | null;
  /** Label of the key that produced plainSignature, if any. */
  plainKeyLabel: string | null;
  /** Short human-readable result, shown on screen while debugging. */
  summary: string;
};

export type CandidateKey = { label: string; bytes: Uint8Array };

/**
 * Decodes text the way Node's Buffer.from(text, 'base64') does: skipping
 * any character that isn't base64. A wallet that wrongly treats our
 * plain-text challenge as base64 would end up signing these bytes.
 */
function lenientBase64(text: string): Uint8Array | null {
  let cleaned = text.replace(/-/g, '+').replace(/_/g, '/').replace(/[^A-Za-z0-9+/]/g, '');
  if (cleaned.length % 4 === 1) cleaned = cleaned.slice(0, -1);
  return decodeBase64(cleaned);
}

export function shortAddress(bytes: Uint8Array): string {
  const encoded = encodeBase58(bytes);
  return `${encoded.slice(0, 4)}…${encoded.slice(-4)}`;
}

function encodeBase58(bytes: Uint8Array): string {
  const digits: number[] = [];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = '';
  for (const byte of bytes) {
    if (byte !== 0) break;
    out += '1';
  }
  for (let i = digits.length - 1; i >= 0; i--) out += BASE58_ALPHABET[digits[i]];
  return out;
}

export async function checkSignature(
  raw: string | Uint8Array,
  challenge: string,
  keys: CandidateKey[],
): Promise<SignatureCheck> {
  const rawInfo = describeSignature(raw);
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    return { plainSignature: null, plainKeyLabel: null, summary: `no local check (no WebCrypto) · ${rawInfo}` };
  }

  const message = textEncoder.encode(challenge);
  const decodings: [string, Uint8Array | null][] = raw instanceof Uint8Array
    ? [['bytes', pickSignature(raw, message)]]
    : [
        ['hex', pickSignature(decodeHex(raw.trim()), message)],
        ['base58', pickSignature(decodeBase58(raw.trim()), message)],
        ['base64', pickSignature(decodeBase64(raw.trim()), message)],
      ];

  const matches: string[] = [];
  let plainSignature: Uint8Array | null = null;
  let plainKeyLabel: string | null = null;
  let ed25519Supported = false;

  for (const candidate of keys) {
    let key: CryptoKey;
    try {
      key = await subtle.importKey('raw', candidate.bytes as BufferSource, { name: 'Ed25519' }, false, ['verify']);
      ed25519Supported = true;
    } catch {
      continue;
    }
    const variants = messageVariants(challenge, candidate.bytes);
    const lenient = lenientBase64(challenge);
    if (lenient) variants.push(['text-read-as-base64', lenient]);

    for (const [encoding, sig] of decodings) {
      if (!sig) continue;
      for (const [variant, bytes] of variants) {
        try {
          if (await subtle.verify({ name: 'Ed25519' }, key, sig as BufferSource, bytes as BufferSource)) {
            matches.push(`${encoding}+${variant} with ${candidate.label} key`);
            if (variant === 'plain' && !plainSignature) {
              plainSignature = sig;
              plainKeyLabel = candidate.label;
            }
          }
        } catch {
          // A malformed candidate just doesn't match.
        }
      }
    }
  }

  if (!ed25519Supported) {
    return { plainSignature: null, plainKeyLabel: null, summary: `no local check (Ed25519 unsupported) · ${rawInfo}` };
  }
  const keyList = keys.map(k => `${k.label} ${shortAddress(k.bytes)}`).join(', ');
  return {
    plainSignature,
    plainKeyLabel,
    summary: matches.length
      ? `match: ${matches.join('; ')} · keys: ${keyList}`
      : `no match · keys: ${keyList} · ${rawInfo}`,
  };
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
}