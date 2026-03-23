# Claude Code Patches - Development Guide

This project provides binary patches for the native Claude Code installation:

1. **Thinking Display** (`patch-thinking.js`) — Makes thinking blocks visible by default (no need to press ctrl+o).
2. **Channels** (`patch-channels.js`) — Enables Claude Code channels by bypassing the `tengu_harbor` GrowthBook feature flag.

The subagent model configuration patch is no longer available — the native binary format prevents changing model name strings (different lengths corrupt precomputed Bun metadata).

## Native Binary Architecture

Claude Code's native binary is a Bun-compiled Mach-O executable containing embedded JavaScript. The binary has two copies of the JS code. Key constraints:

- **Same byte length required**: Replacements must be exactly the same number of bytes as the original
- **No string length changes**: Bun precomputes string metadata; changing string value lengths corrupts the binary
- **Spaces as padding**: JS whitespace between tokens absorbs length differences from variable name changes
- **Ad-hoc re-signing**: After patching, `codesign -fs -` creates a valid ad-hoc signature (macOS)
- **Both copies must be patched**: The binary contains 2 copies of the JS; Buffer.indexOf finds both

## Updating the Thinking Patch for New Versions

The thinking patch uses dynamic regex matching, so it should work across version updates without modification as long as the thinking block structure remains the same. If the structure changes:

### Step 1: Check Claude Code Version

```bash
claude --version
```

### Step 2: Find the Binary

```bash
ls ~/.local/share/claude/versions/
# Or: readlink $(which claude)
```

### Step 3: Find the Thinking Pattern

```bash
strings ~/.local/share/claude/versions/<version> | grep 'case"thinking":{if(!' | head -2
```

The pattern structure:
```
case"thinking":{if(!<VAR1>&&!<VAR2>)return null;let <VAR3>=<hideInTranscript_calc>,<VAR4>;if(<cache_check>)<VAR4>=<NS>.createElement(<COMP>,{addMargin:<Y>,param:<K>,isTranscriptMode:<VAR1>,verbose:<VAR2>,hideInTranscript:<VAR3>}),<cache_updates>;else <VAR4>=<cached>;return <VAR4>}
```

### Step 4: Test

```bash
node patch-thinking.js --dry-run
```

Should show "Pattern found - ready to apply" with the detected variable names.

### Step 5: Update Files

1. **patch-thinking.js** - Update `VERSION` constant
2. **README.md** - Update "Current Version" line
3. **docs/version-history.md** - Add new version entry

## Pattern Reference

### Part 1: Settings — Thinking Content (since v2.1.72)

Claude Code sends a `redact-thinking-2026-02-12` beta flag to the API by default. This causes the API to return thinking blocks with empty text and only cryptographic signatures. The condition for adding the beta:

```
if(hasThinking && modelSupportsIt && !printMode && settings.showThinkingSummaries !== true && featureFlag("tengu_quiet_hollow"))
  betas.push("redact-thinking-2026-02-12");
```

Setting `showThinkingSummaries: true` in `~/.claude/settings.json` prevents the beta from being sent, allowing the API to return actual thinking content. This setting persists across Claude Code updates.

### Part 2: Binary Patch — Thinking Display

The banner function ("Thought for Xs") was removed in v2.0.75 — only the thinking case block patch is needed. The `verbose` prop is still present as of v2.1.72.

The patch:
- Removes `if(!<VAR1>&&!<VAR2>)return null;` (the null return check)
- Simplifies `let <VAR3>=<complex_calc>` to `let <VAR3>=!1` (hideInTranscript = false)
- Changes `isTranscriptMode:<VAR1>` to `isTranscriptMode:!0` (always true)
- Changes `verbose:<VAR2>` to `verbose:!0` (always true)
- Changes `hideInTranscript:<VAR3>` to `hideInTranscript:!1` (always false)
- Updates cache comparisons and assignments to use literal `!0`/`!1`
- Pads removed bytes with spaces (valid JS whitespace) to maintain byte length

## Channels Patch

The channels patch (`patch-channels.js`) is simpler than the thinking patch — it targets a single static function rather than using dynamic regex matching:

- **Target**: `function Po_(){return lT("tengu_harbor",!1)}` — the GrowthBook feature flag check for channels
- **Replacement**: `function Po_(){return                    !0}` — always returns `true`
- **Note**: The function name `Po_` is minified and may change across versions. If the patch stops finding the pattern after an update, search with `strings <binary> | grep "tengu_harbor"` and update the pattern accordingly.
- **Backup**: Uses a separate backup file (`*.backup-channels`) so it does not conflict with the thinking patch backup.

## Quick Update Checklist

| File | What to Update |
|------|----------------|
| `patch-thinking.js` | `VERSION` constant |
| `patch-channels.js` | Pattern string if function name changes after minification |
| `README.md` | Current Version, Last Updated |
| `docs/version-history.md` | Add new version row to tables |

## Key Constraints

1. **Same byte length is critical** — Binary patching requires exact byte length; use space padding between JS tokens
2. **No string literal length changes** — Bun precomputes string metadata; changing lengths corrupts the runtime
3. **Two JS copies** — The binary embeds the JS twice; `Buffer.indexOf` in a loop finds both
4. **Ad-hoc signing is sufficient** — `codesign -fs -` works on macOS; no System Settings changes needed
5. **Dynamic regex matching** — The patcher extracts variable names dynamically, so it survives minifier renames across versions
