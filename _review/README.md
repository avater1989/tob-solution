# 原型评审标注 · 使用说明

在原型页面上直接圈出要改的地方、写下意见，标注会落盘到这里。
我（AI）按 `annotations.json` 逐条定位元素并改代码，改完回填状态。

## 一、启动

```bash
cd <工程根目录>
python3 _review/serve.py          # 默认 8090，端口被占用可直接跟参数：python3 _review/serve.py 9000
```

打开 **http://127.0.0.1:8090/prototype/index.html**，页面右下角出现「标注」按钮即就绪。

> 必须用这个服务启动。若用自己的静态服务打开，页面仍能标注，但数据只留在浏览器里、不落盘。

| 页面 | 地址 |
|---|---|
| 原型导航 | `/prototype/index.html` |
| 评审看板 | `/_review/board.html` |
| 标注数据 | `/_review/annotations.json` |
| 可读版标注 | `/_review/annotations.md` |

> 服务需要一直开着。**请在终端里前台运行**，不要去后台起——进程被回收后你写的标注不会落盘。
> 怀疑掉了：`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8090/__review/ping`，返回 `000` 即已停止。

## 二、怎么标

| 操作 | 说明 |
|---|---|
| `Alt+A` / 点右下角「标注」 | 进入或退出标注模式（鼠标变十字） |
| 在元素上点击 | 选中该元素，弹出编辑卡片 |
| `Shift+点击` | 选上一层父元素（比如想标整个卡片而不是里面某行字） |
| `Esc` | 关掉卡片 / 退出标注模式 |
| `Alt+L` / 点「标注」右侧数字 | 打开本页标注列表 |
| `Ctrl+Enter` | 在卡片里直接保存 |

编辑卡片里选 **类型**（文案 / 布局 / 交互 / 新增 / 删除 / 疑问）、**优先级**（P0 / P1 / P2），写下想怎么改。

保存后该元素左上角出现编号角标：

- 蓝色 = 待处理，绿色 = 已修改，灰色 = 不修改，橙色 = 锚点失效（元素已不在页面上）

## 三、看进度

打开评审看板 `/_review/board.html`：按页面分组列出全部标注，可按状态筛选、按优先级过滤、按关键词搜索，点「打开页面 →」直接跳到对应页面。

改了哪些、还剩哪些没改，一眼可辨。看板每 15 秒自动刷新，也可点「刷新」。

## 四、我的执行流程

1. 读 `_review/annotations.json`（或直接看 `annotations.md`）
2. 按 `page` + `anchor.selectorIn` + `anchor.text` 三重锚点定位到源码元素
3. 按 `comment` 修改；`anchor.region` 为 `shell` 的条目改的是 `assets/js/admin-shell.js` / `ops-shell.js` / `mp-shell.js`，不是页面 HTML
4. 把该条 `status` 改为 `resolved` 并写回 → 页面角标转绿

## 五、几个约定

- 标注层不改动原型页面 DOM，只读不改；角标与高亮都画在独立图层里，删掉 `annotate.js` 即完全复原。
- 页面通过 `assets/js/proto.js` 自动加载标注层（覆盖 170 个页面），`prototype/index.html` 单独引入。
- 临时隐藏标注层：控制台执行 `localStorage.setItem('proto:review','off')`，恢复用 `localStorage.removeItem('proto:review')`。
- 重定向桩页（如 `admin/courses.html`、`admin/live-audit.html`）会自动跳转到真实页面，不需要也无需标注。

## 六、清空标注

**推荐做法**：按 `Alt+L` 打开标注列表 → 点右下角 **「清空全部标注」** → 确认。

这一下会把**浏览器本地和服务端同时清掉**，不用碰控制台。按钮带二次确认，会告诉你清几条。

> 为什么必须两端一起清：`annotate.js` 启动时会把服务端数据与浏览器 `localStorage` 做**并集**（`boot()` 里的 `mergeItems(remote, local)`）。
> 若只清服务端、本地还留着旧条目，它发现服务端为空会走 `persist(true)`，把本地数据**反向推回服务端**，标注就复活了。

### 如果非要手敲

1. 备份：`cp _review/annotations.json _review/annotations.backup-$(date +%Y%m%d-%H%M%S).json`
2. 清服务端：

   ```bash
   curl -X POST http://127.0.0.1:8090/__review/save \
     -H 'Content-Type: application/json' -d '{"items": []}'
   ```

3. 清浏览器端（在任意原型页 F12 控制台执行，注意键名）：

   ```js
   localStorage.removeItem('proto:review:v1'); location.reload();
   ```

> 键名是 `proto:review:v1`。上面第五节的 `proto:review` 是另一个「隐藏标注层」的开关键，别混。
> 顺序很重要：**先清浏览器端再刷新**，否则刷新时会把本地旧数据推回服务端。
