"""Render a clearly labeled portrait music/SFX review; never fake missing VO or logo."""
import argparse
import base64
import json
from pathlib import Path
import subprocess
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--url',default='http://127.0.0.1:8012/whiteboard/')
parser.add_argument('--preview',action='store_true',required=True,
                    help='Review version: music/SFX; original logo and new voice are pending.')
args=parser.parse_args()
config=json.loads((ROOT/'timeline.json').read_text())
fps,duration=config['fps'],config['duration']
out=ROOT/'exports/zenlix-whiteboard-preview.mp4'
with sync_playwright() as p,Path('/tmp/zenlix-whiteboard-ffmpeg.log').open('w') as log:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    page=browser.new_page(viewport={'width':1080,'height':1920},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda e:errors.append(e.text) if e.type=='error' else None)
    page.goto(args.url,wait_until='networkidle');page.evaluate('WhiteboardFilm.ready')
    if errors:raise RuntimeError(errors)
    command=['ffmpeg','-y','-hide_banner','-loglevel','warning',
             '-f','image2pipe','-vcodec','mjpeg','-framerate',str(fps),'-i','-',
             '-i',str(ROOT/'assets/score.wav'),
             '-vf','scale=in_range=full:out_range=limited:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
             '-c:v','libx264','-preset','fast','-crf','18','-threads','3',
             '-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',
             '-c:a','aac','-b:a','192k','-t',str(duration),'-movflags','+faststart',
             '-metadata','title=Zenlix whiteboard — music/SFX review, narration and authentic logo pending',str(out)]
    encoder=subprocess.Popen(command,stdin=subprocess.PIPE,stderr=log)
    try:
        for i in range(round(duration*fps)):
            raw=page.evaluate('t=>{WhiteboardFilm.render(t);return WhiteboardFilm.canvas.toDataURL("image/jpeg",.96).split(",")[1]}',i/fps)
            encoder.stdin.write(base64.b64decode(raw))
            if i%(fps*5)==0:print(f'Rendered {i/fps:.0f}/{duration}s',flush=True)
        encoder.stdin.close()
        result=encoder.wait(timeout=120)
        if result:raise RuntimeError(f'FFmpeg failed: {result}; /tmp/zenlix-whiteboard-ffmpeg.log')
        if errors:raise RuntimeError(errors)
    except BaseException:
        encoder.kill();raise
    finally:browser.close()
print(f'Created {out} ({out.stat().st_size/1048576:.2f} MiB)',flush=True)
