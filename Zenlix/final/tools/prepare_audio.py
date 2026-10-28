"""Preserve the supplied recording at its original speed and mix a quiet score."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import wave

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
SOURCE = ASSETS / 'narration-upload.mp3'

def run(args):
    return subprocess.run(args, check=True, capture_output=True, text=True)

def main():
    run(['ffmpeg', '-y', '-v', 'error', '-i', str(SOURCE), '-ar', '48000',
         '-ac', '1', str(ASSETS / 'voice-original.wav')])
    with wave.open(str(ASSETS / 'voice-original.wav')) as audio:
        samples, rate = audio.getnframes(), audio.getframerate()
    duration = samples / rate
    config = json.loads((ROOT / 'timeline.json').read_text())
    assert abs(config['duration'] - duration) < 1 / rate
    assert abs(duration * config['fps'] - round(duration * config['fps'])) < 1e-6
    run(['python3', str(ROOT / 'tools/make_score.py')])
    # Speech stays at original speed, pitch, start offset and duration.
    graph = ('[0:a]asplit=2[v][side];[1:a]volume=0.14[m];'
             '[m][side]sidechaincompress=threshold=0.012:ratio=10:attack=5:release=220[d];'
             '[v][d]amix=inputs=2:duration=first:normalize=0[out]')
    premix = ASSETS / 'premix.wav'
    run(['ffmpeg', '-y', '-v', 'error', '-i', str(ASSETS / 'voice-original.wav'),
         '-i', str(ASSETS / 'score-v2.wav'), '-filter_complex', graph,
         '-map', '[out]', '-ar', str(rate), '-ac', '2', str(premix)])
    measure = run(['ffmpeg', '-hide_banner', '-i', str(premix), '-af',
                   'loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-'])
    levels = json.loads(re.findall(r'\{[^{}]+\}', measure.stderr)[-1])
    params = ':'.join(f'{key}={levels[value]}' for key, value in [
        ('measured_I', 'input_i'), ('measured_TP', 'input_tp'),
        ('measured_LRA', 'input_lra'), ('measured_thresh', 'input_thresh'),
        ('offset', 'target_offset')])
    run(['ffmpeg', '-y', '-v', 'error', '-i', str(premix), '-af',
         'loudnorm=I=-16:TP=-1.5:LRA=7:linear=true:' + params +
         f',aresample={rate},apad,atrim=end_sample={samples},asetpts=N/SR/TB',
         '-ar', str(rate), '-ac', '2', str(ASSETS / 'final-mix.wav')])
    premix.unlink()
    with wave.open(str(ASSETS / 'final-mix.wav')) as audio:
        assert audio.getnframes() == samples
    run(['ffmpeg', '-y', '-v', 'error', '-i', str(ASSETS / 'final-mix.wav'),
         '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
         str(ASSETS / 'final-mix.m4a')])
    report = {
        'voice_source': 'User-provided content.mp3; provider not independently verified',
        'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        'decoded_duration_seconds': duration, 'sample_rate': rate,
        'source_preserved_in_full': True, 'speed': 1.0, 'pitch_changed': False,
        'video_fps': config['fps'], 'video_frames': round(duration * config['fps']),
        'av_duration_difference_seconds': 0,
        'timing_method': 'Scene cuts placed inside measured pauses in the supplied recording; no word-level ASR verification.',
        'captions_burned_in': False,
        'scene_cuts_seconds': [s['start'] for s in config['scenes']],
        'mix': 'Quiet score with sidechain ducking; two-pass -16 LUFS / -1.5 dBTP normalization',
    }
    (ROOT / 'exports/audio-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    status = {'voiceReady': True, 'voiceSource': 'user-upload', 'audioUrl': 'assets/final-mix.m4a',
              'status': 'Full supplied recording with music ducking; original speed and pitch'}
    (ASSETS / 'audio-status.json').write_text(json.dumps(status, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
