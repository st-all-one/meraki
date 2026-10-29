/** Único ponto de tempo/IDs do Meraki (ADR-028). */
export const systemClock = {
  nowIso(): string {
    return new Date().toISOString();
  },
  todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  },
  nowMs(): number {
    return Date.now();
  },
  uuidv7(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const now = BigInt(Date.now());
    for (let i = 0; i < 6; i++) bytes[i] = Number((now >> BigInt(8 * (5 - i))) & 0xffn);
    bytes[6] = (bytes[6]! & 0x0f) | 0x70;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${
      hex.slice(20)
    }`;
  },
};
