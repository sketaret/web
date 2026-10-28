# Zenlix — supplied narration final

`exports/zenlix-final.mp4` is the complete 1080p H.264/AAC advertisement with the user's `content.mp3` recording. Original V1/V2 exports are preserved.

The decoded recording is **69.12 seconds**. The film uses 25 fps / 1,728 frames so picture and audio have exactly the same duration. The recording retains its original speed, pitch, starting position and full spoken ending. Music and editorial effects follow the revised scene cues and duck under speech. The combined mix targets -16 LUFS and -1.5 dBTP.

Scene cuts are placed inside measured recording pauses at 8.48, 13.36, 25.20, 38.96, 52.48, 60.48 and 65.12 seconds. This is scene-level timing against the supplied recording, not verified word-level transcription. No estimated subtitles are burned into the film. The provider of the uploaded recording is not independently asserted.

The review player is available at `/final/` using the shared server:

```bash
python3 /workspace/web/Zenlix/tools/serve.py --port 8012
```

To rebuild, with Python NumPy, SciPy, Playwright, Chromium and FFmpeg installed:

```bash
python3 tools/prepare_audio.py
python3 tools/render_video.py --with-voice
python3 tools/check_export.py
```

Run these three commands from this directory. Temporary uncompressed audio is ignored by Git; the original uploaded MP3, compressed review mix and finished MP4 are included. Fonts, brand artwork and player styles are shared with the parent project. Product screens and figures are illustrative. Source provenance and timing checks are recorded in `exports/audio-report.json` and `exports/validation.json`.
