# -*- coding: utf-8 -*-
import http.server
import socketserver
import sys

HOST = "127.0.0.1"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

socketserver.TCPServer.allow_reuse_address = True
handler = http.server.SimpleHTTPRequestHandler
httpd = http.server.ThreadingHTTPServer((HOST, PORT), handler)
print(f"serving http://{HOST}:{PORT}/prototype/admin/user-tags.html", flush=True)
httpd.serve_forever()
