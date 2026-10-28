"""Render 39 seconds exactly; require actual production assets for a final export."""
import argparse
import base64
import json
from pathlib import Path
import subprocess
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
mode=parser.add_mutually_exclusive_group(required=True)
mode.add_argument('--preview',action='store_true')
mode.add_argument('--final',action='store_true')
parser.add_argument('--url',default='http://127.0.0.1:8012/energy39/')
args=parser.parse_args()
config=json.loads((ROOT/'timeline.json').read_text())
assets=json.loads((ROOT/'assets/production-assets.json').read_text())
assert config['duration']==39 and config['fps']==30
blockers=[]
if not assets['logo']['authenticReady']:blockers.append('authentic supplied logo variants')
if any(not value for value in assets['screens'].values()):blockers.append('real missed-call, team-quality and CRM software media')
if not assets['voice']['ready']:blockers.append('new narration and reviewed 39-second final mix')
if args.final and blockers:raise SystemExit('BLOCKED: '+ '; '.join(blockers))
if args.final:
    audio=ROOT/assets['voice']['mix']
    if not audio.is_file():raise SystemExit('BLOCKED: actual final narration mix is missing')
    info=json.loads(subprocess.run(['ffprobe','-v','error','-show_format','-of','json',str(audio)],check=True,capture_output=True,text=True).stdout)
    if abs(float(info['format']['duration'])-39)>.002:raise SystemExit('BLOCKED: final mix must be exactly 39 seconds; do not speed up an unrelated narration')
else:audio=ROOT/'assets/score.wav'
out=ROOT/('exports/zenlix-energy39-final.mp4' if args.final else 'exports/zenlix-energy39-preview.mp4')
with sync_playwright() as p,Path('/tmp/zenlix-energy39-ffmpeg.log').open('w') as log:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    page=browser.new_page(viewport={'width':1080,'height':1920},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda e:errors.append(e.text) if e.type=='error' else None)
    page.goto(args.url,wait_until='networkidle');page.evaluate('EnergyFilm.ready')
    if errors:raise RuntimeError(errors)
    if args.final and not page.evaluate('EnergyFilm.originalLogoReady && EnergyFilm.realScreensReady'):
        raise RuntimeError('BLOCKED: original assets did not load; a conceptual fallback cannot become a final export')
    command=['ffmpeg','-y','-hide_banner','-loglevel','warning',
             '-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','-',
             '-i',str(audio),
             '-vf','scale=in_range=full:out_range=limited:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
             '-c:v','libx264','-preset','fast','-crf','18','-threads','3',
             '-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',
             '-c:a','aac','-b:a','192k','-t','39','-movflags','+faststart',
             '-metadata','title=Zenlix Energy 39'+(' — final supplied media' if args.final else ' — motion review, music/SFX only; production assets pending'),str(out)]
    encoder=subprocess.Popen(command,stdin=subprocess.PIPE,stderr=log)
    try:
        for i in range(1170):
            await_media='async t=>{await EnergyFilm.prepare(t);EnergyFilm.render(t);return EnergyFilm.canvas.toDataURL("image/jpeg",.96).split(",")[1]}'
            raw=page.evaluate(await_media,i/30)
            encoder.stdin.write(base64.b64decode(raw))
            if i%150==0:print(f'Rendered {i/30:.0f}/39s',flush=True)
        encoder.stdin.close()
        result=encoder.wait(timeout=120)
        if result:raise RuntimeError('FFmpeg failed; see /tmp/zenlix-energy39-ffmpeg.log')
        if errors:raise RuntimeError(errors)
    except BaseException:
        encoder.kill();raise
    finally:browser.close()
print(f'Created {out} ({out.stat().st_size/1048576:.2f} MiB)',flush=True)
