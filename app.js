/* واجهة اللعبة: ملفات اللاعبين، اختيار السنة، المراحل، الأسئلة مع التلميحات، XP والشارات، مراجعة الأخطاء */
(function () {
'use strict';
const Q = window.MATHQ, Y = Q.years, OPEN = !!window.APP_OPEN, KEY = OPEN ? 'math_adventure_open_v1' : 'math_adventure_v1', app = document.getElementById('app');
let S = load(), run = null;

function load() { try { return JSON.parse(localStorage.getItem(KEY)) || { users: {}, cur: null }; } catch (e) { return { users: {}, cur: null }; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* التخزين غير متاح */ } }
const U = () => S.users[S.cur], lvl = u => Math.floor(u.xp / 100) + 1;
function el(t, a, ...c) { const e = document.createElement(t); for (const k in a || {}) { if (a[k] == null || a[k] === false) continue; if (k === 'class') e.className = a[k]; else if (k.startsWith('on')) e[k] = a[k]; else e.setAttribute(k, a[k]); } c.flat().forEach(x => e.append(x && x.nodeType ? x : document.createTextNode(x == null ? '' : x))); return e; }
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.className = 'show'; clearTimeout(toast.t); toast.t = setTimeout(() => t.className = '', 2600); }
const AVATARS = [['🦊', 0], ['🐼', 30], ['🦁', 40], ['🐯', 50], ['🐸', 60], ['🦄', 80], ['🚀', 100], ['🤖', 120]];
const BADGES = [
  ['first', '🌱', 'أول إجابة صحيحة', u => u.solved >= 1], ['s5', '🔥', '5 إجابات متتالية', u => u.best >= 5], ['s10', '⚡', '10 إجابات متتالية', u => u.best >= 10],
  ['q100', '💯', 'حلّ 100 سؤال', u => u.solved >= 100], ['q500', '🏅', 'حلّ 500 سؤال', u => u.solved >= 500],
  ['xp500', '⭐', '500 نقطة خبرة', u => u.xp >= 500], ['xp2000', '🌟', '2000 نقطة خبرة', u => u.xp >= 2000],
  ['star3', '🏆', 'ثلاث نجوم في درس', u => Object.values(u.lessons).some(l => l.stars === 3)],
  ['year', '🎓', 'أنهيت كل دروس سنة', u => [1, 2, 3, 4].some(y => Y[y].lessons.every(l => (u.lessons[l.id] || {}).stars >= 1))],
  ['fix', '🔧', 'صحّحت 10 أخطاء', u => (u.fixed || 0) >= 10]
];
function checkBadges() { const u = U(); BADGES.forEach(([id, ic, nm, ok]) => { if (!u.badges.includes(id) && ok(u)) { u.badges.push(id); u.coins += 20; toast(`${ic} شارة جديدة: ${nm} (+20 عملة)`); } }); save(); }

function bar() {
  const u = U(), into = u.xp % 100;
  return el('div', { class: 'bar' },
    el('button', { class: 'chip', onclick: screenYears }, u.av + ' ' + u.name),
    el('span', { class: 'chip' }, '⭐ المستوى ' + lvl(u)),
    el('span', { class: 'chip xp' }, el('i', { style: `width:${into}%` }), el('b', {}, u.xp + ' XP')),
    el('span', { class: 'chip' }, '🪙 ' + u.coins),
    el('button', { class: 'chip', onclick: screenProfile }, '🏅 الشارات'),
    el('button', { class: 'chip', onclick: screenHome }, '👥'));
}
function show(...n) { app.replaceChildren(...n); window.scrollTo(0, 0); }

/* ── التحديثات ── */
async function checkUpdates() {
  const N = window.nativeApp;
  if (N) { toast('جارٍ التحقق من التحديثات…'); return handleStatus(await N.check(), true); }
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) { try { const reg = await navigator.serviceWorker.getRegistration(); if (reg) { await reg.update(); toast('تم التحقق. إن وُجد إصدار جديد فسيُطبَّق عند إعادة فتح التطبيق.'); return; } } catch (e) { /* تجاهل */ } }
  toast('هذه النسخة تتحدّث تلقائياً عند إعادة فتح الرابط.');
}
function handleStatus(s, manual) {
  if (s.state === 'downloaded') { if (confirm(`تم تنزيل تحديث (الإصدار ${s.version}). إعادة تشغيل التطبيق الآن لتطبيقه؟`)) window.nativeApp.restart(); else toast('سيُطبَّق التحديث عند التشغيل القادم.'); }
  else if (s.state === 'installer') { if (confirm('يتوفر إصدار جديد يحتاج إعادة تثبيت التطبيق. فتح صفحة التنزيل؟') && s.url) window.nativeApp.openLink(s.url); }
  else if (s.state === 'uptodate') { if (manual) toast('أنت تستعمل أحدث إصدار ✅'); }
  else if (s.state === 'noconfig') { if (manual) toast('لم يُضبط رابط التحديث بعد (ملف update-config.json).'); }
  else if (s.state === 'error' && manual) toast('تعذّر التحديث: ' + s.message);
}
if (window.nativeApp) window.nativeApp.onStatus(s => handleStatus(s, false));

/* ── الشاشة الرئيسية: اللاعبون ── */
function screenHome() {
  run = null; const us = Object.entries(S.users);
  show(el('div', { class: 'hero' }, el('h1', {}, '🧮 أبطال الرياضيات'), el('p', {}, 'تعلّم وتحدَّ وتقدّم في مغامرة الرياضيات حسب سنتك الدراسية')),
    el('div', { class: 'panel' },
      us.length ? el('h2', {}, 'اختر اللاعب') : '',
      ...us.map(([id, u]) => el('div', { class: 'row' },
        el('button', { class: 'big user', onclick: () => { S.cur = id; save(); screenYears(); } }, `${u.av} ${u.name} · المستوى ${lvl(u)}`),
        el('button', { class: 'del', title: 'حذف', onclick: () => { if (confirm('حذف اللاعب وكل تقدّمه؟')) { delete S.users[id]; if (S.cur === id) S.cur = null; save(); screenHome(); } } }, '🗑'))),
      el('h3', {}, 'لاعب جديد'),
      el('input', { id: 'nm', placeholder: 'اكتب اسمك', maxlength: 20 }),
      el('button', { class: 'big go', onclick: () => { const v = document.getElementById('nm').value.trim(); if (!v) return toast('اكتب اسمك أولاً'); const id = 'u' + Date.now(); S.users[id] = { name: v, av: '🦊', avs: ['🦊'], xp: 0, coins: 0, badges: [], lessons: {}, mistakes: [], solved: 0, best: 0, streak: 0, fixed: 0 }; S.cur = id; save(); screenYears(); } }, 'ابدأ المغامرة ✨')));
}

/* ── اختيار السنة ── */
function screenYears() {
  if (!S.cur || !U()) return screenHome(); run = null; const u = U();
  show(bar(), el('h2', { class: 'ttl' }, 'اختر سنتك الدراسية'), el('p', { class: 'sub' }, 'لن تظهر لك إلا دروس السنة التي تختارها.'),
    el('div', { class: 'grid' }, ...[1, 2, 3, 4].map(y => {
      const Yr = Y[y], st = Yr.lessons.reduce((s, l) => s + ((u.lessons[l.id] || {}).stars || 0), 0), mx = Yr.lessons.length * 3;
      return el('button', { class: 'ycard', style: `--c:${Yr.color}`, onclick: () => screenMap(y) }, el('b', {}, Yr.short), el('span', {}, Yr.name), el('small', {}, `⭐ ${st} / ${mx}`));
    })),
    el('div', { class: 'row c' }, el('button', { class: 'btn', onclick: screenMistakes }, `🔧 مراجعة أخطائي (${u.mistakes.length})`), el('button', { class: 'btn', onclick: checkUpdates }, '🔄 التحقق من التحديثات')), el('p', { class: 'ver' }, `الإصدار ${window.APP_VERSION || '1.0.0'}${OPEN ? ' · نسخة مفتوحة 🔓' : ''}`));
}

/* ── خريطة المراحل ── */
function screenMap(y) {
  const u = U(), Yr = Y[y]; run = null;
  show(bar(), el('div', { class: 'row c' }, el('button', { class: 'btn', onclick: screenYears }, '→ السنوات')),
    el('h2', { class: 'ttl', style: `color:${Yr.color}` }, Yr.name),
    el('div', { class: 'map' }, ...Yr.lessons.map((l, i) => {
      const prev = i ? (u.lessons[Yr.lessons[i - 1].id] || {}).stars : 1, lock = !OPEN && !prev, st = (u.lessons[l.id] || {}).stars || 0;
      const sb = el('button', { class: 'stage' + (lock ? ' lock' : ''), disabled: lock ? 'disabled' : null, onclick: () => startRun(y, [l.id], l.title, l.id) },
        el('span', { class: 'num' }, lock ? '🔒' : l.icon), el('span', { class: 'nm' }, `${i + 1}. ${l.title}`), el('span', { class: 'stars' }, '★'.repeat(st) + '☆'.repeat(3 - st)));
      return el('div', { class: 'srow' }, sb, el('button', { class: 'btn sitb', disabled: lock ? 'disabled' : null, onclick: () => screenSit(y, l) }, '🧩 وضعية إدماجية'));
    })),
    el('div', { class: 'row c' }, el('button', { class: 'btn go', onclick: () => startRun(y, Yr.lessons.map(l => l.id), 'تدريب مختلط · ' + Yr.short, null) }, '🎲 تدريب مختلط على دروس السنة')));
}

/* ── الوضعيات الإدماجية: ضعيف / متوسط / ممتاز ── */
const LVN = ['ضعيف', 'متوسط', 'ممتاز'], LVD = ['خطوة واحدة', 'خطوتان', 'عدة خطوات وربط بين المعارف'];
function screenSit(y, l) {
  const u = U(); u.sits = u.sits || {}; run = null;
  show(bar(), el('div', { class: 'row c' }, el('button', { class: 'btn', onclick: () => screenMap(y) }, '→ المراحل')),
    el('h2', { class: 'ttl' }, '🧩 وضعية إدماجية'), el('p', { class: 'sub' }, `${l.icon} ${l.title} · اختر مستوى الوضعية`),
    el('div', { class: 'grid' }, ...[1, 2, 3].map(v => { const st = u.sits[l.id + ':' + v] || 0;
      return el('button', { class: 'ycard', style: `--c:${['#22c55e', '#f59e0b', '#ec4899'][v - 1]}`, onclick: () => startRun(y, [l.id], `وضعية إدماجية · ${l.title} · ${LVN[v - 1]}`, null, false, v) },
        el('b', {}, LVN[v - 1]), el('span', {}, LVD[v - 1]), el('small', {}, '★'.repeat(st) + '☆'.repeat(3 - st))); })));
}

/* ── جلسة الأسئلة ── */
const PAT = [1, 1, 1, 2, 2, 2, 2, 3, 3, 3];
function startRun(y, lessonIds, title, stageId, review, sit) {
  const items = sit ? Array.from({ length: 4 }, () => ({ lid: lessonIds[0], d: sit, sit })) : PAT.map((d, i) => ({ lid: lessonIds.length === 1 ? lessonIds[0] : pick(lessonIds), d: review ? 2 : d }));
  run = { y, title, stageId, review: !!review, sit: sit || 0, items, i: 0, ok: 0, orig: items.length, hint: 0, att: 0, xp: 0, perfect: true, done: false, q: null, pos: 0 };
  nextQ();
}
const pick = a => a[Math.floor(Math.random() * a.length)];
function nextQ() {
  if (run.i >= run.items.length) return finish();
  const it = run.items[run.i]; if (!Q.find(it.lid) || Q.find(it.lid).year !== run.y) return finish();   // لا اختلاط بين السنوات
  run.q = it.sit ? Q.makeSit(it.lid, it.sit) : Q.make(it.lid, it.d); run.hint = 0; run.att = 0; run.done = false; drawQ();
}
function parse(s) {
  s = String(s).trim().replace(/[٠-٩]/g, c => c.charCodeAt(0) - 1632).replace(/[−–]/g, '-').replace(/،/g, '.').replace(',', '.').replace(/\s+/g, '');
  let m = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/); if (m) return +m[1] / +m[2];
  return /^-?\d+(\.\d+)?$/.test(s) ? +s : NaN;
}
function drawQ() {
  const q = run.q, it = run.items[run.i], L = Q.find(it.lid), pct = Math.min(100, Math.round(run.pos / run.orig * 100));
  const fb = el('div', { id: 'fb', class: 'fb' }), nxt = el('button', { id: 'nxt', class: 'btn go hide', onclick: () => { run.i++; nextQ(); } }, 'السؤال التالي ←');
  let body;
  if (q.t === 'num') {
    const inp = el('input', { id: 'ans', class: 'ans', inputmode: 'decimal', autocomplete: 'off', placeholder: 'اكتب الجواب (يمكن 3,5 أو 7/2)' });
    inp.onkeydown = e => { if (e.key === 'Enter') submit(inp.value); };
    body = el('div', { class: 'in' }, inp, el('button', { class: 'btn go', onclick: () => submit(inp.value) }, 'تحقّق ✔')); setTimeout(() => inp.focus(), 50);
  } else body = el('div', { class: 'opts' }, ...q.o.map(o => el('button', { class: 'opt', onclick: ev => submit(o, ev.currentTarget) }, o)));
  show(bar(), el('div', { class: 'row c' }, el('button', { class: 'btn', onclick: () => { run = null; screenMap(L.year); } }, '✕ خروج')),
    el('div', { class: 'prog' }, el('i', { style: `width:${pct}%` })), el('div', { class: 'meta' }, `${run.title} · السؤال ${Math.min(run.pos + 1, run.orig)} من ${run.orig} · ${it.sit ? 'مستوى الوضعية: ' + LVN[it.sit - 1] : 'الصعوبة ' + '●'.repeat(it.d) + '○'.repeat(3 - it.d)}`),
    el('div', { class: 'qbox' }, el('div', { class: 'lt' }, L.icon + ' ' + L.title), el('div', { class: 'qt' }, q.q)),
    body, el('div', { class: 'row c' }, el('button', { id: 'hb', class: 'btn', onclick: askHint }, '💡 تلميح')), fb, nxt);
}
function say(html, cls) { const f = document.getElementById('fb'); f.className = 'fb ' + (cls || ''); f.replaceChildren(...(Array.isArray(html) ? html : [html])); }
function askHint() { if (run.done) return; if (run.hint < 2) run.hint++; run.perfect = false; say(['💡 ' + run.q.h[run.hint - 1]], 'hint'); }
function award(q) {
  const u = U(), d = run.items[run.i].d + (run.items[run.i].sit ? 1 : 0), gain = Math.max(2, 10 * d - 4 * (run.att + run.hint)); u.xp += gain; u.coins += d; u.solved++; u.streak++; u.best = Math.max(u.best, u.streak); run.xp += gain;
  if (run.review) { const k = u.mistakes.findIndex(m => m.lid === run.items[run.i].lid); if (k >= 0) { u.mistakes.splice(k, 1); u.fixed = (u.fixed || 0) + 1; } }
  return gain;
}
function submit(val, btn) {
  if (run.done) return; const q = run.q; let ok;
  if (q.t === 'num') { const v = parse(val); if (isNaN(v)) return say('اكتب عدداً (مثل 12 أو 3,5 أو 7/2).', 'bad'); ok = Math.abs(v - q.a) <= q.tol; } else ok = val === q.a;
  if (ok) {
    run.done = true; run.pos++; if (!run.items[run.i].re) { if (run.att === 0 && run.hint === 0) run.ok++; else if (run.att + run.hint <= 1) run.ok += 0.5; }
    const gain = award(q); if (btn) btn.classList.add('good'); lockAll();
    say([el('b', {}, `✅ أحسنت! +${gain} XP`), el('div', { class: 'why' }, '📘 ' + q.w)], 'good'); showNext(); checkBadges(); save(); return;
  }
  run.att++; run.perfect = false; U().streak = 0; if (btn) { btn.classList.add('wrong'); btn.disabled = true; }
  if (run.att === 1) say(['❌ ليست صحيحة. تلميح أول: ' + q.h[0]], 'bad');
  else if (run.att === 2) say(['❌ حاول مرة أخرى. تلميح أوضح: ' + q.h[1]], 'bad');
  else {
    run.done = true; run.pos++; lockAll(); const u = U(), it = run.items[run.i];
    u.mistakes.unshift({ lid: it.lid, q: q.q, ans: q.t === 'mcq' ? q.a : String(q.a).replace('.', ','), s: q.s, w: q.w }); u.mistakes = u.mistakes.slice(0, 100);
    say([el('b', {}, '📝 لنراجع الحل معاً'), el('div', { class: 'why' }, '🪜 خطوات الحل: ' + q.s), el('div', { class: 'why' }, '📘 ' + q.w), el('div', {}, 'سنعيد عليك سؤالاً مشابهاً بعد قليل للتأكد من الفهم.')], 'step');
    run.items.splice(Math.min(run.i + 4, run.items.length), 0, { lid: it.lid, d: Math.max(1, it.d), re: true, sit: it.sit }); showNext(); save();
  }
  save();
}
function lockAll() { document.querySelectorAll('.opt').forEach(b => { b.disabled = true; }); const a = document.getElementById('ans'); if (a) a.disabled = true; const h = document.getElementById('hb'); if (h) h.disabled = true; }
function showNext() { document.getElementById('nxt').classList.remove('hide'); }

function finish() {
  const u = U(), acc = run.orig ? Math.min(1, run.ok / run.orig) : 0, stars = acc >= 0.9 ? 3 : acc >= 0.75 ? 2 : acc >= 0.6 ? 1 : 0, coins = stars * 5 + Math.round(run.ok);
  u.coins += coins; if (run.sit) { u.sits = u.sits || {}; const k = run.items[0].lid + ':' + run.sit; u.sits[k] = Math.max(u.sits[k] || 0, stars); } if (run.stageId) { const l = u.lessons[run.stageId] || (u.lessons[run.stageId] = { stars: 0, plays: 0 }); l.stars = Math.max(l.stars, stars); l.plays++; }
  const r = run; run = null; checkBadges(); save();
  show(bar(), el('div', { class: 'result' }, el('h2', {}, stars ? 'أحسنت يا بطل! 🎉' : 'محاولة جيدة، لا تستسلم 💪'), el('div', { class: 'bigstars' }, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
    el('p', {}, `الدقة: ${Math.round(acc * 100)}% · +${r.xp} XP · +${coins} عملة`), el('p', { class: 'sub' }, stars ? '' : 'تحتاج 60% على الأقل لنيل نجمة وفتح المرحلة التالية. راجع أخطاءك ثم أعد المحاولة.'),
    el('div', { class: 'row c' }, el('button', { class: 'btn go', onclick: () => r.sit ? startRun(r.y, [r.items[0].lid], r.title, null, false, r.sit) : startRun(r.y, r.stageId ? [r.stageId] : Y[r.y].lessons.map(l => l.id), r.title, r.stageId) }, '🔁 إعادة'), el('button', { class: 'btn', onclick: () => screenMap(r.y) }, '🗺 المراحل'), el('button', { class: 'btn', onclick: screenMistakes }, '🔧 أخطائي'))));
}

/* ── مراجعة الأخطاء ── */
function screenMistakes() {
  const u = U(); run = null; const ids = [...new Set(u.mistakes.map(m => m.lid))];
  show(bar(), el('div', { class: 'row c' }, el('button', { class: 'btn', onclick: screenYears }, '→ رجوع')), el('h2', { class: 'ttl' }, '🔧 مراجعة الأخطاء'),
    u.mistakes.length ? el('div', { class: 'row c' }, ...[1, 2, 3, 4].filter(y => ids.some(i => Q.find(i).year === y)).map(y => el('button', { class: 'btn go', onclick: () => startRun(y, ids.filter(i => Q.find(i).year === y), 'تدرّب على أخطائك · ' + Y[y].short, null, true) }, `تدرّب على أخطاء ${Y[y].short}`))) : el('p', { class: 'sub' }, 'لا أخطاء محفوظة. ممتاز! 🌟'),
    el('div', { class: 'list' }, ...u.mistakes.slice(0, 30).map(m => el('div', { class: 'mi' }, el('b', {}, m.q), el('div', {}, '✔ الجواب: ' + m.ans), el('div', { class: 'why' }, '🪜 ' + m.s), el('div', { class: 'why' }, '📘 ' + m.w)))));
}

/* ── الملف الشخصي والشارات والمتجر ── */
function screenProfile() {
  const u = U(); run = null;
  show(bar(), el('div', { class: 'row c' }, el('button', { class: 'btn', onclick: screenYears }, '→ رجوع')), el('h2', { class: 'ttl' }, '🏅 الشارات والإنجازات'),
    el('p', { class: 'sub' }, `حلّلت ${u.solved} سؤالاً · أطول سلسلة صحيحة ${u.best}`),
    el('div', { class: 'badges' }, ...BADGES.map(([id, ic, nm]) => el('div', { class: 'badge' + (u.badges.includes(id) ? '' : ' off') }, el('span', {}, ic), nm))),
    el('h2', { class: 'ttl' }, '🛍 متجر الشخصيات'),
    el('div', { class: 'badges' }, ...AVATARS.map(([a, p0]) => { const p = OPEN ? 0 : p0, own = u.avs.includes(a); return el('button', { class: 'badge shop' + (u.av === a ? ' sel' : ''), onclick: () => { if (own) { u.av = a; save(); screenProfile(); } else if (u.coins >= p) { u.coins -= p; u.avs.push(a); u.av = a; save(); toast('تم الشراء 🎉'); screenProfile(); } else toast('عملاتك لا تكفي بعد 🪙'); } }, el('span', {}, a), own ? (u.av === a ? 'مختارة' : 'مملوكة') : p + ' 🪙'); })));
}

if (location.protocol.startsWith('http') && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(reg => reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) toast('🔄 يتوفر إصدار جديد، أعد فتح التطبيق لتطبيقه'); }); })).catch(() => {});
}
S.cur && U() ? screenYears() : screenHome();
})();
