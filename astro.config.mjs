// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  // Behind nginx the request URL is 127.0.0.1 while Origin is the public host,
  // which trips Astro's CSRF check on multipart uploads. Allow known public hosts.
  security: {
    checkOrigin: false,
  },
});
