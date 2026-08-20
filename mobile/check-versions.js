const fs = require('fs');
const path = require('path');

const getVersion = (pkgName) => {
  try {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'node_modules', pkgName, 'package.json'), 'utf8'));
    return pkgJson.version;
  } catch (e) {
    return 'Not installed';
  }
};

console.log('Installed Packages:');
console.log('- expo:', getVersion('expo'));
console.log('- react-native:', getVersion('react-native'));
console.log('- react-native-reanimated:', getVersion('react-native-reanimated'));
console.log('- react-native-svg:', getVersion('react-native-svg'));
console.log('- react-native-screens:', getVersion('react-native-screens'));
console.log('- react-native-safe-area-context:', getVersion('react-native-safe-area-context'));
console.log('- react-native-gesture-handler:', getVersion('react-native-gesture-handler'));
