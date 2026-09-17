#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""review-kit · 标注服务

功能：
  1. 静态伺服 <root>（你的站点），并在 <mount>/ 下额外伺服本工具目录（annotate.js / board.html 等），
     所以你的页面可以直接 <script src="/review-kit/annotate.js">，不必把工具复制到站点里。
  2. 提供标注读写接口：
       GET  <prefix>/ping     健康检查
       GET  <prefix>/load     读取标注
       POST <prefix>/save     保存标注（同时写出 annotations.json 与 annotations.md）
  3. 打开浏览器访问 <prefix>/ 会跳转到看板 board.html。

用法：
  python3 review-kit/serve.py                          # 伺服当前目录，端口 8090
  python3 review-kit/serve.py --root . --port 8090
  python3 review-kit/serve.py --root ./site --out .review --prefix /__review
  python3 review-kit/serve.py --no-md                  # 不生成人可读的 md

页面来源有两种接法：
  A. 直接用它当站点服务：浏览器开 http://127.0.0.1:8090/<页面>（同源，最省事）
  B. 页面由你自己的 dev server 提供，本服务只当「标注数据后端」：
     把 serverBase 配成本服务的完整地址，例如 http://127.0.0.1:8090/__review
     （默认已开启跨源响应头；如不需要可 --no-cors 关闭）

数据落盘位置：<out>/annotations.json 与 <out>/annotations.md（默认 <root>/_review）。
"""

import argparse
import http.server
import json
import mimetypes
import os
import socketserver
import sys
import threading
import time
from datetime import datetime

KIT_DIR = os.path.dirname(os.path.abspath(__file__))
KIT_MOUNT = "/" + os.path.basename(KIT_DIR)

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

# 运行时配置（main 里赋值）
CONF = {
    "root": os.getcwd(),
    "out": None,
    "prefix": "/__review",
    "md": True,
    "title": "页面评审标注",
    "cors": True,
}


def json_file():
    return os.path.join(CONF["out"], "annotations.json")


def md_file():
    return os.path.join(CONF["out"], "annotations.md")


def _rel_or_abs(path):
    """相对 root 展示路径；不在 root 下则返回绝对路径。"""
    try:
        rel = os.path.relpath(path, CONF["root"])
    except Exception:
        return path
    return path if rel.startswith("..") else rel


def read_items():
    path = json_file()
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
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
        "# %s" % CONF["title"],
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
    with open(md_file(), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def write_items(items):
    with _lock:
        os.makedirs(CONF["out"], exist_ok=True)
        payload = {
            "v": 1,
            "updated": datetime.now().isoformat(timespec="seconds"),
            "items": items,
        }
        with open(json_file(), "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        if CONF["md"]:
            write_markdown(items)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=CONF["root"], **kwargs)

    def log_message(self, fmt, *args):
        p = self.path or ""
        if p.startswith(CONF["prefix"]) or p.startswith(KIT_MOUNT):
            sys.stderr.write("[review] %s\n" % (fmt % args))

    def end_headers(self):
        # 开发工具：禁止缓存，避免改了 annotate.js 刷新看不到效果
        if not (self.path or "").startswith(CONF["prefix"]):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        # 允许「页面由你自己的 dev server 提供、标注服务另开端口」这种接法
        if CONF["cors"]:
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        # 跨源 POST（application/json）会先发预检
        self.send_response(204)
        self.end_headers()

    # ---------- 工具目录静态伺服 ----------
    def _serve_kit_file(self, rel):
        full = os.path.normpath(os.path.join(KIT_DIR, rel))
        if not full.startswith(KIT_DIR) or not os.path.isfile(full):
            return self.send_error(404, "Not found")
        ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
            ctype += "; charset=utf-8"
        with open(full, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

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
        prefix = CONF["prefix"]
        if path == prefix + "/ping":
            return self._json({"ok": True, "root": CONF["root"], "out": CONF["out"]})
        if path == prefix + "/load":
            return self._json({"v": 1, "items": read_items()})
        if path in (prefix, prefix + "/"):
            self.send_response(302)
            self.send_header("Location", KIT_MOUNT + "/board.html")
            self.end_headers()
            return
        if path.startswith(KIT_MOUNT + "/"):
            return self._serve_kit_file(path[len(KIT_MOUNT) + 1:])
        return super().do_GET()

    def do_POST(self):
        path = self.path.split("?")[0]
        if path != CONF["prefix"] + "/save":
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
                    "json": _rel_or_abs(json_file()),
                    "md": _rel_or_abs(md_file()) if CONF["md"] else None,
                    "savedAt": time.strftime("%Y-%m-%d %H:%M:%S"),
                }
            )
        except Exception as exc:  # noqa: BLE001
            return self._json({"ok": False, "error": str(exc)}, 500)


class Server(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True


def main():
    ap = argparse.ArgumentParser(description="review-kit 标注服务")
    ap.add_argument("--root", default=os.getcwd(), help="站点根目录（默认当前目录）")
    ap.add_argument("--port", type=int, default=8090, help="端口（默认 8090）")
    ap.add_argument("--out", default=None, help="标注数据目录（默认 <root>/_review）")
    ap.add_argument("--prefix", default="/__review", help="接口前缀（默认 /__review）")
    ap.add_argument("--title", default="页面评审标注", help="annotations.md 的标题")
    ap.add_argument("--no-md", action="store_true", help="不生成 annotations.md")
    ap.add_argument("--no-cors", action="store_true",
                    help="关闭跨源响应头（默认开启，便于页面由其他 dev server 提供）")
    args = ap.parse_args()

    CONF["root"] = os.path.abspath(args.root)
    CONF["out"] = os.path.abspath(args.out) if args.out else os.path.join(CONF["root"], "_review")
    CONF["prefix"] = "/" + args.prefix.strip("/")
    CONF["title"] = args.title
    CONF["md"] = not args.no_md
    CONF["cors"] = not args.no_cors

    if not os.path.isdir(CONF["root"]):
        print("站点根目录不存在：%s" % CONF["root"])
        return 1
    os.makedirs(CONF["out"], exist_ok=True)

    httpd = Server(("127.0.0.1", args.port), Handler)
    host, port = httpd.server_address
    print("站点根目录 : %s" % CONF["root"])
    print("标注数据   : %s" % CONF["out"])
    print("工具挂载   : http://%s:%d%s/" % (host, port, KIT_MOUNT))
    print("评审看板   : http://%s:%d%s/board.html" % (host, port, KIT_MOUNT))
    print("接入方式   : 页面里 <script src=\"%s/annotate.js\" defer></script>" % KIT_MOUNT)
    print("按 Ctrl+C 停止。", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
