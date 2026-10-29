export interface SanitizedImage {
  bytes: Uint8Array;
  mime: "image/png" | "image/jpeg";
  width: number;
  height: number;
}

const PNG_DROP_CHUNKS: Record<string, true> = {
  tEXt: true,
  zTXt: true,
  iTXt: true,
  eXIf: true,
  tIME: true,
};

function u32(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset]! << 24) | (bytes[offset + 1]! << 16) | (bytes[offset + 2]! << 8) |
    bytes[offset + 3]!) >>> 0;
}

function u16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset]! << 8) | bytes[offset + 1]!;
}

export function sniff(bytes: Uint8Array): "png" | "jpeg" | "pdf" | null {
  if (
    bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e &&
    bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a
  ) return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-") return "pdf";
  return null;
}

/** Remove chunks de metadados de PNG sem recodificar os pixels. */
function sanitizePng(bytes: Uint8Array): SanitizedImage {
  let offset = 8;
  let width = 0;
  let height = 0;
  const kept: Uint8Array[] = [bytes.slice(0, 8)];
  while (offset + 12 <= bytes.length) {
    const length = u32(bytes, offset);
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error("PNG truncado");
    if (type === "IHDR") {
      if (length < 13) throw new Error("PNG inválido");
      width = u32(bytes, offset + 8);
      height = u32(bytes, offset + 12);
    }
    if (!PNG_DROP_CHUNKS[type]) kept.push(bytes.slice(offset, end));
    offset = end;
    if (type === "IEND") break;
  }
  if (!width || !height) throw new Error("PNG sem dimensões");
  if (width * height > 40_000_000) throw new Error("Imagem grande demais");
  return { bytes: concat(kept), mime: "image/png", width, height };
}

/** Remove segmentos APP1..APPF e COM (EXIF/XMP/comentários), mantendo o JPEG. */
function sanitizeJpeg(bytes: Uint8Array): SanitizedImage {
  let offset = 2;
  let width = 0;
  let height = 0;
  const kept: Uint8Array[] = [bytes.slice(0, 2)];
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error("JPEG inválido");
    const marker = bytes[offset + 1]!;
    if (marker === 0xd9) {
      kept.push(bytes.slice(offset, offset + 2));
      break;
    }
    const length = u16(bytes, offset + 2);
    if (length < 2 || offset + 2 + length > bytes.length) throw new Error("JPEG truncado");
    if (marker >= 0xe0 && marker <= 0xef && marker !== 0xe0) {
      // APP1..APPF: metadados.
    } else if (marker !== 0xfe) {
      kept.push(bytes.slice(offset, offset + 2 + length));
    }
    if (
      [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]
        .includes(marker)
    ) {
      if (length < 7) throw new Error("JPEG inválido");
      height = u16(bytes, offset + 5);
      width = u16(bytes, offset + 7);
    }
    offset += 2 + length;
    if (marker === 0xda) {
      kept.push(bytes.slice(offset));
      break;
    }
  }
  if (!width || !height) throw new Error("JPEG sem dimensões");
  if (width * height > 40_000_000) throw new Error("Imagem grande demais");
  return { bytes: concat(kept), mime: "image/jpeg", width, height };
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function sanitizeUpload(
  bytes: Uint8Array,
): { kind: "image"; image: SanitizedImage } | { kind: "pdf" } {
  const kind = sniff(bytes);
  if (kind === "png") return { kind: "image", image: sanitizePng(bytes) };
  if (kind === "jpeg") return { kind: "image", image: sanitizeJpeg(bytes) };
  if (kind === "pdf") return { kind: "pdf" };
  throw new Error("Formato não permitido. Envie PNG, JPEG ou PDF.");
}
