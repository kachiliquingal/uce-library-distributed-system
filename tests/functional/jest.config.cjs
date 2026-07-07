const path = require('path');
const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'e2e-functional-tests',
  rootDir: path.resolve(__dirname, '../../'),
  testMatch: ['<rootDir>/tests/functional/**/*.test.ts'],
};
