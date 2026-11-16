const expo = require('eslint-config-expo/flat');

module.exports = [
  { ignores: ['dist/**', '.expo/**', 'node_modules/**'] },
  ...expo,
  {
    rules: {
      // Catch duplicate keys
      'no-dupe-keys': 'error',
    },
  },
];
