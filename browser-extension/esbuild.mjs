import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const isWatch = process.argv.includes('--watch');

// Build configuration
const buildConfig = {
  entryPoints: [
    'src/background.ts',
    'src/content.ts',
    'src/sidepanel.ts',
    'src/options.ts',
  ],
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  target: 'es2022',
  sourcemap: isWatch ? 'inline' : false,
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
  },
};

// Copy public files to dist
function copyPublicFiles() {
  const publicDir = 'public';
  const distDir = 'dist';

  // Ensure dist exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Copy all files from public to dist
  function copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(src).forEach(file => {
        copyRecursive(path.join(src, file), path.join(dest, file));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  copyRecursive(publicDir, distDir);
  console.log('✓ Copied public files to dist/');
}

// Main build function
async function build() {
  try {
    if (isWatch) {
      const ctx = await esbuild.context(buildConfig);
      await ctx.watch();
      console.log('👀 Watching for changes...');
    } else {
      await esbuild.build(buildConfig);
      console.log('✓ Build complete');
    }

    copyPublicFiles();
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
