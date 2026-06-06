// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://iamtakura.github.io',
  base: '/jcole-catalog',
  build: {
    assets: 'assets',
  },
});
