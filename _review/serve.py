# -*- coding: utf-8 -*-
"""原型评审服务
静态伺服整个工程（含 /prototype 与 /_review），并额外提供标注写盘接口：

  GET  /__review/ping   健康检查
  GET  /__review/load   读取标注
  POST /__review/save   保存标注（同时生成 annotations.json 与 annotations.md）

保存分两种模式（请求体 mode 字段，省略时按是否带 page 推断）：
  page     只替换 page 对应页面的标注，其它页面保持服务端现值。
           同时开了多个原型页时，不会互相把对方的标注盖掉。
  replace  整体覆盖。用于「清空全部标注」。

写盘是「先备份、写临时文件、再原子替换」，并且每次保存都会保留最近的若干份
annotations.backup-*.json，写坏或误清空时可回退。

用法：
  python3 _review/serve.py            # 默认 8090
  python3 _review/serve.py 9000       # 指定端口

打开 http://127.0.0.1:<port>/prototype/index.html 进入原型，
页面右下角出现「标注」按钮即说明服务与标注层都已就绪。
"""

import http.server
import json
import os
import shutil
import socketserver
import sys
import threading
import time
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REVIEW_DIR = os.path.join(ROOT, "_review")
JSON_FILE = os.path.join(REVIEW_DIR, "annotations.json")
MD_FILE = os.path.join(REVIEW_DIR, "annotations.md")
BACKUP_PREFIX = "annotations.backup-"
BACKUP_KEEP = 12  # 最多保留多少份历史备份，超出删最旧的

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


def strip_private(item):
    """丢掉 _stale 这类运行时临时字段，标注数据只留业务字段。"""
    if not isinstance(item, dict):
        return item
    return {k: v for k, v in item.items() if not k.startswith("_")}


def read_items():
    """读取现有标注。

    文件不存在 → 空列表；文件损坏 → 抛异常。
    损坏时绝不能降级成「空数据」继续往下走，否则会把仅存的标注覆盖掉。
    """
    if not os.path.exists(JSON_FILE):
        return []
    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    items = data.get("items", []) if isinstance(data, dict) else (data or [])
    return [strip_private(i) for i in items if isinstance(i, dict)]


def backup_file():
    """保存前留一份历史备份，并清理过旧的备份。"""
    if not os.path.exists(JSON_FILE):
        return None
    dst = os.path.join(REVIEW_DIR, "%s%s.json" % (BACKUP_PREFIX, datetime.now().strftime("%Y%m%d-%H%M%S")))
    try:
        shutil.copy2(JSON_FILE, dst)
    except Exception:  # noqa: BLE001
        return None
    try:
        olds = sorted(
            n for n in os.listdir(REVIEW_DIR)
            if n.startswith(BACKUP_PREFIX) and n.endswith(".json")
        )
        for name in olds[:-BACKUP_KEEP]:
            os.remove(os.path.join(REVIEW_DIR, name))
    except Exception:  # noqa: BLE001
        pass
    return dst


def merge_items(existing, incoming, page, mode):
    """按模式决定这次保存的结果集。

    page 模式只认领本页的条目：其它页面沿用服务端现值，
    避免「A 页保存时带着的是打开时的旧快照」把 B 页的新标注冲掉。
    """
    if mode == "replace" or not page:
        return incoming
    rest = [it for it in existing if it.get("page") != page]
    mine = [it for it in incoming if it.get("page") == page]
    return sorted(rest + mine, key=lambda it: str(it.get("createdAt") or ""))


def write_markdown(items):
    groups = {}
    for it in items:
        groups.setdefault(it.get("page", "unknown"), []).append(it)

    def count(status):
        return len([i for i in items if (i.get("status") or "open") == status])

    lines = [
        "# 原型评审标注",
        "",
        "生成时间 %s · 共 %d 条（待处理 %d / 已修改 %d / 不修改 %d）"
        % (
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            len(items),
            count("open"),
            count("resolved"),
            count("wontfix"),
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
        os.makedirs(REVIEW_DIR, exist_ok=True)
        backup_file()
        payload = {
            "v": 1,
            "updated": datetime.now().isoformat(timespec="seconds"),
            "items": [strip_private(i) for i in items],
        }
        # 先写临时文件再原子替换：写到一半被打断也不会留下半截 JSON
        tmp = JSON_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, JSON_FILE)
        write_markdown(payload["items"])


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
            return self._json({"ok": True, "root": ROOT, "out": REVIEW_DIR})
        if path == "/__review/load":
            try:
                return self._json({"v": 1, "items": read_items()})
            except Exception as exc:  # noqa: BLE001
                # 明确报错，让页面知道「读不到」而不是「服务端为空」，
                # 否则页面可能把本地数据反向推回，把损坏文件覆盖掉。
                return self._json(
                    {"ok": False, "error": "annotations.json 解析失败：%s" % exc}, 500
                )
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

            page = data.get("page") or ""
            mode = data.get("mode") or ("page" if page else "replace")
            incoming = [strip_private(i) for i in items if isinstance(i, dict)]
            merged = merge_items(read_items(), incoming, page, mode)
            write_items(merged)
            return self._json(
                {
                    "ok": True,
                    "mode": mode,
                    "count": len(merged),
                    "pages": len(set(it.get("page") or "" for it in merged)),
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
    print("标注数据   : %s" % os.path.relpath(JSON_FILE, ROOT))
    print("按 Ctrl+C 停止。", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止。")


if __name__ == "__main__":
    main()
