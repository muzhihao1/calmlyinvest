const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const links = [
  {
    source: path.join(root, 'calmlyinvest', 'node_modules'),
    target: path.join(root, 'api', 'node_modules'),
    label: 'api/node_modules'
  },
  {
    source: path.join(root, 'calmlyinvest', 'shared'),
    target: path.join(root, 'shared'),
    label: 'shared'
  },
  {
    source: path.join(root, 'calmlyinvest', 'server'),
    target: path.join(root, 'server'),
    label: 'server'
  },
  {
    source: path.join(root, 'calmlyinvest', 'shared'),
    target: path.join(root, '@shared'),
    label: '@shared (ts-path alias shim)'
  }
];

function ensureSymlink(source, target, label) {
  if (!fs.existsSync(source)) {
    console.warn(`[postinstall] Skipping ${label} link: source directory missing`);
    return;
  }

  try {
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink()) {
      const current = fs.readlinkSync(target);
      const resolvedCurrent = path.resolve(path.dirname(target), current);
      if (resolvedCurrent === source) {
        return; // already linked
      }
    }
    fs.rmSync(target, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  fs.symlinkSync(source, target, process.platform === 'win32' ? 'junction' : 'dir');
  console.log(`[postinstall] Linked ${label} -> ${path.relative(root, source)}`);
}

function ensureTscWrapper() {
  if (process.platform === 'win32') {
    return;
  }
  const binDir = path.join(root, 'calmlyinvest', 'node_modules', '.bin');
  const tscPath = path.join(binDir, 'tsc');
  const realTsc = path.join(root, 'calmlyinvest', 'node_modules', 'typescript', 'bin', 'tsc');

  if (!fs.existsSync(realTsc)) {
    return;
  }

  const wrapperContent = `#!/usr/bin/env node\nconst realTsc = ${JSON.stringify(realTsc)};\nif (!process.argv.slice(2).some(arg => arg === '--moduleResolution' || arg.startsWith('--moduleResolution'))) {\n  process.argv.splice(2, 0, '--moduleResolution', 'node');\n}\nrequire(realTsc);\n`;

  fs.writeFileSync(tscPath, wrapperContent, { mode: 0o755 });
}

try {
  for (const link of links) {
    ensureSymlink(link.source, link.target, link.label);
  }
  ensureTscWrapper();
} catch (error) {
  console.error('[postinstall] Failed to create symlinks:', error.message);
  process.exit(1);
}
