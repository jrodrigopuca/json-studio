/**
 * Logo Generator for JSON Spark
 * 
 * Generates PNG icons in multiple sizes (16, 32, 48, 128) from SVG designs.
 * Includes 3 design proposals.
 * 
 * Usage: node scripts/generate-logo.mjs [design-number]
 * Example: node scripts/generate-logo.mjs 1
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, '../public/icons');
const iconsSourceDir = resolve(__dirname, '../design/icons-source');

// Design proposals - Using JSON Spark extension colors
const designs = {
  1: {
    name: 'Bold Spark (Impactante)',
    description: 'Rayo GRANDE y GRUESO, máximo impacto visual. Ocupa más espacio, forma sólida',
    svg: (size) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="boltGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" style="stop-color:#fef3c7;stop-opacity:1" />
            <stop offset="40%" style="stop-color:#fbbf24;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="${size}" height="${size}" rx="${size * 0.188}" fill="url(#bgGrad)"/>
        
        <!-- Left brace { - más compactas para dar espacio al rayo -->
        <path d="M ${size * 0.24} ${size * 0.38} 
                 Q ${size * 0.21} ${size * 0.38}, ${size * 0.21} ${size * 0.41}
                 L ${size * 0.21} ${size * 0.45}
                 Q ${size * 0.21} ${size * 0.48}, ${size * 0.18} ${size * 0.48}
                 Q ${size * 0.16} ${size * 0.48}, ${size * 0.16} ${size * 0.50}
                 Q ${size * 0.16} ${size * 0.52}, ${size * 0.18} ${size * 0.52}
                 Q ${size * 0.21} ${size * 0.52}, ${size * 0.21} ${size * 0.55}
                 L ${size * 0.21} ${size * 0.59}
                 Q ${size * 0.21} ${size * 0.62}, ${size * 0.24} ${size * 0.62}"
              stroke="#f1f5f9" stroke-width="${size * 0.035}" fill="none" stroke-linecap="round"/>
        
        <!-- Right brace } -->
        <path d="M ${size * 0.76} ${size * 0.38} 
                 Q ${size * 0.79} ${size * 0.38}, ${size * 0.79} ${size * 0.41}
                 L ${size * 0.79} ${size * 0.45}
                 Q ${size * 0.79} ${size * 0.48}, ${size * 0.82} ${size * 0.48}
                 Q ${size * 0.84} ${size * 0.48}, ${size * 0.84} ${size * 0.50}
                 Q ${size * 0.84} ${size * 0.52}, ${size * 0.82} ${size * 0.52}
                 Q ${size * 0.79} ${size * 0.52}, ${size * 0.79} ${size * 0.55}
                 L ${size * 0.79} ${size * 0.59}
                 Q ${size * 0.79} ${size * 0.62}, ${size * 0.76} ${size * 0.62}"
              stroke="#f1f5f9" stroke-width="${size * 0.035}" fill="none" stroke-linecap="round"/>
        
        <!-- Lightning bolt - GRANDE Y GRUESO -->
        <path d="M ${size * 0.56} ${size * 0.25} 
                 L ${size * 0.42} ${size * 0.48}
                 L ${size * 0.52} ${size * 0.48}
                 L ${size * 0.44} ${size * 0.75}
                 L ${size * 0.58} ${size * 0.52}
                 L ${size * 0.48} ${size * 0.52}
                 Z"
              fill="url(#boltGrad)"/>
      </svg>
    `
  },
  
  2: {
    name: 'Power Spark (Agresivo)',
    description: 'Rayo MUY GRUESO con ángulos agresivos. Forma masiva que domina el icono',
    svg: (size) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none">
        <defs>
          <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="boltGrad2" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" style="stop-color:#fef3c7;stop-opacity:1" />
            <stop offset="35%" style="stop-color:#fbbf24;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="${size}" height="${size}" rx="${size * 0.188}" fill="url(#bgGrad2)"/>
        
        <!-- Left brace { - más finas para contraste -->
        <path d="M ${size * 0.22} ${size * 0.38} 
                 Q ${size * 0.19} ${size * 0.38}, ${size * 0.19} ${size * 0.41}
                 L ${size * 0.19} ${size * 0.45}
                 Q ${size * 0.19} ${size * 0.48}, ${size * 0.16} ${size * 0.48}
                 Q ${size * 0.14} ${size * 0.48}, ${size * 0.14} ${size * 0.50}
                 Q ${size * 0.14} ${size * 0.52}, ${size * 0.16} ${size * 0.52}
                 Q ${size * 0.19} ${size * 0.52}, ${size * 0.19} ${size * 0.55}
                 L ${size * 0.19} ${size * 0.59}
                 Q ${size * 0.19} ${size * 0.62}, ${size * 0.22} ${size * 0.62}"
              stroke="#f1f5f9" stroke-width="${size * 0.03}" fill="none" stroke-linecap="round"/>
        
        <!-- Right brace } -->
        <path d="M ${size * 0.78} ${size * 0.38} 
                 Q ${size * 0.81} ${size * 0.38}, ${size * 0.81} ${size * 0.41}
                 L ${size * 0.81} ${size * 0.45}
                 Q ${size * 0.81} ${size * 0.48}, ${size * 0.84} ${size * 0.48}
                 Q ${size * 0.86} ${size * 0.48}, ${size * 0.86} ${size * 0.50}
                 Q ${size * 0.86} ${size * 0.52}, ${size * 0.84} ${size * 0.52}
                 Q ${size * 0.81} ${size * 0.52}, ${size * 0.81} ${size * 0.55}
                 L ${size * 0.81} ${size * 0.59}
                 Q ${size * 0.81} ${size * 0.62}, ${size * 0.78} ${size * 0.62}"
              stroke="#f1f5f9" stroke-width="${size * 0.03}" fill="none" stroke-linecap="round"/>
        
        <!-- Lightning bolt - MUY GRUESO, ángulos agresivos -->
        <path d="M ${size * 0.58} ${size * 0.23} 
                 L ${size * 0.38} ${size * 0.47}
                 L ${size * 0.53} ${size * 0.47}
                 L ${size * 0.42} ${size * 0.77}
                 L ${size * 0.62} ${size * 0.53}
                 L ${size * 0.47} ${size * 0.53}
                 Z"
              fill="url(#boltGrad2)"/>
      </svg>
    `
  },
  
  3: {
    name: 'Dynamic Spark (Diagonal)',
    description: 'Rayo grande inclinado, más dinámico y en movimiento. Sensación de velocidad',
    svg: (size) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none">
        <defs>
          <linearGradient id="bgGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="boltGrad3" x1="30%" y1="30%" x2="70%" y2="70%">
            <stop offset="0%" style="stop-color:#fef3c7;stop-opacity:1" />
            <stop offset="40%" style="stop-color:#fbbf24;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="${size}" height="${size}" rx="${size * 0.188}" fill="url(#bgGrad3)"/>
        
        <!-- Left brace { -->
        <path d="M ${size * 0.24} ${size * 0.38} 
                 Q ${size * 0.21} ${size * 0.38}, ${size * 0.21} ${size * 0.41}
                 L ${size * 0.21} ${size * 0.45}
                 Q ${size * 0.21} ${size * 0.48}, ${size * 0.18} ${size * 0.48}
                 Q ${size * 0.16} ${size * 0.48}, ${size * 0.16} ${size * 0.50}
                 Q ${size * 0.16} ${size * 0.52}, ${size * 0.18} ${size * 0.52}
                 Q ${size * 0.21} ${size * 0.52}, ${size * 0.21} ${size * 0.55}
                 L ${size * 0.21} ${size * 0.59}
                 Q ${size * 0.21} ${size * 0.62}, ${size * 0.24} ${size * 0.62}"
              stroke="#f1f5f9" stroke-width="${size * 0.035}" fill="none" stroke-linecap="round"/>
        
        <!-- Right brace } -->
        <path d="M ${size * 0.76} ${size * 0.38} 
                 Q ${size * 0.79} ${size * 0.38}, ${size * 0.79} ${size * 0.41}
                 L ${size * 0.79} ${size * 0.45}
                 Q ${size * 0.79} ${size * 0.48}, ${size * 0.82} ${size * 0.48}
                 Q ${size * 0.84} ${size * 0.48}, ${size * 0.84} ${size * 0.50}
                 Q ${size * 0.84} ${size * 0.52}, ${size * 0.82} ${size * 0.52}
                 Q ${size * 0.79} ${size * 0.52}, ${size * 0.79} ${size * 0.55}
                 L ${size * 0.79} ${size * 0.59}
                 Q ${size * 0.79} ${size * 0.62}, ${size * 0.76} ${size * 0.62}"
              stroke="#f1f5f9" stroke-width="${size * 0.035}" fill="none" stroke-linecap="round"/>
        
        <!-- Lightning bolt - GRANDE, inclinado (más dinámico) -->
        <path d="M ${size * 0.62} ${size * 0.22} 
                 L ${size * 0.38} ${size * 0.48}
                 L ${size * 0.50} ${size * 0.50}
                 L ${size * 0.38} ${size * 0.78}
                 L ${size * 0.62} ${size * 0.52}
                 L ${size * 0.50} ${size * 0.50}
                 Z"
              fill="url(#boltGrad3)"/>
      </svg>
    `
  },
  
  4: {
    name: 'Energy Ring (Concepto Diferente)',
    description: 'Diseño COMPLETAMENTE DIFERENTE: círculo de energía con llaves JSON integradas. Concepto más abstracto',
    svg: (size) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none">
        <defs>
          <linearGradient id="bgGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#f59e0b;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#fbbf24;stop-opacity:1" />
          </linearGradient>
          <radialGradient id="centerGlow">
            <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:0.4" />
            <stop offset="100%" style="stop-color:#fbbf24;stop-opacity:0" />
          </radialGradient>
        </defs>
        
        <!-- Background -->
        <rect width="${size}" height="${size}" rx="${size * 0.188}" fill="url(#bgGrad4)"/>
        
        <!-- Energy ring outer -->
        <circle cx="${size * 0.50}" cy="${size * 0.50}" r="${size * 0.32}" 
                stroke="url(#ringGrad)" 
                stroke-width="${size * 0.055}" 
                fill="none"/>
        
        <!-- Energy ring inner glow -->
        <circle cx="${size * 0.50}" cy="${size * 0.50}" r="${size * 0.32}" 
                fill="url(#centerGlow)"/>
        
        <!-- Left brace { - integrado en el diseño -->
        <text x="${size * 0.32}" y="${size * 0.58}" 
              font-family="system-ui, -apple-system, sans-serif" 
              font-size="${size * 0.40}" 
              font-weight="700" 
              fill="#f1f5f9"
              text-anchor="middle">{</text>
        
        <!-- Right brace } -->
        <text x="${size * 0.68}" y="${size * 0.58}" 
              font-family="system-ui, -apple-system, sans-serif" 
              font-size="${size * 0.40}" 
              font-weight="700" 
              fill="#f1f5f9"
              text-anchor="middle">}</text>
        
        <!-- Energy particles on ring -->
        <circle cx="${size * 0.50}" cy="${size * 0.18}" r="${size * 0.025}" fill="#fbbf24"/>
        <circle cx="${size * 0.82}" cy="${size * 0.50}" r="${size * 0.025}" fill="#f59e0b"/>
        <circle cx="${size * 0.50}" cy="${size * 0.82}" r="${size * 0.025}" fill="#fbbf24"/>
        <circle cx="${size * 0.18}" cy="${size * 0.50}" r="${size * 0.025}" fill="#f59e0b"/>
      </svg>
    `
  }
};

// Check if sharp is available
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (err) {
  console.log('⚠️  sharp not installed. Installing...\n');
  console.log('Run: npm install -D sharp\n');
  console.log('For now, generating SVG files only.\n');
}

async function generateLogo(designNum = 1) {
  const design = designs[designNum];
  
  if (!design) {
    console.error(`❌ Design ${designNum} not found. Available: 1, 2, 3, 4`);
    process.exit(1);
  }
  
  console.log(`\n🎨 Generating logo: ${design.name}`);
  console.log(`   ${design.description}\n`);
  
  // Ensure directories exist
  mkdirSync(iconsDir, { recursive: true });
  mkdirSync(iconsSourceDir, { recursive: true });
  
  const sizes = [16, 32, 48, 128];
  
  for (const size of sizes) {
    const svgContent = design.svg(size);
    
    // Save SVG source files in design/icons-source/
    const svgPath = resolve(iconsSourceDir, `icon-${size}.svg`);
    writeFileSync(svgPath, svgContent);
    console.log(`✓ SVG source: design/icons-source/icon-${size}.svg`);
    
    // Convert to PNG if sharp is available
    if (sharp) {
      try {
        const pngPath = resolve(iconsDir, `icon-${size}.png`);
        await sharp(Buffer.from(svgContent))
          .resize(size, size)
          .png()
          .toFile(pngPath);
        console.log(`✓ PNG icon: public/icons/icon-${size}.png`);
      } catch (err) {
        console.error(`❌ Failed to generate PNG for size ${size}:`, err.message);
      }
    }
  }
  
  console.log(`\n✅ Logo generation complete!`);
  
  if (!sharp) {
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Install sharp: npm install -D sharp`);
    console.log(`   2. Run again: node scripts/generate-logo.mjs ${designNum}`);
    console.log(`\n   Or preview SVG files in: design/icons-source/`);
  } else {
    console.log(`\n📁 Files generated:`);
    console.log(`   PNG (for extension): public/icons/*.png`);
    console.log(`   SVG (editable sources): design/icons-source/*.svg`);
  }
}

// Show available designs
function showDesigns() {
  console.log('\n🎨 Available Logo Designs:\n');
  Object.entries(designs).forEach(([num, design]) => {
    console.log(`${num}. ${design.name}`);
    console.log(`   ${design.description}\n`);
  });
  console.log('Usage: node scripts/generate-logo.mjs [1|2|3|4]');
  console.log('Example: node scripts/generate-logo.mjs 1\n');
}

// Main
const designNum = parseInt(process.argv[2]);

if (!designNum || isNaN(designNum)) {
  showDesigns();
  process.exit(0);
}

generateLogo(designNum).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
