# Historical battlefield data provenance

The following is the original source record, retained verbatim for attribution. It describes the historical research input, not Gemstorm branding or a licence grant.

```json
{
  "site": "https://gemfire.drque.net/",
  "pages": "Lands.php?Province=1 .. 30",
  "credit": "Gemfire - The Complete Guide, by Andrew Que (DrQue.net)",
  "retrieved": "2026-09-04",
  "tiles": {
    "set": "Sixteen flat-coloured tiles, 96 px square, lossless WebP, 1.2 KB for the whole set. Named by the faces they connect, so the name is the contract: river-ns joins north and south, wall-se joins south and east.",
    "bandContract": "Every tile presents the same 32 px band, centred, on each face it connects, and nothing but grass on the faces it does not. That is what makes the set seamless: there is no alignment to get right, so a new tile only has to honour the band.",
    "naming": "The set ships plains as grass.png upstream; it is installed as plains.webp to match the tileAssets names, so no loader alias is needed.",
    "seamFix": "The three tiles presenting water on a vertical face - river-ew, river-nw, river-se - drew that face in a second, darker blue (117,154,230) against the water (121,160,251). Harmless alone, but butting two horizontal tiles together doubled it into a line down the channel. Replaced with the water colour; no tile now has a colour that appears only on an outer row or column.",
    "encoding": "Lossless, not the q85 the painted sheet used. Lossy compression fringes hard flat edges, which would quietly reintroduce the seam just removed - and flat colour compresses smaller lossless anyway: plains.webp is 32 bytes.",
    "noEndCap": "There is no wall end-cap, so a castle wall simply stops where the entrance begins. A continuity sweep of every adjacency on all thirty boards finds 44 such wall-to-plains edges and zero river discontinuities, so this is the authored geometry rather than a defect - but it reads as one until you know.",
    "paintedSheetRejected": "A painted 4x4 sheet was tried first, in five versions. Tiles meant to sit side by side did not present the same band at their shared edge - 10 px of 303 on the best version, up to 31 px on the worst - so it needed band detection, a minimax search for corner offsets and a per-material warp to a canonical band, and reached only \"no visible seam\" at 42 KB. The flat set was exact on first measurement at 1.2 KB, survives a 24 px thumbnail where painted tiles turn to mush, and separates figure from ground so the unit sprites read. Kept in git history if the painted direction is ever wanted back."
  }
}
```
