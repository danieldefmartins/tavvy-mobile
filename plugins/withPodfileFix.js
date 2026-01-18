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
      
      console.log('[withPodfileFix] Checking Podfile at:', podfilePath);
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');
        let modified = false;
        
        // Fix 1: Replace use_native_modules!(config_command) with use_native_modules!
        if (podfileContent.includes('use_native_modules!(config_command)')) {
          podfileContent = podfileContent.replace(
            /config = use_native_modules!\(config_command\)/g,
            'config = use_native_modules!'
          );
          modified = true;
          console.log('[withPodfileFix] Fixed use_native_modules! call');
        }
        
        // Fix 2: Remove the entire config_command block
        const configCommandBlockPattern = /\s*if ENV\['EXPO_USE_COMMUNITY_AUTOLINKING'\] == '1'\s*\n\s*config_command = \[.*?\];\s*\n\s*else\s*\n\s*config_command = \[\s*\n[\s\S]*?\]\s*\n\s*end\s*\n/gm;
        if (configCommandBlockPattern.test(podfileContent)) {
          podfileContent = podfileContent.replace(configCommandBlockPattern, '\n  ');
          modified = true;
          console.log('[withPodfileFix] Removed config_command block');
        }
        
        // Fix 3: Add safety check for $MLRN if not already present
        if (podfileContent.includes('$MLRN.post_install(installer)') && 
            !podfileContent.includes('if defined?($MLRN)')) {
          podfileContent = podfileContent.replace(
            /\$MLRN\.post_install\(installer\)/g,
            '$MLRN.post_install(installer) if defined?($MLRN) && $MLRN.respond_to?(:post_install)'
          );
          modified = true;
          console.log('[withPodfileFix] Added safety check for $MLRN');
        }
        
        if (modified) {
          fs.writeFileSync(podfilePath, podfileContent);
          console.log('[withPodfileFix] Successfully patched Podfile');
        } else {
          console.log('[withPodfileFix] No modifications needed');
        }
      } else {
        console.log('[withPodfileFix] Podfile not found at:', podfilePath);
      }
      
      return config;
    },
  ]);
}

module.exports = withPodfileFix;
