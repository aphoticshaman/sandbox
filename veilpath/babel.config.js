module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Removed reanimated plugin - not using reanimated in active code
    // The Skia animation components that use reanimated are not imported anywhere
  };
};