"""Package the actual MP4 for download clients that otherwise display video inline."""
import hashlib
from pathlib import Path
import zipfile

ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'exports/zenlix-energy39-review.zip'
names=['zenlix-energy39-preview.mp4','storyboard.png','narration-proposed-ar.txt']
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for name in names:archive.write(ROOT/'exports'/name,name)
    archive.writestr('READ-ME-AR.txt',
        'ZENLIX SOLUTIONS — نسخة الموشن 39 ثانية\n\n'
        'الفيديو MP4 بدقة 1080×1920، 30 إطارًا في الثانية، ومدته 39.00 ثانية.\n'
        'هذه نسخة مراجعة بالموسيقى والمؤثرات فقط.\n'
        'لم تتم إضافة التسجيل الجديد أو الشعار الأصلي أو واجهات النظام الحقيقي.\n'
        'اللوحات الحالية تصورات موشن، والاسم المكتوب ليس شعارًا معاد رسمه.\n'
        'نص التعليق المرفق مقترح للتسجيل، وليس نصًا مسجلاً أو معتمدًا.\n'
        'الإصدارات السابقة محفوظة.\n')
with zipfile.ZipFile(out) as archive:
    assert archive.testzip() is None
    packaged=hashlib.sha256(archive.read(names[0])).hexdigest()
    source=hashlib.sha256((ROOT/'exports'/names[0]).read_bytes()).hexdigest()
    assert packaged==source
print(f'Created verified download archive: {out} ({out.stat().st_size/1048576:.2f} MiB)')
