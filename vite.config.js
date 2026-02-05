import { defineConfig } from 'vite';

export default defineConfig({
    // Base public path when served in development or production.
    base: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
    },
    server: {
        port: 3000,
        open: true,
    }
});
