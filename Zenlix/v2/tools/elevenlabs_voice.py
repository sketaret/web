"""ElevenLabs Egyptian narration with real character timestamps and bounded retiming.

Credentials come only from ELEVENLABS_API_KEY. No credential values are logged,
saved in source, or copied into outputs. Network/TLS verification stays enabled.
"""
import argparse
import base64
import hashlib
import json
import math
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
import wave
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
SR=48000
API='https://api.elevenlabs.io'

def request(path,key,body=None):
    data=json.dumps(body,ensure_ascii=False).encode() if body is not None else None
    req=urllib.request.Request(API+path,data=data,headers={
        'xi-api-key':key,'Content-Type':'application/json','Accept':'application/json'},
        method='POST' if data is not None else 'GET')
    try:
        with urllib.request.urlopen(req,timeout=150) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        # Response bodies may contain sensitive diagnostics: never echo them.
        raise RuntimeError(f'ElevenLabs returned HTTP {e.code} for {path.split("?")[0]}. Check the saved credential, plan and provider permissions.') from None
    except urllib.error.URLError as e:
        raise RuntimeError('ElevenLabs network request failed: '+str(e.reason)) from None

def probe(path):
    return json.loads(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration',
        '-of','json',str(path)],capture_output=True,text=True,check=True).stdout)['format']

def voice_is_egyptian_male(voice):
    labels=voice.get('labels') or {}
    accent=' '.join(str(v) for k,v in labels.items() if k in ('accent','language','locale'))
    description=accent+' '+str(voice.get('name') or '')+' '+str(voice.get('description') or '')
    male=str(labels.get('gender','')).lower()=='male'
    egyptian=any(t in description.lower() for t in ['egyptian','ar-eg','مصري','مصرى'])
    return male and egyptian

def choose_voice(key,explicit=None):
    if explicit:
        voice=request('/v1/voices/'+urllib.parse.quote(explicit,safe=''),key)
        if not voice_is_egyptian_male(voice):
            raise RuntimeError('The selected voice metadata does not identify an Egyptian male voice. Choose an appropriate voice; do not substitute an unrelated default.')
        return voice
    found=[]
    for term in ['egyptian','مصري']:
        params=urllib.parse.urlencode({'search':term,'gender':'male','page_size':100})
        found.extend(request('/v2/voices?'+params,key).get('voices',[]))
        candidates=[v for v in found if voice_is_egyptian_male(v)]
        if candidates:
            return candidates[0]
    raise RuntimeError('No Egyptian male voice was found in the account. Add one in ElevenLabs, then set ELEVENLABS_VOICE_ID to its non-secret ID.')

def validate_alignment(alignment):
    chars=alignment.get('characters',[])
    starts=alignment.get('character_start_times_seconds',[])
    ends=alignment.get('character_end_times_seconds',[])
    if not chars or len(chars)!=len(starts) or len(chars)!=len(ends):
        raise RuntimeError('ElevenLabs did not return a complete character alignment.')
    if any(not math.isfinite(float(v)) for v in starts+ends):
        raise RuntimeError('Non-finite character timings.')
    if any(a<0 or b<a for a,b in zip(starts,ends)) or any(b<a for a,b in zip(starts,starts[1:])):
        raise RuntimeError('Invalid or non-monotonic ElevenLabs character timings.')
    return chars,starts,ends

def caption_groups(chars,starts,ends):
    text=''.join(chars)
    words=list(re.finditer(r'\S+',text))
    groups=[]
    for at in range(0,len(words),7):
        batch=words[at:at+7]
        first,last=batch[0].start(),batch[-1].end()
        groups.append({'start':round(starts[first],4),'end':round(ends[last-1],4),
                       'text':text[first:last]})
    return groups

def plain(s):
    return re.sub('[\u064b-\u065f\u0670ـ]','',s)

def anchor_time(chars,starts,phrase):
    # Keep a map back to original character positions when stripping diacritics.
    normalized=[];positions=[]
    for i,ch in enumerate(chars):
        for kept in plain(ch):
            normalized.append(kept);positions.append(i)
    found=''.join(normalized).find(plain(phrase))
    return starts[positions[found]] if found>=0 else None

def write_wav(path,samples):
    with wave.open(str(path),'wb') as out:
        out.setnchannels(1);out.setsampwidth(2);out.setframerate(SR)
        out.writeframes((np.clip(samples,-1,1)*32767).astype('<i2').tobytes())

def mix_audio():
    voice=ROOT/'assets/voice-over-v2.wav';score=ROOT/'assets/score-v2.wav'
    premix=ROOT/'assets/.premix-v2.wav';final=ROOT/'assets/final-mix-v2.wav'
    graph='[0:a]asplit=2[v][side];[1:a]volume=0.32[m];[m][side]sidechaincompress=threshold=0.018:ratio=8:attack=7:release=180[d];[v][d]amix=inputs=2:normalize=0,alimiter=limit=0.85:level=false:latency=true[out]'
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(voice),'-i',str(score),'-filter_complex',graph,
        '-map','[out]','-ar',str(SR),'-ac','2','-t','65',str(premix)],check=True)
    analysis=subprocess.run(['ffmpeg','-hide_banner','-i',str(premix),'-af',
        'loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
    matches=re.findall(r'\{[^{}]+\}',analysis.stderr)
    if not matches: raise RuntimeError('Audio loudness measurement is unavailable.')
    measured=json.loads(matches[-1])
    filt=('loudnorm=I=-16:TP=-1.5:LRA=7:linear=true:'+
          ':'.join(f'{k}={measured[v]}' for k,v in [('measured_I','input_i'),('measured_TP','input_tp'),
            ('measured_LRA','input_lra'),('measured_thresh','input_thresh'),('offset','target_offset')]))
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(premix),'-af',filt,
        '-ar',str(SR),'-ac','2','-t','65',str(final)],check=True)
    premix.unlink()
    return measured

def generate(key,voice_id,model):
    config=json.loads((ROOT/'timeline.json').read_text())
    voice=choose_voice(key,voice_id)
    models=request('/v1/models',key)
    if not any(m.get('model_id')==model and m.get('can_do_text_to_speech') for m in models):
        raise RuntimeError('Selected TTS model is unavailable for this account.')
    clipdir=ROOT/'assets/voice-clips';clipdir.mkdir(exist_ok=True)
    samples=np.zeros(SR*65,dtype=np.float64)
    records=[];subtitles=[]
    wanted={0:[('cancel','كنسل'),('rival','هتلحقه')],
            2:[('employee-focus','اسم الموظف'),('timeline-focus','توقيت المكالمة')],
            3:[('callback','ارجع لهم بسرعة'),('contact-result','أوردر جديد')],
            4:[('coaching','اعرف نقاط قوتهم'),('progress','طوّر أداءهم')],
            5:[('reporting','الوارد والصادر'),('assistant','مساعد زِنليكس')],
            6:[('faster','متابعة أسرع'),('stronger','فريق أقوى'),('better','خدمة أحسن')]}
    for i,scene in enumerate(config['scenes']):
        body={'text':scene['voice'],'model_id':model,'seed':20261028+i,
              'voice_settings':{'stability':.5,'similarity_boost':.8,'style':.2,'use_speaker_boost':True,'speed':1.04}}
        if i:body['previous_text']=config['scenes'][i-1]['voice']
        if i+1<len(config['scenes']):body['next_text']=config['scenes'][i+1]['voice']
        digest=hashlib.sha256(json.dumps({'voice_id':voice['voice_id'],'body':body},sort_keys=True,ensure_ascii=False).encode()).hexdigest()
        mp3=clipdir/f'{i+1:02}.mp3';meta=clipdir/f'{i+1:02}.json'
        cached=json.loads(meta.read_text()) if meta.exists() else None
        if not mp3.exists() or not cached or cached.get('input_hash')!=digest:
            response=request('/v1/text-to-speech/'+urllib.parse.quote(voice['voice_id'],safe='')+'/with-timestamps?output_format=mp3_44100_128',key,body)
            alignment=response.get('alignment') or response.get('normalized_alignment')
            if not alignment:raise RuntimeError('TTS returned no timing alignment.')
            validate_alignment(alignment)
            mp3.write_bytes(base64.b64decode(response['audio_base64'],validate=True))
            cached={'input_hash':digest,'alignment':alignment,'provider':'ElevenLabs','model':model,'voice_id':voice['voice_id']}
            meta.write_text(json.dumps(cached,ensure_ascii=False,indent=2)+'\n')
        chars,starts,ends=validate_alignment(cached['alignment'])
        spoken=[j for j,ch in enumerate(chars) if ch.strip()]
        trim=max(0,starts[spoken[0]]-.055)
        end=min(float(probe(mp3)['duration']),ends[spoken[-1]]+.13)
        available=scene['end']-scene['start']-.45
        factor=max(1,(end-trim)/available)
        if factor>1.12:
            raise RuntimeError(f'Scene {i+1} needs {factor:.3f}× speed; exceeds the 1.12× quality limit. Shorten that text or re-record deliberately. Existing clips are cached.')
        decoded=subprocess.run(['ffmpeg','-v','error','-i',str(mp3),'-af',
            f'atrim=start={trim:.6f}:end={end:.6f},asetpts=PTS-STARTPTS,atempo={factor:.8f}',
            '-ar',str(SR),'-ac','1','-f','f32le','-'],capture_output=True,check=True).stdout
        segment=np.frombuffer(decoded,dtype='<f4')
        at=round((scene['start']+.18)*SR)
        if at+len(segment)>round((scene['end']-.12)*SR):
            raise RuntimeError(f'Scene {i+1} audio crosses its cut boundary.')
        samples[at:at+len(segment)]+=segment
        shifted_starts=[scene['start']+.18+(x-trim)/factor for x in starts]
        shifted_ends=[scene['start']+.18+(x-trim)/factor for x in ends]
        subtitles.extend(caption_groups(chars,shifted_starts,shifted_ends))
        for kind,phrase in wanted.get(i,[]):
            exact=anchor_time(chars,shifted_starts,phrase)
            if exact is None:raise RuntimeError(f'Missing spoken cue: {phrase}')
            quantized=round(exact*config['fps'])/config['fps']
            for cue in config['motionCues']:
                if cue['kind']==kind:cue.update(t=round(quantized,6),spokenTime=round(exact,6),source='ElevenLabs character alignment')
        records.append({'scene':i+1,'start':scene['start']+.18,'end':(at+len(segment))/SR,
                        'speed_factor':factor,'source_sha256':hashlib.sha256(mp3.read_bytes()).hexdigest(),
                        'alignment':{'characters':chars,'character_start_times_seconds':shifted_starts,'character_end_times_seconds':shifted_ends}})
        print(f'Scene {i+1}: ElevenLabs audio {len(segment)/SR:.2f}s; rate {factor:.3f}×; within its cut.',flush=True)
    write_wav(ROOT/'assets/voice-over-v2.wav',samples)
    config.update(voiceStatus='generated',subtitles=subtitles,subtitlesSource='ElevenLabs character alignment')
    (ROOT/'timeline.json').write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n')
    subprocess.run([sys.executable,str(ROOT/'tools/make_score.py')],check=True)
    measured=mix_audio()
    report={'provider':'ElevenLabs','voice_id':voice['voice_id'],'voice_name':voice.get('name'),
            'model':model,'duration':65,'sample_rate':SR,'segments':records,
            'maximum_cut_quantization_error_seconds':max([abs(c.get('spokenTime',c['t'])-c['t']) for c in config['motionCues']]),
            'music_ducking':True,'loudness_analysis':measured,
            'pronunciation_review':'Listening review still required; automated timing checks do not guarantee 100% pronunciation quality.'}
    (ROOT/'exports/voice-timing-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    status={'voiceReady':True,'voiceProvider':'ElevenLabs','audioUrl':'assets/final-mix-v2.wav',
            'alignmentVerified':True,'voiceName':voice.get('name')}
    (ROOT/'assets/audio-status.json').write_text(json.dumps(status,ensure_ascii=False,indent=2)+'\n')
    def timestamp(t):
        ms=round(max(0,t)*1000)
        return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
    lines=[]
    for j,sub in enumerate(subtitles):lines.extend([str(j+1),timestamp(sub['start'])+' --> '+timestamp(sub['end']),sub['text'],''])
    (ROOT/'exports/zenlix-v2-ar-aligned.srt').write_text('\n'.join(lines))
    print('Created actual ElevenLabs narration, measured caption/cut timings, and ducked final mix. Review pronunciation before publication.')

def main():
    parser=argparse.ArgumentParser()
    mode=parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check',action='store_true')
    mode.add_argument('--generate',action='store_true')
    mode.add_argument('--list-voices',action='store_true')
    parser.add_argument('--voice-id',default=os.environ.get('ELEVENLABS_VOICE_ID'))
    parser.add_argument('--model',default='eleven_multilingual_v2')
    args=parser.parse_args()
    key=os.environ.get('ELEVENLABS_API_KEY')
    if not key:raise RuntimeError('BLOCKED: ELEVENLABS_API_KEY is absent. Supply it securely in environment settings, never in chat or source files.')
    if args.check:
        models=request('/v1/models',key)
        print('ElevenLabs authenticated network access: OK; TTS models:',sum(bool(m.get('can_do_text_to_speech')) for m in models))
    elif args.list_voices:
        params=urllib.parse.urlencode({'search':'egyptian','gender':'male','page_size':100})
        for v in request('/v2/voices?'+params,key).get('voices',[]):
            print(json.dumps({'voice_id':v['voice_id'],'name':v.get('name'),'labels':v.get('labels')},ensure_ascii=False))
    else:generate(key,args.voice_id,args.model)

if __name__=='__main__':
    try:main()
    except (RuntimeError,subprocess.CalledProcessError) as e:
        print(str(e),file=sys.stderr)
        raise SystemExit(2)
