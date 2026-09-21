const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// Allow CI and restricted environments to bundle without a Watchman service.
if (process.env.TAVVY_NO_WATCHMAN === '1') config.resolver.useWatchman = false;
module.exports = config;
