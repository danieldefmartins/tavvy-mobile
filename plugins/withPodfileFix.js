/**
 * Custom Expo Config Plugin to fix the Podfile issue
 * 
 * This plugin modifies the generated Podfile to fix the "no implicit conversion 
 * of String into Integer" error caused by passing config_command to use_native_modules!
 * 
 * Uses withDangerousMod which runs after prebuild and can directly modify files.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withPodfileFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      console.log('[withPodfileFix] Looking for Podfile at:', podfilePath);
      
      if (!fs.existsSync(podfilePath)) {
        console.log('[withPodfileFix] Podfile not found, skipping...');
        return config;
      }
      
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');
      let modified = false;
      
      console.log('[withPodfileFix] Checking Podfile for config_command issue...');
      
      // Check if fix is needed
      if (podfileContent.includes('use_native_modules!(config_command)')) {
        console.log('[withPodfileFix] Found problematic config_command, applying fix...');
        
        // Remove the config_command if/else block entirely
        // This regex matches the entire block that defines config_command
        const configCommandBlockRegex = /\s*if ENV\['EXPO_USE_COMMUNITY_AUTOLINKING'\]\s*==\s*'1'\s*\n[\s\S]*?config_command\s*=[\s\S]*?end\s*\n/gm;
        
        podfileContent = podfileContent.replace(configCommandBlockRegex, '\n');
        
        // Replace use_native_modules!(config_command) with use_native_modules!
        podfileContent = podfileContent.replace(
          /config\s*=\s*use_native_modules!\s*\(\s*config_command\s*\)/g,
          'config = use_native_modules!'
        );
        
        modified = true;
      }
      
      // Also handle the case where config_command might be on a single line
      if (podfileContent.includes('config_command')) {
        console.log('[withPodfileFix] Found remaining config_command references, cleaning up...');
        
        // Remove any remaining config_command variable definitions
        podfileContent = podfileContent.replace(
          /^\s*config_command\s*=.*$/gm,
          ''
        );
        
        // Clean up any remaining use_native_modules!(config_command)
        podfileContent = podfileContent.replace(
          /use_native_modules!\s*\(\s*config_command\s*\)/g,
          'use_native_modules!'
        );
        
        modified = true;
      }
      
      // Add safety check for $MLRN if present
      if (podfileContent.includes('$MLRN.post_install(installer)') && 
          !podfileContent.includes('if defined?($MLRN)')) {
        podfileContent = podfileContent.replace(
          /\$MLRN\.post_install\(installer\)/g,
          '$MLRN.post_install(installer) if defined?($MLRN) && $MLRN.respond_to?(:post_install)'
        );
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(podfilePath, podfileContent, 'utf8');
        console.log('[withPodfileFix] ✅ Successfully modified Podfile');
        
        // Log the fixed line for verification
        const lines = podfileContent.split('\n');
        const useNativeModulesLine = lines.find(line => line.includes('use_native_modules'));
        if (useNativeModulesLine) {
          console.log('[withPodfileFix] Fixed line:', useNativeModulesLine.trim());
        }
      } else {
        console.log('[withPodfileFix] No modifications needed');
      }
      
      return config;
    }
  ]);
}

module.exports = withPodfileFix;
