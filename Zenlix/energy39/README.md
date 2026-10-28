# Zenlix Energy 39 — vertical motion commercial

`exports/zenlix-energy39-preview.mp4` is the **39.00-second, 1080×1920, 30-fps H.264/AAC motion review**. It contains the new animated edit, Cairo Arabic typography and original 128 BPM music/SFX. Earlier films are preserved.

## Current production stage

The motion is rendered. **This review has no new narrator, authentic logo or real software capture.** Those assets were not attached to this revision. Plain brand-name typography is a review placeholder, not a recreated Zenlix logo; workflow motion plates are conceptual diagrams, not the real product UI. The previous regenerated logo and unrelated 69-second narration are not reused. An actual website request was denied by the environment network proxy, and no callable ElevenLabs tool or API binding is present.

The final exporter refuses to create `zenlix-energy39-final.mp4` until original logo files, real missed-call/team-quality/customer-history media, and a prepared narrated mix are supplied. A 39-second commercial cannot use an unrelated 69-second recording without changing the brief or rushing/cutting it. `exports/narration-proposed-ar.txt` is a proposed short Egyptian recording script, not an approved or generated voice-over.

## Editorial timeline

| Seconds | Motion / story |
|---|---|
| 0–7 | Immediate ringing call; no answer within the first second; owner, receipt and lost opportunity; navy/white/orange shifts and a designed freeze |
| 7–10 | Split screen; receipt moves from the original restaurant toward another restaurant |
| 10–16 | Reverse that receipt; morph to a follow-up plate; agent calls customer; possible opportunity, not a guaranteed sale |
| 16–22 | Phone/headset morph; three agents; qualitative response/quality cues; helpful coaching and improvement |
| 22–31 | Previously recorded complaint; new call; explicit manual opening of the customer file; review of past complaint; reassured customer |
| 31–37 | Follow-up, stronger team and customer care; three linked nodes form one ecosystem |
| 37–39 | Converging lines, dark navy closing, slogan and zenlix.org; original-logo slot is pending |

The user's 37–40 closing range is shortened to 37–39 to respect the explicit 39-second total. The main editorial cues are no more than 1.5 seconds apart before the final hold. The two receipt match cuts preserve the prop's pixels at the cut, rather than simply fading between unrelated panels. CRM takes nine seconds and reduces musical density for clarity. No financial statistics or guaranteed sales are used. The CRM record only appears again after the agent visibly opens the file; there is no claim of automatic retrieval.

## Preview and rebuild

Start the shared server:

```bash
python3 /workspace/web/Zenlix/tools/serve.py --port 8012
```

Open `/energy39/`. Playback starts paused, with seven chapters, seeking, mute, fullscreen and keyboard navigation. The pending-production-assets status is disclosed in the review page.

From this directory, with Python/NumPy, Playwright, Chromium and FFmpeg installed:

```bash
python3 tools/make_audio.py
python3 tools/render_video.py --preview
python3 tools/export_storyboard.py
python3 tools/check_film.py
python3 tools/make_delivery.py
```

`film.js` is the deterministic renderer used by the movie, storyboard and reviewer. Characters reuse the original authored whiteboard puppets with the new palette and timeline. Frames export in limited-range BT.709, 1,170 frames exactly, with AAC/48 kHz stereo and MP4 faststart. Arabic is shaped by the browser from local Cairo fonts under the parent assets' SIL OFL license. The music, percussion and ring/UI/whoosh effects are original synthesis.

## Add actual production media

`assets/production-assets.json` declares the missing originals. Logo URLs and screen media URLs resolve relative to `/energy39/`; voice mix paths resolve relative to this directory. Only mark supplied originals ready after inspecting the real files.

- `logo.lightBackground` and `logo.darkBackground`: authentic user-supplied logo variants. No replacement icon is generated.
- `screens.missedCalls`, `screens.teamQuality`, `screens.customerHistory`: objects with `src`, `type` (`image` or `video`), optional normalized `crop` (`x`,`y`,`w`,`h`) and optional video `inPoint`. Real video clips are sought to the current animation time at each exported frame; screens can be tightly cropped for mobile readability.
- `voice.source`, `voice.mix`, `voice.provider`, `voice.ready`: actual new narration and the reviewed 39-second ducked/normalized mix. Do not attribute an upload to ElevenLabs without provenance. No narration has been synthesized by this project yet.

After the missing assets and reviewed voice timing are genuinely complete, `python3 tools/render_video.py --final` verifies the assets loaded and the narrated mix is exactly 39 seconds. The preview intentionally remains a separate deliverable.

`exports/validation.json` records encoded duration, full decode, 36 distinct frames, two pixel-matched receipt cuts, explicit manual CRM order, designed freeze, playback/mobile/error handling and the blocked-final check. `exports/storyboard.png` uses actual rendered frames. The downloadable ZIP contains the review MP4, storyboard, proposed narration and an Arabic status note.
