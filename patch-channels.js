#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isRestore = args.includes('--restore');

console.log('Claude Code Channels Patcher');
console.log('============================\n');
console.log('Patches Po_() to always return true, enabling channels.\n');

// Find binary
const versionsDir = path.join(os.homedir(), '.local', 'share', 'claude', 'versions');
const versions = fs.readdirSync(versionsDir)
  .filter(f => !f.includes('.backup') && !f.startsWith('.'))
  .sort((a, b) => {
    const ap = a.split('.').map(Number), bp = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) if ((bp[i]||0) !== (ap[i]||0)) return (bp[i]||0) - (ap[i]||0);
    return 0;
  });

if (!versions.length) { console.error('No Claude Code binary found'); process.exit(1); }

const targetPath = path.join(versionsDir, versions[0]);
const backupPath = targetPath + '.backup-channels';

console.log(`Binary: ${targetPath}`);
console.log(`Version: ${versions[0]}\n`);

if (isRestore) {
  if (!fs.existsSync(backupPath)) { console.error('No backup found'); process.exit(1); }
  fs.copyFileSync(backupPath, targetPath);
  if (process.platform === 'darwin') {
    try { execSync(`codesign -fs - "${targetPath}"`, { stdio: 'ignore' }); } catch(e) {}
  }
  console.log('Restored from backup.');
  process.exit(0);
}

const data = fs.readFileSync(targetPath);
const dataStr = data.toString('utf8');

// The target: function Po_(){return lT("tengu_harbor",!1)}
// We want:    function Po_(){return                   !0}
// Same byte length, spaces pad the removed lT call

const pattern = 'function Po_(){return lT("tengu_harbor",!1)}';
const patched = 'function Po_(){return                    !0}';

if (pattern.length !== patched.length) {
  console.error(`Length mismatch: ${pattern.length} vs ${patched.length}`);
  process.exit(1);
}

const count = (s, p) => { let c=0, i=0; while((i=s.indexOf(p,i))!==-1){c++;i++} return c; };

const alreadyPatched = count(dataStr, patched);
const unpatched = count(dataStr, pattern);

console.log(`Unpatched occurrences: ${unpatched}`);
console.log(`Already patched: ${alreadyPatched}\n`);

if (unpatched === 0 && alreadyPatched >= 2) {
  console.log('Already patched! Channels should be enabled.');
  process.exit(0);
}

if (unpatched === 0) {
  console.error('Pattern not found. The binary may have changed in a newer version.');
  console.error('Look for: strings <binary> | grep "tengu_harbor"');
  process.exit(1);
}

if (isDryRun) {
  console.log(`DRY RUN — would patch ${unpatched} occurrence(s)`);
  console.log(`\nOriginal: ${pattern}`);
  console.log(`Patched:  ${patched}`);
  process.exit(0);
}

// Backup
if (!fs.existsSync(backupPath)) {
  console.log('Creating backup...');
  fs.copyFileSync(targetPath, backupPath);
}

// Patch
const buf = Buffer.from(data);
const searchBuf = Buffer.from(pattern, 'utf8');
const replaceBuf = Buffer.from(patched, 'utf8');

let patchCount = 0, offset = 0;
while (true) {
  const idx = buf.indexOf(searchBuf, offset);
  if (idx === -1) break;
  replaceBuf.copy(buf, idx);
  patchCount++;
  offset = idx + searchBuf.length;
}

console.log(`Patched ${patchCount} occurrence(s)`);

fs.writeFileSync(targetPath, buf);

// Re-sign on macOS
if (process.platform === 'darwin') {
  console.log('Re-signing binary...');
  try {
    execSync(`codesign -fs - "${targetPath}"`, { stdio: 'ignore' });
    console.log('Signed.\n');
  } catch(e) {
    console.error('Warning: codesign failed');
  }
}

// Verify
try {
  const v = execSync(`"${targetPath}" --version`, { encoding: 'utf8', timeout: 10000, stdio: ['pipe','pipe','ignore'] }).trim();
  console.log(`Binary executes: OK (${v})`);
} catch(e) {
  console.error('Binary execution FAILED — restore with: node patch-channels.js --restore');
  process.exit(1);
}

console.log('\nChannels patched! Restart Claude Code with:');
console.log('  claude --dangerously-load-development-channels server:whatsapp');
