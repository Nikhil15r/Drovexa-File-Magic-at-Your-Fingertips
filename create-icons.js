const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIcons() {
  const buildDir = path.join(__dirname, 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  // Create high-res 256x256 icon SVG with modern glowing app icon
  const iconSvg = `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0ea5e9" />
          <stop offset="50%" stop-color="#6366f1" />
          <stop offset="100%" stop-color="#ec4899" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0ea5e9" flood-opacity="0.4" />
        </filter>
      </defs>
      
      <!-- Rounded squircle icon base -->
      <rect x="12" y="12" width="232" height="232" rx="56" fill="url(#bgGrad)" stroke="#334155" stroke-width="4" filter="url(#glow)" />
      
      <!-- Central concentric radial orbit ring -->
      <circle cx="128" cy="128" r="74" fill="none" stroke="#0ea5e9" stroke-width="3" stroke-dasharray="8 8" opacity="0.6" />
      <circle cx="128" cy="128" r="48" fill="url(#accentGrad)" opacity="0.9" />

      <!-- Center file icon / star -->
      <path d="M110 88 H138 L154 104 V168 H110 Z" fill="#ffffff" />
      <path d="M138 88 V104 H154 Z" fill="#e2e8f0" />
      
      <!-- Radial orbit satellite nodes -->
      <circle cx="128" cy="54" r="10" fill="#10b981" />
      <circle cx="202" cy="128" r="10" fill="#f59e0b" />
      <circle cx="128" cy="202" r="10" fill="#ec4899" />
      <circle cx="54" cy="128" r="10" fill="#8b5cf6" />
    </svg>
  `;

  const pngBuffer = await sharp(Buffer.from(iconSvg)).png().toBuffer();
  fs.writeFileSync(path.join(buildDir, 'icon.png'), pngBuffer);

  // Wrap into simple ICO file
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // Number of images

  const iconEntry = Buffer.alloc(16);
  iconEntry.writeUInt8(0, 0);   // Width 0 = 256
  iconEntry.writeUInt8(0, 1);   // Height 0 = 256
  iconEntry.writeUInt8(0, 2);   // Color palette
  iconEntry.writeUInt8(0, 3);   // Reserved
  iconEntry.writeUInt16LE(1, 4); // Color planes
  iconEntry.writeUInt16LE(32, 6); // Bits per pixel
  iconEntry.writeUInt32LE(pngBuffer.length, 8); // Image size in bytes
  iconEntry.writeUInt32LE(6 + 16, 12); // Offset of image data

  const icoBuffer = Buffer.concat([icoHeader, iconEntry, pngBuffer]);
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);

  console.log('✓ Successfully created build/icon.png and build/icon.ico');
}

createIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
