// 生成一期页面真值清单（默认隐藏二期）
const fs = require('fs');
const path = require('path');
const BASE = path.join(__dirname, '..', 'prototype');

function extract(file) {
  const s = fs.readFileSync(file, 'utf8');
  const i = s.indexOf('var sidebars = ');
  if (i < 0) return null;
  let st = s.indexOf('{', i), d = 0;
  for (let j = st; j < s.length; j++) {
    if (s[j] === '{') d++;
    else if (s[j] === '}') { d--; if (d === 0) return s.slice(st, j + 1); }
  }
  return null;
}

function evalSidebars(file) {
  const code = extract(file);
  if (!code) return null;
  try { return new Function('return ' + code)(); } catch (e) { return null; }
}

// phase2
const p2src = fs.readFileSync(path.join(BASE, 'assets/js/phase2-config.js'), 'utf8');
const p2items = {};
{
  const sandbox = { window: {} };
  new Function('window', p2src)(sandbox.window);
  Object.assign(p2items, sandbox.window.ProtoPhase2.items);
}

const out = { admin: [], ops: [], mp: [] };
for (const [file, scope] of [['admin-shell.js', 'admin'], ['ops-shell.js', 'ops'], ['mp-shell.js', 'mp']]) {
  const sb = evalSidebars(path.join(BASE, 'assets/js', file));
  if (!sb) { console.error('parse fail', file); continue; }
  const p2 = p2items[scope] || [];
  for (const mod in sb) {
    for (const g of sb[mod]) {
      for (const l of (g.links || [])) {
        out[scope].push({ module: mod, group: g.group, id: l.id, href: l.href, label: l.label, phase2: p2.includes(l.id) });
      }
    }
  }
}

const p1 = { admin: [], ops: [], mp: [] };
for (const s of ['admin', 'ops', 'mp']) {
  p1[s] = out[s].filter(x => !x.phase2);
  console.log(`\n===== ${s.toUpperCase()} 一期侧栏（${p1[s].length} 项 / 共 ${out[s].length}） =====`);
  for (const x of p1[s]) console.log(`${x.module} | ${x.group} | ${x.id} | ${x.href} | ${x.label}`);
}
fs.writeFileSync('/tmp/p1-pages.json', JSON.stringify({ p1, all: out, p2items }, null, 2));
