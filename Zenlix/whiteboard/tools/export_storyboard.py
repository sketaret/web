"""Build a board from the real vector animation, not generated scene stills."""
import base64
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
TIMES=[2.8,20.8,34.8,47.8,63.5,72,80.8]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    page=browser.new_page(viewport={'width':1600,'height':1020})
    page.goto('http://127.0.0.1:8012/whiteboard/',wait_until='networkidle')
    page.evaluate('WhiteboardFilm.ready')
    images=[]
    for t in TIMES:
        raw=page.evaluate('t=>{WhiteboardFilm.render(t);return WhiteboardFilm.canvas.toDataURL()}',t)
        (ROOT/f'exports/frame-{t}.png').write_bytes(base64.b64decode(raw.split(',')[1]))
        images.append(raw)
    page.set_content('<html><body style="margin:0;display:grid;grid-template-columns:repeat(4,1fr);gap:3px;background:#dfe4e8">'+
                     ''.join(f'<img style="display:block;width:100%" src="{v}">' for v in images)+
                     '<div style="background:#fff;display:grid;place-content:center;text-align:center;font:700 21px sans-serif;color:#162b42"><p>ZENLIX SOLUTIONS</p><p>WHITEBOARD FILM / 9:16</p><p>83 SEC · 1080 × 1920</p><p style="font:14px sans-serif;line-height:1.8">Visual review · music/SFX only<br>New narration + authentic logo pending</p></div></body></html>')
    page.evaluate('Promise.all([...document.images].map(x=>x.decode()))')
    page.screenshot(path=str(ROOT/'exports/storyboard.png'),full_page=True)
    browser.close()
print('Exported actual seven-scene storyboard.')
