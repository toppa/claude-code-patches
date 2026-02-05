# Version History

This document contains detailed version-by-version changes for the Claude Code patches.

## Thinking Display Patch

### Banner Function History (Removed in v2.0.75)

The banner function displayed "Thought for Xs (ctrl+o to show thinking)" and was removed in v2.0.75.

| Version | Function | React Namespace | Notes |
|---------|----------|-----------------|-------|
| 2.0.9   | `Mr2`    | - | Initial |
| 2.0.10  | `br2`    | `PE.createElement` | |
| 2.0.11  | `er2`    | `_E.createElement` | |
| 2.0.13  | `hGB`    | `TL.createElement` | |
| 2.0.14  | `pGB`    | `TL.createElement` | `TX1.useState` |
| 2.0.15  | `KYB`    | `xL.createElement` | `mX1.useState` |
| 2.0.19  | `aFB`    | `ZM.createElement` | `BV1.useState` |
| 2.0.21  | `wVB`    | `XM.createElement` | `DV1.useState` |
| 2.0.22  | `YOB`    | `NM.createElement` | `zK1.useState` |
| 2.0.24  | `GSB`    | `oM.createElement` | `kD1.useState` |
| 2.0.25  | `YSB`    | `tM.createElement` | `xD1.useState` |
| 2.0.26  | `KjQ`    | `QO.createElement` | `gKA.useState` |
| 2.0.28  | `RjQ`    | `IO.createElement` | `iKA.useState` |
| 2.0.29  | `RjQ`    | `IO.createElement` | Unchanged from 2.0.28 |
| 2.0.30  | `GkQ`    | `NO.createElement` | `dDA.useState` |
| 2.0.31  | `_kQ`    | `MO.createElement` | `nDA.useState` |
| 2.0.32  | `wkQ`    | `LO.createElement` | `oDA.useState` |
| 2.0.37  | `nR2`    | `CR.createElement` | `AwA.useState` |
| 2.0.42  | `cR2`    | `RR.createElement` | `UwA.useState` |
| 2.0.46  | `Et2`    | `xP.createElement` | `HTA.useState` |
| 2.0.53  | `hq2`    | `QP.createElement` | `dMA.useState` |
| 2.0.55  | `nM2`    | `UP.createElement` | `bOA.useState` |
| 2.0.56  | `CL2`    | `HP.createElement` | `xOA.useState` |
| 2.0.57  | `HM2`    | `EP.createElement` | `oOA.useState` |
| 2.0.58  | `SM2`    | `$P.createElement` | `GRA.useState` |
| 2.0.59  | `DO2`    | `MP.createElement` | `CRA.useState` |
| 2.0.61  | `RR2`    | `rj.createElement` | `vTA.useState`, `P` container |
| 2.0.62  | `ZT2`    | `GP.createElement` | `rTA.useState`, `P` container |
| 2.0.75+ | *removed* | - | Banner function no longer exists |

### Thinking Visibility Component History

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
| 2.1.31  | `_j6`     | `K9` | `j`, `V` | 2 condition variables, `verbose` prop removed |

### Pattern Evolution Summary Table

| Version | Banner Function | Component | Variables |
|---------|----------------|-----------|-----------|
| 2.0.9   | `Mr2`          | `S2B`     | Various   |
| 2.0.10  | `br2`          | `DOB`     | `H` check |
| 2.0.11  | `er2`          | `SOB`     | `z` check |
| 2.0.13  | `hGB`          | `xlB`     | `K` check |
| 2.0.14  | `pGB`          | `dlB`     | `K` check |
| 2.0.15  | `KYB`          | `FpB`     | `K` check |
| 2.0.19  | `aFB`          | `NoB`     | `K` check |
| 2.0.21  | `wVB`          | `H8Q`     | `K,D` check |
| 2.0.22  | `YOB`          | `nNB`     | `K,D` check |
| 2.0.24  | `GSB`          | `nTB`     | `K,D` check |
| 2.0.25  | `YSB`          | `aTB`     | `K,D` check |
| 2.0.26  | `KjQ`          | `CTQ`     | `V` check   |
| 2.0.28  | `RjQ`          | `LTQ`     | `V` check   |
| 2.0.29  | `RjQ`          | `LTQ`     | `V` check   |
| 2.0.30  | `GkQ`          | `sjQ`     | `V,I` check |
| 2.0.31  | `_kQ`          | `MSQ`     | `V,I` check |
| 2.0.32  | `wkQ`          | `ljQ`     | `V,I` check |
| 2.0.37  | `nR2`          | `n$Q`     | `V,I` check |
| 2.0.42  | `cR2`          | `xLQ`     | `V,I` check |
| 2.0.46  | `Et2`          | `T32`     | `K,Z` check |
| 2.0.53  | `hq2`          | `o09`     | `K,G` check |
| 2.0.55  | `nM2`          | `J29`     | `K,G` check |
| 2.0.56  | `CL2`          | `b29`     | `K,G` check |
| 2.0.57  | `HM2`          | `K49`     | `K,G` check |
| 2.0.58  | `SM2`          | `k49`     | `K,G` check |
| 2.0.59  | `DO2`          | `F89`     | `K,G` check |
| 2.0.61  | `RR2`          | `T69`     | `F,G` check |
| 2.0.62  | `ZT2`          | `X59`     | `F,G` check |
| 2.0.75  | *removed*      | `co2`     | `D,Z` check |
| 2.0.76  | *removed*      | `lo2`     | `D,Z` check |
| 2.1.5   | *removed*      | `dvA`     | `F,Z` check |
| 2.1.14  | *removed*      | `zkA`     | `F,Z` check |
| 2.1.15  | *removed*      | `k_1`     | `D,H` check |
| 2.1.27  | *removed*      | `mX6`     | `P,H,T` check |
| 2.1.31  | *removed*      | `_j6`     | `j,V` check |

## Subagent Model Configuration

### Subagent Defaults by Version

| Version | Plan Default | Explore Default | Notes |
|---------|-------------|-----------------|-------|
| 2.0.31  | sonnet      | haiku           | |
| 2.0.32  | sonnet      | haiku           | |
| 2.0.37  | sonnet      | haiku           | |
| 2.0.75  | inherit     | haiku           | Plan changed to inherit |
| 2.0.76  | inherit     | haiku           | |
| 2.1.5   | inherit     | haiku           | |
| 2.1.14  | inherit     | haiku           | |
| 2.1.15  | inherit     | haiku           | |
| 2.1.27  | inherit     | haiku           | |
| 2.1.31  | inherit     | haiku           | Current |

### Subagent Variable Names by Version

| Version | Plan Variable | Explore Variable |
|---------|--------------|------------------|
| 2.0.75  | `SHA` | `LL` |
| 2.0.76  | `SHA` | `LL` |
| 2.1.5   | `IHA` | `qO` |
| 2.1.14  | - | - |
| 2.1.15  | - | - |
| 2.1.27  | `i26` | `KL` |
| 2.1.31  | `VH6` | `dT` |

---

When Claude Code updates, function names and component identifiers are regenerated during minification. The patterns in the patch scripts must be updated to match.
