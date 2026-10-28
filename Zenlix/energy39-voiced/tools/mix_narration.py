"""Mix the real uploaded recording at original speed, padding only the ending."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import wave

ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'assets'
RATE=48000
TOTAL=39*RATE

def run(args):
    return subprocess.run(args,check=True,capture_output=True,text=True)

def main():
    source=A/'narration-upload.mp3'
    run(['ffmpeg','-y','-v','error','-i',str(source),'-ar',str(RATE),'-ac','1',str(A/'voice-original.wav')])
    with wave.open(str(A/'voice-original.wav')) as voice:
        frames=voice.getnframes()
    if frames>TOTAL:
        raise RuntimeError('The source is longer than 39 seconds. Do not silently speed up or cut narration.')
    run(['python3',str(ROOT/'tools/make_audio.py')])
    graph=(f'[0:a]apad,atrim=end_sample={TOTAL},asetpts=N/SR/TB,asplit=2[v][side];'
           '[1:a]volume=0.32[m];'
           '[m][side]sidechaincompress=threshold=0.018:ratio=6:attack=5:release=180[d];'
           '[v][d]amix=inputs=2:duration=first:normalize=0[out]')
    run(['ffmpeg','-y','-v','error','-i',str(A/'voice-original.wav'),'-i',str(A/'score.wav'),
         '-filter_complex',graph,'-map','[out]','-ar',str(RATE),'-ac','2',str(A/'premix.wav')])
    result=run(['ffmpeg','-hide_banner','-i',str(A/'premix.wav'),'-af',
                'loudnorm=I=-16:TP=-1.8:LRA=7:print_format=json','-f','null','-'])
    measured=json.loads(re.findall(r'\{[^{}]+\}',result.stderr)[-1])
    params=':'.join(f'{k}={measured[v]}' for k,v in [
        ('measured_I','input_i'),('measured_TP','input_tp'),('measured_LRA','input_lra'),
        ('measured_thresh','input_thresh'),('offset','target_offset')])
    filt=('loudnorm=I=-16:TP=-1.8:LRA=7:linear=true:'+params+
          f',aresample={RATE},apad,atrim=end_sample={TOTAL},asetpts=N/SR/TB')
    run(['ffmpeg','-y','-v','error','-i',str(A/'premix.wav'),'-af',filt,
         '-ar',str(RATE),'-ac','2',str(A/'final-mix.wav')])
    (A/'premix.wav').unlink()
    with wave.open(str(A/'final-mix.wav')) as mix:
        assert mix.getnframes()==TOTAL
    run(['ffmpeg','-y','-v','error','-i',str(A/'final-mix.wav'),'-c:a','aac','-b:a','192k',
         '-movflags','+faststart',str(A/'final-mix.m4a')])
    assets=json.loads((A/'production-assets.json').read_text())
    assets['voice'].update(ready=True,mix='assets/final-mix.wav')
    assets['note']='Uploaded narration mixed at original speed. Original logo and real UI remain pending.'
    (A/'production-assets.json').write_text(json.dumps(assets,indent=2)+'\n')
    report={'source':'User-uploaded content (1).mp3','provider':'Not independently verified',
            'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
            'decoded_voice_seconds':frames/RATE,'voice_start_seconds':0,
            'source_preserved_in_full':True,'speech_speed':1.0,'pitch_changed':False,
            'output_seconds':39,'music_tail_seconds':39-frames/RATE,
            'music_bpm':128,'mix':'Sidechain ducking and two-pass -16 LUFS / -1.8 dBTP normalization'}
    (ROOT/'exports/audio-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
