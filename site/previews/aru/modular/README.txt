ARU — MODULAR ANIMATION PACK
Concept art; no new character history or canon implied.

30 components, each in 3 variations = 90 sprite sheets:
8 individual wings; head, torso, pelvis, left/right arm, left/right leg;
1 heart; 2 crossing rings; 8 distinct shard masks; 4 tiny dust masks.
Plus 3 flattened complete-character sprite sheets and animations.

DRIFT: gentle individual oscillation. Composite dust makes one orbit.
NEON: interruptions, jitter and displaced afterimages.
SWIRL: individual full in-plane turns with afterimages. Composite dust
and shards have independently phased elliptical trajectories.
These are 2D rotations, not newly painted volumetric turnarounds.

Individual sheets: 32 frames, 80 ms each, 8 columns / 4 rows.
Wings 128x128; body/heart/rings 160x160; particles 80x80 per frame.
Composite sheets: 64 frames, 80 ms each, 8 columns / 8 rows;
384x320 per frame. Heart anchor (192,143).
Read frames left to right then top to bottom.

PNG sheets preserve full transparency and exact PixelLab render colors.
Animated lossless WebP preserves transparency. GIF uses a dark matte
and a reduced palette for mobile compatibility. GIF/WebP encoders may
merge identical adjacent frames while preserving their total duration.
JSON files include frame rectangles, pivots and source anchors.
CSV is the spreadsheet-compatible index of all component variations.

Components use the existing whole-Aru rainbow wings/body (whole Aru
source image 304x304) and degraded Aru source image (400x272).
Source anchors are component centers in their original source image;
they are not all on a shared original canvas. Wings/body use the whole
source coordinate system; shards/dust use the degraded coordinate system.
The rings are reconstructed crossing ellipses in the source color theme.
Gold heart pixels come from the whole Aru design. Recipes document exact
pixel masks, transforms, timing and independent trajectories.

The composite has 108 independently phased dust paths with fading wakes.
One to three wings flash at a time during short scheduled bursts.
These irregular flicker patterns repeat each 5.12-second loop.
Each standalone animation is a reusable variant; composite recipes are
the authoritative timing/placement for the flattened loops.

Pixel art rendered with PixelLab workbench. Files were downloaded and
losslessly assembled into sheets; GIFs are palette-reduced previews.
