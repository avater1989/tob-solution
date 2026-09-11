# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(r"c:\share project\TO B解决方案\prototype\admin\live-control.html")
text = p.read_text(encoding="utf-8")

# --- 1. Top right bar ---
old_top_right = '''    <div class="ctrl-top-right">
      <span class="ctrl-pill ctrl-pill-gray">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
        未开通
      </span>
      <span class="ctrl-pill ctrl-pill-ok" id="ctrl-net-pill">
        <span class="net-dot"></span>
        <span class="net-label">网络良好</span>
      </span>
      <button class="ctrl-pill ctrl-pill-blue">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H8C6.34 1 5 2.34 5 4v16c4 0 4 0 4 0s0 0 4 0h4c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zm-2 20H8v-2h6v2zm4-4H6V4h12v13z"/></svg>
        已导入 IM
      </button>
      <a class="ctrl-pill ctrl-pill-blue" id="ctrl-stats-link" href="live-stats.html" style="text-decoration:none;display:none">查看实时数据</a>
      <button class="ctrl-btn-start" id="btn-start-live">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="margin-right:6px"><path d="M8 5v14l11-7z"/></svg>
        开始直播
      </button>
      <div class="ctrl-avatar">阮</div>
    </div>'''

new_top_right = '''    <div class="ctrl-top-right">
      <span class="ctrl-pill ctrl-pill-ok" id="ctrl-net-pill" title="网络状态">
        <span class="net-dot"></span>
        <span class="net-label">网络良好</span>
      </span>
      <span class="ctrl-pill ctrl-pill-blue" id="ctrl-im-pill" title="互动服务">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H8C6.34 1 5 2.34 5 4v16c4 0 4 0 4 0s0 0 4 0h4c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zm-2 20H8v-2h6v2zm4-4H6V4h12v13z"/></svg>
        互动服务正常
      </span>
      <span class="ctrl-pill ctrl-pill-gray" id="ctrl-duration-pill" style="display:none">时长 <b id="ctrl-duration">00:00:00</b></span>
      <a class="ctrl-pill ctrl-pill-blue" id="ctrl-stats-link" href="live-stats.html" style="text-decoration:none;display:none">查看实时数据</a>
      <button class="ctrl-btn-start" id="btn-start-live">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="margin-right:6px"><path d="M8 5v14l11-7z"/></svg>
        开始直播
      </button>
      <div class="ctrl-avatar" id="ctrl-host-label" title="当前主播">当前主播：阮荣均</div>
    </div>'''

if old_top_right not in text:
    raise SystemExit("top-right block not found")
text = text.replace(old_top_right, new_top_right)

# live meta: keep structure, JS will fill ID
text = text.replace(
    '<div class="ctrl-live-meta">传统直播间 · 已通过审核</div>',
    '<div class="ctrl-live-meta" id="ctrl-live-meta">传统直播间 · 已通过审核</div>\n        <div class="ctrl-live-id muted" id="ctrl-live-id" style="font-size:11px;opacity:.75;margin-top:2px">ID —</div>'
)

# foot actions
text = text.replace(
    '''          <button class="ctrl-btn-line" id="btn-update">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
            发布更新
          </button>
          <button class="ctrl-btn-line ctrl-btn-danger">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            清空中控台
          </button>''',
    '''          <button class="ctrl-btn-line" id="btn-update">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
            <span id="btn-update-label">应用到预览</span>
          </button>
          <button class="ctrl-btn-line ctrl-btn-danger" id="btn-clear-canvas">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            清空画布
          </button>'''
)

text = text.replace("主播语音播报和连麦声音", "主播语音和直播声音")

# remove dance tab — keep only mic
text = text.replace(
    '''      <div class="ctrl-right-tabs">
        <button class="ctrl-right-tab active" data-tab="voice">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
          麦克风
        </button>
        <button class="ctrl-right-tab" data-tab="dance">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M14 9.5h2V8H14v1.5zm-4 0h2V8h-2v1.5zm-4 0h2V8H6v1.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
          舞蹈
        </button>
      </div>''',
    '''      <div class="ctrl-right-tabs">
        <button class="ctrl-right-tab active" data-tab="voice">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
          麦克风
        </button>
      </div>'''
)

# --- Bottom section: find and replace from <!-- 底部互动面板 --> through end of ctrl-bottom ---
start = text.index("  <!-- 底部互动面板 -->")
end = text.index("<!-- 直播间内营销动画容器")
bottom_new = r'''  <!-- 底部操作区：互动 / 商品 / 营销工具 -->
  <div class="ctrl-bottom" id="ctrl-bottom">
    <div class="ctrl-bottom-tabs">
      <button class="ctrl-bottom-tab active" data-btab="interact">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
        互动
      </button>
      <button class="ctrl-bottom-tab" data-btab="product" id="tab-product">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03L20.88 5H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
        商品 <span class="ctrl-tab-badge" id="tab-product-count">0</span>
      </button>
      <button class="ctrl-bottom-tab" data-btab="tools">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>
        营销工具
      </button>
      <div class="spacer"></div>
      <button class="ctrl-bottom-close" id="btn-close-bottom" aria-label="关闭">×</button>
    </div>

    <!-- 互动 -->
    <div class="ctrl-bottom-pane active" id="pane-interact">
      <div class="ctrl-stats-row" id="ctrl-live-metrics">
        <div class="ctrl-mini-stat"><span class="dot dot-blue"></span>当前在线 <b id="m-online">0</b></div>
        <div class="ctrl-mini-stat"><span class="dot dot-gray"></span>累计进入 <b id="m-enter">0</b></div>
        <div class="ctrl-mini-stat"><span class="dot dot-yellow"></span>下单人数 <b id="m-buyers">0</b></div>
        <div class="ctrl-mini-stat"><span class="dot dot-pink"></span>成交金额 <b id="m-gmv">¥0</b></div>
      </div>

      <div class="ctrl-comment-bar">
        <label class="ctrl-audit-switch">
          <input type="checkbox" id="ctrl-audit-toggle" />
          <span class="ctrl-switch-track"><span class="ctrl-switch-thumb"></span></span>
          <span class="ctrl-switch-label">评论审核</span>
          <span class="ctrl-switch-tip">开启后用户评论默认隐藏</span>
        </label>
        <div class="ctrl-comment-filters">
          <button class="ctrl-comment-filter active" data-filter="all">全部消息</button>
          <button class="ctrl-comment-filter" data-filter="qa">问答</button>
          <button class="ctrl-comment-filter" data-filter="teacher">讲师消息</button>
        </div>
      </div>

      <div class="ctrl-comment-list" id="ctrl-comment-list"></div>

      <div class="ctrl-quick-msg">
        <input type="text" placeholder="输入快捷回复（按 Enter 发送）..." class="ctrl-quick-input" id="ctrl-quick-input" />
        <button class="ctrl-btn-pri" id="btn-send-msg">发送</button>
      </div>
    </div>

    <!-- 商品（底部内嵌，不遮挡顶部状态） -->
    <div class="ctrl-bottom-pane" id="pane-product">
      <div class="ctrl-prod-pane">
        <div class="ctrl-prod-toolbar">
          <div class="ctrl-prod-title">已挂载商品 <span class="muted" id="prod-mounted-hint">0</span></div>
          <button type="button" class="ctrl-btn-pri" id="btn-add-product">+ 添加商品</button>
        </div>
        <div id="ctrl-product-list" class="ctrl-prod-list">
          <!-- JS 渲染 -->
        </div>
        <div id="ctrl-product-picker" class="ctrl-prod-picker" style="display:none">
          <div class="ctrl-prod-picker-hd">选择要挂载的商品</div>
          <div id="ctrl-product-catalog"></div>
          <button type="button" class="btn btn-sm" id="btn-close-picker" style="margin-top:8px">收起</button>
        </div>
      </div>
    </div>

    <!-- 营销工具：优惠券 / 直播公告 / 跑马灯 -->
    <div class="ctrl-bottom-pane" id="pane-tools">
      <div class="ctrl-mk-pane">
        <div class="ctrl-mk-pane-tip">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          现场营销工具：发放优惠券、发布直播公告或推送跑马灯。详细效果请到「查看实时数据」查看。
        </div>
        <div class="ctrl-mk-pane-grid">
          <button class="ctrl-mk-card" id="btn-mk-coupon" type="button">
            <div class="ctrl-mk-card-icon" style="background:linear-gradient(135deg,#ff7a45,#ff4d4f)">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>
            </div>
            <div class="ctrl-mk-card-body">
              <div class="ctrl-mk-card-name">优惠券</div>
              <div class="ctrl-mk-card-desc">直播间发放限时优惠券</div>
              <div class="ctrl-mk-card-stat">已发放 <b id="mk-pane-coupon-stat">0</b> 张</div>
            </div>
          </button>
          <button class="ctrl-mk-card" id="btn-mk-announce" type="button">
            <div class="ctrl-mk-card-icon" style="background:linear-gradient(135deg,#165dff,#4080ff)">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
            </div>
            <div class="ctrl-mk-card-body">
              <div class="ctrl-mk-card-name">直播公告</div>
              <div class="ctrl-mk-card-desc">向观众发送固定公告</div>
              <div class="ctrl-mk-card-stat">最近：<b id="mk-announce-stat">未发送</b></div>
            </div>
          </button>
          <button class="ctrl-mk-card" id="btn-mk-marquee" type="button">
            <div class="ctrl-mk-card-icon" style="background:linear-gradient(135deg,#722ed1,#b577ff)">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M2 8h20v8H2z" opacity=".3"/><path d="M22 6H2v12h20V6zm-2 10H4V8h16v8z"/></svg>
            </div>
            <div class="ctrl-mk-card-body">
              <div class="ctrl-mk-card-name">跑马灯</div>
              <div class="ctrl-mk-card-desc">顶部滚动公告/优惠</div>
              <div class="ctrl-mk-card-stat">已推送 <b id="mk-pane-marquee-stat">0</b> 次</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>

'''

text = text[:start] + bottom_new + text[end:]

# Remove product drawer (use inline pane instead)
drawer_start = text.find('<!-- 挂商品抽屉 -->')
drawer_end = text.find('<!-- 优惠券发放弹窗 -->')
if drawer_start > 0 and drawer_end > drawer_start:
    text = text[:drawer_start] + text[drawer_end:]

# Update end modal copy
text = text.replace(
    '''<!-- 结束直播确认 -->
<div class="proto-modal" id="modal-end">
  <div class="proto-modal-hd">
    <h3>结束直播</h3>
    <button class="btn btn-sm btn-ghost" data-close>×</button>
  </div>
  <div class="proto-modal-bd">
    <p>确认结束 <b id="modal-end-live-name">本场直播</b>？结束后不可再次进入实时中控，可查看场次数据与回放。</p>
  </div>
  <div class="proto-modal-ft">
    <button class="btn" data-close>取消</button>
    <button class="btn btn-primary" id="btn-confirm-end" style="background:#f53f3f;border-color:#f53f3f">确认结束</button>
  </div>
</div>''',
    '''<!-- 结束直播确认 -->
<div class="proto-modal" id="modal-end">
  <div class="proto-modal-hd">
    <h3>确认结束直播？</h3>
    <button class="btn btn-sm btn-ghost" data-close>×</button>
  </div>
  <div class="proto-modal-bd">
    <p>结束后本场直播将进入已结束状态，无法重新恢复直播。你仍可查看场次数据和直播回放。</p>
    <p class="muted" style="margin-top:8px;font-size:13px">当前场次：<b id="modal-end-live-name">本场直播</b></p>
  </div>
  <div class="proto-modal-ft">
    <button class="btn" data-close>取消</button>
    <button class="btn btn-primary" id="btn-confirm-end" style="background:#f53f3f;border-color:#f53f3f">确认结束直播</button>
  </div>
</div>

<!-- 清空画布确认 -->
<div class="proto-modal" id="modal-clear-canvas">
  <div class="proto-modal-hd">
    <h3>清空画布</h3>
    <button class="btn btn-sm btn-ghost" data-close>×</button>
  </div>
  <div class="proto-modal-bd">
    <p>确定清空当前画布中的媒体源吗？该操作不会结束直播，也不会删除评论、商品或直播数据。</p>
  </div>
  <div class="proto-modal-ft">
    <button class="btn" data-close>取消</button>
    <button class="btn btn-primary" id="btn-confirm-clear-canvas" style="background:#f53f3f;border-color:#f53f3f">确认清空</button>
  </div>
</div>

<!-- 直播公告 -->
<div class="proto-modal" id="modal-announce">
  <div class="proto-modal-hd">
    <h3>发布直播公告</h3>
    <button class="btn btn-sm btn-ghost" data-close>×</button>
  </div>
  <div class="proto-modal-bd">
    <div class="field">
      <label>公告内容</label>
      <textarea id="announce-text" rows="3" maxlength="120" style="width:100%;padding:8px;border:1px solid #e5e6eb;border-radius:6px">欢迎家长进入直播间，课程优惠今晚有效。</textarea>
    </div>
  </div>
  <div class="proto-modal-ft">
    <button class="btn" data-close>取消</button>
    <button class="btn btn-primary" id="btn-announce-confirm">发布公告</button>
  </div>
</div>'''
)

# CSS additions before </style>
css_extra = '''
.ctrl-avatar {
  min-width: auto !important; width: auto !important; height: auto !important;
  padding: 6px 10px; border-radius: 16px !important; font-size: 12px !important;
  background: #1d2742 !important; color: #c9d1d9 !important;
}
.ctrl-prod-pane { padding: 12px 16px; }
.ctrl-prod-toolbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.ctrl-prod-title { font-size:13px; font-weight:600; color:#e8eaed; }
.ctrl-prod-list { display:flex; flex-direction:column; gap:8px; max-height:180px; overflow:auto; }
.ctrl-prod-row {
  display:flex; align-items:center; gap:10px; padding:10px 12px;
  background:#121a2b; border:1px solid #1f2940; border-radius:8px;
}
.ctrl-prod-row.is-explaining { border-color:#165dff; background:#152238; }
.ctrl-prod-name { font-size:13px; color:#e8eaed; font-weight:500; }
.ctrl-prod-meta { font-size:11px; color:#86909c; margin-top:2px; }
.ctrl-prod-actions { margin-left:auto; display:flex; gap:6px; flex-wrap:wrap; }
.ctrl-prod-actions .btn { font-size:12px; padding:2px 8px; height:28px; }
.ctrl-prod-badge {
  font-size:11px; color:#165dff; background:rgba(22,93,255,.15);
  padding:1px 6px; border-radius:3px; margin-left:6px;
}
.ctrl-prod-picker {
  margin-top:10px; padding:10px; background:#0d1424; border:1px dashed #2d3a55; border-radius:8px;
}
.ctrl-prod-picker-hd { font-size:12px; color:#86909c; margin-bottom:8px; }
.ctrl-prod-cat-row {
  display:flex; align-items:center; justify-content:space-between;
  padding:8px 0; border-bottom:1px solid #1f2940; font-size:13px; color:#c9d1d9;
}
'''
text = text.replace("</style>\n\n<script src=\"../assets/js/proto.js\"></script>", css_extra + "</style>\n\n<script src=\"../assets/js/proto.js\"></script>")

p.write_text(text, encoding="utf-8")
print("HTML structure patched OK")
print("残留检查:", "风学院" in text, "连麦" in text, "舞蹈" in text, "已导入 IM" in text, "未开通" in text, "挂商品抽屉" in text)
