const { withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins');

function withAndroidSizeOptimizations(config) {
  config = withGradleProperties(config, (props) => {
    function setProp(key, value) {
      const item = props.modResults.find(p => p.type === 'property' && p.key === key);
      if (item) {
        item.value = value;
      } else {
        props.modResults.push({ type: 'property', key, value });
      }
    }
    // Enable R8 resource shrinking in release builds
    setProp('android.enableShrinkResourcesInReleaseBuilds', 'true');
    // Enable compressed packaging for native libraries (.so) in APK
    setProp('expo.useLegacyPackaging', 'true');
    // Disable unused legacy GIF & WebP decoders to reduce native binary overhead
    setProp('expo.gif.enabled', 'false');
    setProp('expo.webp.enabled', 'false');
    return props;
  });

  config = withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    if (!contents.includes('splits {')) {
      const splitsBlock = `
    splits {
        abi {
            reset()
            enable true
            universalApk true
            include "armeabi-v7a", "arm64-v8a", "x86_64"
        }
    }
`;
      contents = contents.replace('buildTypes {', splitsBlock + '    buildTypes {');
      mod.modResults.contents = contents;
    }
    return mod;
  });

  return config;
}

module.exports = ({ config }) => {
  const baseConfig = {
    ...config,
    experiments: {
      ...config.experiments,
      baseUrl: (process.env.EXPO_BASE_URL || '').trim(),
    },
  };

  return withAndroidSizeOptimizations(baseConfig);
};
