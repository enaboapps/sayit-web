const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(convex-test|convex)/)',
  ],
  collectCoverageFrom: [
    'convex/**/*.ts',
    'app/components/**/*.tsx',
    'app/api/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();
  // Svix 2 is ESM-only. Compile its real verifier for Jest on our Node 22
  // runtime instead of mocking signature verification in webhook tests.
  config.transformIgnorePatterns = config.transformIgnorePatterns.map((pattern) =>
    pattern.includes('node_modules')
      ? `^(?!.*[/\\\\]node_modules[/\\\\]svix[/\\\\])${pattern}`
      : pattern
  );
  return config;
};
