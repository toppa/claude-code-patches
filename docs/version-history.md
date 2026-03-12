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

---

When Claude Code updates, component and variable names are regenerated during minification. Since v2.1.69, the patcher uses dynamic regex matching to extract variable names automatically.
