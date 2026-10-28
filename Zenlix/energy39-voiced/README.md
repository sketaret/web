# Zenlix Energy39 — uploaded narration edit

`exports/zenlix-energy39-with-voice.mp4` is the 1080×1920, 30-fps, **39.00-second** motion review with the supplied `content (1).mp3` recording. Its ZIP is provided for download clients that display MP4 inline.

The decoded recording is **34.16 seconds**. It starts at zero and is included in full, at original speed and pitch. No speech is cut, looped or synthesized. The remaining 4.84 seconds are a music/brand-title hold, respecting the previous exact 39-second brief. Music is ducked under speech and the final encoded mix measures approximately -16 LUFS. The source provider is not independently asserted.

## Actual retiming

The same story now cuts at 0, 6.7667, 9.2333, 15.4, 20.5, 26.1 and 30.8 seconds. Internal action anchors move the unanswered call, follow-up, coaching, manual CRM interaction and closing typography with their corresponding phrases. The agent opens the file at 23.1333 seconds before the previous complaint appears at 24.2667. The brand title starts at 30.8, the spoken closing line appears at 32.3, and the website appears at 33.2333.

Local Whisper small/base recognition using official Sherpa-ONNX models identified the spoken sections; actual detected recording pauses determine the scene cuts. These are phrase/scene anchors, not a claim of perfect word-level transcription or human auditory review. No unverified subtitles are burned into the film. The original standalone 39-second preview remains preserved. The shared renderer's optional time maps and closing cues retain its original default behavior, verified by the original film checks.

**The authentic logo and real product media remain pending.** This is a voiced motion review with the existing conceptual workflow drawings and plain brand-name typography. No fabricated logo or software capture is added. The separate final-production mode continues to reject missing original assets.

## Preview and rebuild

Start `python3 /workspace/web/Zenlix/tools/serve.py --port 8012` and open `/energy39-voiced/`.

From this directory, with Python, NumPy, SciPy, Playwright, Chromium and FFmpeg available:

```bash
python3 tools/align_edit.py
python3 tools/mix_narration.py
python3 tools/render_video.py --voiced-review
python3 tools/export_storyboard.py
python3 tools/check_export.py
python3 tools/make_delivery.py
```

The saved anchors are locked to the supplied recording's SHA-256. A different upload must be re-aligned; the build will not silently reuse its timings. `align_edit.py` regenerates the retimed score source from the original energy39 score. Uncompressed temporary audio is ignored by Git; original MP3, compressed review mix, delivered MP4 and archive are included.

`exports/audio-report.json`, `alignment-report.json` and `validation.json` record the source, timing and checks. The actual encoded MP4 fully decodes; eight sampled speech windows from the beginning through the closing have zero measured offset relative to the original recording. Browser checks cover action/text order, chapters, audio seeking, ending, mobile overflow and actual MP4 playback. The archive's MP4 hash is verified against the delivery file.
