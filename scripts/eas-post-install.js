/* scripts/eas-post-install.js
 * 
 * This hook runs after npm install on EAS builds.
 * It patches react-native-screens fabric TypeScript files to remove
 * props that cause codegen failures.
 * 
 * The issue: RN codegen can't parse certain TypeScript patterns in
 * react-native-screens Fabric components (DirectEventHandler with custom types).
 */

const fs = require('fs');
const path = require('path');

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  ✅ EAS POST-INSTALL HOOK RUNNING                          ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('\n');

// Log versions for debugging
let screensVersion = 'unknown';
try {
  screensVersion = require('react-native-screens/package.json').version;
} catch (e) {
  console.log('Could not read react-native-screens version:', e.message);
}
console.log('react-native-screens version:', screensVersion);

const fabricDir = path.join(
  process.cwd(),
  'node_modules',
  'react-native-screens',
  'src',
  'fabric'
);

console.log('Fabric directory:', fabricDir);
console.log('Directory exists:', fs.existsSync(fabricDir));

if (!fs.existsSync(fabricDir)) {
  console.log('Fabric directory not found, skipping patch');
  process.exit(0);
}

// Props that cause codegen failures - remove them all
const PROBLEMATIC_PROPS = [
  'onAttached',
  'onDetached', 
  'onAppear',
  'onDisappear',
  'onDismissed',
  'onNativeDismissCancelled',
  'onWillAppear',
  'onWillDisappear',
  'onHeaderHeightChange',
  'onTransitionProgress',
  'onGestureCancel',
  'onSearchButtonPress',
  'onSearchFocus',
  'onChangeText',
  'onCancelButtonPress',
  'onClose',
  'onOpen',
  'onSheetDetentChanged',
];

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { patched: false, reason: 'file not found' };
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  let patchCount = 0;
  
  // Remove problematic prop lines
  for (const prop of PROBLEMATIC_PROPS) {
    const regex = new RegExp(`^\\s*${prop}\\??:.*$`, 'gm');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, '');
      patchCount += matches.length;
    }
  }
  
  // Clean up double blank lines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { patched: true, patchCount };
  }
  
  return { patched: false, reason: 'no changes needed' };
}

function patchDirectory(dir) {
  const results = [];
  
  if (!fs.existsSync(dir)) {
    return results;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      results.push(...patchDirectory(fullPath));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      const result = patchFile(fullPath);
      results.push({
        file: fullPath.replace(process.cwd() + '/', ''),
        ...result
      });
    }
  }
  
  return results;
}

console.log('\n--- Patching fabric TypeScript files ---\n');

const results = patchDirectory(fabricDir);

let patchedCount = 0;
let skippedCount = 0;

for (const result of results) {
  if (result.patched) {
    console.log(`✅ PATCHED: ${result.file} (${result.patchCount} props removed)`);
    patchedCount++;
  } else {
    console.log(`⏭️  SKIPPED: ${result.file} (${result.reason})`);
    skippedCount++;
  }
}

console.log('\n--- Patch Summary ---');
console.log(`Files patched: ${patchedCount}`);
console.log(`Files skipped: ${skippedCount}`);

// Verify the most problematic file is patched
const headerConfigPath = path.join(fabricDir, 'ScreenStackHeaderConfigNativeComponent.ts');
if (fs.existsSync(headerConfigPath)) {
  const content = fs.readFileSync(headerConfigPath, 'utf8');
  const hasOnAttached = /onAttached\??:/.test(content);
  
  console.log('\n--- Verification ---');
  console.log('ScreenStackHeaderConfigNativeComponent.ts:');
  console.log('  onAttached present:', hasOnAttached ? '❌ YES (PATCH FAILED!)' : '✅ NO (good)');
  
  if (hasOnAttached) {
    console.error('\n❌ PATCH VERIFICATION FAILED: onAttached still present');
    process.exit(1);
  }
}

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  ✅ EAS POST-INSTALL HOOK COMPLETED SUCCESSFULLY           ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('\n');
