/* 通用分享弹窗（参照小鹅通「分享课程」能力重做）
 * - 分享方式：二维码 / 链接（短链接、长链接）/ 海报
 * - 分享设置：自定义分享标题、分享描述（保存后学员端分享卡片生效）
 * 用法：XiboShare.open({ type: "系列课", url: "https://yibo.app/s/S001",
 *                        cover: "../assets/img/covers/xxx.jpg",
 *                        name: "内容名称", desc: "内容简介" })
 */
window.XiboShare = (function () {
  var CSS = ""
    + ".xs-tabs{display:flex;gap:4px;background:#f2f3f5;border-radius:8px;padding:4px;margin-bottom:14px}"
    + ".xs-tab{flex:1;text-align:center;padding:6px 0;font-size:13px;border-radius:6px;cursor:pointer;color:#4e5969;border:none;background:transparent}"
    + ".xs-tab.active{background:#fff;color:#165dff;font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,.08)}"
    + ".xs-panel{display:none}.xs-panel.active{display:block}"
    + ".xs-qr{width:168px;height:168px;margin:0 auto;padding:10px;border:1px solid #e8e8e8;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center}"
    + ".xs-tip{text-align:center;font-size:12px;color:#8c8c8c;margin:10px 0 14px}"
    + ".xs-label{font-size:12px;color:#8c8c8c;margin:0 0 6px}"
    + ".xs-url{font-family:monospace;font-size:12px;background:#f7f8fa;border:1px solid #e8e8e8;border-radius:6px;padding:8px 10px;word-break:break-all}"
    + ".xs-linkmode{display:flex;gap:14px;margin-bottom:8px;font-size:13px;color:#4e5969}"
    + ".xs-linkmode label{display:inline-flex;align-items:center;gap:4px;cursor:pointer}"
    + ".xs-poster{width:230px;margin:0 auto;border:1px solid #e8e8e8;border-radius:10px;overflow:hidden;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.06)}"
    + ".xs-poster-cover{width:100%;height:129px;background:#f2f3f5;object-fit:cover;display:block}"
    + ".xs-poster-bd{padding:10px 12px 12px}"
    + ".xs-poster-title{font-size:14px;font-weight:600;color:#1d2129;line-height:1.4;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}"
    + ".xs-poster-desc{font-size:11px;color:#8c8c8c;line-height:1.5;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}"
    + ".xs-poster-ft{display:flex;align-items:center;justify-content:space-between}"
    + ".xs-poster-brand{font-size:11px;color:#8c8c8c}"
    + ".xs-poster-qr{width:44px;height:44px;flex-shrink:0}"
    + ".xs-poster-qr svg{width:100%;height:100%;display:block}"
    + ".xs-setting-hd{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#1d2129;margin:16px 0 10px;padding-top:14px;border-top:1px solid #f0f0f0}"
    + ".xs-setting-hd .xs-caret{color:#8c8c8c;font-size:11px;font-weight:400}"
    + ".xs-field{margin-bottom:10px}"
    + ".xs-field label{display:block;font-size:12px;color:#8c8c8c;margin-bottom:4px}"
    + ".xs-field input,.xs-field textarea{width:100%;box-sizing:border-box;border:1px solid #e8e8e8;border-radius:6px;padding:7px 10px;font-size:13px;color:#1d2129;font-family:inherit}"
    + ".xs-field textarea{resize:vertical;min-height:56px}"
    + ".xs-field input:focus,.xs-field textarea:focus{outline:none;border-color:#165dff}"
    + ".xs-actions{display:flex;gap:8px;flex-wrap:wrap}"
    + ".xs-count{font-size:11px;color:#bfbfbf;text-align:right;margin-top:2px}";

  var MODAL_HTML = ""
    + '<div class="proto-modal" id="xs-modal" style="width:460px;max-width:94vw;max-height:90vh;overflow-y:auto">'
    + '  <div style="background:#fff;border-radius:10px;overflow:hidden">'
    + '    <div class="proto-modal-hd"><h3 style="margin:0;font-size:16px" id="xs-title">分享</h3><button class="ctrl-icon-btn" data-xs-close>×</button></div>'
    + '    <div class="proto-modal-bd">'
    + '      <div class="xs-tabs">'
    + '        <button class="xs-tab active" data-xs-tab="qr">二维码</button>'
    + '        <button class="xs-tab" data-xs-tab="link">链接</button>'
    + '        <button class="xs-tab" data-xs-tab="poster">海报</button>'
    + '      </div>'
    + '      <div class="xs-panel active" data-xs-panel="qr">'
    + '        <div class="xs-qr" id="xs-qr"></div>'
    + '        <p class="xs-tip">学员微信扫一扫，即可查看内容</p>'
    + '        <div class="xs-actions"><button class="btn btn-primary" id="xs-download-qr">下载二维码</button></div>'
    + '      </div>'
    + '      <div class="xs-panel" data-xs-panel="link">'
    + '        <div class="xs-linkmode">'
    + '          <label><input type="radio" name="xs-lm" value="short" checked /> 短链接</label>'
    + '          <label><input type="radio" name="xs-lm" value="long" /> 长链接</label>'
    + '        </div>'
    + '        <div class="xs-url" id="xs-url"></div>'
    + '        <p class="xs-tip" style="text-align:left;margin:8px 0 14px">可将链接挂在公众号菜单 / 图文，或复制后发给学员</p>'
    + '        <div class="xs-actions"><button class="btn btn-primary" id="xs-copy">复制链接</button></div>'
    + '      </div>'
    + '      <div class="xs-panel" data-xs-panel="poster">'
    + '        <div class="xs-poster">'
    + '          <img class="xs-poster-cover" id="xs-poster-cover" alt="" />'
    + '          <div class="xs-poster-bd">'
    + '            <div class="xs-poster-title" id="xs-poster-title"></div>'
    + '            <div class="xs-poster-desc" id="xs-poster-desc"></div>'
    + '            <div class="xs-poster-ft"><span class="xs-poster-brand">艺博教育</span><span class="xs-poster-qr" id="xs-poster-qr"></span></div>'
    + '          </div>'
    + '        </div>'
    + '        <p class="xs-tip">海报使用上方「分享设置」中的标题与描述</p>'
    + '        <div class="xs-actions"><button class="btn btn-primary" id="xs-download-poster">下载海报</button></div>'
    + '      </div>'
    + '      <div class="xs-setting-hd">分享设置 <span class="xs-caret">自定义学员端分享卡片的标题与描述</span></div>'
    + '      <div class="xs-field"><label>分享标题（默认为内容名称，30 字内）</label><input id="xs-share-title" maxlength="30" /></div>'
    + '      <div class="xs-field"><label>分享描述（60 字内）</label><textarea id="xs-share-desc" maxlength="60"></textarea><div class="xs-count"><span id="xs-desc-count">0</span>/60</div></div>'
    + '      <div class="xs-actions"><button class="btn" id="xs-save-setting">保存分享设置</button><button class="btn" id="xs-reset-setting">恢复默认</button></div>'
    + '    </div>'
    + '  </div>'
    + '</div>';

  var ready = false;
  function ensureDom() {
    if (ready) return;
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    var wrap = document.createElement("div");
    wrap.innerHTML = MODAL_HTML;
    document.body.appendChild(wrap.firstElementChild);
    bind();
    ready = true;
  }

  var state = { urlShort: "", urlLong: "", shareTitle: "", shareDesc: "" };

  function bind() {
    var modal = document.getElementById("xs-modal");
    var mask = document.getElementById("mask");

    function close() {
      mask.classList.remove("open");
      modal.classList.remove("open");
    }
    modal.addEventListener("click", function (e) {
      if (e.target.closest("[data-xs-close]")) { close(); return; }
      var tab = e.target.closest("[data-xs-tab]");
      if (tab) {
        modal.querySelectorAll(".xs-tab").forEach(function (t) { t.classList.toggle("active", t === tab); });
        modal.querySelectorAll(".xs-panel").forEach(function (p) {
          p.classList.toggle("active", p.getAttribute("data-xs-panel") === tab.getAttribute("data-xs-tab"));
        });
        return;
      }
    });

    modal.querySelectorAll('input[name="xs-lm"]').forEach(function (r) {
      r.addEventListener("change", function () {
        document.getElementById("xs-url").textContent = r.value === "long" ? state.urlLong : state.urlShort;
      });
    });

    document.getElementById("xs-copy").addEventListener("click", function () {
      var long = modal.querySelector('input[name="xs-lm"]:checked').value === "long";
      var text = long ? state.urlLong : state.urlShort;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { window.Proto.toast("链接已复制"); }, function () { window.Proto.toast("链接已复制"); });
      } else { window.Proto.toast("链接已复制"); }
    });

    document.getElementById("xs-download-qr").addEventListener("click", function () {
      var svg = document.querySelector("#xs-qr svg");
      if (!svg) { window.Proto.toast("二维码尚未生成"); return; }
      var blob = new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = (state.shareTitle || "内容") + "-分享二维码.svg";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      window.Proto.toast("二维码已下载");
    });

    document.getElementById("xs-download-poster").addEventListener("click", function () {
      window.Proto.toast("海报已生成并下载（演示）");
    });

    document.getElementById("xs-share-desc").addEventListener("input", function () {
      document.getElementById("xs-desc-count").textContent = this.value.length;
      renderPoster();
    });
    document.getElementById("xs-share-title").addEventListener("input", renderPoster);

    document.getElementById("xs-save-setting").addEventListener("click", function () {
      window.Proto.toast("分享设置已保存，学员端分享卡片将同步生效");
    });
    document.getElementById("xs-reset-setting").addEventListener("click", function () {
      document.getElementById("xs-share-title").value = state.shareTitle;
      document.getElementById("xs-share-desc").value = state.shareDesc;
      document.getElementById("xs-desc-count").textContent = state.shareDesc.length;
      renderPoster();
      window.Proto.toast("已恢复默认分享语");
    });
  }

  function renderPoster() {
    var t = document.getElementById("xs-share-title").value || state.shareTitle;
    var d = document.getElementById("xs-share-desc").value || state.shareDesc;
    document.getElementById("xs-poster-title").textContent = t;
    document.getElementById("xs-poster-desc").textContent = d;
  }

  function open(opts) {
    opts = opts || {};
    ensureDom();
    var Proto = window.Proto;
    state.urlShort = opts.url || "";
    state.urlLong = opts.longUrl || (opts.url ? opts.url.replace(/^https:\/\/yibo\.app\//, "https://h5.yiboedu.com/detail?type=") : "");
    state.shareTitle = opts.name || "";
    state.shareDesc = opts.desc || "";

    document.getElementById("xs-title").textContent = "分享" + (opts.type || "内容");
    document.getElementById("xs-qr").innerHTML = Proto && Proto.qrSvg ? Proto.qrSvg(state.urlShort, 148) : "";
    document.getElementById("xs-poster-qr").innerHTML = Proto && Proto.qrSvg ? Proto.qrSvg(state.urlShort, 44) : "";
    document.getElementById("xs-poster-cover").src = opts.cover || "";
    document.getElementById("xs-url").textContent = state.urlShort;
    document.getElementById("xs-share-title").value = state.shareTitle;
    document.getElementById("xs-share-desc").value = state.shareDesc;
    document.getElementById("xs-desc-count").textContent = state.shareDesc.length;
    renderPoster();

    // 默认定位到「二维码」面板
    var modal = document.getElementById("xs-modal");
    modal.querySelector(".xs-tab").click();

    document.getElementById("mask").classList.add("open");
    modal.classList.add("open");
  }

  return { open: open };
})();
