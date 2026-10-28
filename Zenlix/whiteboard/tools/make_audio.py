"""Original gentle underscore, restrained ringing, pen sounds and editorial transitions."""
from pathlib import Path
import json
import subprocess
import wave
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
CFG=json.loads((ROOT/'timeline.json').read_text());SR=48000;D=CFG['duration']
rng=np.random.default_rng(28102026);mix=np.zeros((round(D*SR),2),dtype=np.float64)
def add(at,sig,gain=1,pan=0):
 i=round(at*SR)
 if i<0:sig=sig[-i:];i=0
 n=min(len(sig),len(mix)-i)
 if n<=0:return
 mix[i:i+n,0]+=sig[:n]*gain*np.sqrt((1-pan)/2)
 mix[i:i+n,1]+=sig[:n]*gain*np.sqrt((1+pan)/2)
def note(at,freq,dur,gain=.05,pan=0):
 t=np.arange(round(dur*SR))/SR
 env=(1-np.exp(-t*120))*np.exp(-t*3.8/dur)*np.minimum((dur-t)*45,1)
 sig=np.sin(2*np.pi*freq*t)+.18*np.sin(2*np.pi*freq*2*t)+.045*np.sin(2*np.pi*freq*3*t)
 add(at,sig*env,gain,pan)
def swell(at,dur=.25,gain=.013):
 t=np.arange(round(dur*SR))/SR;noise=np.diff(rng.standard_normal(len(t)+1))*.2
 add(at-.15,noise*np.sin(np.pi*t/dur)**2,gain,-.4);add(at-.12,noise*np.sin(np.pi*t/dur)**2,gain,.4)
beat=60/102
chords=[(130.81,164.81,196,246.94),(146.83,174.61,220,261.63),(110,130.81,164.81,196),(98,123.47,146.83,196)]
for i,at in enumerate(np.arange(0,D-2,beat)):
 chord=chords[(i//16)%4];soft=.55 if at<10 else .85
 if i%8==0:
  for n,f in enumerate(chord):note(float(at)+n*.018,f,beat*8,.013*soft,(-.4+n*.27))
 if i%2==0:note(float(at),chord[0]/2,beat*1.5,.032*soft)
 if i%2:note(float(at),chord[(i//2)%4]*2,beat*1.2,.027*soft,(-1 if i%4 else 1)*.4)
 if 24<=at<75 and i%4==2:
  tt=np.arange(round(.075*SR))/SR
  add(float(at),rng.standard_normal(len(tt))*np.exp(-tt*90),.006)
for cue in CFG['audioCues']:
 at=cue['t'];kind=cue['kind']
 if kind=='ring':
  for offset in [0,.43]:
   tt=np.arange(round(.25*SR))/SR;env=np.sin(np.pi*tt/.25)**2
   sig=(np.sin(2*np.pi*440*tt)+np.sin(2*np.pi*480*tt))*.5*env
   add(at+offset,sig,.075,-.15)
 elif kind=='draw':
  dur=.44;tt=np.arange(round(dur*SR))/SR
  noise=np.diff(rng.standard_normal(len(tt)+1))*.14
  env=np.sin(np.pi*tt/dur)**2*(.45+.55*np.sin(tt*70)**2)
  add(at,noise*env,.032,.3)
 elif kind=='swoosh':swell(at,.29,.027)
 elif kind=='notification':
  note(at,659.25,.23,.048,.1);note(at+.08,783.99,.24,.036,.1)
 elif kind=='reveal':
  for n,f in enumerate([261.63,329.63,392,493.88]):note(at+n*.055,f,1.3,.035)
 elif kind=='loss':note(at,196,.24,.037);note(at+.14,146.83,.3,.034)
for i,f in enumerate([130.81,196,261.63,329.63]):note(78+i*.04,f,4.5,.024)
t=np.arange(len(mix))/SR
mix*=np.minimum(t/.05,1)[:,None]*np.minimum((D-t)/1.8,1)[:,None]
# Leave headroom for a future narrator. No synthetic or recycled speech is inserted.
mix=np.tanh(mix)*.8
out=ROOT/'assets/score.wav'
with wave.open(str(out),'wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-y','-v','error','-i',str(out),'-c:a','aac','-b:a','192k','-movflags','+faststart',str(ROOT/'assets/score.m4a')],check=True)
print('Created 83-second original music/SFX track; no narrator.')
