---
version: alpha
colors:
  primary: "#ff7900"
  background: "#101114"
  surface: "#1c1e23"
  ink: "#f7f5f1"
  muted: "#a5a6ad"
  line: "#34363e"
  orange: "#ff7900"
  red: "#ff5265"
  green: "#47d7a1"
typography:
  display:
    fontFamily: "Cairo, sans-serif"
  body:
    fontFamily: "Cairo, sans-serif"
rounded:
  controls: "7px"
  product: "22px"
spacing:
  page: "40px"
  gap: "16px"
components:
  player:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
  primaryControl:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.background}"
  caption:
    textColor: "{colors.muted}"
  divider:
    backgroundColor: "{colors.line}"
  missedCall:
    textColor: "{colors.red}"
  answeredCall:
    textColor: "{colors.green}"
---

## Overview
An Egyptian Arabic 65-second motion commercial for restaurant owners. This is a brand film with a review player, not the Zenlix product application. The brief and supplied logos are the business source. The signature is an orange call orbit linking incoming calls to orders and the brand. V1's reference is /workspace/generated_images/exec-5f69e4e3-62fe-4a8b-b3a8-5da4b89f99ef.png. The user-authorized V2 at `v2/` follows v2/assets/concept-v2.png: more editorial cuts, a specific first-six-second customer-loss hook, an orange brand reveal at second 6, and full scenes for cancellation attribution, customer follow-up and quality/coaching. This evolution is requested by the user; the original V1 movie is preserved.

## Colors
The values above map to :root in styles.css and the C palettes in the V1/V2 film.js files. Film export and playback share their version's same renderer. V2 deliberately uses full-bleed orange for the early brand reveal and the ink token as a bright evaluation-scene background; it does not introduce a new brand palette. Orange carries the brand; red indicates missed/rejected calls; green indicates answered calls. No purple, blue neon grids, stock restaurant imagery, or unrelated product claims.

## Typography
Local Cairo WOFF2 fonts, 400/700/800 weights, Arabic and Latin subsets. Film headlines are 65–133px on a 1920px canvas, voice subtitles 27px, UI 12–37px. Arabic is shaped by the browser canvas and direction is set explicitly. Latin numbers and the website retain LTR direction.

## Layout
The film is fixed 1920×1080. The player scales it proportionally, preserving geometry. Controls, chapters, transcript and downloads remain usable on narrow screens; chapters wrap from eight columns to four. Export contains the film only. All mock product screens are labeled as illustrative.

## Elevation & Depth
Dark dimensional phone with restrained metallic orange edge, soft shadow and a glowing orbit. The illustrative product panel is light and legible. Depth supports transitions without obscuring the chart and table.

## Shapes
Rounded hardware and product panel; open typographic compositions. No repeated marketing card grid. A single call path links scenes.

## Components
One deterministic render(time, captions) function drives playback and video frames in each version. Semantic play, mute, captions and fullscreen buttons; native range for seeking; eight keyboard-accessible chapters. Motion is paused until explicitly played. Reduced-motion users receive the same still initial frame and no control transitions. Captions and scene transcript provide a textual alternative. V2's motionCues can be driven by actual ElevenLabs character timestamps. Until actual speech is generated, its status and downloadable filename explicitly say visual preview; placeholder narration is never presented as generated speech.

## Do's and Don'ts
V1 retains 0–8–17–26–33–45–55–60–65. V2 uses 0–6–12–23–36–49–57–60–65, making the brand visible earlier and giving the three user-prioritized features full sequences. Do not claim illustrative dashboard values are real, customer recovery is guaranteed, or evaluation uses automatic AI grading. Do not claim a music/SFX preview contains an Egyptian narrator. Generated voice requires real provider audio; precise timing is measurable but 100% subjective pronunciation quality cannot be guaranteed. The logo asset is derived from supplied references and should be replaced by the original production PNG/SVG when provided as a file.

## Authorized vertical whiteboard direction

The new user brief explicitly changes the creative direction for `whiteboard/`: 1080×1920 portrait, white paper, fine navy outlines (#162B42), vivid brand orange (#FF821C), Cairo text and consistently illustrated adult characters. This is a separate film with a light review player; previous landscape films and their palette remain intact. Its signature is one orange pen path connecting the lost call, follow-up, coaching, complaint history and customer trust. Qualitative indicators replace invented performance numbers. No stock footage or photorealistic people are used.

The authentic logo requirement is stricter than the earlier drafts: do not use the regenerated parent logo. Gate original-asset rendering through `whiteboard/assets/brand-status.json`. Plain brand-name typography is disclosed as a review placeholder. The new scene descriptions do not contain a verbatim supplied narration script; `whiteboard/exports/narration-proposed-ar.txt` remains a proposal. Do not recycle the previous narration, claim word-level synchronization or label the music/SFX review a finished voiced commercial. Final shot durations must follow the actual new recording.

## Authorized Energy39 revision

The subsequent brief defines `energy39/` as a separate 39-second, 1080×1920, 30-fps high-energy film. Its palette is white, midnight navy #0B1420, orange #FF821C, gray #E8EDF2 and ink #18222C. It reuses the authored cast, but replaces the long whiteboard pacing with purpose-led white/navy/orange cuts, one carried receipt, parallax motion plates, a phone/headset morph, a manual CRM interaction and three connected business outcomes. The ending is 37–39 to satisfy the hard total. Music is original 128 BPM; the CRM passage has lower density. Arabic remains local Cairo composition.

The original logo, real product screens and new narration remain absent. `energy39/assets/production-assets.json` gates real assets and the final renderer; plain type and workflow diagrams are explicitly review-only. Do not claim the preview uses the authentic logo, real software, ElevenLabs speech, automatic complaint lookup or guaranteed recovered orders. Do not accelerate/recycle the unrelated 69-second recording. Follow the actual new recording when those assets arrive while retaining the user's 39-second maximum.

## Uploaded narration edition

`energy39-voiced/` applies the actual later-uploaded `content (1).mp3` (34.16 seconds) to the Energy39 story. Narration remains uncut and at original speed/pitch; the 39-second total ends with a 4.84-second music/title hold. Phrase/scene anchors from local ASR and measured pauses retime the shared renderer through optional `timeMap` values. The brand-title and slogan have independent real-time cues. The original Energy39 config has no time maps, so it retains its original edit. The voiced edition still discloses missing authentic logo and actual UI media; voice completion must not be described as production-brand approval.
