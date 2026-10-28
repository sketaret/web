# Zenlix Solutions — vertical whiteboard commercial

`exports/zenlix-whiteboard-preview.mp4` is an **83-second, 1080×1920, 9:16, 25-fps H.264/AAC visual review with music and effects**. Previous landscape deliveries are preserved.

## Delivery status

- Seven animated scenes are implemented and exported. Authored vector puppets keep the owner, customer and agent consistent, with arm gestures, blinks, mouth poses and expressions. Drawn paths, phone rings, disappearing receipts, follow-up, coaching and complaint history form the story. Arabic text uses local Cairo fonts and browser shaping rather than image-generated lettering.
- **New narration is not included.** The brief describes the scenes but supplies no verbatim voice-over script. `exports/narration-proposed-ar.txt` is a proposed Egyptian script awaiting approval/replacement and recording. The earlier 69.12-second uploaded recording belongs to the previous call-rejection film and does not cover the complaint-history sequence. It is not reused or stretched.
- **The original logo file is required.** The existing parent logo is a regenerated derivative and is deliberately not loaded. This review uses plain brand-name typography, not a fabricated logo. `assets/brand-status.json` gates the early and final logo reveals until an authentic file is supplied. This is not the final branded/voiced commercial.
- Performance indicators are qualitative, with no fabricated statistics, guaranteed recovered orders or subscription CTA. Product/workflow drawings are illustrative.

## Planned scenes

| Seconds | Action |
|---|---|
| 0–10 | Restaurant owner, diner and food; ringing phone; disappearing order opportunities |
| 10–24 | Hungry customer tries twice; orange path leads to another restaurant |
| 24–37 | Freeze receipt; pen line introduces Zenlix; missed calls and agent follow-up |
| 37–51 | Three headset agents; useful coaching; qualitative improvement |
| 51–66 | Complaint saved; later call reveals the previous history; reassured customer |
| 66–75 | Heart connects customer, owner, restaurant and agent; clear service overview |
| 75–83 | Orange lines converge; brand-title review ending and zenlix.org |

These are editorial planning times, not verified speech alignment. Adapt scene lengths and action cues to the actual new narration without forcing its speed.

## Preview and rebuild

Run `python3 /workspace/web/Zenlix/tools/serve.py --port 8012` and open `/whiteboard/`. Playback starts paused and supports seven chapters, seeking, mute, fullscreen and keyboard Space/left/right. The proposed-script and missing-voice/logo status appear outside the film.

From this directory, with Python, NumPy, Playwright, Chromium and FFmpeg available:

```bash
python3 tools/make_audio.py
python3 tools/render_video.py --preview
python3 tools/export_storyboard.py
python3 tools/check_film.py
```

The exporter requires `--preview`; there is no misleading finished-voice mode. `film.js` is the shared deterministic renderer for playback, storyboard and export. Frames export in limited-range BT.709, with AAC audio and MP4 faststart. Fonts are shared from `../assets/` under the Cairo SIL OFL license. Music and restrained ringing, pen sounds and transitions are original synthesis. Compressed review audio is included; temporary WAV is ignored by Git.

`assets/art-direction.png` is the generated art reference. The film is independently drawn and animated in code, not a sequence of generated stills. `exports/storyboard.png` uses actual film frames; `exports/validation.json` records delivered-artifact checks.
