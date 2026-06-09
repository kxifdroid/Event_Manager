import sharp from 'sharp';

export async function compressImage(buffer: Buffer, maxWidth = 2000, quality = 80) {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const width = metadata.width || maxWidth;

  const processed = width > maxWidth ? image.resize(maxWidth, null, { withoutEnlargement: true }) : image;

  const output = await processed.jpeg({ quality }).toBuffer();
  const meta = await sharp(output).metadata();

  return {
    buffer: output,
    width: meta.width || width,
    height: meta.height || 0,
  };
}

export async function generateThumbnail(buffer: Buffer, thumbWidth = 400) {
  return sharp(buffer)
    .resize(thumbWidth, null, { withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toBuffer();
}
