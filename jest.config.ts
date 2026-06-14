// import tsconfig from './tsconfig.json';

import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';

const config: Config = {
  clearMocks: true,
  preset: 'ts-jest',

  collectCoverage: true,

  coverageDirectory: 'coverage',

  coverageProvider: 'v8',

  extensionsToTreatAsEsm: ['.ts'],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  modulePaths: ['<rootDir>/src'],

  moduleNameMapper: {
    // 1. Spread the alias mappings from the helper function
    ...pathsToModuleNameMapper(
      {
        '@core/*': ['./src/core/$1'],
        '@/*': ['./src/$1'],
        '@app': ['./src/app'],

        // '@config/*': ['./src/config/$1'],
        // '@config': ['./src/config'],
        // '@core': ['./src/core'],
        // '@modules/*': ['./src/modules/$1'],
        // '@modules': ['./src/modules'],
        // '@app': ['./src/app'],
        // '@/*': ['./src/$1'],
      },
      {
        prefix: '<rootDir>/',
      },
    ),

    // 2. Add the fix for .js imports (The line you needed)
    // This tells Jest: "When you see './file.js', look for './file' (which finds .ts)"
    // '^(\\.{1,2}/.*)\\.js$': '$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^(@/.*)\\.js$': '$1', // ← strips .js from absolute imports (e.g. @core/...)
  },

  resetMocks: true,

  restoreMocks: true,

  testEnvironment: 'node',

  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  transform: {
    '^.+\\.ts?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'esnext',
          moduleResolution: 'nodenext',
          rootDir: undefined,
        },
        diagnostics: false, // pre-existing TS errors in other modules — use `tsc --noEmit` for type checks
      },
    ],
  },

  testMatch: [
    '**/__tests__/**/*.?([mc])[jt]s?(x)',
    '**/?(*.)+(spec|test).?([mc])[jt]s?(x)',
  ],

  verbose: true,
};

export default config;
