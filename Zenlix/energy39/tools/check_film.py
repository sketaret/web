"""Verify exact 39s AV export, visual match cuts, narrative order and playback."""
import hashlib
import json
from pathlib import Path
import subprocess
from playwright.sync_api import sync_playwright,expect

ROOT=Path(__file__).resolve().parents[1]
CFG=json.loads((ROOT/'timeline.json').read_text())
assert (CFG['duration'],CFG['fps'],CFG['width'],CFG['height'],CFG['bpm'])==(39,30,1080,1920,128)
assert [(s['start'],s['end']) for s in CFG['scenes']]==[(0,7),(7,10),(10,16),(16,22),(22,31),(31,37),(37,39)]
assert CFG['crmManualOpenAt']<CFG['crmHistoryVisibleAt']
assert all(0<b['t']-a['t']<=1.5 for a,b in zip(CFG['editCues'],CFG['editCues'][1:]))
blocked=subprocess.run(['python3',str(ROOT/'tools/render_video.py'),'--final'],capture_output=True,text=True)
assert blocked.returncode!=0 and all(s in blocked.stderr for s in ['BLOCKED','authentic','real','narration'])
assert not (ROOT/'exports/zenlix-energy39-final.mp4').exists()
TIMES=[0,.3,.8,1.0,1.7,2.5,3.6,4.7,5.6,6.8,7.2,8,8.9,10.1,11.5,12.2,13.9,15.7,
       16.2,17.6,18.9,20.8,21.8,22.6,23.5,24.6,25.3,26.5,28.3,29.8,31.5,33,34.6,36,37.3,38.5]
errors=[];console=[];failures=[];hashes=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1100})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
    page.on('requestfailed',lambda r:failures.append({'url':r.url,'error':r.failure}) if r.failure!='net::ERR_ABORTED' else None)
    page.goto('http://127.0.0.1:8012/energy39/',wait_until='networkidle');page.evaluate('EnergyFilm.ready')
    expect(page.locator('#loading')).to_be_hidden()
    assert page.locator('.chapter').count()==7 and not page.evaluate('EnergyPlayer.playing')
    for t in TIMES:
        raw=page.evaluate('t=>{EnergyFilm.render(t);return EnergyFilm.canvas.toDataURL()}',t)
        hashes.append(hashlib.sha256(raw.encode()).hexdigest())
    assert len(set(hashes))==len(TIMES)
    # Read the actual drawn text, including the manual CRM action before history.
    def words(t):
        return page.evaluate('''t=>{const ctx=EnergyFilm.canvas.getContext('2d'),old=ctx.fillText,words=[];
            ctx.fillText=function(...args){words.push(args[0]);return old.apply(this,args)};
            try{EnergyFilm.render(t)}finally{ctx.fillText=old}return words}''',t)
    assert 'مكالمة واردة' in words(0)
    assert 'لم يتم الرد' in words(1)
    assert 'فتح ملف العميل' in words(25.25)
    assert not any('شكوى سابقة' in s for s in words(25.25))
    assert 'مراجعة الشكوى السابقة' in words(26.8)
    assert 'من غير ما يعيد الحكاية.' in words(30)
    assert 'كل مكالمة ليها قيمة' in words(38.5)
    # The carried receipt remains in the same place across both editorial cuts.
    deltas=[]
    for before,after,rect in [(6.999,7,[350,600,380,700]),(9.999,10,[755,875,100,140])]:
        delta=page.evaluate('''({before,after,rect})=>{const ctx=EnergyFilm.canvas.getContext('2d');
            EnergyFilm.render(before);const a=ctx.getImageData(...rect).data;
            EnergyFilm.render(after);const b=ctx.getImageData(...rect).data;
            let d=0;for(let i=0;i<a.length;i++)d+=Math.abs(a[i]-b[i]);return d/a.length}''',{'before':before,'after':after,'rect':rect})
        assert delta<1.5,(before,after,delta)
        deltas.append({'cut_seconds':after,'receipt_mean_pixel_difference':round(delta,5)})
    first=page.evaluate('()=>{EnergyFilm.render(3.5);return EnergyFilm.canvas.toDataURL()}')
    second=page.evaluate('()=>{EnergyFilm.render(3.9);return EnergyFilm.canvas.toDataURL()}')
    assert first==second,'The designed freeze frame must hold its pose'
    for i,s in enumerate(CFG['scenes']):
        page.locator('.chapter').nth(i).click()
        assert s['start']<=page.evaluate('EnergyPlayer.position')<s['end']
        expect(page.locator('.chapter').nth(i)).to_have_attribute('aria-current','true')
    page.locator('.chapter').nth(0).click();page.locator('#play').click();page.wait_for_timeout(500)
    assert page.evaluate('EnergyPlayer.playing') and page.evaluate('EnergyPlayer.position')>.4
    page.locator('#play').click();assert not page.evaluate('EnergyPlayer.playing')
    page.locator('#sound').click();assert page.locator('#audio').evaluate('(a)=>a.muted')
    page.locator('#canvas').focus();before=page.evaluate('EnergyPlayer.position');page.keyboard.press('ArrowRight')
    assert abs(page.evaluate('EnergyPlayer.position')-before-5)<.02
    page.evaluate('EnergyPlayer.setPosition(38.8)');page.locator('#play').click();page.wait_for_timeout(650)
    assert page.evaluate('EnergyPlayer.position')==39 and not page.evaluate('EnergyPlayer.playing')
    page.locator('#play').click();page.wait_for_timeout(250);assert 0<page.evaluate('EnergyPlayer.position')<1
    page.evaluate('EnergyPlayer.pause()')
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path='/tmp/zenlix-energy39-mobile.png',full_page=True)
    page.emulate_media(reduced_motion='reduce');page.reload(wait_until='networkidle');page.evaluate('EnergyFilm.ready')
    assert not page.evaluate('EnergyPlayer.playing')
    assert not errors,errors
    assert not console,console
    assert not failures,failures
    bad=browser.new_page();bad.route('**/energy39/timeline.json',lambda r:r.fulfill(status=503,body='{}'))
    bad.goto('http://127.0.0.1:8012/energy39/',wait_until='networkidle')
    expect(bad.locator('#loading')).to_contain_text('تعذّر تحميل')
    expect(bad.locator('#play')).to_be_disabled();browser.close()

movie=ROOT/'exports/zenlix-energy39-preview.mp4'
probe=json.loads(subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(movie)],check=True,capture_output=True,text=True).stdout)
video=next(s for s in probe['streams'] if s['codec_type']=='video')
audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (video['codec_name'],video['width'],video['height'],video['avg_frame_rate'])==('h264',1080,1920,'30/1')
assert int(video['nb_frames'])==1170
assert float(video['duration'])==float(audio['duration'])==float(probe['format']['duration'])==39
assert video['color_space']=='bt709' and video['color_range']=='tv'
subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(movie),'-f','null','-'],check=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    page=browser.new_page();page.goto('http://127.0.0.1:8012/energy39/exports/zenlix-energy39-preview.mp4',wait_until='domcontentloaded')
    page.wait_for_function('document.querySelector("video")?.readyState>=1')
    assert abs(page.locator('video').evaluate('(v)=>v.duration')-39)<.001
    page.locator('video').evaluate('(v)=>{v.muted=true;v.currentTime=37;return v.play()}')
    page.wait_for_timeout(350);assert page.locator('video').evaluate('(v)=>v.currentTime')>37
    browser.close()
report={'result':'PASS','duration_seconds':39,'dimensions':[1080,1920],'aspect_ratio':'9:16','fps':30,'frames':1170,
        'music_bpm':128,'audio':'Original music and SFX only; new narration pending.',
        'original_logo':'Pending; plain review typography only','real_software_ui':'Pending; conceptual motion plates only',
        'final_export_gate':'Correctly blocked pending actual assets','distinct_frames':len(set(hashes)),
        'manual_crm_open_before_history':True,'receipt_match_cuts':deltas,'freeze_frame':'PASS','full_decode':'PASS',
        'browser_checks':['all chapters','play/pause','mute','keyboard seek','end/replay','mobile overflow','reduced motion','missing-timeline error','actual MP4 seek/play'],
        'page_errors':errors,'console_errors':console,'failed_requests':failures,
        'bytes':movie.stat().st_size,'sha256':hashlib.sha256(movie.read_bytes()).hexdigest()}
(ROOT/'exports/validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
