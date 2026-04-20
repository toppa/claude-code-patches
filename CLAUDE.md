# Claude Code Patches - Development Guide

This project provides a patch for the native Claude Code binary to make thinking blocks visible by default (no need to press ctrl+o).

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

### Part 1: Settings — Legacy redact-thinking beta (since v2.1.72)

Older Claude Code versions sent a `redact-thinking-2026-02-12` beta flag to the API by default. This caused the API to return thinking blocks with empty text and only cryptographic signatures. The condition for adding the beta:

```
if(hasThinking && modelSupportsIt && !printMode && settings.showThinkingSummaries !== true)
  betas.push("redact-thinking-2026-02-12");
```

Setting `showThinkingSummaries: true` in `~/.claude/settings.json` prevents the beta from being sent. This is still useful for older models, so the patcher still writes the setting.

### Part 2: Binary Patch — Thinking Display

The banner function ("Thought for Xs") was removed in v2.0.75 — only the thinking case block patch is needed.

The patch:
- Removes `if(!<VAR1>&&!<VAR2>)return null;` (the null return check)
- Simplifies `let <VAR3>=<complex_calc>` to `let <VAR3>=!1` (hideInTranscript = false)
- Changes `isTranscriptMode:<VAR1>` to `isTranscriptMode:!0` (always true)
- Changes `verbose:<VAR2>` to `verbose:!0` (always true)
- Changes `hideInTranscript:<VAR3>` to `hideInTranscript:!1` (always false)
- Updates cache comparisons and assignments to use literal `!0`/`!1`
- Pads removed bytes with spaces (valid JS whitespace) to maintain byte length

### Part 3: Binary Patch — Force `display="summarized"` on API requests (since v2.1.114)

Starting with Opus 4.7 the API silently omits thinking content unless the request body sets `thinking.display: "summarized"`. Claude Code doesn't set this by default; its hidden `--thinking-display` CLI flag is the only in-binary opt-in.

The request-builder contains this expression inside a `let` declaration (variable names vary with minification):

```
NH=G_?q.display:void 0
```

where `G_` is "thinking not disabled" and `q` is the thinking config. The patcher rewrites it to:

```
NH=G_?"summarized":0
```

padded with trailing spaces to preserve the 22-byte length. When thinking is enabled, `NH` becomes `"summarized"` and flows into the `{type:"adaptive",display:NH}` object sent to the API. Claude Code's own code path (`if(gH&&NH)...splice(v0_)`) also splices the legacy redact-thinking beta out of the betas list once `NH` is truthy, so the two API-side redaction paths are covered by a single patch.

This is the first patch in this repo that introduces a new string literal token (`"summarized"`) at a position that didn't previously contain it. The string already appears elsewhere in the JS source (in the Zod schema for thinking config), so Bun's metadata already has an entry for it. Empirically the binary still runs and thinking content is returned.

## Quick Update Checklist

| File | What to Update |
|------|----------------|
| `patch-thinking.js` | `VERSION` constant |
| `README.md` | Current Version, Last Updated |
| `docs/version-history.md` | Add new version row to tables |

## Key Constraints

1. **Same byte length is critical** — Binary patching requires exact byte length; use space padding between JS tokens
2. **No string literal length changes** — Bun precomputes string metadata; changing lengths corrupts the runtime
3. **Two JS copies** — The binary embeds the JS twice; `Buffer.indexOf` in a loop finds both
4. **Ad-hoc signing is sufficient** — `codesign -fs -` works on macOS; no System Settings changes needed
5. **Dynamic regex matching** — The patcher extracts variable names dynamically, so it survives minifier renames across versions
