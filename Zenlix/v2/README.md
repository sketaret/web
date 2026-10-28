# Zenlix V2 — الحق عميلك قبل المنافس

65-second, 1920×1080, 30-fps motion-graphics revision. The first six seconds now ask: **«عميلك بيتصل… وحد كنسل عليه! هتلحقه، ولا هيروح لمنافسك؟»**. Zenlix appears at second 6. The main features each receive a full sequence instead of brief dashboard flashes.

## Current delivery status

The visual montage, original score, sound effects and preview player are implemented and tested. `exports/zenlix-v2-visual-preview.mp4` is explicitly a **music/SFX visual preview without narration**. Its SRT timings are estimates for reviewing the script.

**ElevenLabs narration is not generated yet.** This instance has no `ELEVENLABS_API_KEY`, the provider API request was blocked by the network proxy, and the tagged ElevenLabs plugin has no callable tools in this session. The environment configuration draft declares `ELEVENLABS_API_KEY` securely for `api.elevenlabs.io`; saving that draft does not supply a key or apply/publish the configuration. Enter the key securely in environment settings and apply the saved network/configuration change. Do not put credentials in chat, Git, this README or source files.

`tools/elevenlabs_voice.py` contains the direct provider integration prepared using the official ElevenLabs Python SDK API reference. Live synthesis has not been validated. The renderer refuses a `--with-voice` export while real narration/alignment are missing. Do not describe the current preview as an ElevenLabs-voiced commercial.

## Creative edit

| Time | Shot sequence | Feature/message |
|---|---|---|
| 00–06 | Ring → rejection slash → competing restaurant route | A concrete hook for restaurant owners |
| 06–12 | Orange brand reveal with a dimensional dark logo panel | Zenlix appears immediately after the hook |
| 12–23 | Rejection event → highlighted employee → exact event timeline | Who rejected the call, and when |
| 23–36 | Unanswered customer list → follow-up call → contact → possible order | Follow up before a competitor gets the opportunity |
| 36–49 | Quality criteria → strengths/coaching notes → development chart | Evaluate and train the team to improve service |
| 49–57 | Recording waveform → inbound/outbound report → AI question | Supporting product tools |
| 57–60 | Three one-second typographic cuts | Faster follow-up, stronger team, better service |
| 60–65 | Brand/signature/site held on screen | Every Call, Under Control |

Twenty editorial/audio cues, diagonal wipes, a three-beat opening, live highlighting, paths, chart motion, layered panels and a contrasting light evaluation sequence replace the original steady slide rhythm. All product screens and values are illustrative. A rejected call is explicitly attributed to the employee in the example; it is not presented as a customer-cancelled order. Customer recovery is an opportunity, not a guaranteed conversion. Evaluation shows review/training, not an invented automated AI grading service.

## Preview and rebuild

From `/workspace/web/Zenlix`:

```bash
python3 tools/serve.py --port 8012
```

The local V2 route is `/v2/`. Keep the server running, then from `/workspace/web/Zenlix/v2`:

```bash
python3 tools/make_score.py
python3 tools/check_video.py
python3 tools/render_video.py --visual-preview
python3 tools/export_storyboard.py
```

The prepared machine has Python 3, NumPy, Python Playwright, Chromium and FFmpeg. No frontend installation or build is required. Fonts, logo and review-player styles are shared with the parent Zenlix directory. The original V1 MP4 remains unchanged.

## Generate actual ElevenLabs narration after access is available

```bash
python3 tools/elevenlabs_voice.py --check
python3 tools/elevenlabs_voice.py --list-voices
python3 tools/elevenlabs_voice.py --generate --voice-id YOUR_EGYPTIAN_MALE_VOICE_ID
python3 tools/check_video.py
python3 tools/render_video.py --with-voice
```

The voice ID is not a secret. It can also be supplied through `ELEVENLABS_VOICE_ID`. The API key is read from the secure environment binding only. The default model is `eleven_multilingual_v2`; it supports Arabic and its official API returns character timestamps. The script verifies Egyptian/male voice metadata, uses one consistent voice and context across eight clips, caches matching requests, and does not fall back to an unrelated premade voice.

Each generated clip is measured before assembly. It may be accelerated by up to 1.12× without changing pitch; larger changes are rejected for text revision or deliberate re-recording. Real character timings drive captions and the cancellation, employee, callback, evaluation and typography cues. Graphic cues are snapped to the nearest 30-fps frame (at most 16.7 ms quantization). Each clip must remain inside its scene with padding. The final mix ducks music under speech and uses two-pass loudness normalization.

After successful generation: `assets/voice-over-v2.wav`, `assets/final-mix-v2.wav`, `exports/voice-timing-report.json`, `exports/zenlix-v2-ar-aligned.srt` and `exports/zenlix-v2-with-voice.mp4` are the voiced deliverables. The player switches to the voiced mix only after actual synthesis/timing processing succeeds. **Timing validation does not guarantee 100% pronunciation or accent quality.** Listen to the voice, especially «زِنليكس»، «كنسل»، and the Egyptian phrasing, before calling it a finished commercial.

## Verification already executed

- Browser: 21 distinct review frames; all chapters; play/pause; audio seeking; mute; captions; keyboard seeking; ending/replay; transcript coverage; 390px viewport; reduced-motion initial state; owned error message for missing timeline.
- Export gate: a voiced final cannot be rendered from a music-only status.
- Timing helpers: Arabic-diacritic cue mapping and rejection of malformed provider alignment.
- DSP: ducking/two-pass loudness pipeline exercised with a temporary synthetic diagnostic, preserving exactly 65 seconds/48 kHz/stereo. This was a DSP test, not a generated narrator.
- Actual provider request: blocked/missing credentials; live speech generation and pronunciation review remain outstanding.

Provider integration code, prototype interfaces and score are project source. Font license is in `../assets/OFL-Cairo.txt`; brand artwork is derived from the original user-supplied logo references as documented in the parent project.
