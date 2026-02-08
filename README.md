# Claude Code Patches

> **Fork Note:** This is a fork of [aleks-apostle/claude-code-patches](https://github.com/aleks-apostle/claude-code-patches).

Enhance Claude Code with custom patches for thinking display and subagent model configuration.

## ⚠️ Important: Binary Installations Not Supported

**Starting with Claude Code v2.1.19**, Anthropic switched from npm-based JavaScript to **Bun-compiled signed binaries**. These patches **only work with npm installations** (`cli.js` files).

On macOS, binary modifications are blocked by code signing - any change invalidates the signature, causing the process to be killed. This is a fundamental limitation that cannot be worked around.

**Supported:**
- ✅ npm installations (`npm install -g @anthropic-ai/claude-code`) with `cli.js`
- ❌ Binary installations (`claude install`) - Not supported

If you have a binary installation, consider requesting these features officially from Anthropic: https://github.com/anthropics/claude-code/issues

---

## Available Patches

1. **[Thinking Display Patch](#thinking-display-patch)** - Make thinking blocks visible by default
2. **[Subagent Model Configuration](#subagent-model-configuration)** - Configure which models subagents use

---

## Thinking Display Patch

Make Claude Code's thinking blocks visible by default without pressing `ctrl+o`.

## The Problem

Claude Code collapses thinking blocks by default, showing only:
```
∴ Thought for 3s (ctrl+o to show thinking)
```

You have to press `ctrl+o` every time to see the actual thinking content. This patch makes thinking blocks visible inline automatically.

**Current Version:** Claude Code 2.1.32 (Updated 2026-02-07)

## Quick Start

```bash
# Clone or download this repository
cd claude-code-patches

# Run the patch script (automatically detects your installation)
node patch-thinking.js

# Restart Claude Code
```

That's it! Thinking blocks now display inline without `ctrl+o`.

**Works with:**
- ✅ Local installations (`~/.claude/local`)
- ✅ Global npm installations (`npm install -g @anthropic-ai/claude-code`)
- ✅ All Node version managers (NVM, nodenv, asdf, etc.)

## What This Patch Does

**Before:**
```
∴ Thought for 3s (ctrl+o to show thinking)
[thinking content hidden]
```

**After:**
```
∴ Thinking…

  [thinking content displayed inline in dim/light color]
  The actual thinking process is now visible
  without any keyboard shortcuts needed
```

The patch applies two changes:
1. **Visibility**: Forces thinking content to always display (no need to press ctrl+o)
2. **Dim color**: Renders thinking as plain dimmed text instead of syntax-highlighted markdown, making it visually distinct from regular output

## How It Works

This patch modifies two locations in Claude Code's compiled JavaScript:

### How the Patch Works
**Before:**
```javascript
case"thinking":if(!K&&!Z)return null;
  return H7.createElement(T32,{addMargin:Q,param:A,isTranscriptMode:K,verbose:Z});
```

**After:**
```javascript
case"thinking":
  return H7.createElement(T32,{addMargin:Q,param:A,isTranscriptMode:!0,verbose:Z});
```

**Effect:** Forces thinking content to render as if in transcript mode (visible).

See [docs/version-history.md](docs/version-history.md) for the full version history of component and variable names.

## Installation

### Prerequisites
- Claude Code v2.1.32 installed
- Node.js (comes with Claude Code installation)

### Install Steps

1. **Download the patcher:**
   ```bash
   # Clone this repository
   git clone <repository-url>
   cd claude-code-patches
   ```

2. **Run the patcher:**
   ```bash
   node patch-thinking.js
   ```

3. **Restart Claude Code** for changes to take effect.

## Command-Line Options

The script supports several options:

```bash
# Apply patches (default)
node patch-thinking.js

# Preview changes without applying
node patch-thinking.js --dry-run

# Restore original behavior from backup
node patch-thinking.js --restore

# Show help
node patch-thinking.js --help
```

## Installation Detection

The script **automatically detects** Claude Code installations using a robust 4-tier detection strategy:

### Detection Methods (Priority Order)

1. **Local Installations** (Priority 1)
   - `~/.claude/local/node_modules/@anthropic-ai/claude-code/cli.js`
   - `~/.config/claude/local/node_modules/@anthropic-ai/claude-code/cli.js`

2. **Global npm Installation** (Priority 2)
   - Dynamically detected via `npm root -g`
   - Works with **all Node version managers** (NVM, nodenv, asdf, nvm-windows)
   - Automatically resolves symlinks

3. **Derived from Node.js Binary** (Priority 3)
   - Falls back to `process.execPath` derivation
   - Works when npm command is unavailable

4. **Unix Binary Location** (Priority 4)
   - Uses `which claude` on macOS/Linux
   - Traces binary back to installation directory

### Key Features

- ✅ **Works with any Node version** - No hardcoded paths
- ✅ **Supports all version managers** - NVM, nodenv, asdf, etc.
- ✅ **Cross-platform** - macOS, Linux, Windows
- ✅ **Automatic symlink resolution** - Handles npm global symlinks
- ✅ **Comprehensive error messages** - Shows all attempted paths

**Backup Created:**
- `cli.js.backup` (in the same directory as cli.js)

## Important: After Claude Code Updates

When you run `claude update`, the patches will be **overwritten**. You must re-apply them:

```bash
cd claude-code-patches
node patch-thinking.js
# Restart Claude Code
```

The patch script automatically:
- Detects your Claude Code installation
- Creates a backup before patching (if it doesn't exist)
- Applies both patches atomically
- Reports success or failure
- Safe to run multiple times

## Rollback

To restore the original behavior:

**Option 1: Using the script**
```bash
node patch-thinking.js --restore
```

**Option 2: Manual restore**
```bash
# The backup is created in the same directory as cli.js
cp ~/.claude/local/node_modules/@anthropic-ai/claude-code/cli.js.backup \
   ~/.claude/local/node_modules/@anthropic-ai/claude-code/cli.js
```

Then restart Claude Code.

## Verification

Check if patches are applied (for v2.1.32):

```bash
# Check thinking visibility patch
grep -n 'isTranscriptMode:!0,hideInTranscript:!1' ~/.claude/local/node_modules/@anthropic-ai/claude-code/cli.js

# Should show a match in the thinking case block
```

**Note:** In v2.1.32, there is only one patch needed. The separate banner function has been removed since v2.0.75.

## Troubleshooting

### "Could not find Claude Code installation"

**Cause:** The script cannot locate your Claude Code installation.

The script will display all attempted detection methods and paths, for example:

```
❌ Error: Could not find Claude Code installation

Searched using the following methods:

  [local installation]
    - ~/.claude/local/node_modules/@anthropic-ai/claude-code/cli.js
    - ~/.config/claude/local/node_modules/@anthropic-ai/claude-code/cli.js
  [npm root -g]
    - /opt/homebrew/lib/node_modules/@anthropic-ai/claude-code/cli.js
  [derived from process.execPath]
    - /opt/homebrew/bin/../lib/node_modules/@anthropic-ai/claude-code/cli.js
  [which claude]
    - /opt/homebrew/bin/../lib/node_modules/@anthropic-ai/claude-code/cli.js

💡 Troubleshooting:
  1. Verify Claude Code is installed: claude --version
  2. For local install: Check ~/.claude/local or ~/.config/claude/local
  3. For global install: Ensure "npm install -g @anthropic-ai/claude-code" succeeded
  4. Check that npm is in your PATH if using global install
```

**Solutions:**
1. **Verify installation:** Run `claude --version` to confirm Claude Code is installed
2. **For local installations:** Check that cli.js exists in `~/.claude/local` or `~/.config/claude/local`
3. **For global installations:**
   - Ensure `npm install -g @anthropic-ai/claude-code` completed successfully
   - Verify npm is in your PATH: `npm --version`
   - If using NVM: Ensure you've activated the correct Node version
4. **Check file permissions:** Ensure the script has read access to the installation directory

### "Pattern not found"

**Cause:** This means:
1. Claude Code has been updated to a newer version
2. The patches are already applied
3. The file structure has changed

**Solution:**
1. Run `node patch-thinking.js --dry-run` to check status
2. If already applied, you're good!
3. If version changed, the patterns may need updating for the new version

### Thinking Still Collapsed After Patching

**Solution:** You must restart Claude Code for changes to take effect.

### Backup File Missing

The patch script creates a backup automatically on first run. The `--restore` command will fail if the backup doesn't exist.

## Cross-Platform Support

The script works on:
- **macOS** ✅ Full support (all 4 detection methods)
- **Linux** ✅ Full support (all 4 detection methods)
- **Windows** ✅ Supported (3 detection methods - excludes `which claude`)

### Platform-Specific Notes

**macOS & Linux:**
- All 4 detection methods available
- Includes `which claude` binary resolution
- Automatic symlink resolution for Homebrew, NVM, etc.

**Windows:**
- Uses first 3 detection methods
- Works with nvm-windows and system Node
- Skips Unix-specific `which` command

Path detection is fully automatic using Node.js built-in modules.

### Version Manager Support

The script automatically works with all Node.js version managers:

| Version Manager | Support | Notes |
|----------------|---------|-------|
| **NVM** (Node Version Manager) | ✅ Full | Detects via `npm root -g` |
| **nodenv** | ✅ Full | Detects via `process.execPath` |
| **asdf** | ✅ Full | Detects via `npm root -g` |
| **nvm-windows** | ✅ Full | Works with all 3 Windows methods |
| **System Node** | ✅ Full | Standard installation detection |
| **Homebrew** (macOS) | ✅ Full | Symlink resolution included |

**How it works:**
- `npm root -g` dynamically finds the global node_modules directory regardless of version manager
- `process.execPath` derives the path from the current Node.js binary location
- No hardcoded paths means it works with any Node setup

## Technical Details

### File Structure
- **cli.js:** ~3,600+ lines, ~9+ MB (heavily minified)
- **Version:** See "Current Version" above
- **Patches:** Non-invasive, minimal changes

### Installation Detection System

The patcher uses a sophisticated detection system with multiple fallback methods:

```javascript
// Priority 1: Local installations
~/.claude/local/node_modules/@anthropic-ai/claude-code/cli.js
~/.config/claude/local/node_modules/@anthropic-ai/claude-code/cli.js

// Priority 2: Global npm (dynamic)
$(npm root -g)/@anthropic-ai/claude-code/cli.js

// Priority 3: Derived from Node binary
$(dirname process.execPath)/../lib/node_modules/@anthropic-ai/claude-code/cli.js

// Priority 4: Unix binary resolution
$(which claude) → resolve symlinks → find cli.js
```

**Key implementation details:**
- Uses `child_process.execSync()` with proper error handling
- Automatically resolves symlinks via `fs.realpathSync()`
- Tracks all attempted paths for detailed error reporting
- Cross-platform compatible (Windows, macOS, Linux)

### Pattern Evolution

When Claude Code updates, function names and component identifiers are regenerated during minification. See [docs/version-history.md](docs/version-history.md) for the complete pattern evolution table.

## Limitations

1. **Breaks on updates:** Must re-run after `claude update`
2. **Minified code:** Fragile, patterns may change with version updates
3. **No official config:** This is a workaround until Anthropic adds a native setting
4. **Version-specific:** Patterns must match the installed Claude Code version

## Feature Request

Consider requesting this as an official feature from Anthropic:
- Configuration option to always show thinking
- User preference in settings (`~/.claude/config.json`)
- Toggle command like `/thinking show` or `/thinking hide`
- Environment variable like `CLAUDE_SHOW_THINKING=true`

Submit feedback: https://github.com/anthropics/claude-code/issues

## Contributing

If Claude Code updates and the patches stop working:

1. **Locate the new patterns** in cli.js:
   - Search for the thinking banner function (look for "Thought for" text)
   - Search for `case"thinking"` to find the visibility check

2. **Update the script** with new patterns

3. **Test thoroughly** before committing

4. **Update this README** with the new version information

Pull requests welcome!

### Update Guide

See [CLAUDE.md](CLAUDE.md) for instructions on updating the patches for new Claude Code versions.

---

## Subagent Model Configuration

Configure which AI models Claude Code uses for different subagent types (Plan, Explore, general-purpose).

### The Problem

By default, Claude Code hardcodes the models used by subagents:
- **Plan subagent**: Uses Sonnet (for planning tasks)
- **Explore subagent**: Uses Haiku (for code exploration)
- **general-purpose subagent**: Inherits from main loop model

You cannot change these defaults without modifying the source code.

### The Solution

This patch allows you to configure subagent models via a configuration file (`~/.claude/subagent-models.json`).

### Quick Start

```bash
# 1. Create configuration file
cat > ~/.claude/subagent-models.json <<EOF
{
  "Plan": "sonnet",
  "Explore": "sonnet",
  "general-purpose": "sonnet"
}
EOF

# 2. Run the patch script
node patch-subagent-models.js

# 3. Restart Claude Code
```

### Configuration

Create `~/.claude/subagent-models.json` with your preferred models:

```json
{
  "Plan": "sonnet",
  "Explore": "haiku",
  "general-purpose": "sonnet"
}
```

**Valid model values:**
- `"haiku"` - Fast and efficient (Claude Haiku 4.5)
- `"sonnet"` - Balanced performance (Claude Sonnet 4.5)
- `"opus"` - Most capable (Claude Opus 4.1)

**Subagent Types:**
- **Plan** - Used in planning mode for breaking down tasks
- **Explore** - Used for codebase exploration and file searching
- **general-purpose** - Used for general multi-step tasks

### Command-Line Options

```bash
# Apply patches
node patch-subagent-models.js

# Preview changes without applying
node patch-subagent-models.js --dry-run

# Restore original behavior
node patch-subagent-models.js --restore

# Show help
node patch-subagent-models.js --help
```

### How It Works

The patch modifies Claude Code's `cli.js` to change the hardcoded model assignments:

**Before:**
```javascript
// Plan subagent
R3A={agentType:"Plan",...,model:"sonnet"}

// Explore subagent
model:"haiku"}});var R3A;
```

**After (with config: Plan="haiku", Explore="sonnet"):**
```javascript
// Plan subagent
R3A={agentType:"Plan",...,model:"haiku"}

// Explore subagent
model:"sonnet"}});var R3A;
```

### Important Notes

1. **After Claude Code Updates:** Must re-run after `claude update`:
   ```bash
   node patch-subagent-models.js
   ```

2. **Backup:** Created automatically at:
   ```
   ~/.claude/local/node_modules/@anthropic-ai/claude-code/cli.js.subagent-models.backup
   ```

3. **Version-Specific:** Patterns are version-specific. May need updates for newer Claude Code versions.

### Restoration

**Using the script:**
```bash
node patch-subagent-models.js --restore
```

**Manual restore:**
```bash
cp ~/.claude/local/node_modules/@anthropic-ai/claude-code/cli.js.subagent-models.backup \
   ~/.claude/local/node_modules/@anthropic-ai/claude-code/cli.js
```

### Example Use Cases

**Use Sonnet everywhere (avoid Haiku):**
```json
{
  "Plan": "sonnet",
  "Explore": "sonnet",
  "general-purpose": "sonnet"
}
```

**Use Haiku for speed:**
```json
{
  "Plan": "haiku",
  "Explore": "haiku",
  "general-purpose": "haiku"
}
```

**Balanced approach:**
```json
{
  "Plan": "sonnet",
  "Explore": "haiku",
  "general-purpose": "sonnet"
}
```

### Troubleshooting

**"No model configuration found"**
- Create `~/.claude/subagent-models.json` with your desired configuration
- Ensure the JSON syntax is valid

**"Pattern not found"**
- Claude Code version may have changed
- Run with `--dry-run` to see which patterns are detected
- Check if patches are already applied

**Changes not taking effect**
- Restart Claude Code after applying patches
- Verify patches were applied with `--dry-run`

### Version History

See [docs/version-history.md](docs/version-history.md) for subagent defaults by version.

---

## License

This patch is provided as-is for educational purposes. Use at your own risk.

## Credits

Developed through analysis of Claude Code's compiled JavaScript. Special thanks to the community for identifying the thinking display issue.

---

**Last Updated:** 2026-02-07
**Status:** Working

