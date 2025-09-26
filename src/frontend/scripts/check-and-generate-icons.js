const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');

const sizes = [128, 192, 256, 384, 512];
const outputDir = path.join(__dirname, '..', 'public');

/**
 * Verifica si todos los iconos PWA existen
 * @returns {boolean} true si todos los iconos existen, false en caso contrario
 */
function checkIconsExist() {
  console.log('Verificando si los iconos PWA existen...');
  
  const requiredIcons = [
    'favicon.ico',
    ...sizes.map(size => `icon-${size}x${size}.png`)
  ];

  const missingIcons = requiredIcons.filter(icon => {
    const iconPath = path.join(outputDir, icon);
    const exists = fs.existsSync(iconPath);
    if (!exists) {
      console.log(`Icono faltante: ${icon}`);
    }
    return !exists;
  });

  if (missingIcons.length === 0) {
    console.log('Todos los iconos PWA están presentes');
    return true;
  }

  console.log(`Faltan ${missingIcons.length} iconos:`, missingIcons);
  return false;
}

/**
 * Verifica que las dependencias necesarias estén disponibles
 */
function checkDependencies() {
  try {
    // Verificar que Sharp está instalado
    require('sharp');
    console.log('Dependencia Sharp disponible');
    return true;
  } catch (error) {
    console.log('Sharp no está instalado. Ejecuta: npm install sharp');
    return false;
  }
}

/**
 * Genera los iconos directamente usando Sharp
 */
async function generateIcons() {
  console.log('Generando iconos PWA...');
  
  try {
    const logoPath = path.join(outputDir, 'logo.svg');
    if (!fs.existsSync(logoPath)) {
      throw new Error('El archivo logo.svg no existe en la carpeta public');
    }

    // Verificar dependencias
    if (!checkDependencies()) {
      throw new Error('Faltan dependencias necesarias para generar iconos');
    }

    // Leer el archivo SVG
    const svgBuffer = fs.readFileSync(logoPath);
    
    // Generar iconos para cada tamaño
    for (const size of sizes) {
      const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputFile);
      
      console.log(`Generated: icon-${size}x${size}.png`);
    }
    
    // Generar favicon
    const faviconFile = path.join(outputDir, 'favicon.ico');
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(faviconFile);
    
    console.log('Generated: favicon.ico');
    console.log('Iconos generados correctamente');
  } catch (error) {
    console.error('Error al generar iconos:', error.message);
    process.exit(1);
  }
}

/**
 * Función principal que verifica y genera iconos si es necesario
 */
async function checkAndGenerateIcons() {
  console.log('Iniciando verificación de iconos PWA...');
  
  if (!checkIconsExist()) {
    await generateIcons();
    
    // Verificar nuevamente después de la generación
    if (!checkIconsExist()) {
      console.error('Error: Los iconos no se generaron correctamente');
      process.exit(1);
    }
  }
  
  console.log('Verificación de iconos completada');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkAndGenerateIcons().catch(console.error);
}

module.exports = { checkAndGenerateIcons, checkIconsExist, generateIcons, checkDependencies };