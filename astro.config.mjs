// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ai-governance-tp.github.io',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
