#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isRestore = args.includes('--restore');
const isVerify = args.includes('--verify');
const showHelp = args.includes('--help') || args.includes('-h');

const VERSION = '2.1.74';

if (showHelp) {
  console.log(`Claude Code Thinking Visibility Patcher v${VERSION}`);
  console.log('==============================================\n');
  console.log('Patches the native Claude Code binary to show thinking blocks by default.\n');
  console.log('Usage: node patch-thinking.js [options]\n');
  console.log('Options:');
  console.log('  --dry-run    Preview changes without applying them');
  console.log('  --restore    Restore from backup file');
  console.log('  --verify     Verify patch status without modifying the binary');
  console.log('  --help, -h   Show this help message\n');
  console.log('Examples:');
  console.log('  node patch-thinking.js              # Apply patch');
  console.log('  node patch-thinking.js --dry-run    # Preview changes');
  console.log('  node patch-thinking.js --verify     # Check patch status');
  console.log('  node patch-thinking.js --restore    # Restore original');
  process.exit(0);
}

console.log(`Claude Code Thinking Visibility Patcher v${VERSION}`);
console.log('==============================================\n');

// --- Settings check: showThinkingSummaries ---
// Claude Code sends a "redact-thinking" beta flag to the API by default, which
// causes the API to return thinking blocks with empty text (only signatures).
// Setting showThinkingSummaries: true in user settings prevents this beta from
// being sent, allowing the API to return actual thinking content.
const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');

function checkAndConfigureSettings() {
  let settings = {};
  let settingsExisted = false;

  try {
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      settingsExisted = true;
    }
  } catch (e) {
    console.warn(`Warning: Could not read ${settingsPath}: ${e.message}`);
  }

  if (settings.showThinkingSummaries === true) {
    console.log('Settings: showThinkingSummaries is already enabled');
    return 'already_set';
  }

  console.log('Settings: showThinkingSummaries needs to be enabled');
  console.log('  This prevents the API from redacting thinking content');

  if (isDryRun || isVerify) {
    return 'needs_update';
  }

  try {
    settings.showThinkingSummaries = true;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    console.log(`  Updated ${settingsPath}`);
    return 'updated';
  } catch (e) {
    console.error(`  Error: Could not update settings: ${e.message}`);
    console.error(`  Manually add "showThinkingSummaries": true to ${settingsPath}`);
    return 'error';
  }
}

const settingsResult = checkAndConfigureSettings();
console.log();

// Auto-detect Claude Code native binary path
function getClaudeCodePath() {
  const homeDir = os.homedir();
  const attemptedPaths = [];

  function checkPath(testPath, method) {
    if (!testPath) return null;
    attemptedPaths.push({ path: testPath, method });
    try {
      if (fs.existsSync(testPath)) {
        const realPath = fs.realpathSync(testPath);
        return realPath;
      }
    } catch (error) {
      // Path check failed, continue
    }
    return null;
  }

  // PRIORITY 1: Native binary installation (default since ~v2.1.19)
  const nativeVersionsDir = path.join(homeDir, '.local', 'share', 'claude', 'versions');
  if (fs.existsSync(nativeVersionsDir)) {
    try {
      const versions = fs.readdirSync(nativeVersionsDir)
        .filter(f => !f.includes('.backup') && !f.startsWith('.'))
        .sort((a, b) => {
          // Sort by semver descending
          const aParts = a.split('.').map(Number);
          const bParts = b.split('.').map(Number);
          for (let i = 0; i < 3; i++) {
            if ((bParts[i] || 0) !== (aParts[i] || 0)) return (bParts[i] || 0) - (aParts[i] || 0);
          }
          return 0;
        });
      if (versions.length > 0) {
        const latestVersion = versions[0];
        const binaryPath = path.join(nativeVersionsDir, latestVersion);
        const found = checkPath(binaryPath, 'native binary');
        if (found) return found;
      }
    } catch (error) {
      // Continue to fallback methods
    }
  }

  // PRIORITY 2: Resolve from 'which claude' symlink
  if (process.platform !== 'win32') {
    try {
      const claudeBinary = execSync('which claude', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
      if (claudeBinary) {
        const found = checkPath(claudeBinary, 'which claude');
        if (found) return found;
      }
    } catch (e) {
      // Continue
    }
  }

  getClaudeCodePath.attemptedPaths = attemptedPaths;
  return null;
}

const targetPath = getClaudeCodePath();

if (!targetPath) {
  console.error('Error: Could not find Claude Code installation\n');
  console.error('Searched using the following methods:\n');
  const attemptedPaths = getClaudeCodePath.attemptedPaths || [];
  if (attemptedPaths.length > 0) {
    attemptedPaths.forEach(({ path: p, method }) => {
      console.error(`  [${method}] ${p}`);
    });
  }
  console.error('\nTroubleshooting:');
  console.error('  1. Verify Claude Code is installed: claude --version');
  console.error('  2. Check ~/.local/share/claude/versions/ for the binary');
  console.error('  3. Check that "which claude" resolves to the binary');
  process.exit(1);
}

console.log(`Found Claude Code at: ${targetPath}\n`);

// Check if it's a native binary
const fileType = execSync(`file "${targetPath}"`, { encoding: 'utf8' }).trim();
const isNativeBinary = fileType.includes('Mach-O') || fileType.includes('ELF');

if (!isNativeBinary) {
  console.error('Error: Expected a native binary but found:', fileType);
  console.error('This patcher only supports native binary installations.');
  process.exit(1);
}

console.log('Detected native binary installation\n');

const backupPath = targetPath + '.backup';

// Restore from backup
if (isRestore) {
  if (!fs.existsSync(backupPath)) {
    console.error('Error: Backup file not found at:', backupPath);
    console.error('\nThe backup is created when you first apply the patch.');
    process.exit(1);
  }

  console.log('Restoring from backup...');
  fs.copyFileSync(backupPath, targetPath);
  // Re-sign after restore
  try {
    execSync(`codesign -fs - "${targetPath}"`, { stdio: 'ignore' });
    console.log('Restored and re-signed successfully!');
  } catch (e) {
    console.log('Restored successfully! (codesign skipped)');
  }
  console.log('\nPlease restart Claude Code for changes to take effect.');
  process.exit(0);
}

// Read binary
console.log('Reading binary...');
const data = fs.readFileSync(targetPath);
const dataStr = data.toString('utf8');

// Verification helper: count occurrences of a pattern in a string
function countOccurrences(str, pattern) {
  let count = 0, idx = 0;
  while ((idx = str.indexOf(pattern, idx)) !== -1) { count++; idx++; }
  return count;
}

// Check patch status
const patchedMarker = 'isTranscriptMode:!0,verbose:!0,hideInTranscript:!1';
const patchedCount = countOccurrences(dataStr, patchedMarker);

// --verify mode: report patch status and exit
if (isVerify) {
  console.log('Patch status verification:\n');

  // Settings
  console.log('  Settings (prevents API from redacting thinking content):');
  console.log(`    showThinkingSummaries: ${settingsResult === 'already_set' ? 'ENABLED' : 'NOT SET — add "showThinkingSummaries": true to ~/.claude/settings.json'}`);

  // Display patch
  const unpatchedWithNullCheck = countOccurrences(dataStr, 'case"thinking":{if(!');
  console.log('\n  Display patch (forces thinking blocks visible in UI):');
  console.log(`    Patched blocks: ${patchedCount}/2, Unpatched blocks: ${unpatchedWithNullCheck}`);
  console.log(`    Status: ${patchedCount === 2 && unpatchedWithNullCheck === 0 ? 'APPLIED' : patchedCount === 0 ? 'NOT APPLIED' : 'PARTIAL'}`);

  // Overall
  const displayPatched = patchedCount === 2 && unpatchedWithNullCheck === 0;
  const allGood = displayPatched && settingsResult === 'already_set';
  console.log(`\n  Overall: ${allGood ? 'FULLY CONFIGURED' : 'NEEDS ATTENTION'}`);

  if (!displayPatched) {
    console.log('  Run "node patch-thinking.js" to apply the display patch.');
  }

  // Verify binary runs
  try {
    const versionOutput = execSync(`"${targetPath}" --version`, { encoding: 'utf8', timeout: 10000, stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    console.log(`\n  Binary executes: yes (${versionOutput})`);
  } catch (e) {
    console.log('\n  Binary executes: FAILED — binary may be corrupted');
  }
  process.exit(0);
}

// Check if already patched
if (patchedCount >= 2) {
  console.log('Display patch already applied.\n');
  if (isDryRun) {
    console.log('DRY RUN - No changes needed\n');
  }
  process.exit(0);
}

// Find the display patch pattern
let originalPattern = null;
let replacement = null;

const createElementWithThinking = dataStr.indexOf(',isTranscriptMode:');
if (createElementWithThinking === -1) {
  console.error('Display patch:');
  console.error('  Pattern not found - could not locate thinking createElement');
  process.exit(1);
}

// Find all case"thinking":{ blocks and check which one contains the thinking createElement
let searchStart = 0;

while (true) {
  const caseIdx = dataStr.indexOf('case"thinking":{if(!', searchStart);
  if (caseIdx === -1) break;

  // Extract until we find the closing pattern: return VAR}
  let depth = 0;
  let endIdx = caseIdx + 16; // past case"thinking":
  for (let i = caseIdx + 16; i < caseIdx + 500; i++) {
    if (dataStr[i] === '{') depth++;
    if (dataStr[i] === '}') {
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
      depth--;
    }
  }

  const block = dataStr.substring(caseIdx, endIdx);

  // Verify this is the right block (has createElement with thinking props)
  if (block.includes('isTranscriptMode:') && block.includes('hideInTranscript:') && block.includes('createElement')) {
    originalPattern = block;
    break;
  }

  searchStart = caseIdx + 1;
}

if (!originalPattern) {
  console.error('Display patch:');
  console.error('  Pattern not found - may need update for newer version');
  console.error('\nRun "claude --version" to check the installed version.');
  process.exit(1);
}

console.log('Display patch:');
console.log('  Pattern found - ready to apply');
console.log(`  Pattern length: ${originalPattern.length} bytes`);

// Extract variable names from the pattern
const nullCheckMatch = originalPattern.match(/if\(!(\w+)&&!(\w+)\)return null/);
if (!nullCheckMatch) {
  console.error('Error: Could not parse null check variables');
  process.exit(1);
}
const var1 = nullCheckMatch[1];
const var2 = nullCheckMatch[2];

const hideVarMatch = originalPattern.match(/;let (\w+)=/);
if (!hideVarMatch) {
  console.error('Error: Could not parse hideInTranscript variable');
  process.exit(1);
}
const var3 = hideVarMatch[1];

console.log(`  Variables: isTranscriptMode=${var1}, verbose=${var2}, hideInTranscript=${var3}`);

// Build replacement - same byte length required for binary patching
replacement = originalPattern;

const nullCheck = `if(!${var1}&&!${var2})return null;`;
replacement = replacement.replace(nullCheck, '\x00PADDING_PLACEHOLDER\x00');

const hideCalcRegex = new RegExp(`let ${var3}=.+?,(?=\\w+;if)`);
const hideCalcMatch = replacement.match(hideCalcRegex);
if (hideCalcMatch) {
  replacement = replacement.replace(hideCalcMatch[0], `let ${var3}=!1,`);
}

replacement = replacement.replace(`isTranscriptMode:${var1}`, 'isTranscriptMode:!0');
replacement = replacement.replace(`verbose:${var2}`, 'verbose:!0');
replacement = replacement.replace(`hideInTranscript:${var3}`, 'hideInTranscript:!1');

function replaceVar(str, varName, literal) {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  str = str.replace(new RegExp(`!==${escaped}(?=[|)])`, 'g'), `!==${literal}`);
  str = str.replace(new RegExp(`\\]=${escaped}(?=,)`, 'g'), `]=${literal}`);
  return str;
}
replacement = replaceVar(replacement, var1, '!0');
replacement = replaceVar(replacement, var2, '!0');
replacement = replaceVar(replacement, var3, '!1');

const placeholderLen = '\x00PADDING_PLACEHOLDER\x00'.length;
const currentLen = replacement.length;
const targetLen = originalPattern.length;
const paddingNeeded = targetLen - currentLen + placeholderLen;

if (paddingNeeded < 0) {
  console.error(`Error: Replacement is ${-paddingNeeded} bytes too long. Please report this bug.`);
  process.exit(1);
}

replacement = replacement.replace('\x00PADDING_PLACEHOLDER\x00', ' '.repeat(paddingNeeded));

if (replacement.length !== originalPattern.length) {
  console.error(`Error: Replacement length mismatch (${replacement.length} vs ${originalPattern.length})`);
  process.exit(1);
}

console.log();

if (isDryRun) {
  console.log('DRY RUN - No changes will be made\n');
  console.log('Would apply display patch (thinking block visibility)');
  console.log(`  Pattern: ${originalPattern.substring(0, 60)}...`);
  if (settingsResult === 'needs_update') {
    console.log('Would enable showThinkingSummaries in settings');
  }
  console.log('\nRun without --dry-run to apply.');
  process.exit(0);
}

// Create backup
if (!fs.existsSync(backupPath)) {
  console.log('Creating backup...');
  fs.copyFileSync(targetPath, backupPath);
  console.log(`Backup created: ${backupPath}\n`);
}

const patched = Buffer.from(data);

// Apply display patch — force thinking blocks visible
console.log('Applying display patch...');
const searchBuf = Buffer.from(originalPattern, 'utf8');
const replaceBuf = Buffer.from(replacement, 'utf8');

let displayPatchCount = 0;
let offset = 0;
while (true) {
  const idx = patched.indexOf(searchBuf, offset);
  if (idx === -1) break;
  replaceBuf.copy(patched, idx);
  displayPatchCount++;
  offset = idx + searchBuf.length;
}

if (displayPatchCount === 0) {
  console.error('Error: Display pattern was found in text scan but not in binary search.');
  process.exit(1);
}
console.log(`  Applied to ${displayPatchCount} location(s)`);

if (displayPatchCount === 1) {
  console.warn('  Warning: Expected 2 locations (binary contains 2 JS copies). Patch may be incomplete.');
}

console.log();

// Write patched binary
console.log('Writing patched binary...');
fs.writeFileSync(targetPath, patched);

// Re-sign the binary (macOS)
if (process.platform === 'darwin') {
  console.log('Re-signing binary (ad-hoc)...');
  try {
    execSync(`codesign -fs - "${targetPath}"`, { stdio: 'ignore' });
    console.log('Binary re-signed successfully\n');
  } catch (e) {
    console.error('Warning: codesign failed. The binary may not run on macOS.');
    console.error('You can try manually: codesign -fs - "' + targetPath + '"');
  }
}

// Post-patch verification
console.log('Verifying patch...');
const verifyData = fs.readFileSync(targetPath);
const verifyStr = verifyData.toString('utf8');

const verifyDisplayCount = countOccurrences(verifyStr, patchedMarker);
const remainingUnpatchedDisplay = countOccurrences(verifyStr, 'case"thinking":{if(!');

if (verifyDisplayCount >= 2 && remainingUnpatchedDisplay === 0) {
  console.log(`  Display patch: ${verifyDisplayCount} location(s) confirmed`);
} else {
  console.error(`  Display patch verification FAILED: ${verifyDisplayCount} patched, ${remainingUnpatchedDisplay} unpatched`);
  console.error('  Restore from backup and try again.');
  process.exit(1);
}

// Verify the binary still executes
try {
  const versionOutput = execSync(`"${targetPath}" --version`, { encoding: 'utf8', timeout: 10000, stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  console.log(`  Binary execution: OK (${versionOutput})\n`);
} catch (e) {
  console.error('  Binary execution: FAILED');
  console.error('  The binary may not run. Restore from backup: node patch-thinking.js --restore');
  process.exit(1);
}

console.log('Patch applied and verified! Please restart Claude Code for changes to take effect.');
console.log('\nTo verify later: node patch-thinking.js --verify');
console.log('To restore original behavior: node patch-thinking.js --restore');
process.exit(0);
