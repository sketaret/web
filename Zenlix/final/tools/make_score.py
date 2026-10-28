"""Original 132-BPM V2 score, ringing hook, editorial hits and stereo transitions."""
from pathlib import Path
import json
import re
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT/'timeline.json').read_text())
SR, SECONDS, BPM = 48000, CONFIG['duration'], 132
CUES={q['kind']:q['t'] for q in CONFIG['motionCues']}
BRAND,TOOLS,PROMISE,CLOSING=[CUES[k] for k in ['brand-reveal','recordings','faster','closing']]
rng = np.random.default_rng(20261028)
mix = np.zeros((round(SR * SECONDS), 2), dtype=np.float64)

def add(start, signal, gain=1, pan=0):
    begin = round(start * SR)
    if begin < 0:
        signal = signal[-begin:]
        begin = 0
    n = min(len(signal), len(mix) - begin)
    if n <= 0:
        return
    sig = signal[:n] * gain
    mix[begin:begin+n, 0] += sig * np.sqrt((1-pan)/2)
    mix[begin:begin+n, 1] += sig * np.sqrt((1+pan)/2)

def tone(start, duration, notes, gain=.06, decay=4, pan=0, overtones=False):
    t = np.arange(round(SR * duration)) / SR
    sig = sum(np.sin(2*np.pi*f*t) for f in notes) / len(notes)
    if overtones:
        sig += .14 * sum(np.sin(4*np.pi*f*t) for f in notes) / len(notes)
    env = np.minimum(t*120, 1) * np.exp(-decay*t/duration)
    env *= np.minimum((duration-t)*80, 1)
    add(start, sig*env, gain, pan)

def kick(start, gain=.2):
    t = np.arange(round(.24*SR)) / SR
    phase = 2*np.pi*(47*t + 85*.023*(1-np.exp(-t/.023)))
    add(start, np.sin(phase)*np.exp(-t*25), gain)

def hat(start, gain=.022, pan=.5):
    t = np.arange(round(.045*SR)) / SR
    noise = np.diff(rng.standard_normal(len(t)+1))*.4
    add(start, noise*np.exp(-t*130), gain, pan)

def clap(start):
    for offset, level in [(0,.055),(.012,.038),(.024,.025)]:
        t = np.arange(round(.1*SR)) / SR
        noise = rng.standard_normal(len(t))
        add(start+offset, noise*np.exp(-t*55), level)

def whoosh(at, gain=.06):
    duration=.20
    t=np.arange(round(duration*SR))/SR
    noise=np.diff(rng.standard_normal(len(t)+1))*.3
    env=np.sin(np.pi*t/duration)**2
    add(at-.15,noise*env,gain,-.5)
    add(at-.13,noise*env,gain,.5)

beat=60/BPM
chords=[(146.83,220,293.66,349.23),(174.61,220,261.63,349.23),
        (130.81,196,261.63,329.63),(116.54,174.61,233.08,293.66)]
for i,start in enumerate(np.arange(0,SECONDS-1,beat)):
    start=float(start)
    chord=chords[(i//16)%4]
    intensity=.35 if start<BRAND else .75 if start<CONFIG['scenes'][2]['start'] else 1
    if i%8==0:
        tone(start,beat*8,chord,.07*intensity,decay=1.7)
    tone(start+beat/2,beat*.72,[chord[i%4]*2],.045*intensity,decay=5,
         pan=(-1 if i%2 else 1)*.45,overtones=True)
    if BRAND<=start<CLOSING:
        if i%2==0:
            kick(start,.18)
            tone(start,.24,[chord[0]/2],.095,decay=4)
        if i%4==2:
            clap(start)
        hat(start+beat/2,.018,(-1 if i%2 else 1)*.6)
        if CONFIG['scenes'][2]['start']<=start<PROMISE and i%2:
            hat(start+beat*.75,.009,-.4)

for at in [.12,.59,1.05]:
    tone(at,.28,[440,480],.17,decay=.5)
tone(CUES['cancel'],.18,[185,246],.17,decay=4)
kick(CUES['cancel'],.25)
for cue in json.loads((ROOT/'timeline.json').read_text())['motionCues']:
    at=cue['t']
    if at>1:
        whoosh(at)
        tone(at,.10,[880,1320],.052,decay=5)
tone(BRAND,1.5,[293.66,440,587.33],.11,decay=2)
tone(CUES['contact-result'],.45,[440,554.37,659.25],.08,decay=3)
tone(CLOSING,SECONDS-CLOSING,[146.83,220,293.66,440],.12,decay=1.8)
fade=np.minimum(np.arange(len(mix))/SR/.08,1)
fade*=np.minimum((len(mix)-np.arange(len(mix)))/SR/1.15,1)
mix*=fade[:,None]
peak=np.max(np.abs(mix))
mix=np.tanh(mix/max(peak,.001)*.9)*.74
with wave.open(str(ROOT/'assets/score-v2.wav'),'wb') as out:
    out.setnchannels(2);out.setsampwidth(2);out.setframerate(SR)
    out.writeframes((mix*32767).astype('<i2').tobytes())

print('Created soundtrack following uploaded-audio scene boundaries.')
