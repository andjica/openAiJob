import path from 'path';
import { fileURLToPath } from 'url';
import framework7 from 'rollup-plugin-framework7';
import { createHtmlPlugin } from 'vite-plugin-html';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isCordova = process.env.TARGET === 'cordova';

const SRC_DIR = path.resolve(__dirname, './src');
const PUBLIC_DIR = path.resolve(__dirname, './public');
const BUILD_DIR = path.resolve(__dirname, isCordova ? './cordova/www' : './www');

export default {
  root: SRC_DIR,
  base: './',
  publicDir: PUBLIC_DIR,

  plugins: [
    framework7({
      emitCss: false,
      components: true,
    }),
    createHtmlPlugin({
      inject: {
        data: {
          TARGET: process.env.TARGET || 'web',
        },
      },
    }),
    viteStaticCopy({
      targets: [
        {
          src: path.resolve(__dirname, 'src/assets'),
          dest: 'assets',
        },
      ],
    }),
  ],

  resolve: {
    alias: {
      '@': SRC_DIR,
    },
  },

  build: {
    outDir: BUILD_DIR,
    emptyOutDir: true,
    assetsInlineLimit: 0,
    assetsDir: '',
    rollupOptions: {
      input: path.resolve(SRC_DIR, 'index.html'),
      external: isCordova ? ['cordova.js'] : [],
    },
  },

  optimizeDeps: {
    include: ['framework7', 'dom7'],
  },

  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },

  esbuild: {
    jsxFactory: '$jsx',
    jsxFragment: '"Fragment"',
  },
};
