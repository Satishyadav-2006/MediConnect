#!/usr/bin/env node

/**
 * MediConnect Icon Generator
 * 
 * Since Node.js lacks built-in Canvas/SVG-to-PNG conversion,
 * this script creates an HTML file you can open in a browser
 * to generate PNG icons using the Canvas API.
 * 
 * Usage:
 *   1. Open public/icons/generate.html in your browser
 *   2. Click "Generate All Icons" to download PNG files
 *   3. Save them to public/icons/
 * 
 * For automated generation, install the 'sharp' package:
 *   npm install sharp
 *   Then uncomment the sharp-based implementation below.
 */

const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, 'public', 'icons');
const SVG_SOURCES = {
  main: path.join(ICONS_DIR, 'icon-192x192.svg'),
  maskable: path.join(ICONS_DIR, 'icon-maskable-512x512.svg')
};

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

function checkFiles() {
  console.log('MediConnect Icon Generator\n');
  
  for (const [name, filePath] of Object.entries(SVG_SOURCES)) {
    if (fs.existsSync(filePath)) {
      console.log(`✓ Found: ${path.basename(filePath)}`);
    } else {
      console.log(`✗ Missing: ${path.basename(filePath)}`);
    }
  }
  
  console.log('\nTo generate PNG icons:');
  console.log('1. Open public/icons/generate.html in a modern browser');
  console.log('2. Click "Generate All Icons"');
  console.log('3. Save the downloaded PNG files to public/icons/\n');
}

checkFiles();
