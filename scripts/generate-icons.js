const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple icon with gradient background and text
async function generateIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1"/>
          <stop offset="100%" style="stop-color:#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#grad)"/>
      <text x="${size/2}" y="${size * 0.62}" 
            font-family="Arial, sans-serif" 
            font-size="${size * 0.45}" 
            font-weight="bold" 
            fill="white" 
            text-anchor="middle">iS</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
  
  console.log(`Generated icon-${size}x${size}.png`);
}

async function generateAddIcon() {
  const size = 96;
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981"/>
          <stop offset="100%" style="stop-color:#059669"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#grad)"/>
      <text x="${size/2}" y="${size * 0.7}" 
            font-family="Arial, sans-serif" 
            font-size="${size * 0.6}" 
            font-weight="bold" 
            fill="white" 
            text-anchor="middle">+</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(iconsDir, 'add-icon.png'));
  
  console.log('Generated add-icon.png');
}

async function main() {
  console.log('Generating PWA icons...');
  
  for (const size of sizes) {
    await generateIcon(size);
  }
  
  await generateAddIcon();
  
  console.log('Done!');
}

main().catch(console.error);
