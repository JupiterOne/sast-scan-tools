module.exports = {
  clearMocks: true,
  setupFiles: ['./testSetup.ts'],
  preset: 'ts-jest',
  moduleNameMapper: {
    '~/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/*test.(js|ts)'],
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};