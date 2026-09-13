// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Identifiers for employers, break types, categories and spans. Random rather
// than sequential so two devices creating things between syncs cannot collide
// (see `merge.ts`); short rather than a full UUID because every one of them
// lives in the document forever and there are a lot of spans in a year.
//
// The pure domain modules never call this — they take the id as a parameter
// (see the `ctx` argument in `actions.ts`) — so a test can name its ids and a
// derivation can never depend on chance.

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** A fresh 12-character id from the platform's random source. */
export function makeId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}
