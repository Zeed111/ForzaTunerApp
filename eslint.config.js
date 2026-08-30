const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    rules: {
      // Catch duplicate keys
      'no-dupe-keys': 'error',
    },
  },
];