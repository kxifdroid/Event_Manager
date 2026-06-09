import sharp from 'sharp';

/**
 * Perceptual hash (pHash) for duplicate image detection.
 * Computes 64-bit hash from 8x8 grayscale DCT approximation.
 */
export async function computePerceptualHash(imageBuffer: Buffer): Promise<string> {
  const size = 32;
  const small = 8;

  const { data } = await sharp(imageBuffer)
    .greyscale()
    .resize(size, size, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels: number[] = [];
  for (let i = 0; i < data.length; i++) pixels.push(data[i]);

  const dct = dct2d(pixels, size);
  const lowFreq: number[] = [];
  for (let y = 0; y < small; y++) {
    for (let x = 0; x < small; x++) {
      if (x === 0 && y === 0) continue;
      lowFreq.push(dct[y * size + x]);
    }
  }

  const avg = lowFreq.reduce((a, b) => a + b, 0) / lowFreq.length;
  let hash = '';
  for (const v of lowFreq) {
    hash += v > avg ? '1' : '0';
  }
  return hash;
}

export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Infinity;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

export function similarityPercent(a: string, b: string): number {
  const dist = hammingDistance(a, b);
  if (!isFinite(dist)) return 0;
  return ((a.length - dist) / a.length) * 100;
}

function dct2d(pixels: number[], size: number): number[] {
  const result = new Array(size * size).fill(0);
  for (let u = 0; u < size; u++) {
    for (let v = 0; v < size; v++) {
      let sum = 0;
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          sum +=
            pixels[y * size + x] *
            Math.cos(((2 * x + 1) * u * Math.PI) / (2 * size)) *
            Math.cos(((2 * y + 1) * v * Math.PI) / (2 * size));
        }
      }
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
      result[v * size + u] = (2 / size) * cu * cv * sum;
    }
  }
  return result;
}
