/** @type {import('jest').Config} */
const config = {
    verbose: true,
    testEnvironment: 'node',
    transform: {},
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.mjs$': '$1.mjs'
    },
    testMatch: [
        '**/__tests__/**/*.mjs',
        '**/?(*.)+(spec|test).mjs'
    ]
};

export default config; 