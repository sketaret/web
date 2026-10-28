"""Check retimed actions, exact export duration and the complete voice in the MP4."""
import hashlib
import json
from pathlib import Path
import subprocess
import numpy as np
from scipy.signal import correlate
from playwright.sync_api import sync_playwright,expect

ROOT=Path(__file__).resolve().parents[1]
MOVIE=ROOT/'exports/zenlix-energy39-with-voice.mp4'
CONFIG=json.loads((ROOT/'timeline.json').read_text())

def run(args):return subprocess.run(args,capture_output=True,check=True)

probe=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(MOVIE)]).stdout)
video=next(s for s in probe['streams'] if s['codec_type']=='video')
audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (video['codec_name'],video['width'],video['height'],video['avg_frame_rate'])==('h264',1080,1920,'30/1')
assert int(video['nb_frames'])==1170
assert float(video['duration'])==float(audio['duration'])==float(probe['format']['duration'])==39
run(['ffmpeg','-v','error','-xerror','-i',str(MOVIE),'-f','null','-'])

def pcm(path):
    raw=run(['ffmpeg','-v','error','-i',str(path),'-ar','16000','-ac','1','-f','f32le','-']).stdout
    return np.frombuffer(raw,dtype='<f4')

source,encoded=pcm(ROOT/'assets/narration-upload.mp3'),pcm(MOVIE)
assert abs(len(source)/16000-34.16)<1/16000
checks=[]
for second in [1,7,12,17,22,27,31,33]:
    length=.65 if second==33 else .85
    ref=source[round(second*16000):round((second+length)*16000)]
    window=encoded[round((second-.15)*16000):round((second+length+.15)*16000)]
    pos=int(np.argmax(correlate(window,ref,mode='valid',method='fft')))
    offset=(pos-2400)/16
    similarity=float(np.corrcoef(ref,window[pos:pos+len(ref)])[0,1])
    assert abs(offset)<1 and similarity>.96,(second,offset,similarity)
    checks.append({'at_seconds':second,'offset_ms':offset,'correlation':round(similarity,6)})

assert CONFIG['crmManualOpenAt']<CONFIG['crmHistoryVisibleAt']
assert CONFIG['scenes'][-1]['start']==30.8
errors=[];console=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1100})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
    page.goto('http://127.0.0.1:8012/energy39-voiced/',wait_until='networkidle');page.evaluate('EnergyFilm.ready')
    expect(page.locator('#loading')).to_be_hidden()
    def words(t):
        return page.evaluate('''t=>{const g=EnergyFilm.canvas.getContext('2d'),old=g.fillText,words=[];
            g.fillText=function(...a){words.push(a[0]);return old.apply(this,a)};
            try{EnergyFilm.render(t)}finally{g.fillText=old}return words}''',t)
    assert 'أوردر ممكن' in words(3.8)
    assert 'تابع الفرصة.' in words(10)
    assert 'فتح ملف العميل' in words(23.5)
    assert 'مراجعة الشكوى السابقة' in words(24.8)
    assert 'كل مكالمة ليها قيمة' not in words(32)
    assert 'كل مكالمة ليها قيمة' in words(32.8)
    assert 'zenlix.org' in words(33.8)
    for i,scene in enumerate(CONFIG['scenes']):
        page.locator('.chapter').nth(i).click()
        assert scene['start']<=page.evaluate('EnergyPlayer.position')<scene['end']
    page.evaluate('EnergyPlayer.setPosition(12)');page.locator('#play').click();page.wait_for_timeout(500)
    assert page.evaluate('EnergyPlayer.playing') and page.evaluate('EnergyPlayer.position')>12.3
    page.evaluate('EnergyPlayer.pause()')
    page.evaluate('EnergyPlayer.setPosition(38.8)');page.locator('#play').click();page.wait_for_timeout(650)
    assert not page.evaluate('EnergyPlayer.playing') and page.evaluate('EnergyPlayer.position')==39
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.goto('http://127.0.0.1:8012/energy39-voiced/exports/zenlix-energy39-with-voice.mp4',wait_until='domcontentloaded')
    page.wait_for_function('document.querySelector("video")?.readyState>=1')
    page.locator('video').evaluate('(v)=>{v.muted=true;v.currentTime=32;return v.play()}')
    page.wait_for_timeout(350);assert page.locator('video').evaluate('(v)=>v.currentTime')>32
    browser.close()
assert not errors,errors
assert not console,console
gate=subprocess.run(['python3',str(ROOT/'tools/render_video.py'),'--final'],capture_output=True,text=True)
assert gate.returncode!=0 and 'authentic' in gate.stderr and 'real' in gate.stderr
report={'result':'PASS','duration_seconds':39,'voice_seconds':34.16,'music_tail_seconds':4.84,
        'dimensions':[1080,1920],'fps':30,'frames':1170,'source_voice_preserved_in_full':True,
        'speech_speed':1,'pitch_changed':False,'encoded_voice_offset_checks':checks,
        'scene_cuts_seconds':[s['start'] for s in CONFIG['scenes']],
        'retimed_actions':['opening conflict','follow-up','manual CRM opening','complaint history','spoken closing tagline'],
        'full_decode':'PASS','browser_checks':['chapters','play/pause','audio seeking','ending','mobile overflow','encoded MP4 playback'],
        'original_logo_and_real_ui':'Still pending; no fabricated production assets added',
        'page_errors':errors,'console_errors':console,'bytes':MOVIE.stat().st_size,
        'sha256':hashlib.sha256(MOVIE.read_bytes()).hexdigest()}
(ROOT/'exports/validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
