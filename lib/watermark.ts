import sharp from 'sharp';

/**
 * Composite watermark onto image for download.
 * Text: "{ClubName} | {EventName} | {UserRole}"
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  clubName: string,
  eventName: string,
  userRole: string,
): Promise<Buffer> {
  const text = `${clubName} | ${eventName} | ${userRole}`;
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 800;

  const fontSize = Math.max(14, Math.floor(width / 40));
  const barHeight = fontSize * 2.5;
  const padding = fontSize;

  const svg = `
    <svg width="${width}" height="${barHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)"/>
      <text x="${width - padding}" y="${barHeight / 2 + fontSize / 3}"
        font-family="Arial, sans-serif" font-size="${fontSize}"
        fill="rgba(255,255,255,0.85)" text-anchor="end" dominant-baseline="middle">
        ${escapeXml(text)}
      </text>
    </svg>`;

  const watermarkBar = await sharp(Buffer.from(svg)).png().toBuffer();

  return sharp(imageBuffer)
    .composite([
      {
        input: watermarkBar,
        top: height - barHeight,
        left: 0,
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
