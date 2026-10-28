"""Validate V2 content, playback, motion, failure handling and audio honesty."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--url',default='http://127.0.0.1:8012/v2/')
args=parser.parse_args()
config=json.loads((ROOT/'timeline.json').read_text())
assert config['scenes'][0]['start']==0 and config['scenes'][-1]['end']==65
assert len(config['scenes'])==8
for a,b in zip(config['scenes'],config['scenes'][1:]):assert a['end']==b['start']
assert [s['kind'] for s in config['scenes'][2:5]]==['live-cancellation','customer-recovery','quality-coaching']
for a,b in zip(config['subtitles'],config['subtitles'][1:]):assert a['end']<=b['start']+.001
assert all(0<=s['start']<s['end']<=65 for s in config['subtitles'])
status=json.loads((ROOT/'assets/audio-status.json').read_text())
if not status['voiceReady']:
    blocked=subprocess.run(['python3',str(ROOT/'tools/render_video.py'),'--with-voice'],capture_output=True,text=True)
    assert blocked.returncode!=0 and 'BLOCKED' in blocked.stderr
    assert not (ROOT/'exports/zenlix-v2-with-voice.mp4').exists()

times=[.05,1,1.9,4.2,8,13,16,20.5,25,29,33,38,42,46,50,53,56,57.4,58.4,59.4,63]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1100},device_scale_factor=1)
    errors=[];failures=[];console=[];cancellations=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
    def failed(req):
        item={'url':req.url,'reason':req.failure}
        (cancellations if req.failure=='net::ERR_ABORTED' and req.url.endswith('.wav') else failures).append(item)
    page.on('requestfailed',failed)
    page.goto(args.url,wait_until='networkidle');page.evaluate('ZenlixFilm.ready')
    expect(page).to_have_title('Zenlix — الحق عميلك قبل المنافس')
    expect(page.locator('#loading')).to_be_hidden()
    expect(page.locator('#play')).to_be_enabled()
    assert page.locator('.chapter').count()==8
    hashes=[]
    for t in times:
        page.evaluate('t=>ZenlixPlayer.setPosition(t)',t)
        raw=page.evaluate('ZenlixFilm.canvas.toDataURL()')
        hashes.append(hashlib.sha256(raw.encode()).hexdigest())
        page.locator('#canvas').screenshot(path=f'/tmp/zenlix-v2-qa-{t}.png')
    assert len(set(hashes))==len(times), 'Expected distinct moving/cut frames'
    for i,scene in enumerate(config['scenes']):
        page.locator('.chapter').nth(i).click()
        assert scene['start']<=page.evaluate('ZenlixPlayer.position')<scene['end']
        expect(page.locator('.chapter').nth(i)).to_have_attribute('aria-current','true')
    page.locator('.chapter').nth(2).click();page.locator('#play').click();page.wait_for_timeout(650)
    assert page.evaluate('ZenlixPlayer.playing') and page.evaluate('ZenlixPlayer.position')>12.7
    page.locator('#play').click();assert not page.evaluate('ZenlixPlayer.playing')
    page.locator('#sound').click();assert page.locator('#audio').evaluate('(a)=>a.muted')
    page.locator('#captions').click();expect(page.locator('#captions')).to_have_attribute('aria-pressed','false')
    page.locator('#captions').click()
    page.locator('#canvas').focus();before=page.evaluate('ZenlixPlayer.position');page.keyboard.press('ArrowRight')
    assert abs(page.evaluate('ZenlixPlayer.position')-before-5)<.02
    page.evaluate('ZenlixPlayer.setPosition(64.8)');page.locator('#play').click();page.wait_for_timeout(600)
    assert page.evaluate('ZenlixPlayer.position')==65 and not page.evaluate('ZenlixPlayer.playing')
    page.locator('#play').click();page.wait_for_timeout(250);assert page.evaluate('ZenlixPlayer.position')<1
    page.locator('#play').click()
    page.locator('summary').click();assert page.locator('.script section').count()==8
    expect(page.locator('#script')).to_contain_text('نقاط قوتهم')
    expect(page.locator('#script')).to_contain_text('مين كنسل')
    expect(page.locator('#script')).to_contain_text('منافسك')
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path='/tmp/zenlix-v2-mobile.png',full_page=True)
    page.emulate_media(reduced_motion='reduce');page.reload(wait_until='networkidle');page.evaluate('ZenlixFilm.ready')
    assert not page.evaluate('ZenlixPlayer.playing')
    assert not errors,errors
    assert not console,console
    assert not failures,failures
    # Failure path: local timeline unavailable must have an owned message.
    broken=browser.new_page()
    broken.route('**/v2/timeline.json',lambda r:r.fulfill(status=503,content_type='application/json',body='{}'))
    broken.goto(args.url,wait_until='networkidle')
    expect(broken.locator('#loading')).to_contain_text('تعذّر تحميل ملفات الإعلان')
    expect(broken.locator('#play')).to_be_disabled()
    broken.close();browser.close()

report={'result':'PASS','scenes':8,'visual_frames':len(times),'distinct_frames':len(set(hashes)),
        'console_errors':console,'page_errors':errors,'failed_requests':failures,
        'voice_over_generated':status['voiceReady'],'voice_status':status['status'] if not status['voiceReady'] else 'Actual ElevenLabs audio',
        'checks':['timeline partition','subtitle bounds','opening motion','all chapters','play/pause',
          'audio seek','mute','captions','keyboard seek','end/replay','transcript feature coverage',
          'mobile overflow','reduced motion paused','owned asset-failure message','no fake voiced-final export']}
(ROOT/'exports/validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
