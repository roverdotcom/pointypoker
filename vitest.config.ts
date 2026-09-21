import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

/**
 * Unit tests cover pure logic only — data mapping, fixture adapters, and
 * resolution order. Component and flow coverage lives in Playwright (`e2e/`),
 * so no DOM environment is configured here.
 */
export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'node',
    exclude: ['e2e/**', 'node_modules/**'],
    include: ['src/**/*.test.ts'],
  },
}));
