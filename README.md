# Claude Code Thinking Display Patch

**macOS only. For native binary installations only (not npm).**

> Fork of [aleks-apostle/claude-code-patches](https://github.com/aleks-apostle/claude-code-patches).

**Last tested with:** Claude Code 2.1.87

## The Problem

When Claude Code processes your requests, it goes through a thinking phase where it reasons about the problem, considers approaches, and makes decisions. By default, this thinking is completely hidden — you only see the final output.

Making thinking visible is valuable because it is:
- **Educational** — You can understand Claude's decision-making process, which the normal concise output doesn't explain
- **Enables early problem detection** — If Claude is missing context or heading in the wrong direction, you can catch it during thinking rather than after it's already acted

This patch makes thinking blocks visible inline automatically:

```
∴ Thinking…

  The user wants to refactor the authentication module.
  Looking at the current structure, the session handling
  is tightly coupled to the database layer. I should
  suggest extracting an interface first...
```

**Note:** This is not the same as "verbose" mode. Claude always thinks — the thinking happens regardless of whether you can see it. This patch simply makes that existing thinking visible to you. It does not cause additional token usage or change Claude's behavior in any way.

## Quick Start

```bash
cd claude-code-patches

# Apply the patch (detects binary, configures settings, patches, and re-signs)
node patch-thinking.js

# Restart Claude Code
```

## How It Works

The patch has two parts:

### 1. Settings: Disable thinking redaction

Claude Code sends a `redact-thinking` beta flag to the API by default, which causes the API to return thinking blocks with empty text (only cryptographic signatures). The patcher sets `showThinkingSummaries: true` in `~/.claude/settings.json`, which prevents this beta flag from being sent. This allows the API to return actual thinking content.

### 2. Binary patch: Force thinking blocks visible

The native Claude Code binary is a Bun-compiled Mach-O executable containing embedded JavaScript. The patcher:

1. Finds the active binary (via `which claude` symlink, falling back to the versions directory)
2. Creates a backup of the original binary (on first run)
3. Dynamically extracts variable names via regex (survives minifier renames across versions)
4. Replaces the thinking render pattern in-place with same-byte-length modifications
5. Re-signs the binary with an ad-hoc code signature (`codesign -fs -`)

## Command-Line Options

```bash
node patch-thinking.js              # Apply patch
node patch-thinking.js --dry-run    # Preview without applying
node patch-thinking.js --verify     # Check patch and settings status
node patch-thinking.js --restore    # Restore from backup
node patch-thinking.js --help       # Show help
```

## After Claude Code Updates

When Claude Code auto-updates, the binary patch is overwritten. Re-apply:

```bash
node patch-thinking.js
```

The `showThinkingSummaries` setting persists across updates — only the binary patch needs to be re-applied.

The patch uses dynamic regex matching to extract variable names, so it works across Claude Code versions even when the minifier renames variables. This repo is only updated when the underlying code structure changes and a new patch is needed.

## Rollback

```bash
node patch-thinking.js --restore
```

To also remove the settings change, edit `~/.claude/settings.json` and remove `"showThinkingSummaries": true`.

## Version History

See [docs/version-history.md](docs/version-history.md) for the pattern evolution table across versions. See [CLAUDE.md](CLAUDE.md) for the development/update guide.

## Previously: Subagent Model Configuration

This project previously included a patch to configure which models subagents use. That patch was removed because the native binary format prevents changing string value lengths (Bun precomputes string metadata, and all model names differ in length).

---

**Last Updated:** 2026-03-31
