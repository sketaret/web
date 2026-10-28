"""ZIP delivery containing the actual voiced film for direct downloading."""
from pathlib import Path
import hashlib
import zipfile

ROOT=Path(__file__).resolve().parents[1]
movie=ROOT/'exports/zenlix-energy39-with-voice.mp4'
out=ROOT/'exports/zenlix-energy39-with-voice.zip'
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    archive.write(movie,movie.name)
    archive.write(ROOT/'exports/storyboard.png','storyboard.png')
    archive.writestr('READ-ME-AR.txt',
        'ZENLIX SOLUTIONS — نسخة بالصوت المرفق\n\n'
        'مدة الفيديو 39 ثانية، بدقة 1080×1920، 30 إطارًا في الثانية.\n'
        'تم استخدام التسجيل المرفق كاملًا (34.16 ثانية) بسرعته ونبرته الأصلية.\n'
        'أعيد توقيت المشاهد على الجمل، مع خفض الموسيقى تحت الكلام.\n'
        'آخر 4.84 ثانية للنهاية البصرية والموسيقى.\n'
        'الشعار الأصلي وواجهات النظام الحقيقية لم تُضف بعد؛ الرسومات الحالية توضيحية.\n')
with zipfile.ZipFile(out) as archive:
    assert archive.testzip() is None
    assert hashlib.sha256(archive.read(movie.name)).digest()==hashlib.sha256(movie.read_bytes()).digest()
print(f'Created verified ZIP: {out} ({out.stat().st_size/1048576:.2f} MiB)')
