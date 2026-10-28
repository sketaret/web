"""Retiming anchors for the supplied recording: ASR-assisted phrases plus measured pauses."""
from pathlib import Path
import copy
import hashlib
import json

ROOT=Path(__file__).resolve().parents[1]
CANON=json.loads((ROOT/'timeline-canonical.json').read_text())
EXPECTED_SOURCE='f2f2c978887ea84154b5f53a332e3b8385c2ae2da8b0aadf192d8b76a31013db'
if hashlib.sha256((ROOT/'assets/narration-upload.mp3').read_bytes()).hexdigest()!=EXPECTED_SOURCE:
    raise RuntimeError('These phrase anchors belong to the supplied content (1).mp3. Re-align a different recording first.')
# Absolute output seconds / canonical local animation seconds. Cuts sit in real pauses.
MAPS=[
 [(0,0),(61/30,1.40625),(3.5,3.28125),(4.9,4.21875),(6.0,6.09375),(203/30,7)],
 [(203/30,0),(277/30,3)],
 [(277/30,0),(349/30,1.875),(374/30,2.8125),(400/30,3.75),(436/30,4.6875),(451/30,5.625),(15.4,6)],
 [(15.4,0),(470/30,.52),(17.7,2.8125),(19.8,4.6875),(605/30,5.625),(20.5,6)],
 [(20.5,0),(21.9,2.34375),(694/30,2.8125),(728/30,4.21875),(25.5,7.03125),(26.1,9)],
 [(26.1,0),(27.8,1.5),(875/30,3),(30.0,4.5),(30.8,6)],
 [(30.8,0),(31.5,.65),(32.3,1.1),(34.16,2),(39,2)],
]

def actual(index,canonical_local):
    points=MAPS[index]
    for (ta,ca),(tb,cb) in zip(points,points[1:]):
        if canonical_local<=cb:
            return ta+(tb-ta)*(canonical_local-ca)/(cb-ca) if cb>ca else ta
    return points[-1][0]

config=copy.deepcopy(CANON)
for scene,points in zip(config['scenes'],MAPS):
    scene['start']=round(points[0][0],9);scene['end']=round(points[-1][0],9)
    scene['timeMap']=[[round(t-scene['start'],9),c] for t,c in points]
for cue,old in zip(config['editCues'],CANON['editCues']):
    index=next(i for i,s in enumerate(CANON['scenes']) if old['t']<s['end'])
    cue['t']=round(actual(index,old['t']-CANON['scenes'][index]['start']),6)
config['crmManualOpenAt']=round(actual(4,2.8125),6)
config['crmHistoryVisibleAt']=round(actual(4,4.21875),6)
config['closingVoiceCues']={'brandAt':30.8,'taglineAt':32.3,'websiteAt':997/30}
config['audioStatus']='uploaded_narration_preserved'
config['alignmentMethod']='Local Whisper small/base ASR-assisted phrase identification and measured recording pauses; no burned-in word captions.'
(ROOT/'timeline.json').write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n')
report={'source_sha256':hashlib.sha256((ROOT/'assets/narration-upload.mp3').read_bytes()).hexdigest(),
        'method':config['alignmentMethod'],
        'asr_model':'OpenAI Whisper small/base via official Sherpa-ONNX models, processed locally',
        'source_model_url':'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-small.tar.bz2',
        'notes':'ASR estimates guide scene/phrase timing; they do not certify every word or provide human auditory review.',
        'cut_seconds':[s['start'] for s in config['scenes']],
        'manual_crm_open_seconds':config['crmManualOpenAt'],'history_visible_seconds':config['crmHistoryVisibleAt'],
        'spoken_tagline_onset_seconds':32.3,'voice_duration_seconds':34.16,'video_duration_seconds':39,
        'frame_quantization_max_seconds':1/60,'voice_speed':1,'voice_start_offset_seconds':0,
        'maps':[{'scene':s['kind'],'actual_to_canonical':points} for s,points in zip(config['scenes'],MAPS)]}
(ROOT/'exports/alignment-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
# Rebuild score accents at the moved actions; keep the original music tempo.
source=(ROOT.parent/'energy39/tools/make_audio.py').read_text()
source=source.replace("SR=48000;D=CFG['duration'];BPM=128;BEAT=60/BPM", "SR=48000;D=CFG['duration'];BPM=128;BEAT=60/BPM\nCRM_START=CFG['scenes'][4]['start'];CRM_END=CFG['scenes'][4]['end'];CLOSE_START=CFG['scenes'][6]['start']")
source=source.replace('np.arange(0,37,BEAT)','np.arange(0,CLOSE_START,BEAT)').replace('crm=22<=at<31','crm=CRM_START<=at<CRM_END').replace('note(at+n*.025,f,1.8,.043)','note(at+n*.025,f,D-at-n*.025,.043)')
source=source.replace('39 seconds; no narration.','39 seconds; score for uploaded narration.')
(ROOT/'tools/make_audio.py').write_text(source)
print(json.dumps({'cuts':report['cut_seconds'],'crm_manual_open':config['crmManualOpenAt'],'history':config['crmHistoryVisibleAt']},indent=2))
