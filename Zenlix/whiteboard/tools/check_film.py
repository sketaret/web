"""Visual, playback and encoded-video checks for the portrait review artifact."""
import hashlib
import json
from pathlib import Path
import subprocess
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'timeline.json').read_text())
TIMES=[0,.4,.85,1.3,1.8,2.4,2.95,4.2,7.3,10.8,13.9,16.6,20.8,24.6,26.8,29.4,34.8,
       38.8,40.7,44.3,47.8,51.8,55.8,59.4,63.5,66.8,69.8,72,75.5,77.4,80.8,82.8]
assert (CONFIG['width'],CONFIG['height'],CONFIG['duration'],CONFIG['fps'])==(1080,1920,83,25)
assert len(CONFIG['scenes'])==7
assert CONFIG['scenes'][0]['start']==0 and CONFIG['scenes'][-1]['end']==83
for a,b in zip(CONFIG['scenes'],CONFIG['scenes'][1:]):assert a['end']==b['start']
assert CONFIG['voiceStatus']=='awaiting_new_script_and_recording'
brand=json.loads((ROOT/'assets/brand-status.json').read_text())
assert brand['authenticLogoReady'] is False
assert 'zenlix-logo.png' not in (ROOT/'film.js').read_text()

errors=[];console=[];failures=[];hashes=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1100})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
    page.on('requestfailed',lambda r:failures.append({'url':r.url,'failure':r.failure}) if r.failure!='net::ERR_ABORTED' else None)
    page.goto('http://127.0.0.1:8012/whiteboard/',wait_until='networkidle');page.evaluate('WhiteboardFilm.ready')
    expect(page.locator('#loading')).to_be_hidden()
    assert page.locator('.chapter').count()==7
    assert not page.evaluate('WhiteboardPlayer.playing')
    for t in TIMES:
        data=page.evaluate('t=>{WhiteboardFilm.render(t);return WhiteboardFilm.canvas.toDataURL()}',t)
        hashes.append(hashlib.sha256(data.encode()).hexdigest())
    assert len(set(hashes))>=len(TIMES)-2
    assert len(set(hashes[:7]))==7, 'Opening must animate throughout the first three seconds'
    assert hashes[-1]==hashes[-2], 'The closing brand/title should settle into a clean hold'
    # Deterministic vector poses and transitions, including backward seeks.
    first=page.evaluate('()=>{WhiteboardFilm.render(3.2);return WhiteboardFilm.canvas.toDataURL()}')
    page.evaluate('WhiteboardFilm.render(66.5)')
    again=page.evaluate('()=>{WhiteboardFilm.render(3.2);return WhiteboardFilm.canvas.toDataURL()}')
    assert first==again
    for i,s in enumerate(CONFIG['scenes']):
        page.locator('.chapter').nth(i).click()
        assert s['start']<=page.evaluate('WhiteboardPlayer.position')<s['end']
        expect(page.locator('.chapter').nth(i)).to_have_attribute('aria-current','true')
    page.locator('.chapter').nth(0).click();page.locator('#play').click();page.wait_for_timeout(500)
    assert page.evaluate('WhiteboardPlayer.playing') and page.evaluate('WhiteboardPlayer.position')>.4
    page.locator('#play').click();assert not page.evaluate('WhiteboardPlayer.playing')
    page.locator('#sound').click();assert page.locator('#audio').evaluate('(a)=>a.muted')
    page.locator('#canvas').focus();before=page.evaluate('WhiteboardPlayer.position');page.keyboard.press('ArrowRight')
    assert abs(page.evaluate('WhiteboardPlayer.position')-before-5)<.02
    page.evaluate('WhiteboardPlayer.setPosition(82.8)');page.locator('#play').click();page.wait_for_timeout(650)
    assert not page.evaluate('WhiteboardPlayer.playing') and page.evaluate('WhiteboardPlayer.position')==83
    page.locator('#play').click();page.wait_for_timeout(250)
    assert 0<page.evaluate('WhiteboardPlayer.position')<1
    page.evaluate('WhiteboardPlayer.pause()')
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path='/tmp/zenlix-whiteboard-mobile.png',full_page=True)
    page.emulate_media(reduced_motion='reduce');page.reload(wait_until='networkidle')
    page.evaluate('WhiteboardFilm.ready');assert not page.evaluate('WhiteboardPlayer.playing')
    assert not errors,errors
    assert not console,console
    assert not failures,failures
    broken=browser.new_page()
    broken.route('**/whiteboard/timeline.json',lambda route:route.fulfill(status=503,body='{}'))
    broken.goto('http://127.0.0.1:8012/whiteboard/',wait_until='networkidle')
    expect(broken.locator('#loading')).to_contain_text('تعذّر تحميل')
    expect(broken.locator('#play')).to_be_disabled()
    browser.close()

movie=ROOT/'exports/zenlix-whiteboard-preview.mp4'
probe=json.loads(subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(movie)],check=True,capture_output=True,text=True).stdout)
video=next(s for s in probe['streams'] if s['codec_type']=='video')
audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (video['codec_name'],video['width'],video['height'],video['avg_frame_rate'])==('h264',1080,1920,'25/1')
assert int(video['nb_frames'])==2075
assert float(video['duration'])==float(audio['duration'])==83
assert video['color_space']=='bt709' and video['color_range']=='tv'
subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(movie),'-f','null','-'],check=True)
report={'result':'PASS','duration_seconds':83,'dimensions':[1080,1920],'aspect_ratio':'9:16',
        'fps':25,'frames':2075,'video_codec':'H.264','audio_codec':audio['codec_name'],
        'audio':'Original music and SFX only. New Egyptian narration is pending.',
        'authentic_logo_used':False,'logo_note':'No substitute logo; plain text brand title pending original file.',
        'distinct_review_frames':len(set(hashes)),'opening_review_frames':7,
        'deterministic_render':True,'full_decode':'PASS','page_errors':errors,'console_errors':console,
        'failed_requests':failures,'playback_checks':['chapters','play/pause','mute','keyboard seek','end/replay','mobile overflow','reduced motion','owned missing-timeline message'],
        'sha256':hashlib.sha256(movie.read_bytes()).hexdigest(),'bytes':movie.stat().st_size}
(ROOT/'exports/validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
