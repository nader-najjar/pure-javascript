import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/test/**/*.test.ts'],
    environment: 'node',
    globals: false,
    restoreMocks: true,
    mockReset: true,
    unstubEnvs: true,
    unstubGlobals: true,
    passWithNoTests: false,
    reporters: ['default', 'junit'],
    outputFile: { junit: 'build/test-results/junit.xml' },
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src/main/**/*.ts'],
      exclude: ['src/main/Main.ts', 'src/main/composition/**'],
      reportsDirectory: 'build/coverage',
      reporter: ['text', 'html', 'lcov'],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 }
    }
  }
});
