# Version History

This document contains detailed version-by-version changes for the thinking display patch.

## Thinking Visibility Component History

The thinking visibility component controls whether thinking content is displayed.

| Version | Component | React Variable | Condition Variables | Notes |
|---------|-----------|----------------|---------------------|-------|
| 2.0.9   | `S2B`     | - | - | Initial |
| 2.0.10  | `DOB`     | - | `H` | |
| 2.0.11  | `SOB`     | - | `z` | |
| 2.0.13  | `xlB`     | - | `K`, `D` | |
| 2.0.14  | `dlB`     | - | `K`, `D` | |
| 2.0.15  | `FpB`     | `z3`→`C3` | `K`, `D` | |
| 2.0.19  | `NoB`     | `C3`→`B7` | `K`, `D` | |
| 2.0.21  | `H8Q`     | `B7`→`G7` | `K`, `D` | |
| 2.0.22  | `nNB`     | `G7`→`e3` | `K`, `D` | |
| 2.0.24  | `nTB`     | `e3`→`Y7` | `K`, `D` | |
| 2.0.25  | `aTB`     | `Y7` | `K`, `D` | |
| 2.0.26  | `CTQ`     | `Y7`→`Y3` | `V` | Single variable check |
| 2.0.28  | `LTQ`     | `Y3`→`C3` | `V` | |
| 2.0.29  | `LTQ`     | `C3` | `V` | Unchanged from 2.0.28 |
| 2.0.30  | `sjQ`     | `C3`→`D3` | `V`, `I` | Added `verbose` parameter |
| 2.0.31  | `MSQ`     | `D3`→`E3` | `V`, `I` | |
| 2.0.32  | `ljQ`     | `E3`→`F3` | `V`, `I` | |
| 2.0.37  | `n$Q`     | `F3`→`K3` | `V`, `I` | |
| 2.0.42  | `xLQ`     | `K3`→`w3` | `V`, `I` | |
| 2.0.46  | `T32`     | `w3`→`H7` | `K`, `Z` | |
| 2.0.53  | `o09`     | `H7`→`L3` | `K`, `G` | |
| 2.0.55  | `J29`     | `L3`→`y3` | `K`, `G` | |
| 2.0.56  | `b29`     | `y3`→`v3` | `K`, `G` | |
| 2.0.57  | `K49`     | `v3`→`b3` | `K`, `G` | |
| 2.0.58  | `k49`     | `b3` | `K`, `G` | Lowercase k |
| 2.0.59  | `F89`     | `u3` | `K`, `G` | |
| 2.0.61  | `T69`     | `A3` | `F`, `G` | |
| 2.0.62  | `X59`     | `J3` | `F`, `G` | |
| 2.0.75  | `co2`     | `J5` | `D`, `Z` | Banner removed, only patch needed |
| 2.0.76  | `lo2`     | `J5` | `D`, `Z` | |
| 2.1.5   | `dvA`     | `J5` | `F`, `Z` | Added `hideInTranscript`, curly braces |
| 2.1.14  | `zkA`     | `q3` | `F`, `Z` | |
| 2.1.15  | `k_1`     | `g3` | `D`, `H` | Added React memoization caching |
| 2.1.27  | `mX6`     | `s5` | `P`, `H`, `T` | 3 condition variables, added dim color patch |
| 2.1.31  | `_j6`     | `K9` | `j`, `V` | 2 condition variables |
| 2.1.32  | `Cj6`     | `S5` | `j`, `Z` | |
| 2.1.69  | `QS_`     | `Q$` | `P`, `H` | Native binary, dynamic regex matching |
| 2.1.72  | `eyT`     | -    | `w`, `O` | Added settings patch (`showThinkingSummaries`) to disable `redact-thinking` API beta |
| 2.1.74  | `cvT`     | -    | `D`, `O` | Same pattern structure |
| 2.1.101 | `ql_`     | -    | `j`, `$` | Fixed identifier regex to accept `$` |
| 2.1.114 | `Yl_`     | -    | `D`, `$` | Added force-display patch: rewrites `NH=G_?q.display:void 0` → `NH=G_?"summarized":0` so thinking content is no longer omitted by the API on Opus 4.7 |
| 2.1.138 | `B56`     | -    | `D`, `A` | Binary now embeds only one JS copy of the thinking block / force-display expression instead of two. Relaxed the patcher's hardcoded `>= 2` occurrence checks to a dynamic invariant ("no unpatched markers remain"). |
| 2.1.154 | `LeH`     | -    | `M`, `$` | Two changes. (1) Claude Code added a new grouped-message summary component (function `DOK`) that collapses thinking + tool-use sequences into "Thought for Xs, ... (ctrl+o to expand)". Added a third "summary patch" that rewrites `if(<verbose>){...}` inside `DOK` to `if(1){...}`, forcing the full-render branch (which already invokes `LeH` with `isTranscriptMode:!0,verbose:!0`). The existing `case "thinking":` patch is still required for non-grouped assistant messages (rendered via `PN3`). (2) The force-display expression's condition changed from a single identifier (`G_?q.display:void 0`) to a compound expression (`IH&&SR()&&NA_(Y)?q.display:void 0`); relaxed the patcher regex to accept arbitrary chars between `=` and `?` so the compound condition is captured and preserved. Also hardened the "already applied (skipping)" branch to fail loud when neither the patched nor unpatched marker is present (previously a silently-skipped force-display patch made the regression invisible). |
| 2.1.158 | `neH`     | -    | `M`, `$` | No structural change to the three existing patches (the thinking component renamed `LeH`→`neH`, but dynamic regex matching absorbed it). Added a fourth "tool-output patch" so expanded thinking no longer drags in full tool output. The grouped tool renderer (`dN3`, reached only via the force-expanded `DOK` branch) hardcodes `renderToolResultMessage?.(…,{verbose:!0,…})` — the binary's only such call. The patcher flips that `verbose:!0` → `verbose:!1` (same byte length), so tool **results** render truncated while thinking and the separately-rendered tool-call header (`renderToolUseMessage`, left untouched) stay visible. Note: the `DOK` verbose gate is all-or-nothing per group, so a purely-tool-use run still expands to per-tool headers instead of the one-line "Ran N tools" summary; only the output *volume* is reduced. |
| 2.1.168 | `rk6`     | -    | `f`, `$` | The `hideInTranscript` prop was removed entirely from the thinking `createElement` call (the binary no longer contains the string `hideInTranscript:` at all). Updated block-verification check to no longer require it, made var3/hideInTranscript extraction optional throughout the patcher, and updated `patchedCount` / post-patch verification to infer "patched" from the absence of unpatched blocks when `hideInTranscript` is absent. The other three patches (summary, force-display, tool-output) were unaffected. |
| 2.1.186 | `u3n`     | -    | `m`, `i` | Claude Code switched the thinking component from the classic `React.createElement(...)` call to the JSX runtime transform (`ME.jsx(u3n,{addMargin:r,param:n,isTranscriptMode:m,verbose:i})`). The block structure (null check, cache check, props, cache updates) is otherwise unchanged, so only the display patch's block-detection check needed updating to accept `.jsx(` in addition to `createElement` (`isTranscriptMode:` alone uniquely identifies the block). All variable extraction and same-length replacement logic worked as-is. The other three patches (summary, force-display, tool-output) matched unchanged via dynamic regex. |

---

When Claude Code updates, component and variable names are regenerated during minification. Since v2.1.69, the patcher uses dynamic regex matching to extract variable names automatically.
