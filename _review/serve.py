# -*- coding: utf-8 -*-
"""原型评审服务
静态伺服整个工程（含 /prototype 与 /_review），并额外提供标注写盘接口：

  GET  /__review/ping   健康检查
  GET  /__review/load   读取标注
  POST /__review/save   保存标注（同时生成 annotations.json 与 annotations.md）

用法：
  python3 _review/serve.py            # 默认 8090
  python3 _review/serve.py 9000       # 指定端口

打开 http://127.0.0.1:<port>/prototype/index.html 进入原型，
页面右下角出现「标注」按钮即说明服务与标注层都已就绪。
"""

import http.server
import json
import os
import socketserver
import sys
import threading
import time
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REVIEW_DIR = os.path.join(ROOT, "_review")
JSON_FILE = os.path.join(REVIEW_DIR, "annotations.json")
MD_FILE = os.path.join(REVIEW_DIR, "annotations.md")

TYPE_TEXT = {
    "copy": "文案",
    "layout": "布局",
    "interaction": "交互",
    "add": "新增",
    "remove": "删除",
    "question": "疑问",
}
STATUS_TEXT = {"open": "待处理", "resolved": "已修改", "wontfix": "不修改"}
_lock = threading.Lock()


def read_items():
    if not os.path.exists(JSON_FILE):
        return []
    try:
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("items", []) if isinstance(data, dict) else (data or [])
    except Exception:
        return []


def write_markdown(items):
    groups = {}
    for it in items:
        groups.setdefault(it.get("page", "unknown"), []).append(it)

    opened = [i for i in items if (i.get("status") or "open") == "open"]
    lines = [
        "# 原型评审标注",
        "",
        "生成时间 %s · 共 %d 条（待处理 %d / 已修改 %d）"
        % (
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            len(items),
            len(opened),
            len(items) - len(opened),
        ),
        "",
        "> 本文件由标注层自动生成，请勿手工改动结构；修改意见请在原型页面里标注。",
        "",
    ]
    for page in sorted(groups.keys()):
        rows = groups[page]
        lines.append("## %s（%d 条）" % (page, len(rows)))
        lines.append("")
        for idx, it in enumerate(rows, 1):
            a = it.get("anchor") or {}
            lines.append(
                "### %d. [%s][%s] %s"
                % (
                    idx,
                    it.get("priority") or "P1",
                    TYPE_TEXT.get(it.get("type"), "意见"),
                    STATUS_TEXT.get(it.get("status") or "open", "待处理"),
                )
            )
            sel = a.get("selectorIn") or a.get("selector") or ""
            root = ("（根 %s）" % a["root"]) if a.get("root") else ""
            lines.append("- 锚点：`%s`%s" % (sel, root))
            if a.get("region") == "shell":
                lines.append(
                    "- 区域：外壳（%s），需改脚本而非页面" % (a.get("shell") or "外壳脚本")
                )
            if a.get("text"):
                lines.append("- 元素文本：%s" % a["text"][:120])
            if a.get("html"):
                lines.append("- 元素片段：`%s`" % a["html"].replace("`", "'")[:200])
            lines.append("- 意见：%s" % (it.get("comment") or ""))
            lines.append("")
    with open(MD_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def write_items(items):
    with _lock:
        payload = {
            "v": 1,
            "updated": datetime.now().isoformat(timespec="seconds"),
            "items": items,
        }
        with open(JSON_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        write_markdown(items)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        if "/__review/" in (self.path or ""):
            sys.stderr.write("[review] %s\n" % (fmt % args))

    def end_headers(self):
        # 标注服务是开发工具：禁止浏览器缓存静态资源，
        # 否则改了 annotate.js / admin-shell.js 后刷新看不到效果。
        if not (self.path or "").startswith("/__review/"):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        super().end_headers()

    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/__review/ping":
            return self._json({"ok": True, "root": ROOT})
        if path == "/__review/load":
            return self._json({"v": 1, "items": read_items()})
        if path in ("/__review", "/__review/"):
            self.send_response(302)
            self.send_header("Location", "/_review/board.html")
            self.end_headers()
            return
        return super().do_GET()

    def do_POST(self):
        path = self.path.split("?")[0]
        if path != "/__review/save":
            return self._json({"ok": False, "error": "unknown endpoint"}, 404)
        try:
            n = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(n).decode("utf-8")
            data = json.loads(raw or "{}")
            items = data.get("items")
            if not isinstance(items, list):
                return self._json({"ok": False, "error": "items must be a list"}, 400)
            write_items(items)
            return self._json(
                {
                    "ok": True,
                    "count": len(items),
                    "json": os.path.relpath(JSON_FILE, ROOT),
                    "md": os.path.relpath(MD_FILE, ROOT),
                    "savedAt": time.strftime("%Y-%m-%d %H:%M:%S"),
                }
            )
        except Exception as exc:  # noqa: BLE001
            return self._json({"ok": False, "error": str(exc)}, 500)


class Server(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8090
    httpd = Server(("127.0.0.1", port), Handler)
    host, real_port = httpd.server_address
    print("工程根目录 : %s" % ROOT)
    print("原型入口   : http://%s:%d/prototype/index.html" % (host, real_port))
    print("评审看板   : http://%s:%d/_review/board.html" % (host, real_port))
    print("标注标文件 : %s" % os.path.relpath(JSON_FILE, ROOT))
    print("按 Ctrl+C 停止。", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止。")


if __name__ == "__main__":
    main()
