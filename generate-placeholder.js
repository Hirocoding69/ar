// Simple script to generate placeholder poster.png
// Run with: node generate-placeholder.js

import { writeFileSync } from 'fs';

// Create a simple 800x600 PNG with a pattern
// This is a minimal valid PNG (1x1 red pixel, base64 encoded)
// For a real poster, replace this with an actual image file

const simplePNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

writeFileSync('./assets/poster.png', simplePNG);
console.log('Created placeholder poster.png (1x1 pixel)');
console.log('⚠️  Replace this with your actual target image (recommended: 800x600 or larger)');

