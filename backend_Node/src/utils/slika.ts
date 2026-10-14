import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { imageSize } from 'image-size';

const EKSTENZIJE: Record<string, string> = { jpg: 'jpg', jpeg: 'jpg', png: 'png', gif: 'gif' };
export const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const PUBLIC_URL = 'http://localhost:4000';

export interface ProveraSlike {
  ekstenzija: string;
  sirina: number;
  visina: number;
}

export function proveriSliku(buffer: Buffer): ProveraSlike | { greska: string } {
  let dim: ReturnType<typeof imageSize>;
  try {
    dim = imageSize(buffer);
  } catch {
    return { greska: 'Fajl nije moguće očitati kao sliku.' };
  }
  let ekstenzija = EKSTENZIJE[String(dim.type)];
  if (!ekstenzija) return { greska: 'Slika mora biti u JPG, PNG ili GIF formatu.' };
  return { ekstenzija, sirina: dim.width ?? 0, visina: dim.height ?? 0 };
}

export async function snimiSliku(buffer: Buffer, ekstenzija: string, podfolder = ''): Promise<string> {
  let ime = path.posix.join(podfolder, crypto.randomUUID() + '.' + ekstenzija);
  await fs.mkdir(path.join(UPLOAD_DIR, podfolder), { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, ime), buffer);
  return ime;
}

export async function obrisiSliku(ime: string | undefined | null): Promise<void> {
  if (!ime || ime === 'default_profile_image.jpg' || ime === 'default_profile_image.svg') return;
  let putanja = path.join(UPLOAD_DIR, ime);
  if (!putanja.startsWith(UPLOAD_DIR + path.sep)) return;
  await fs.unlink(putanja).catch(() => {});
}

export const apsolutniUrl = (u: string): string =>
  /^https?:\/\//i.test(u) ? u : `${PUBLIC_URL}/${u.replace(/^\/+/, '')}`;
