"""Check encoded AV duration, original voice timing, full decode and review playback."""
import hashlib
import json
from pathlib import Path
import subprocess
import numpy as np
from playwright.sync_api import sync_playwright
from scipy.signal import correlate

ROOT = Path(__file__).resolve().parents[1]
MOVIE = ROOT / 'exports/zenlix-final.mp4'
config = json.loads((ROOT / 'timeline.json').read_text())

def run(args):
    return subprocess.run(args, check=True, capture_output=True)

probe = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format',
                        '-of', 'json', str(MOVIE)]).stdout)
v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
a = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
assert (v['codec_name'], v['width'], v['height']) == ('h264', 1920, 1080)
assert v['avg_frame_rate'] == '25/1' and int(v['nb_frames']) == 1728
assert a['codec_name'] == 'aac' and a['sample_rate'] == '48000'
assert float(v['duration']) == float(a['duration']) == config['duration']
run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(MOVIE), '-f', 'null', '-'])

def pcm(path):
    raw = run(['ffmpeg', '-v', 'error', '-i', str(path), '-ar', '16000',
               '-ac', '1', '-f', 'f32le', '-']).stdout
    return np.frombuffer(raw, dtype='<f4')

source, encoded = pcm(ROOT / 'assets/narration-upload.mp3'), pcm(MOVIE)
offsets = []
for second in [1, 15, 30, 45, 67]:
    ref = source[second*16000:(second+1)*16000]
    window = encoded[second*16000-3200:(second+1)*16000+3200]
    best = int(np.argmax(correlate(window, ref, mode='valid', method='fft')))
    lag_ms = (best - 3200) / 16
    similarity = float(np.corrcoef(ref, window[best:best+len(ref)])[0, 1])
    assert abs(lag_ms) < 1 and similarity > .97, (second, lag_ms, similarity)
    offsets.append({'at_seconds': second, 'offset_ms': lag_ms, 'correlation': round(similarity, 6)})

errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True)
    page = browser.new_page(viewport={'width':1440, 'height':1000})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:8012/final/', wait_until='networkidle')
    page.evaluate('ZenlixFilm.ready')
    assert page.locator('.chapter').count() == 8
    for i, scene in enumerate(config['scenes']):
        page.locator('.chapter').nth(i).click()
        assert scene['start'] <= page.evaluate('ZenlixPlayer.position') < scene['end']
    page.evaluate('ZenlixPlayer.setPosition(68.9)')
    page.locator('#play').click()
    page.wait_for_timeout(700)
    assert page.evaluate('ZenlixPlayer.position') == 69.12
    assert not page.evaluate('ZenlixPlayer.playing')
    page.locator('#play').click()
    page.wait_for_timeout(300)
    assert 0 < page.evaluate('ZenlixPlayer.position') < 1
    page.evaluate('ZenlixPlayer.pause()')
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.goto('http://127.0.0.1:8012/final/exports/zenlix-final.mp4',wait_until='domcontentloaded')
    page.wait_for_function('document.querySelector("video")?.readyState >= 1')
    assert abs(page.locator('video').evaluate('(v)=>v.duration')-69.12) < .001
    page.locator('video').evaluate('(v)=>{v.muted=true;v.currentTime=67;return v.play()}')
    page.wait_for_timeout(350)
    assert page.locator('video').evaluate('(v)=>v.currentTime') > 67
    browser.close()
assert not errors, errors
report = {'result':'PASS','duration_seconds':69.12,'video_frames':1728,'fps':25,
          'resolution':'1920x1080','codec':'H.264 / AAC','av_duration_difference_seconds':0,
          'full_decode':'PASS','encoded_voice_offsets':offsets,'page_errors':errors,
          'browser_checks':['all eight chapters','ending and replay','mobile overflow','encoded MP4 seek/play'],
          'word_level_transcript_verified':False,
          'file_bytes':MOVIE.stat().st_size,'sha256':hashlib.sha256(MOVIE.read_bytes()).hexdigest()}
(ROOT/'exports/validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
