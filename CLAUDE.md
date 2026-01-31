# Claude Code Patches - Development Guide

This project provides patches for Claude Code to:
1. **Thinking Display Patch** - Make thinking blocks visible by default (no need to press ctrl+o)
2. **Subagent Model Configuration** - Configure which models subagents use

## Updating Patches for New Claude Code Versions

When Claude Code updates, the patches need to be updated because the minified JavaScript has different variable names and component identifiers.

### Step 1: Check Claude Code Version

```bash
claude --version
```

### Step 2: Find the cli.js File

```bash
npm root -g
# cli.js is at: <path>/@anthropic-ai/claude-code/cli.js
```

### Step 3: Find the New Thinking Visibility Pattern

```bash
grep 'case"thinking"' $(npm root -g)/@anthropic-ai/claude-code/cli.js | head -2
```

Extract from the output:
- **React variable:** The part before `.createElement` (e.g., `q3`)
- **Component name:** First argument to createElement (e.g., `zkA`)
- **Condition variables:** In the if-check (e.g., `F` and `Z`)
- **Additional properties:** Any new props like `hideInTranscript`

### Step 4: Find Subagent Patterns

```bash
# Find Plan agent definition
grep -E 'agentType:"Plan"' $(npm root -g)/@anthropic-ai/claude-code/cli.js | head -1 | fold -w 100

# Find Explore agent definition
grep -E 'agentType:"Explore"' $(npm root -g)/@anthropic-ai/claude-code/cli.js | head -1 | fold -w 100
```

### Step 5: Update Files

1. **patch-thinking.js** - Update search/replace patterns (around lines 183-184)
2. **patch-subagent-models.js** - Update comments for variable names (if needed)
3. **README.md** - Update "Current Version" line (line 27)
4. **docs/version-history.md** - Add new version entry

### Step 6: Test

```bash
node patch-thinking.js --dry-run
node patch-subagent-models.js --dry-run
```

Should show "Pattern found - ready to apply"

## Pattern Reference

### Thinking Visibility Pattern

The key pattern structure (note: has curly braces since v2.1.5, and React memoization caching since v2.1.15):
```
case"thinking":{if(!<VAR1>&&!<VAR2>&&!<VAR3>)return null;let <LOCAL>=<hideInTranscript_calc>,<RESULT>;if(<cache_check>)<RESULT>=<NAMESPACE>.createElement(<COMPONENT>,{addMargin:<Y>,param:<K>,isTranscriptMode:<VAR1>,verbose:<VAR2>,hideInTranscript:<LOCAL>}),<cache_updates>;else <RESULT>=<cached>;return <RESULT>}
```

Replace with:
```
case"thinking":{let <LOCAL>=!1,<RESULT>;if(<cache_check_with_!0_!1>)<RESULT>=<NAMESPACE>.createElement(<COMPONENT>,{addMargin:<Y>,param:<K>,isTranscriptMode:!0,verbose:<VAR2>,hideInTranscript:!1}),<cache_updates>;else <RESULT>=<cached>;return <RESULT>}
```

The patch:
- Removes the `if(!<VAR1>&&!<VAR2>&&!<VAR3>)return null;` check
- Changes `isTranscriptMode:<VAR1>` to `isTranscriptMode:!0` (always true)
- Sets `hideInTranscript` to `!1` (false)
- Updates cache comparison to use `!0` and `!1` for consistent caching

### Subagent Patterns

The patch uses regex-based matching for robustness:
- Match `agentType:"<TYPE>",[^}]*model:"<MODEL>"`
- Replace only the `model:"<MODEL>"` portion

## Quick Update Checklist

| File | What to Update |
|------|----------------|
| `patch-thinking.js` | Version strings (2 places), search pattern, replacement pattern |
| `patch-subagent-models.js` | Version strings (2 places), comments for variable names |
| `README.md` | Current Version (line 27), Last Updated (footer) |
| `docs/version-history.md` | Add new version row to tables |

## Lessons Learned

1. **Structural changes to case statements** - Check for added braces or semicolons between versions
2. **New properties may be added** - Identify what they control and set appropriately for always-visible behavior
3. **Variable name changes are common** - The minifier regenerates these names with each build
4. **Use broader grep patterns first** - Then refine based on findings
5. **Banner function removed in v2.0.75** - Only one patch needed since then
