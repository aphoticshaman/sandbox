const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Add missingDimensionStrategy to resolve react-native-iap variant ambiguity
 * Tells Gradle to use "play" flavor for Google Play Store builds
 */
module.exports = function withAndroidIAPConfig(config) {
  return withAppBuildGradle(config, (config) => {
    const { contents } = config.modResults;

    // Check if already added to avoid duplicates
    if (contents.includes('missingDimensionStrategy "store"')) {
      return config;
    }

    // Add missingDimensionStrategy inside defaultConfig block
    const defaultConfigRegex = /(defaultConfig\s*\{)/;
    const strategyToAdd = `
        // Fix react-native-iap flavor ambiguity - use Play Store flavor
        missingDimensionStrategy "store", "play"
`;

    config.modResults.contents = contents.replace(
      defaultConfigRegex,
      `$1${strategyToAdd}`
    );

    return config;
  });
};
