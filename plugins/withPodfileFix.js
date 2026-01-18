/**
 * Custom Expo Config Plugin to fix the Podfile issue
 * 
 * This plugin modifies the generated Podfile to fix the "no implicit conversion 
 * of String into Integer" error caused by passing config_command to use_native_modules!
 * 
 * Uses the withPodfile modifier which runs after the Podfile is generated.
 */

const { withPodfile } = require('@expo/config-plugins');

function withPodfileFix(config) {
  return withPodfile(config, (config) => {
    console.log('[withPodfileFix] Modifying Podfile contents...');
    
    let podfileContent = config.modResults.contents;
    let modified = false;
    
    // Check if fix is needed
    if (podfileContent.includes('use_native_modules!(config_command)')) {
      console.log('[withPodfileFix] Found problematic config_command, applying fix...');
      
      // Remove the config_command if/else block
      const configCommandBlockRegex = /\s*if ENV\['EXPO_USE_COMMUNITY_AUTOLINKING'\] == '1'\s*\n\s*config_command = \[.*?\];\s*\n\s*else\s*\n\s*config_command = \[\s*\n[\s\S]*?\]\s*\n\s*end\s*\n/gm;
      
      podfileContent = podfileContent.replace(configCommandBlockRegex, '\n  ');
      
      // Replace use_native_modules!(config_command) with use_native_modules!
      podfileContent = podfileContent.replace(
        /config = use_native_modules!\(config_command\)/g,
        'config = use_native_modules!'
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
      config.modResults.contents = podfileContent;
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
  });
}

module.exports = withPodfileFix;
