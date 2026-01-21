#!/usr/bin/env node
/**
 * This script removes TypeScript files from react-native-screens/src/fabric
 * that cause codegen errors during Metro bundling.
 * 
 * The issue is that RN codegen tries to parse these files even when
 * New Architecture is disabled, and fails on certain TypeScript patterns.
 */

const fs = require('fs');
const path = require('path');

const fabricDir = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-screens',
  'src',
  'fabric'
);

function removeAllTsFiles(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      removeAllTsFiles(fullPath);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      console.log(`Removing: ${fullPath}`);
      fs.unlinkSync(fullPath);
    }
  }
}

console.log('\\n=== Removing react-native-screens fabric TS files ===');
removeAllTsFiles(fabricDir);
console.log('=== Done removing fabric TS files ===\\n');

// Verify no .ts files remain
const { execSync } = require('child_process');
try {
  const remaining = execSync(`find "${fabricDir}" -name "*.ts" -type f 2>/dev/null`, { encoding: 'utf8' });
  if (remaining.trim()) {
    console.log('WARNING: Some .ts files still remain:');
    console.log(remaining);
  } else {
    console.log('SUCCESS: No .ts files remain in fabric directory');
  }
} catch (e) {
  console.log('SUCCESS: No .ts files remain in fabric directory');
}
