"""Capture the actual motion frames and a seven-scene portrait board."""
import base64
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
TIMES=[2.4,8.9,13.9,20.8,27.4,35.9,38.6]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    page=browser.new_page(viewport={'width':1600,'height':1020})
    page.goto('http://127.0.0.1:8012/energy39/',wait_until='networkidle');page.evaluate('EnergyFilm.ready')
    images=[]
    for t in TIMES:
        raw=page.evaluate('async t=>{await EnergyFilm.prepare(t);EnergyFilm.render(t);return EnergyFilm.canvas.toDataURL()}',t)
        (ROOT/f'exports/frame-{t}.png').write_bytes(base64.b64decode(raw.split(',')[1]));images.append(raw)
    markup=''.join(f'<img style="display:block;width:100%" src="{raw}">' for raw in images)
    note='<div style="background:#0b1420;color:white;display:grid;place-content:center;text-align:center;font:700 22px sans-serif"><p>ZENLIX / ENERGY 39</p><p>39 SEC · 30 FPS</p><p>1080 × 1920</p><p style="font:14px/1.9 sans-serif;color:#c0cbd5">Motion review · music/SFX only<br>Authentic logo, real UI and new VO pending</p></div>'
    page.set_content('<body style="margin:0;display:grid;grid-template-columns:repeat(4,1fr);gap:3px;background:#e8edf2">'+markup+note+'</body>')
    page.evaluate('Promise.all([...document.images].map(x=>x.decode()))')
    page.screenshot(path=str(ROOT/'exports/storyboard.png'),full_page=True)
    browser.close()
print('Exported actual Energy39 storyboard.')
