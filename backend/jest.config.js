module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*spec.ts'],
  transform: { '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*spec.ts', '!src/main.ts'],
  // Definition of Done: độ phủ nhánh mới ≥ 60%. CI chạy `npm run test:cov` và đỏ nếu tụt dưới ngưỡng.
  coverageThreshold: { global: { statements: 60, branches: 60, functions: 60, lines: 60 } },
};
