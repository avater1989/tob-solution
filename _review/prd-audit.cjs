// 核查 PRD 中引用的页面是否属一期或废弃
const fs = require('fs');
const path = require('path');
const ROOT = '/Users/b_hong/Documents/WBDY/tob-solution-main/prototype';
const PRD = fs.readFileSync('/tmp/prd/full.txt', 'utf8');
const scan = JSON.parse(fs.readFileSync('/tmp/p1-pages.json', 'utf8'));

// 一期可见页面（按端）
const p1 = { admin: new Set(), ops: new Set() };
for (const s of ['admin', 'ops']) for (const x of scan.p1[s]) p1[s].add(x.href.split('#')[0].split('?')[0]);

// 二期页面（侧栏里有但标二期）
const p2 = { admin: new Set(), ops: new Set() };
for (const s of ['admin', 'ops']) for (const x of scan.all[s]) if (x.phase2) p2[s].add(x.href.split('#')[0].split('?')[0]);

// 实际存在的 html
const exists = { admin: new Set(), ops: new Set(), miniprogram: new Set(), root: new Set() };
for (const d of ['admin', 'ops', 'miniprogram']) {
  for (const f of fs.readdirSync(path.join(ROOT, d))) if (f.endsWith('.html')) exists[d].add(f);
}
for (const f of fs.readdirSync(ROOT)) if (f.endsWith('.html')) exists.root.add(f);

// 抽取 PRD 里所有 xxx.html 引用
const re = /([a-z0-9-]+)\.html/gi;
const refs = {};
let m;
while ((m = re.exec(PRD))) {
  const n = m[1].toLowerCase();
  (refs[n] = refs[n] || new Set()).add(m[0]);
}

function classify(name) {
  const inAdmin = exists.admin.has(name + '.html');
  const inOps = exists.ops.has(name + '.html');
  const inMp = exists.miniprogram.has(name + '.html');
  const inRoot = exists.root.has(name + '.html');
  const side = [];
  if (inAdmin) side.push('admin');
  if (inOps) side.push('ops');
  if (inMp) side.push('mp');
  if (inRoot) side.push('root');
  const phases = [];
  for (const s of side) {
    if (s === 'admin' || s === 'ops') {
      if (p1[s].has(name + '.html')) phases.push('P1:' + s);
      if (p2[s].has(name + '.html')) phases.push('P2:' + s);
    } else phases.push('?' + s);
  }
  return { side, phases };
}

console.log('=== PRD 引用页面分类 ===');
console.log('name.html | 存在于 | 一期侧栏 | 二期侧栏 | PRD 提及次数');
const rows = [];
for (const name of Object.keys(refs).sort()) {
  const c = classify(name);
  const p1hit = c.phases.filter(x => x.startsWith('P1')).join(',');
  const p2hit = c.phases.filter(x => x.startsWith('P2')).join(',');
  const n = (PRD.match(new RegExp(name.replace(/-/g, '\\-') + '\\.html', 'gi')) || []).length;
  const flag = (!p1hit && p2hit) ? '<<< 二期' : (!p1hit && !p2hit && c.side.length) ? '<<< 无侧栏入口' : (!c.side.length ? '<<< 文件不存在' : '');
  rows.push(`${name}.html | ${c.side.join(',') || '-'} | ${p1hit || '-'} | ${p2hit || '-'} | ${n} ${flag}`);
}
console.log(rows.join('\n'));
fs.writeFileSync('/tmp/prd/page-audit.txt', rows.join('\n'));
