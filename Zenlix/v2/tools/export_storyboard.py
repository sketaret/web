"""Render a review board from the actual V2 frames, not concept artwork."""
from pathlib import Path
import base64
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    page=browser.new_page(viewport={'width':1600,'height':1000},device_scale_factor=1)
    page.goto('http://127.0.0.1:8012/v2/',wait_until='networkidle');page.evaluate('ZenlixFilm.ready')
    images=[]
    for t in [4.5,8.5,17.5,33.5,42.8,55.8,59.5,63]:
        images.append(page.evaluate('t=>{ZenlixFilm.render(t,false);return ZenlixFilm.canvas.toDataURL("image/png")}',t))
    (ROOT/'exports/poster-v2.png').write_bytes(base64.b64decode(images[0].split(',')[1]))
    (ROOT/'exports/closing-v2.png').write_bytes(base64.b64decode(images[-1].split(',')[1]))
    markup=''.join(f'<img src="{s}" alt="Scene {i+1}">' for i,s in enumerate(images))
    page.set_content('<html><head><style>body{margin:0;background:#34363e;display:grid;grid-template-columns:1fr 1fr;gap:2px}img{display:block;width:100%;aspect-ratio:16/9}</style></head><body>'+markup+'</body></html>')
    page.evaluate('Promise.all(Array.from(document.images,i=>i.decode()))')
    page.screenshot(path=str(ROOT/'exports/storyboard-v2.png'),full_page=True)
    browser.close()
print('Exported actual V2 scene board and posters.')
