"""Original 128 BPM electronic score and editorial effects, exactly 39 seconds."""
from pathlib import Path
import json
import wave
import subprocess
import numpy as np
ROOT=Path(__file__).resolve().parents[1];CFG=json.loads((ROOT/'timeline.json').read_text())
SR=48000;D=CFG['duration'];BPM=128;BEAT=60/BPM
CRM_START=CFG['scenes'][4]['start'];CRM_END=CFG['scenes'][4]['end'];CLOSE_START=CFG['scenes'][6]['start']
rng=np.random.default_rng(39128);mix=np.zeros((round(D*SR),2),dtype=np.float64)
def add(at,sig,gain=1,pan=0):
 i=round(at*SR)
 if i<0:sig=sig[-i:];i=0
 n=min(len(sig),len(mix)-i)
 if n<=0:return
 mix[i:i+n,0]+=sig[:n]*gain*np.sqrt((1-pan)/2)
 mix[i:i+n,1]+=sig[:n]*gain*np.sqrt((1+pan)/2)
def note(at,f,dur,gain=.04,pan=0,bass=False):
 t=np.arange(round(dur*SR))/SR
 if bass:sig=np.sin(2*np.pi*f*t)+.2*np.sin(4*np.pi*f*t)
 else:sig=np.sin(2*np.pi*f*t)+.12*np.sin(4*np.pi*f*t)+.04*np.sin(6*np.pi*f*t)
 env=(1-np.exp(-t*150))*np.exp(-t*(3 if bass else 5)/dur)*np.minimum((dur-t)*100,1)
 add(at,sig*env,gain,pan)
def kick(at,gain=.21):
 t=np.arange(round(.28*SR))/SR
 phase=2*np.pi*(49*t+91*.022*(1-np.exp(-t/.022)))
 add(at,np.sin(phase)*np.exp(-t*22),gain)
def hat(at,gain=.018):
 t=np.arange(round(.055*SR))/SR
 add(at,np.diff(rng.standard_normal(len(t)+1))*.35*np.exp(-t*110),gain,.45 if int(at*4)%2 else -.45)
def snare(at,gain=.055):
 t=np.arange(round(.13*SR))/SR
 noise=np.diff(rng.standard_normal(len(t)+1))*.23
 add(at,(noise+.15*np.sin(2*np.pi*180*t))*np.exp(-t*36),gain)
def whoosh(at,gain=.025):
 dur=.19;t=np.arange(round(dur*SR))/SR;noise=np.diff(rng.standard_normal(len(t)+1))*.22
 add(at-.11,noise*np.sin(np.pi*t/dur)**2,gain,-.35);add(at-.09,noise*np.sin(np.pi*t/dur)**2,gain,.35)
chords=[(146.83,174.61,220,261.63),(116.54,146.83,174.61,220),(174.61,220,261.63,329.63),(130.81,164.81,196,233.08)]
for i,at in enumerate(np.arange(0,CLOSE_START,BEAT)):
 at=float(at);c=chords[(i//16)%4];crm=CRM_START<=at<CRM_END;strength=.43 if crm else 1
 if i%8==0:
  for j,f in enumerate(c):note(at+j*.014,f,BEAT*7,.014*strength,(-.45+j*.3))
 if at>1:
  if i%2==0:kick(at,.18*strength);note(at,c[0]/2,.29,.105*strength,bass=True)
  if i%4==2:snare(at,.075*strength)
  if not crm:hat(at+BEAT/2,.017);note(at+BEAT/2,c[(i//2)%4]*2,BEAT*.6,.044,(-.4 if i%2 else .4))
for at in [0,.46875]:
 t=np.arange(round(.30*SR))/SR;env=np.sin(np.pi*t/.30)**2
 add(at,(np.sin(2*np.pi*440*t)+np.sin(2*np.pi*480*t))*.5*env,.15)
for cue in CFG['editCues']:
 at=cue['t'];kind=cue['kind']
 if kind in ['whip','match','reverse','transfer','morph','benefit','ecosystem']:whoosh(at,.038 if kind in ['match','reverse'] else .023)
 if kind in ['click','manual-open','history']:
  note(at,1108,.05,.052);note(at+.018,659,.06,.025)
 if kind=='draw':
  tt=np.arange(round(.15*SR))/SR;noise=np.diff(rng.standard_normal(len(tt)+1))*.17
  add(at,noise*np.sin(np.pi*tt/.15)**2,.024,.2)
 if kind in ['reveal','callback','chime']:
  note(at,523.25,.23,.048);note(at+.075,659.25,.26,.037)
 if kind in ['freeze','loss']:
  note(at,146.83,.15,.067,bass=True);note(at+.09,110,.17,.046,bass=True)
 if kind=='brand':
  kick(at,.22);note(at,49,.8,.13,bass=True)
  for n,f in enumerate([146.83,220,293.66,349.23]):note(at+n*.025,f,D-at-n*.025,.043)
t=np.arange(len(mix))/SR
mix*=np.minimum((D-t)/.55,1)[:,None]
mix=np.tanh(mix)*.83
out=ROOT/'assets/score.wav'
with wave.open(str(out),'wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-y','-v','error','-i',str(out),'-c:a','aac','-b:a','192k','-movflags','+faststart',str(ROOT/'assets/score.m4a')],check=True)
print('128 BPM original music/SFX prepared; 39 seconds; score for uploaded narration.')
