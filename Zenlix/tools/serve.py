"""Static preview server with byte-range support for accurate media seeking."""
from pathlib import Path
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
import re

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Keep persistent preview sessions from blocking on an unread log pipe.
        pass

    def send_head(self):
        self.byte_range = None
        path = self.translate_path(self.path)
        header = self.headers.get('Range')
        if not header or not os.path.isfile(path):
            return super().send_head()
        total = os.path.getsize(path)
        match = re.fullmatch(r'bytes=(\d*)-(\d*)', header.strip())
        if not match or not any(match.groups()):
            self.send_error(416, 'Unsupported byte range')
            return None
        first, last = match.groups()
        if first:
            start = int(first)
            end = int(last) if last else total - 1
        else:
            start, end = max(0, total - int(last)), total - 1
        end = min(end, total - 1)
        if start > end or start >= total:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{total}')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return None
        file = open(path, 'rb')
        file.seek(start)
        self.byte_range = (start, end)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Length', str(end - start + 1))
        self.send_header('Content-Range', f'bytes {start}-{end}/{total}')
        self.send_header('Accept-Ranges', 'bytes')
        self.end_headers()
        return file

    def copyfile(self, source, outputfile):
        if self.byte_range is None:
            return super().copyfile(source, outputfile)
        left = self.byte_range[1] - self.byte_range[0] + 1
        while left:
            block = source.read(min(65536, left))
            if not block:
                break
            try:
                outputfile.write(block)
            except (BrokenPipeError, ConnectionResetError):
                break
            left -= len(block)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8011)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(root)))
    print(f'Serving Zenlix preview on port {args.port}', flush=True)
    server.serve_forever()
