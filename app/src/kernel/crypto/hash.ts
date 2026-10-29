import { argon2id } from "@noble/hashes/argon2";
import { blake3 } from "@noble/hashes/blake3";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils";

const SALT_BYTES = 16;
const HASH_BYTES = 32;
const encoder = new TextEncoder();

export function blake3Hex(input: string | Uint8Array): string {
  return bytesToHex(
    blake3(typeof input === "string" ? encoder.encode(input) : input, { dkLen: 32 }),
  );
}

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

export function hashPassword(password: string): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const digest = argon2id(utf8ToBytes(password), salt, {
    t: 2,
    m: 19456,
    p: 1,
    dkLen: HASH_BYTES,
  });
  return `$argon2id$v=19$m=19456,t=2,p=1$${bytesToHex(salt)}$${bytesToHex(digest)}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[1] !== "argon2id" || parts[2] !== "v=19") return false;
  const match = /^m=(\d+),t=(\d+),p=(\d+)$/.exec(parts[3] ?? "");
  if (!match) return false;
  try {
    const salt = hexToBytes(parts[4] ?? "");
    const expected = hexToBytes(parts[5] ?? "");
    const digest = argon2id(utf8ToBytes(password), salt, {
      m: Number(match[1]),
      t: Number(match[2]),
      p: Number(match[3]),
      dkLen: expected.length,
    });
    return timingSafeEqual(digest, expected);
  } catch {
    return false;
  }
}

let decoy = "";
export function verifyDecoy(password: string): false {
  decoy ||= hashPassword("meraki-decoy-password-0001");
  verifyPassword(password, decoy);
  return false;
}

export function opaqueToken(bytes = 32): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return base64Url(data);
}

export function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function sha256Hex(bytes: Uint8Array): Promise<string> {
  return crypto.subtle.digest("SHA-256", bytes.slice().buffer).then((digest) =>
    [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")
  );
}
