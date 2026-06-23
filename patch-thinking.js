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

const VERSION = '2.1.186';

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

  // PRIORITY 1: Resolve from 'which claude' symlink (most reliable — this is what's actually running)
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

  // PRIORITY 2: Native binary installation (fallback — picks latest version in versions dir)
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

// JS identifiers can include $ and _, which \w does not match
const IDENT = '[A-Za-z_$][\\w$]*';

// Check patch status
const patchedMarker = 'isTranscriptMode:!0,verbose:!0,hideInTranscript:!1';
// Since v2.1.168 hideInTranscript was removed from the thinking createElement props entirely.
// For binaries without it, "patched" is inferred from the absence of unpatched blocks.
const unpatchedDisplayCount = countOccurrences(dataStr, 'case"thinking":{if(!');
const hasHideInTranscript = dataStr.includes('hideInTranscript:');
const patchedCount = hasHideInTranscript
  ? countOccurrences(dataStr, patchedMarker)
  : (unpatchedDisplayCount === 0 ? 1 : 0);

// Force-display patch status
const forceDisplayMarker = '?"summarized":0';
const forceDisplayCount = countOccurrences(dataStr, forceDisplayMarker);
// Count unpatched force-display occurrences (VAR=<condition>?VAR.display:void 0).
// In v2.1.154 the condition expanded from a single identifier to a compound expression
// (e.g. `IH&&SR()&&NA_(Y)`), so we accept any non-statement-separator chars between `=` and `?`.
const unpatchedForceDisplayCount = (() => {
  const re = new RegExp(`[A-Za-z_$][\\w$]*=[^,;]+?\\?[A-Za-z_$][\\w$]*\\.display:void 0`, 'g');
  return (dataStr.match(re) || []).length;
})();

// Summary patch status (introduced in v2.1.154) — forces the grouped agent-summary
// component to always render its verbose branch, eliminating "Thought for Xs (ctrl+o to expand)".
// The component's signature is stable: {message:_,inProgressToolUseIDs:_,shouldAnimate:_,verbose:_,
// tools:_,lookups:_,isActiveGroup:_}. Inside, `if(<verbose>){let _=[];for(let _ of _)if(_.type==="assistant")...`
// is the verbose-only render branch — we rewrite `if(<verbose>)` to `if(1)` so it's always taken.
const summaryPatchedRegex = new RegExp(
  `if\\(1\\) *\\{let ${IDENT}=\\[\\];for\\(let ${IDENT} of ${IDENT}\\)if\\(${IDENT}\\.type==="assistant"\\)`,
  'g'
);
const summaryUnpatchedRegex = new RegExp(
  `if\\((${IDENT})\\)\\{let ${IDENT}=\\[\\];for\\(let ${IDENT} of ${IDENT}\\)if\\(${IDENT}\\.type==="assistant"\\)`,
  'g'
);
const summaryPatchedCount = (dataStr.match(summaryPatchedRegex) || []).length;
const summaryUnpatchedCount = (dataStr.match(summaryUnpatchedRegex) || []).length;

// Tool-output patch status (since v2.1.158) — decouples tool-result verbosity from thinking
// visibility. Inside dN3 (reached only via the force-expanded DOK grouped branch), the tool RESULT
// is rendered by renderToolResultMessage?.(...,{verbose:!0,...}) — the binary's only such call.
// Flipping that verbose:!0 to verbose:!1 renders tool results in their normal truncated form while
// thinking and the separately-rendered tool-call header stay visible.
const toolOutputUnpatchedRegex = new RegExp(`renderToolResultMessage\\?\\.\\([^)]*?verbose:!0`);
const toolOutputPatchedRegex = new RegExp(`renderToolResultMessage\\?\\.\\([^)]*?verbose:!1`);
const toolOutputUnpatchedCount = (dataStr.match(new RegExp(toolOutputUnpatchedRegex.source, 'g')) || []).length;
const toolOutputPatchedCount = (dataStr.match(new RegExp(toolOutputPatchedRegex.source, 'g')) || []).length;

// --verify mode: report patch status and exit
if (isVerify) {
  console.log('Patch status verification:\n');

  // Settings
  console.log('  Settings (prevents API from redacting thinking content — legacy):');
  console.log(`    showThinkingSummaries: ${settingsResult === 'already_set' ? 'ENABLED' : 'NOT SET — add "showThinkingSummaries": true to ~/.claude/settings.json'}`);

  // Display patch
  console.log('\n  Display patch (forces standalone thinking blocks visible in UI):');
  console.log(`    Patched blocks: ${patchedCount}, Unpatched blocks: ${unpatchedDisplayCount}`);
  console.log(`    Status: ${unpatchedDisplayCount === 0 && patchedCount > 0 ? 'APPLIED' : patchedCount === 0 ? 'NOT APPLIED' : 'PARTIAL'}`);

  // Summary patch
  console.log('\n  Summary patch (expands grouped agent-summary so thinking shows by default):');
  console.log(`    Patched blocks: ${summaryPatchedCount}, Unpatched blocks: ${summaryUnpatchedCount}`);
  console.log(`    Status: ${summaryUnpatchedCount === 0 && summaryPatchedCount > 0 ? 'APPLIED' : summaryPatchedCount === 0 ? 'NOT APPLIED' : 'PARTIAL'}`);

  // Force-display patch
  console.log('\n  Force-display patch (forces thinking.display="summarized" on API requests):');
  console.log(`    Patched blocks: ${forceDisplayCount}, Unpatched blocks: ${unpatchedForceDisplayCount}`);
  console.log(`    Status: ${unpatchedForceDisplayCount === 0 && forceDisplayCount > 0 ? 'APPLIED' : forceDisplayCount === 0 ? 'NOT APPLIED' : 'PARTIAL'}`);

  // Tool-output patch
  console.log('\n  Tool-output patch (truncates tool results so expanded thinking does not pull in full output):');
  console.log(`    Patched blocks: ${toolOutputPatchedCount}, Unpatched blocks: ${toolOutputUnpatchedCount}`);
  console.log(`    Status: ${toolOutputUnpatchedCount === 0 && toolOutputPatchedCount > 0 ? 'APPLIED' : toolOutputPatchedCount === 0 ? 'NOT APPLIED' : 'PARTIAL'}`);

  // Overall
  const displayPatched = unpatchedDisplayCount === 0 && patchedCount > 0;
  const summaryPatched = summaryUnpatchedCount === 0 && summaryPatchedCount > 0;
  const forceDisplayPatched = unpatchedForceDisplayCount === 0 && forceDisplayCount > 0;
  const toolOutputPatched = toolOutputUnpatchedCount === 0 && toolOutputPatchedCount > 0;
  const allGood = displayPatched && summaryPatched && forceDisplayPatched && toolOutputPatched;
  console.log(`\n  Overall: ${allGood ? 'FULLY CONFIGURED' : 'NEEDS ATTENTION'}`);

  if (!allGood) {
    console.log('  Run "node patch-thinking.js" to apply missing patches.');
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

// Check if all patches already applied (no unpatched markers remain)
if (
  unpatchedDisplayCount === 0 && patchedCount > 0 &&
  summaryUnpatchedCount === 0 && summaryPatchedCount > 0 &&
  unpatchedForceDisplayCount === 0 && forceDisplayCount > 0 &&
  toolOutputUnpatchedCount === 0 && toolOutputPatchedCount > 0
) {
  console.log('All patches already applied.\n');
  if (isDryRun) {
    console.log('DRY RUN - No changes needed\n');
  }
  process.exit(0);
}

// --- Display patch: force thinking block visibility in UI ---
let originalPattern = null;
let replacement = null;

if (unpatchedDisplayCount > 0) {
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

    // Verify this is the right block (renders the thinking component with thinking props).
    // Pre-v2.1.186 binaries used React.createElement(...); v2.1.186 switched to the JSX
    // transform (e.g. ME.jsx(...)). isTranscriptMode: is unique to this thinking block,
    // so accept either render mechanism.
    if (block.includes('isTranscriptMode:') && (block.includes('createElement') || block.includes('.jsx('))) {
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
  const nullCheckMatch = originalPattern.match(new RegExp(`if\\(!(${IDENT})&&!(${IDENT})\\)return null`));
  if (!nullCheckMatch) {
    console.error('Error: Could not parse null check variables');
    process.exit(1);
  }
  const var1 = nullCheckMatch[1];
  const var2 = nullCheckMatch[2];

  let var3 = null;
  const hasHideInTranscriptProp = originalPattern.includes('hideInTranscript:');
  if (hasHideInTranscriptProp) {
    const hideVarMatch = originalPattern.match(new RegExp(`;let (${IDENT})=`));
    if (!hideVarMatch) {
      console.error('Error: Could not parse hideInTranscript variable');
      process.exit(1);
    }
    var3 = hideVarMatch[1];
  }

  const varMsg = var3 ? `, hideInTranscript=${var3}` : '';
  console.log(`  Variables: isTranscriptMode=${var1}, verbose=${var2}${varMsg}`);

  // Build replacement - same byte length required for binary patching
  replacement = originalPattern;

  const nullCheck = `if(!${var1}&&!${var2})return null;`;
  replacement = replacement.replace(nullCheck, '\x00PADDING_PLACEHOLDER\x00');

  if (var3) {
    const hideCalcRegex = new RegExp(`let ${var3.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=.+?,(?=${IDENT};if)`);
    const hideCalcMatch = replacement.match(hideCalcRegex);
    if (hideCalcMatch) {
      replacement = replacement.replace(hideCalcMatch[0], `let ${var3}=!1,`);
    }
  }

  replacement = replacement.replace(`isTranscriptMode:${var1}`, 'isTranscriptMode:!0');
  replacement = replacement.replace(`verbose:${var2}`, 'verbose:!0');
  if (var3) {
    replacement = replacement.replace(`hideInTranscript:${var3}`, 'hideInTranscript:!1');
  }

  function replaceVar(str, varName, literal) {
    const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    str = str.replace(new RegExp(`!==${escaped}(?=[|)])`, 'g'), `!==${literal}`);
    str = str.replace(new RegExp(`\\]=${escaped}(?=,)`, 'g'), `]=${literal}`);
    return str;
  }
  replacement = replaceVar(replacement, var1, '!0');
  replacement = replaceVar(replacement, var2, '!0');
  if (var3) {
    replacement = replaceVar(replacement, var3, '!1');
  }

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
} else if (patchedCount > 0) {
  console.log('Display patch: already applied (skipping)\n');
} else {
  console.error('Display patch:');
  console.error('  Pattern not found and no patched markers present.');
  console.error('  This usually means the binary structure changed in a newer version.');
  process.exit(1);
}

// --- Summary patch: force grouped agent-summary to always render in verbose mode ---
// In v2.1.154 a new component renders grouped (assistant + tool_use) messages as a single
// summary line ("Thought for Xs, edited N files, ... (ctrl+o to expand)"), hiding the
// thinking content behind transcript mode. The function destructures verbose:<var> and
// uses `if(<verbose>){...full render with LeH (isTranscriptMode:!0,verbose:!0)...}`.
// We rewrite `if(<verbose>)` to `if(1)` so the full-render branch is always taken.
let summaryOriginal = null;
let summaryReplacement = null;

if (summaryUnpatchedCount > 0) {
  const sMatch = dataStr.match(summaryUnpatchedRegex);
  if (!sMatch) {
    console.error('Summary patch:');
    console.error('  Pattern not found - may need update for newer version');
    process.exit(1);
  }
  // The captured verbose variable name
  const captureRegex = new RegExp(
    `if\\((${IDENT})\\)\\{let ${IDENT}=\\[\\];for\\(let ${IDENT} of ${IDENT}\\)if\\(${IDENT}\\.type==="assistant"\\)`
  );
  const cMatch = dataStr.match(captureRegex);
  const verboseVar = cMatch[1];
  summaryOriginal = cMatch[0];

  console.log('Summary patch:');
  console.log('  Pattern found - ready to apply');
  console.log(`  Variable: verbose=${verboseVar}`);

  // Replace `if(<verboseVar>)` with `if(1)` + padding to preserve byte length
  const ifOld = `if(${verboseVar})`;
  const ifNew = `if(1)` + ' '.repeat(verboseVar.length - 1);
  if (ifNew.length !== ifOld.length) {
    console.error(`Error: Summary patch ifNew/ifOld length mismatch (${ifNew.length} vs ${ifOld.length})`);
    process.exit(1);
  }
  summaryReplacement = summaryOriginal.replace(ifOld, ifNew);
  if (summaryReplacement.length !== summaryOriginal.length) {
    console.error(`Error: Summary length mismatch (${summaryReplacement.length} vs ${summaryOriginal.length})`);
    process.exit(1);
  }
  console.log(`  Pattern length: ${summaryOriginal.length} bytes\n`);
} else if (summaryPatchedCount > 0) {
  console.log('Summary patch: already applied (skipping)\n');
} else {
  console.error('Summary patch:');
  console.error('  Pattern not found and no patched markers present.');
  console.error('  This usually means the binary structure changed in a newer version.');
  process.exit(1);
}

// --- Force-display patch: send thinking.display="summarized" on API requests ---
// Opus 4.7+ silently omits thinking content unless display="summarized" is set in the request.
// We rewrite `<var>=<cond>?<cfg>.display:void 0` to `<var>=<cond>?"summarized":0` (with padding).
// In v2.1.154 the <cond> expanded from a single identifier to a compound expression
// (e.g. `IH&&SR()&&NA_(Y)`), so we accept arbitrary chars between `=` and `?`.
let forceDisplayOriginal = null;
let forceDisplayReplacement = null;

if (unpatchedForceDisplayCount > 0) {
  const fdRegex = new RegExp(`(${IDENT})=([^,;]+?)\\?(${IDENT})\\.display:void 0`);
  const fdMatch = dataStr.match(fdRegex);
  if (!fdMatch) {
    console.error('Force-display patch:');
    console.error('  Pattern not found (expected "VAR=<cond>?VAR.display:void 0")');
    console.error('  May need update for newer version.');
    process.exit(1);
  }
  forceDisplayOriginal = fdMatch[0];
  const fdVar1 = fdMatch[1];
  const fdCond = fdMatch[2];
  const fdVar3 = fdMatch[3];

  console.log('Force-display patch:');
  console.log('  Pattern found - ready to apply');
  console.log(`  Variables: result=${fdVar1}, condition=${fdCond}, config=${fdVar3}`);

  const newExpr = `${fdVar1}=${fdCond}?"summarized":0`;
  const pad = forceDisplayOriginal.length - newExpr.length;
  if (pad < 0) {
    console.error(`Error: Force-display replacement too long by ${-pad} bytes`);
    process.exit(1);
  }
  forceDisplayReplacement = newExpr + ' '.repeat(pad);

  if (forceDisplayReplacement.length !== forceDisplayOriginal.length) {
    console.error(`Error: Force-display length mismatch (${forceDisplayReplacement.length} vs ${forceDisplayOriginal.length})`);
    process.exit(1);
  }
  console.log(`  Pattern length: ${forceDisplayOriginal.length} bytes\n`);
} else if (forceDisplayCount > 0) {
  console.log('Force-display patch: already applied (skipping)\n');
} else {
  console.error('Force-display patch:');
  console.error('  Pattern not found and no patched markers present.');
  console.error('  This usually means the binary structure changed in a newer version.');
  process.exit(1);
}

// --- Tool-output patch: truncate tool results in the force-expanded grouped view ---
// dN3 renders each tool result via renderToolResultMessage?.(...,{verbose:!0,...}); this is the
// only such call in the binary and is reached only when the summary patch force-expands DOK.
// Flip verbose:!0 -> verbose:!1 (same byte length) so results render in their normal truncated
// form, decoupling tool-output volume from thinking visibility. The tool-call header
// (renderToolUseMessage, a separate call) is left untouched so the tool name/args still show.
let toolOutputOriginal = null;
let toolOutputReplacement = null;

if (toolOutputUnpatchedCount > 0) {
  const toMatch = dataStr.match(toolOutputUnpatchedRegex);
  if (!toMatch) {
    console.error('Tool-output patch:');
    console.error('  Pattern not found (expected renderToolResultMessage?.(...verbose:!0)');
    console.error('  May need update for newer version.');
    process.exit(1);
  }
  toolOutputOriginal = toMatch[0];
  toolOutputReplacement = toolOutputOriginal.replace(/verbose:!0$/, 'verbose:!1');

  if (toolOutputReplacement === toolOutputOriginal) {
    console.error('Tool-output patch: could not locate trailing verbose:!0 to flip');
    process.exit(1);
  }
  if (toolOutputReplacement.length !== toolOutputOriginal.length) {
    console.error(`Error: Tool-output length mismatch (${toolOutputReplacement.length} vs ${toolOutputOriginal.length})`);
    process.exit(1);
  }

  console.log('Tool-output patch:');
  console.log('  Pattern found - ready to apply');
  console.log(`  Pattern length: ${toolOutputOriginal.length} bytes\n`);
} else if (toolOutputPatchedCount > 0) {
  console.log('Tool-output patch: already applied (skipping)\n');
} else {
  console.error('Tool-output patch:');
  console.error('  Pattern not found and no patched markers present.');
  console.error('  This usually means the binary structure changed in a newer version.');
  process.exit(1);
}

if (isDryRun) {
  console.log('DRY RUN - No changes will be made\n');
  if (originalPattern) {
    console.log('Would apply display patch (standalone thinking block visibility)');
    console.log(`  Pattern: ${originalPattern.substring(0, 60)}...`);
  }
  if (summaryOriginal) {
    console.log('Would apply summary patch (grouped agent-summary auto-expand)');
    console.log(`  Original:    ${summaryOriginal}`);
    console.log(`  Replacement: ${summaryReplacement}`);
  }
  if (forceDisplayOriginal) {
    console.log('Would apply force-display patch (thinking.display="summarized")');
    console.log(`  Original:    ${forceDisplayOriginal}`);
    console.log(`  Replacement: ${forceDisplayReplacement}`);
  }
  if (toolOutputOriginal) {
    console.log('Would apply tool-output patch (truncate tool results in expanded grouped view)');
    console.log(`  Original:    ${toolOutputOriginal}`);
    console.log(`  Replacement: ${toolOutputReplacement}`);
  }
  if (settingsResult === 'needs_update') {
    console.log('Would enable showThinkingSummaries in settings (legacy)');
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

function applyPatch(buf, searchStr, replaceStr, label) {
  const searchBuf = Buffer.from(searchStr, 'utf8');
  const replaceBuf = Buffer.from(replaceStr, 'utf8');
  let count = 0;
  let offset = 0;
  while (true) {
    const idx = buf.indexOf(searchBuf, offset);
    if (idx === -1) break;
    replaceBuf.copy(buf, idx);
    count++;
    offset = idx + searchBuf.length;
  }
  if (count === 0) {
    console.error(`Error: ${label} pattern found in text scan but not in binary search.`);
    process.exit(1);
  }
  console.log(`  Applied to ${count} location(s)`);
  return count;
}

// Apply display patch — force standalone thinking blocks visible
if (originalPattern) {
  console.log('Applying display patch...');
  applyPatch(patched, originalPattern, replacement, 'Display');
  console.log();
}

// Apply summary patch — force grouped agent-summary to render verbose by default
if (summaryOriginal) {
  console.log('Applying summary patch...');
  applyPatch(patched, summaryOriginal, summaryReplacement, 'Summary');
  console.log();
}

// Apply force-display patch — send thinking.display="summarized" to API
if (forceDisplayOriginal) {
  console.log('Applying force-display patch...');
  applyPatch(patched, forceDisplayOriginal, forceDisplayReplacement, 'Force-display');
  console.log();
}

// Apply tool-output patch — truncate tool results in the force-expanded grouped view
if (toolOutputOriginal) {
  console.log('Applying tool-output patch...');
  applyPatch(patched, toolOutputOriginal, toolOutputReplacement, 'Tool-output');
  console.log();
}

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

const remainingUnpatchedDisplay = countOccurrences(verifyStr, 'case"thinking":{if(!');
const verifyDisplayCount = hasHideInTranscript
  ? countOccurrences(verifyStr, patchedMarker)
  : (remainingUnpatchedDisplay === 0 ? 1 : 0);

if (verifyDisplayCount > 0 && remainingUnpatchedDisplay === 0) {
  console.log(`  Display patch: ${verifyDisplayCount} location(s) confirmed`);
} else {
  console.error(`  Display patch verification FAILED: ${verifyDisplayCount} patched, ${remainingUnpatchedDisplay} unpatched`);
  console.error('  Restore from backup and try again.');
  process.exit(1);
}

const verifySummaryPatchedCount = (verifyStr.match(summaryPatchedRegex) || []).length;
const verifySummaryUnpatchedCount = (verifyStr.match(summaryUnpatchedRegex) || []).length;
if (verifySummaryPatchedCount > 0 && verifySummaryUnpatchedCount === 0) {
  console.log(`  Summary patch: ${verifySummaryPatchedCount} location(s) confirmed`);
} else {
  console.error(`  Summary patch verification FAILED: ${verifySummaryPatchedCount} patched, ${verifySummaryUnpatchedCount} unpatched`);
  console.error('  Restore from backup and try again.');
  process.exit(1);
}

const verifyForceDisplayCount = countOccurrences(verifyStr, forceDisplayMarker);
const remainingUnpatchedForceDisplay = (() => {
  const re = new RegExp(`[A-Za-z_$][\\w$]*=[^,;]+?\\?[A-Za-z_$][\\w$]*\\.display:void 0`, 'g');
  return (verifyStr.match(re) || []).length;
})();
if (verifyForceDisplayCount > 0 && remainingUnpatchedForceDisplay === 0) {
  console.log(`  Force-display patch: ${verifyForceDisplayCount} location(s) confirmed`);
} else {
  console.error(`  Force-display patch verification FAILED: ${verifyForceDisplayCount} patched, ${remainingUnpatchedForceDisplay} unpatched`);
  console.error('  Restore from backup and try again.');
  process.exit(1);
}

const verifyToolOutputPatchedCount = (verifyStr.match(new RegExp(toolOutputPatchedRegex.source, 'g')) || []).length;
const verifyToolOutputUnpatchedCount = (verifyStr.match(new RegExp(toolOutputUnpatchedRegex.source, 'g')) || []).length;
if (verifyToolOutputPatchedCount > 0 && verifyToolOutputUnpatchedCount === 0) {
  console.log(`  Tool-output patch: ${verifyToolOutputPatchedCount} location(s) confirmed`);
} else {
  console.error(`  Tool-output patch verification FAILED: ${verifyToolOutputPatchedCount} patched, ${verifyToolOutputUnpatchedCount} unpatched`);
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
