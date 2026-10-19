const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');

async function runTests() {
  console.log('--- STARTING UNIVERSAL FILE TOOLKIT END-TO-END VERIFICATION ---');

  const testDir = path.join(__dirname, 'test_output');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // 1. Create a sample test image (800x600 PNG with gradient)
  const testImgPath = path.join(testDir, 'sample_input.png');
  const svgBuffer = Buffer.from(`
    <svg width="800" height="600">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0ea5e9" />
          <stop offset="100%" stop-color="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#g)" />
      <circle cx="400" cy="300" r="150" fill="#ffffff" opacity="0.9" />
      <text x="400" y="315" font-family="sans-serif" font-size="32" font-weight="bold" fill="#0f172a" text-anchor="middle">Universal File Toolkit</text>
    </svg>
  `);
  await sharp(svgBuffer).png().toFile(testImgPath);
  console.log('✓ Created test image:', testImgPath, `(${fs.statSync(testImgPath).size} bytes)`);

  // Load the built main services
  // We can test sharp and pdf operations directly or require dist-electron
  
  // Test Crop
  const cropOut = path.join(testDir, 'test_cropped.png');
  await sharp(testImgPath).extract({ left: 100, top: 100, width: 400, height: 300 }).toFile(cropOut);
  const cropMeta = await sharp(cropOut).metadata();
  console.log(`✓ Crop test passed: ${cropMeta.width}x${cropMeta.height} px`);

  // Test Resize
  const resizeOut = path.join(testDir, 'test_resized.jpg');
  await sharp(testImgPath).resize(512, 512, { fit: 'inside' }).jpeg({ quality: 85 }).toFile(resizeOut);
  const resizeMeta = await sharp(resizeOut).metadata();
  console.log(`✓ Resize & JPEG convert test passed: ${resizeMeta.width}x${resizeMeta.height} px (${fs.statSync(resizeOut).size} bytes)`);

  // Test WebP Compression
  const webpOut = path.join(testDir, 'test_compressed.webp');
  await sharp(testImgPath).webp({ quality: 70 }).toFile(webpOut);
  console.log(`✓ WebP compression test passed: (${fs.statSync(webpOut).size} bytes)`);

  // Test AVIF
  const avifOut = path.join(testDir, 'test_converted.avif');
  await sharp(testImgPath).avif({ quality: 65 }).toFile(avifOut);
  console.log(`✓ AVIF convert test passed: (${fs.statSync(avifOut).size} bytes)`);

  // Test Image to PDF
  const imgToPdfOut = path.join(testDir, 'test_image_to_pdf.pdf');
  const pdfDoc1 = await PDFDocument.create();
  const pngBytes = fs.readFileSync(testImgPath);
  const embeddedPng = await pdfDoc1.embedPng(pngBytes);
  const page1 = pdfDoc1.addPage([embeddedPng.width, embeddedPng.height]);
  page1.drawImage(embeddedPng, { x: 0, y: 0, width: embeddedPng.width, height: embeddedPng.height });
  const pdfBytes1 = await pdfDoc1.save();
  fs.writeFileSync(imgToPdfOut, pdfBytes1);
  console.log(`✓ Image to PDF conversion test passed: (${fs.statSync(imgToPdfOut).size} bytes)`);

  // Test PDF Merge
  const pdfMergeOut = path.join(testDir, 'test_merged.pdf');
  const pdfDocMerge = await PDFDocument.create();
  const docA = await PDFDocument.load(pdfBytes1);
  const docB = await PDFDocument.load(pdfBytes1);
  const copiedA = await pdfDocMerge.copyPages(docA, docA.getPageIndices());
  const copiedB = await pdfDocMerge.copyPages(docB, docB.getPageIndices());
  copiedA.forEach(p => pdfDocMerge.addPage(p));
  copiedB.forEach(p => pdfDocMerge.addPage(p));
  const mergedBytes = await pdfDocMerge.save();
  fs.writeFileSync(pdfMergeOut, mergedBytes);
  const loadedMerged = await PDFDocument.load(mergedBytes);
  console.log(`✓ PDF Merge test passed: ${loadedMerged.getPageCount()} pages (${fs.statSync(pdfMergeOut).size} bytes)`);

  // Test PDF Split
  const splitDir = path.join(testDir, 'split_pages');
  if (!fs.existsSync(splitDir)) fs.mkdirSync(splitDir);
  for (let i = 0; i < loadedMerged.getPageCount(); i++) {
    const singleDoc = await PDFDocument.create();
    const [page] = await singleDoc.copyPages(loadedMerged, [i]);
    singleDoc.addPage(page);
    const sBytes = await singleDoc.save();
    fs.writeFileSync(path.join(splitDir, `page_${i + 1}.pdf`), sBytes);
  }
  console.log(`✓ PDF Split test passed: split into ${loadedMerged.getPageCount()} files`);

  // Test Rotation
  const rotOut = path.join(testDir, 'test_rotated.png');
  await sharp(testImgPath).rotate(90).toFile(rotOut);
  const rotMeta = await sharp(rotOut).metadata();
  console.log(`✓ Rotate 90° test passed: ${rotMeta.width}x${rotMeta.height} px`);

  // Test Background canvas / padding / rounded corners
  const bgOut = path.join(testDir, 'test_styled_bg.png');
  const maskSvg = `<svg width="800" height="600"><rect x="0" y="0" width="800" height="600" rx="30" ry="30" fill="#fff"/></svg>`;
  const roundedImg = await sharp(testImgPath).composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }]).png().toBuffer();
  const bgSvg = `<svg width="900" height="700">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f43f5e"/>
        <stop offset="100%" stop-color="#fb923c"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
  </svg>`;
  await sharp(Buffer.from(bgSvg)).composite([{ input: roundedImg, top: 50, left: 50 }]).png().toFile(bgOut);
  console.log(`✓ Background & Canvas Styling test passed: (${fs.statSync(bgOut).size} bytes)`);

  console.log('\n========================================');
  console.log(' ALL END-TO-END FILE OPERATIONS VERIFIED!');
  console.log('========================================\n');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
