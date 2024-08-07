module.exports = {
    preset: 'ts-jest', // Use ts-jest preset for TypeScript support
    testEnvironment: 'node', // Set the test environment to Node.js
    verbose: true, // Display individual test results with the test suite hierarchy
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'], // Match test files with .ts extension
    transform: {
        '^.+\\.tsx?$': 'ts-jest', // Transform TypeScript files using ts-jest
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'], // File extensions to be considered
    coverageDirectory: 'coverage', // Directory to output coverage reports
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'], // Files to collect coverage information from
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Optional: setup file to run after Jest environment is set up
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.test.json', // Specify a custom tsconfig file for tests
        },
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1', // Map module paths if using path aliases
    },
};
