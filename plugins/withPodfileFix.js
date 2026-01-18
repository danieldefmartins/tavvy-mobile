/**
 * Custom Expo Config Plugin to fix the Podfile issue with MapLibre
 * 
 * This plugin modifies the generated Podfile to fix the "no implicit conversion 
 * of String into Integer" error caused by passing config_command to use_native_modules!
 */

const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withPodfileFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');
        
        // Fix 1: Replace the problematic use_native_modules!(config_command) with use_native_modules!
        // This regex matches the entire if/else block that defines config_command and the use_native_modules! call
        const configCommandPattern = /if ENV\['EXPO_USE_COMMUNITY_AUTOLINKING'\] == '1'\s*\n\s*config_command = \[.*?\];\s*\n\s*else\s*\n\s*config_command = \[\s*\n[\s\S]*?\]\s*\n\s*end\s*\n\s*\n\s*config = use_native_modules!\(config_command\)/gm;
        
        if (configCommandPattern.test(podfileContent)) {
          podfileContent = podfileContent.replace(
            configCommandPattern,
            'config = use_native_modules!'
          );
        }
        
        // Fix 2: Also handle simpler patterns where just the line needs to be fixed
        podfileContent = podfileContent.replace(
          /config = use_native_modules!\(config_command\)/g,
          'config = use_native_modules!'
        );
        
        // Fix 3: Add safety check for $MLRN if not already present
        if (podfileContent.includes('$MLRN.post_install(installer)') && 
            !podfileContent.includes('if defined?($MLRN)')) {
          podfileContent = podfileContent.replace(
            /\$MLRN\.post_install\(installer\)/g,
            '$MLRN.post_install(installer) if defined?($MLRN) && $MLRN.respond_to?(:post_install)'
          );
        }
        
        // Fix 4: Remove the config_command block entirely if it still exists
        const configCommandBlockPattern = /\s*if ENV\['EXPO_USE_COMMUNITY_AUTOLINKING'\] == '1'\s*\n\s*config_command = \[.*?\];\s*\n\s*else\s*\n\s*config_command = \[\s*\n[\s\S]*?\]\s*\n\s*end\s*\n/gm;
        podfileContent = podfileContent.replace(configCommandBlockPattern, '\n');
        
        fs.writeFileSync(podfilePath, podfileContent);
        console.log('[withPodfileFix] Successfully patched Podfile');
      }
      
      return config;
    },
  ]);
}

module.exports = withPodfileFix;
