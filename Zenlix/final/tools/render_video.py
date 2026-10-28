"""Render the final film with the actual supplied recording."""
import argparse
import base64
import json
from pathlib import Path
import subprocess
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--url',default='http://127.0.0.1:8012/final/')
mode=parser.add_mutually_exclusive_group(required=True)
mode.add_argument('--visual-preview',action='store_true')
mode.add_argument('--with-voice',action='store_true')
args=parser.parse_args()
status=json.loads((ROOT/'assets/audio-status.json').read_text())
config=json.loads((ROOT/'timeline.json').read_text())
if args.with_voice:
    if not status.get('voiceReady') or status.get('voiceSource')!='user-upload':
        raise SystemExit('BLOCKED: an actual uploaded narration and prepared final mix are required. Use --visual-preview for a clearly labeled montage draft.')
    audio=ROOT/'assets/final-mix.wav'
    out=ROOT/'exports/zenlix-final.mp4'
    if not audio.is_file():
        raise SystemExit('BLOCKED: voiced final mix is missing.')
else:
    audio=ROOT/'assets/score-v2.wav'
    out=ROOT/'exports/visual-preview.mp4'
fps=config['fps']
seconds=config['duration']
with sync_playwright() as p,Path('/tmp/zenlix-final-ffmpeg.log').open('w') as log:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    page=browser.new_page(viewport={'width':1920,'height':1080},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.goto(args.url,wait_until='networkidle')
    page.evaluate('ZenlixFilm.ready')
    cmd=['ffmpeg','-y','-hide_banner','-loglevel','warning','-f','image2pipe','-vcodec','mjpeg','-framerate',str(fps),'-i','-',
         '-i',str(audio),'-vf','scale=in_range=full:out_range=limited:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
         '-c:v','libx264','-preset','fast','-crf','18','-threads','3','-pix_fmt','yuv420p',
         '-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',
         '-c:a','aac','-b:a','192k','-t',str(seconds),'-movflags','+faststart',
         '-metadata','title=Zenlix final'+(' — supplied narration' if args.with_voice else ' — visual preview, narration pending'),str(out)]
    encoder=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=log)
    try:
        for frame in range(round(seconds*fps)):
            data=page.evaluate('t=>{ZenlixFilm.render(t,false);return ZenlixFilm.canvas.toDataURL("image/jpeg",.95).split(",")[1]}',frame/fps)
            encoder.stdin.write(base64.b64decode(data))
            if frame%(fps*5)==0:
                print(f'Rendered {frame/fps:.0f}/{seconds}s',flush=True)
        encoder.stdin.close()
        result=encoder.wait(timeout=120)
        if result: raise RuntimeError(f'Encoder failed: {result}; see /tmp/zenlix-final-ffmpeg.log')
        if errors: raise RuntimeError(errors)
    except BaseException:
        encoder.kill()
        raise
    finally:
        browser.close()
print(f'Created {out} ({out.stat().st_size/1048576:.1f} MiB)',flush=True)
