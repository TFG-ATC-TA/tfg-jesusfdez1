const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = [128, 192, 256, 384, 512];
const inputFile = path.join(__dirname, 'public', 'logo.svg');
const outputDir = path.join(__dirname, 'public');

async function generateIcons() {
  try {
    // Read the SVG file
    const svgBuffer = fs.readFileSync(inputFile);
    
    // Generate icons for each size
    for (const size of sizes) {
      const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputFile);
      
      console.log(`Generated: icon-${size}x${size}.png`);
    }
    
    // Generate favicon
    const faviconFile = path.join(outputDir, 'favicon.ico');
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(faviconFile);
    
    console.log('Generated: favicon.ico');
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
