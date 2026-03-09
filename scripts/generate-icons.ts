import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const svgInput = readFileSync(resolve(ROOT, "public/icon.svg"));

async function generateIcons() {
  const sizes = [
    { name: "public/icon-16.png", size: 16 },
    { name: "public/icon-32.png", size: 32 },
    { name: "public/apple-touch-icon.png", size: 180 },
    { name: "public/icon-192.png", size: 192 },
    { name: "public/icon-512.png", size: 512 },
  ];

  for (const { name, size } of sizes) {
    const outputPath = resolve(ROOT, name);
    await sharp(svgInput).resize(size, size).png().toFile(outputPath);
    console.log(`Generated ${name} (${size}x${size})`);
  }

  // Open Graph image (1200x630) — icon centered on navy background
  const ogWidth = 1200;
  const ogHeight = 630;
  const iconSize = 200;

  // Create the icon at the desired size
  const iconBuffer = await sharp(svgInput)
    .resize(iconSize, iconSize)
    .png()
    .toBuffer();

  // Create navy background with centered icon and text
  const ogSvg = `<svg width="${ogWidth}" height="${ogHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${ogWidth}" height="${ogHeight}" fill="#1B2A4A"/>
    <text x="${ogWidth / 2}" y="${ogHeight / 2 + 160}" text-anchor="middle"
          font-family="sans-serif" font-weight="700" font-size="48" fill="#FFFFFF"
          letter-spacing="4">BRACKETSBALL</text>
    <text x="${ogWidth / 2}" y="${ogHeight / 2 + 210}" text-anchor="middle"
          font-family="sans-serif" font-size="24" fill="#E85D26">
      March Madness Bracket Challenge</text>
  </svg>`;

  // Composite the icon onto the OG background
  await sharp(Buffer.from(ogSvg))
    .composite([
      {
        input: iconBuffer,
        top: Math.round((ogHeight - iconSize) / 2 - 60),
        left: Math.round((ogWidth - iconSize) / 2),
      },
    ])
    .png()
    .toFile(resolve(ROOT, "public/og-image.png"));

  console.log(`Generated og-image.png (${ogWidth}x${ogHeight})`);

  console.log("\nAll icons generated successfully!");
}

generateIcons().catch(console.error);
