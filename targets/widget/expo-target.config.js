/** Widget „Zusammen-Zähler“ für Home- und Sperrbildschirm (iOS). */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'WirZweiWidget',
  displayName: 'Wir zwei',
  bundleIdentifier: '.widget',
  deploymentTarget: '17.0',
  colors: {
    $widgetBackground: '#C58BF2',
    $accent: '#FF5FA2',
  },
  // Dieselbe App Group wie die App – darüber liest das Widget Namen und Datum.
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
