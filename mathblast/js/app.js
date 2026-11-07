/* ============================================================
   UTILIDADES
============================================================ */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[R(0, a.length - 1)];
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const lcm = (a, b) => a / gcd(a, b) * b;
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const PLACE = ['unidades','decenas','centenas','unidades de millar','decenas de millar','centenas de millar'];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

function fmt(n) {
  const s = String(Math.abs(n));
  const g = s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s;
  return (n < 0 ? '−' : '') + g;
}
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = R(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function placesOf(n) { return String(n).split('').reverse().map((c, i) => +c * 10 ** i); }       // [u, d, c…]
function partsOf(n) { return placesOf(n).filter(v => v).reverse(); }                               // [400, 30, 7]
function factorize(n) { const f = []; let d = 2; while (n > 1) { while (n % d === 0) { f.push(d); n /= d; } d++; } return f; }
function factorStr(n) {
  const c = {}; factorize(n).forEach(p => c[p] = (c[p] || 0) + 1);
  const k = Object.keys(c); if (!k.length) return '1';
  return k.map(p => c[p] > 1 ? `${p}<sup>${c[p]}</sup>` : p).join(' × ');
}
function divisors(n) { const d = []; for (let i = 1; i <= n; i++) if (n % i === 0) d.push(i); return d; }
function noCarrySum(a, b) { const A = placesOf(a), B = placesOf(b), L = Math.max(A.length, B.length); let s = 0; for (let i = 0; i < L; i++) { const x = (A[i] || 0) / 10 ** i, y = (B[i] || 0) / 10 ** i; s += ((x + y) % 10) * 10 ** i; } return s; }
function smallFromBig(a, b) { const A = placesOf(a), B = placesOf(b); let s = 0; for (let i = 0; i < A.length; i++) { const x = A[i] / 10 ** i, y = (B[i] || 0) / 10 ** i; s += Math.abs(x - y) * 10 ** i; } return s; }

/* ============================================================
   FORMATOS
============================================================ */
const FORMATS = {
  sum:  { name:'Suma',            badge:'+ Suma',              sym:'+',   c:'#28a86e', g:'base', min:1 },
  sub:  { name:'Resta',           badge:'− Resta',             sym:'−',   c:'#e8354a', g:'base', min:1 },
  mul:  { name:'Multiplicación',  short:'Mult.', badge:'× Multiplicación', sym:'×', c:'#2d6be4', g:'base', min:1 },
  div:  { name:'División',        short:'Div.',  badge:'÷ División',       sym:'÷', c:'#d48806', g:'base', min:1 },
  prob: { name:'Problemas',       badge:'¿? Problema',         sym:'¿?',  c:'#1a1a2e', g:'plus', min:1 },
  div2: { name:'División 2 cifras', short:'÷ 2 cifras', badge:'÷ Divisor de 2 cifras', sym:'÷<small style="font-size:.5em">dd</small>', c:'#c2410c', g:'plus', min:2 },
  comb: { name:'Combinadas',      badge:'( ) Operaciones combinadas', sym:'( )', c:'#0d9488', g:'plus', min:2 },
  pot:  { name:'Potencias',       badge:'xⁿ Potencias',        sym:'x<sup style="font-size:.55em">n</sup>', c:'#7c3aed', g:'plus', min:3 },
  raiz: { name:'Raíz cuadrada',   short:'Raíces', badge:'√ Raíz cuadrada', sym:'√', c:'#e8358a', g:'plus', min:3 },
  mcd:  { name:'m.c.d.',          badge:'Máximo común divisor', sym:'mcd', txt:true, c:'#0369a1', g:'plus', min:3 },
  mcm:  { name:'m.c.m.',          badge:'Mínimo común múltiplo', sym:'mcm', txt:true, c:'#4d7c0f', g:'plus', min:3 },
};
const LEVEL_DIGITS = { 1:[1,2], 2:[2,3], 3:[3,4], 4:[4,5] };

/* ============================================================
   ESTADO
============================================================ */
const state = {
  mode:'mc', ops:new Set(['sum','mul']), digits:new Set([3,4]), level:3, remainder:false,
  qCount:10, useTeams:false, numTeams:2, teamNames:[],
  teamColors:['#e8354a','#2d6be4','#28a86e','#f5a623','#7c3aed'],
  duaHints:true, duaTools:true, duaPad:true, useTimer:false, timerSecs:60,
};
const game = { questions:[], current:0, answers:[], teamScores:[], currentTeam:0, correct:0, wrong:0, score:0, streak:0, maxStreak:0, timer:null, timerVal:0, locked:false, aidLevel:0 };
const DEFAULT_TEAMS = ['Equipo Rojo 🔴','Equipo Azul 🔵','Equipo Verde 🟢','Equipo Naranja 🟠','Equipo Morado 🟣'];
const STORE = 'edumind-mathblast-2-niveles';

/* ============================================================
   CONFIGURACIÓN (pantalla inicial)
============================================================ */
function buildFormatGrids() {
  ['base','plus'].forEach(g => {
    const grid = $(g === 'base' ? '#gridBase' : '#gridPlus');
    grid.innerHTML = '';
    Object.entries(FORMATS).filter(([, f]) => f.g === g).forEach(([k, f]) => {
      const b = document.createElement('button');
      b.className = 'op-card'; b.dataset.op = k; b.style.setProperty('--c', f.c);
      b.innerHTML = `<span class="op-symbol${f.txt ? ' txt' : ''}" aria-hidden="true">${f.sym}</span><div class="op-name">${f.short || f.name}</div><div class="min">Desde nivel ${f.min}</div>`;
      b.onclick = () => toggleOp(k);
      grid.appendChild(b);
    });
  });
}
function toggleOp(op) {
  if (FORMATS[op].min > state.level) return;
  if (state.ops.has(op)) { if (state.ops.size === 1) return; state.ops.delete(op); } else state.ops.add(op);
  syncUI();
}
function toggleDigit(d) {
  if (state.digits.has(d)) { if (state.digits.size === 1) return; state.digits.delete(d); } else state.digits.add(d);
  syncUI();
}
function selectMode(m) { state.mode = m; syncUI(); }
function selectLevel(l) {
  state.level = l;
  state.digits = new Set(LEVEL_DIGITS[l]);
  [...state.ops].forEach(o => { if (FORMATS[o].min > l) state.ops.delete(o); });
  if (!state.ops.size) state.ops.add('sum');
  syncUI();
}
function selectQ(n) { state.qCount = n; syncUI(); }
function toggleTeams() { state.useTeams = !state.useTeams; syncUI(); if (state.useTeams) buildTeamInputs(); }
function selectNumTeams(n) { state.numTeams = n; syncUI(); buildTeamInputs(); }
function buildTeamInputs() {
  const cont = $('#teamInputs'); cont.innerHTML = '';
  for (let i = 0; i < state.numTeams; i++) {
    const name = (state.teamNames[i] || DEFAULT_TEAMS[i]).replace(/"/g, '&quot;');
    cont.insertAdjacentHTML('beforeend', `<div class="team-row"><div class="team-color-dot" style="background:${state.teamColors[i]}"></div><input class="team-name-input" type="text" id="teamName${i}" value="${name}" maxlength="20" aria-label="Nombre del equipo ${i + 1}"></div>`);
  }
}
function syncUI() {
  $$('.mode-btn').forEach(b => b.classList.toggle('selected', b.dataset.mode === state.mode));
  $$('.op-card').forEach(b => { b.setAttribute('aria-pressed', state.ops.has(b.dataset.op)); b.setAttribute('aria-disabled', FORMATS[b.dataset.op].min > state.level); });
  $$('.pill.digit').forEach(b => b.classList.toggle('selected', state.digits.has(+b.dataset.d)));
  $$('.pill.lvl').forEach(b => b.classList.toggle('selected', +b.dataset.l === state.level));
  $$('#qcountRow .pill').forEach(b => b.classList.toggle('selected', +b.dataset.q === state.qCount));
  $$('[data-n]').forEach(b => b.classList.toggle('selected', +b.dataset.n === state.numTeams));
  const t = $('#teamsToggle'); t.setAttribute('aria-pressed', state.useTeams);
  $('#teamsToggleLabel').textContent = state.useTeams ? 'Activado ✓' : 'Desactivado';
  $('#teamsConfig').classList.toggle('visible', state.useTeams);
  const base = ['sum','sub','mul','div'].some(o => state.ops.has(o));
  $('#secDigits').classList.toggle('hidden', !base);
  $('#secDiv').classList.toggle('hidden', !(state.ops.has('div') || state.ops.has('div2')));
  $('#optRemainder').checked = state.remainder;
  $('#duaHints').checked = state.duaHints; $('#duaTools').checked = state.duaTools;
  $('#duaPad').checked = state.duaPad; $('#duaTimer').checked = state.useTimer;
  $('#timerSecs').value = String(state.timerSecs);
}
function saveSettings() {
  try {
    localStorage.setItem(STORE, JSON.stringify({ ...state, ops:[...state.ops], digits:[...state.digits] }));
    localStorage.setItem(STORE + '-vm', document.documentElement.classList.contains('vm') ? '1' : '0');
  } catch (e) {}
}
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (s) {
      Object.assign(state, s, { ops:new Set((s.ops || []).filter(o => FORMATS[o])), digits:new Set(s.digits || [1,2]) });
      if (!(state.level >= 1 && state.level <= 4)) state.level = 3;
      [...state.ops].forEach(o => { if (FORMATS[o].min > state.level) state.ops.delete(o); });
      if (!state.ops.size) state.ops = new Set(['sum','mul']);
    }
    if (localStorage.getItem(STORE + '-vm') === '1') setVM(true);
  } catch (e) {}
}
function setVM(on) {
  document.documentElement.classList.toggle('vm', on);
  $$('.vm-btn').forEach(b => b.setAttribute('aria-pressed', on));
}
function toggleVM() { setVM(!document.documentElement.classList.contains('vm')); saveSettings(); if (padCtx) resizePad(); }

/* ============================================================
   AYUDAS VISUALES (HTML/SVG)
============================================================ */
function expr(a, sym, b, op) {
  return `${fmt(a)} <span class="q-symbol" style="color:${FORMATS[op].c}">${sym}</span> ${fmt(b)} <span class="q-eq">= ?</span>`;
}
function decompHTML(nums) {
  return nums.map(n => {
    const p = partsOf(n);
    return `<p class="big">${fmt(n)} = ${p.length > 1 ? p.map(fmt).join(' + ') : fmt(n)}</p>`;
  }).join('');
}
function numberLine(pts, jumps, labels) {
  const n = pts.length, gap = 112, W = 80 + gap * (n - 1), H = 118, y = 78;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="nl" role="img" aria-label="Recta numérica con saltos">`;
  s += `<line x1="8" y1="${y}" x2="${W - 8}" y2="${y}" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`;
  pts.forEach((p, i) => {
    const x = 40 + gap * i;
    s += `<line x1="${x}" y1="${y - 9}" x2="${x}" y2="${y + 9}" stroke="currentColor" stroke-width="3"/>`;
    s += `<text x="${x}" y="${y + 32}" text-anchor="middle" class="nl-t">${labels ? labels[i] : fmt(p)}</text>`;
    if (i < n - 1) {
      const x2 = x + gap, mx = (x + x2) / 2;
      s += `<path d="M${x + 5} ${y - 12} Q ${mx} ${y - 66} ${x2 - 5} ${y - 12}" fill="none" stroke="#2d6be4" stroke-width="2.5"/>`;
      s += `<path d="M${x2 - 5} ${y - 12} l-10 -4 M${x2 - 5} ${y - 12} l-1 -10" stroke="#2d6be4" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      s += `<text x="${mx}" y="${y - 46}" text-anchor="middle" class="nl-j">${jumps[i]}</text>`;
    }
  });
  return s + '</svg>';
}
function dotsSVG(rows, cols, color) {
  const r = 9, g = 26, W = cols * g + 14, H = rows * g + 14;
  let s = `<svg class="dots" viewBox="0 0 ${W} ${H}" width="${Math.min(W * 1.2, 520)}" role="img" aria-label="${rows} filas de ${cols} puntos">`;
  for (let i = 0; i < rows; i++) {
    s += `<rect x="3" y="${7 + i * g - 2}" width="${W - 6}" height="${g - 4}" rx="9" fill="none" stroke="${color}" stroke-opacity=".35" stroke-width="2"/>`;
    for (let j = 0; j < cols; j++) s += `<circle cx="${7 + j * g + r + 1}" cy="${7 + i * g + r - 2}" r="${r}" fill="${color}"/>`;
  }
  return s + '</svg>';
}
function squareSVG(n, color) {
  const g = Math.max(10, Math.min(26, Math.floor(260 / n))), W = n * g + 4;
  let s = `<svg class="dots" viewBox="0 0 ${W} ${W}" width="${Math.min(W, 300)}" role="img" aria-label="Cuadrado de ${n} por ${n}">`;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += `<rect x="${2 + j * g}" y="${2 + i * g}" width="${g - 2}" height="${g - 2}" rx="2" fill="${color}" fill-opacity=".75"/>`;
  return s + '</svg>';
}
function areaModel(a, b, showProducts) {
  const rows = partsOf(a), cols = partsOf(b);
  let h = `<table class="mt area"><tr><th>×</th>${cols.map(c => `<th>${fmt(c)}</th>`).join('')}</tr>`;
  rows.forEach(r => {
    h += `<tr><th>${fmt(r)}</th>${cols.map(c => `<td>${fmt(r)} × ${fmt(c)}${showProducts ? `<b>${fmt(r * c)}</b>` : ''}</td>`).join('')}</tr>`;
  });
  return h + '</table>';
}
function multTable(b, upto, limit) {
  let rows = [];
  for (let i = 1; i <= upto; i++) rows.push([i, b * i]);
  if (limit) for (const m of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) { if (m > upto && b * m <= limit) rows.push([m, b * m]); }
  return `<table class="mt">${rows.map(([i, v]) => `<tr><td>${b} × ${i}</td><td>${fmt(v)}</td></tr>`).join('')}</table>`;
}
function ladder(n) {
  const f = factorize(n); let cur = n, rows = '';
  f.forEach(p => { rows += `<tr><td class="l">${fmt(cur)}</td><td>${p}</td></tr>`; cur /= p; });
  rows += `<tr><td class="l">1</td><td></td></tr>`;
  return `<table class="ladder" aria-label="Descomposición de ${n}">${rows}</table>`;
}
function chips(list, hl) { return `<div class="chips">${list.map(v => `<span${hl && hl.includes(v) ? ' class="hl"' : ''}>${fmt(v)}</span>`).join('')}</div>`; }
function longDiv(a, b) {
  const ds = String(a).split('').map(Number);
  let part = 0, i = 0;
  while (i < ds.length - 1 && part * 10 + ds[i] < b) { part = part * 10 + ds[i]; i++; }
  const steps = []; let first = true, firstPart = null;
  for (; i < ds.length; i++) {
    part = part * 10 + ds[i];
    if (first) firstPart = part;
    const qd = Math.floor(part / b), prod = qd * b, rest = part - prod;
    steps.push(`${first ? `Cogemos <b>${fmt(part)}</b>` : `Bajamos el ${ds[i]} → <b>${fmt(part)}</b>`}: ¿cuántas veces cabe ${b}? → <b>${qd}</b> (${b} × ${qd} = ${fmt(prod)}), resto ${fmt(rest)}`);
    part = rest; first = false;
  }
  return { steps, firstPart };
}

/* ============================================================
   GENERADORES
============================================================ */
function genNumber(digits) {
  const d = pick([...digits]);
  return R(d === 1 ? 1 : 10 ** (d - 1), 10 ** d - 1);
}
function byLevel(pools) {                        // pools = {nivel: [...]}; 70 % del nivel actual, 30 % de repaso de niveles anteriores
  const L = state.level;
  let cur = L; while (cur > 1 && !(pools[cur] && pools[cur].length)) cur--;
  const lower = Object.keys(pools).filter(k => +k < cur).flatMap(k => pools[k]);
  return (lower.length && Math.random() < .3) ? pick(lower) : pick(pools[cur]);
}

const GEN = {
  sum() {
    const a = genNumber(state.digits), b = genNumber(state.digits), ans = a + b;
    const steps = [];
    if (a < 10 && b < 10) {
      steps.push(`${a} + ${b} = <b>${ans}</b>`, `Truco: parte del mayor (${Math.max(a, b)}) y cuenta ${Math.min(a, b)} hacia delante.`);
    } else {
      const A = placesOf(a), B = placesOf(b), L = Math.max(A.length, B.length), sums = [];
      for (let i = 0; i < L; i++) { const x = A[i] || 0, y = B[i] || 0; sums.push(x + y); steps.push(`${cap(PLACE[i])}: ${fmt(x)} + ${fmt(y)} = ${fmt(x + y)}`); }
      steps.push(`Juntamos: ${sums.slice().reverse().map(fmt).join(' + ')} = <b>${fmt(ans)}</b>`);
    }
    const jumps = partsOf(b), pts = [a]; let cur = a; jumps.forEach(j => { cur += j; pts.push(cur); });
    const labels = pts.map((p, i) => i === 0 ? fmt(p) : (i === pts.length - 1 ? '?' : '…'));
    return {
      html: expr(a, '+', b, 'sum'), plain: `${fmt(a)} + ${fmt(b)}`, answer: ans, steps,
      hint: a < 10 && b < 10 ? 'Empieza por el número mayor y cuenta hacia delante.' : 'Suma por partes: unidades con unidades, decenas con decenas…',
      tools: [
        { t: 'Descompón los números', h: decompHTML([a, b]) + '<p>Suma cada orden por separado y después junta los resultados.</p>' },
        { t: `Recta numérica: salta desde ${fmt(a)}`, h: numberLine(pts, jumps.map(j => '+' + fmt(j)), labels) + '<p>Da un salto por cada parte del segundo número. ¿Dónde aterrizas?</p>' },
      ],
      traps: [noCarrySum(a, b), ans + 10, ans - 10],
    };
  },

  sub() {
    let a = genNumber(state.digits), b = genNumber(state.digits);
    if (b > a) [a, b] = [b, a];
    if (a === b) a += R(1, 9);
    const ans = a - b;
    // saltos desde b hasta a (resta como complemento)
    let cur = b; const pts = [b];
    for (const p of [10, 100, 1000, 10000]) { const n = Math.ceil(cur / p) * p; if (n > cur && n <= a) { cur = n; pts.push(n); } }
    for (const p of [10000, 1000, 100, 10]) { const n = Math.floor(a / p) * p; if (n > cur) { cur = n; pts.push(n); } }
    if (cur < a) pts.push(a);
    const jumps = pts.slice(1).map((p, i) => p - pts[i]);
    const steps = [];
    if (pts.length > 2) steps.push(`Salta de ${fmt(b)} a ${fmt(a)}: ${jumps.map(j => '+' + fmt(j)).join(', ')}`, `Total de saltos: ${jumps.map(fmt).join(' + ')} = <b>${fmt(ans)}</b>`);
    else steps.push(`${fmt(a)} − ${fmt(b)} = <b>${fmt(ans)}</b>`);
    steps.push(`Prueba con la suma: ${fmt(b)} + ${fmt(ans)} = ${fmt(a)} ✓`);
    return {
      html: expr(a, '−', b, 'sub'), plain: `${fmt(a)} − ${fmt(b)}`, answer: ans, steps,
      hint: a < 20 ? 'Cuenta hacia atrás o piensa: ¿cuánto le falta al pequeño para llegar al grande?' : `¿Cuánto le falta a ${fmt(b)} para llegar a ${fmt(a)}?`,
      tools: [
        { t: `Recta numérica: de ${fmt(b)} a ${fmt(a)}`, h: numberLine(pts, jumps.map(() => '?'), null) + '<p>Calcula cada salto y súmalos todos: esa es la diferencia.</p>' },
        { t: 'Comprueba con la suma', h: `<p class="big">${fmt(b)} + ? = ${fmt(a)}</p><p>La resta y la suma son operaciones inversas.</p>` },
      ],
      traps: [smallFromBig(a, b), ans + 10, a + b],
    };
  },

  mul() {
    const maxD = Math.max(...state.digits);
    let a, b;
    if (state.level === 1) { a = R(2, 5); b = R(2, 10); }          // 1.º ciclo: grupos iguales pequeños
    else {
      a = R(2, 9); if (maxD >= 3 && state.level >= 3 && Math.random() < .3) a = R(11, 49);
      b = genNumber(state.digits); if (b === 1) b = R(2, 9);
    }
    const ans = a * b;
    const rows = partsOf(a), cols = partsOf(b), partials = [];
    rows.forEach(r => cols.forEach(c => partials.push([r, c])));
    const steps = partials.length > 1
      ? [...partials.map(([r, c]) => `${fmt(r)} × ${fmt(c)} = ${fmt(r * c)}`), `Sumamos los productos parciales: ${partials.map(([r, c]) => fmt(r * c)).join(' + ')} = <b>${fmt(ans)}</b>`]
      : [`${a} × ${b} = <b>${fmt(ans)}</b>`, `${a} grupos de ${b}.`];
    const tools = [];
    if (a <= 10 && b <= 10) tools.push({ t: `${a} grupos de ${b}`, h: dotsSVG(a, b, FORMATS.mul.c) + '<p>Cuenta de fila en fila: de ' + b + ' en ' + b + '.</p>' });
    tools.push({ t: 'Modelo de área', h: areaModel(a, b, false) + '<p>Calcula cada casilla y después suma todas.</p>' });
    if (partials.length > 1) tools.push({ t: 'Productos parciales', h: areaModel(a, b, true) + '<p>Ahora solo falta sumar los números azules.</p>' });
    return {
      html: expr(a, '×', b, 'mul'), plain: `${fmt(a)} × ${fmt(b)}`, answer: ans, steps,
      hint: partials.length > 1 ? `Descompón ${fmt(b)} y multiplica cada parte por ${a}.` : `${a} grupos de ${b}.`,
      tools, traps: [a + b, ans + a, ans - a, ans + 10],
    };
  },

  div() {
    const maxD = Math.max(...state.digits);
    let b, q;
    if (state.level === 1) { b = R(2, 5); q = R(2, 10); }            // 1.º ciclo: repartos sencillos
    else {
      b = R(2, 9);
      const maxQ = Math.min(Math.floor((10 ** maxD - 1) / b), 99);
      q = R(1, Math.max(1, maxQ)); if (q < 2 && maxQ >= 2) q = R(2, maxQ);
    }
    const r = state.remainder ? R(0, b - 1) : 0, a = b * q + r;
    return divisionQuestion(a, b, q, r, 'div');
  },

  div2() {
    const L = state.level;
    const b = L <= 2 ? R(11, 19) : L === 3 ? R(12, 49) : R(12, 99);
    const q = L <= 2 ? R(2, 9) : L === 3 ? R(11, 99) : R(21, 299);
    const r = state.remainder ? R(0, b - 1) : 0, a = b * q + r;
    return divisionQuestion(a, b, q, r, 'div2');
  },

  comb() {
    const T = {
      t0: () => { const a = R(10, 40), b = R(2, 20), c = R(1, a + b - 1); return { e: `${a} + ${b} − ${c}`, v: a + b - c, first: `${a} + ${b} (de izquierda a derecha)`, steps: [`Sumas y restas: de izquierda a derecha.`, `${a} + ${b} = ${a + b}`, `${a + b} − ${c} = <b>${a + b - c}</b>`], trap: a + b + c }; },
      t4s: () => { const a = R(2, 9), b = R(2, 9), c = R(2, 5); return { e: `(${a} + ${b}) × ${c}`, v: (a + b) * c, first: `(${a} + ${b})`, steps: [`Primero el paréntesis: ${a} + ${b} = ${a + b}`, `Después la multiplicación: ${a + b} × ${c} = <b>${(a + b) * c}</b>`], trap: a + b * c }; },
      t1: () => { const a = R(2, 20), b = R(2, 9), c = R(2, 9); return { e: `${a} + ${b} × ${c}`, v: a + b * c, first: `${b} × ${c}`, steps: [`Primero la multiplicación: ${b} × ${c} = ${b * c}`, `Después la suma: ${a} + ${b * c} = <b>${a + b * c}</b>`], trap: (a + b) * c }; },
      t2: () => { const a = R(2, 9), b = R(2, 9), c = R(1, a * b - 1); return { e: `${a} × ${b} − ${c}`, v: a * b - c, first: `${a} × ${b}`, steps: [`Primero la multiplicación: ${a} × ${b} = ${a * b}`, `Después la resta: ${a * b} − ${c} = <b>${a * b - c}</b>`], trap: b > c ? a * (b - c) : a * b + c }; },
      t3: () => { const b = R(2, 6), c = R(2, 6), a = R(b * c + 1, b * c + 30); return { e: `${a} − ${b} × ${c}`, v: a - b * c, first: `${b} × ${c}`, steps: [`Primero la multiplicación: ${b} × ${c} = ${b * c}`, `Después la resta: ${a} − ${b * c} = <b>${a - b * c}</b>`], trap: (a - b) * c }; },
      t4: () => { const a = R(2, 15), b = R(2, 15), c = R(2, 9); return { e: `(${a} + ${b}) × ${c}`, v: (a + b) * c, first: `(${a} + ${b})`, steps: [`Primero el paréntesis: ${a} + ${b} = ${a + b}`, `Después la multiplicación: ${a + b} × ${c} = <b>${(a + b) * c}</b>`], trap: a + b * c }; },
      t5: () => { const a = R(2, 9), b = R(2, 9), c = R(2, 9), d = R(2, 9); return { e: `${a} × ${b} + ${c} × ${d}`, v: a * b + c * d, first: `${a} × ${b} y ${c} × ${d}`, steps: [`Primero las multiplicaciones: ${a} × ${b} = ${a * b} y ${c} × ${d} = ${c * d}`, `Después la suma: ${a * b} + ${c * d} = <b>${a * b + c * d}</b>`], trap: (a * b + c) * d }; },
      t6: () => { const c = R(2, 9), k = R(2, 12), b = c * k, a = R(2, 30); return { e: `${a} + ${b} ÷ ${c}`, v: a + k, first: `${b} ÷ ${c}`, steps: [`Primero la división: ${b} ÷ ${c} = ${k}`, `Después la suma: ${a} + ${k} = <b>${a + k}</b>`], trap: (a + b) % c === 0 ? (a + b) / c : a + b }; },
      t7: () => { const b = R(2, 10), a = R(b + 1, b + 15), c = R(2, 9), d = R(1, 20); const v = (a - b) * c + d; return { e: `(${a} − ${b}) × ${c} + ${d}`, v, first: `(${a} − ${b})`, steps: [`Paréntesis: ${a} − ${b} = ${a - b}`, `Multiplicación: ${a - b} × ${c} = ${(a - b) * c}`, `Suma: ${(a - b) * c} + ${d} = <b>${v}</b>`], trap: (a - b) * (c + d) }; },
      t8: () => { const a = R(2, 6), b = R(2, 9), c = R(2, 9), e = R(2, 9), k = R(1, 9), d = e * k; const v = a * (b + c) - k; return { e: `${a} × (${b} + ${c}) − ${d} ÷ ${e}`, v, first: `(${b} + ${c})`, steps: [`Paréntesis: ${b} + ${c} = ${b + c}`, `Multiplicación y división: ${a} × ${b + c} = ${a * (b + c)} ; ${d} ÷ ${e} = ${k}`, `Resta: ${a * (b + c)} − ${k} = <b>${v}</b>`], trap: a * b + c - k }; },
      t9: () => { const b = R(2, 6), c = R(2, 9), k = R(2, 10), a = b * k; return { e: `${a} ÷ ${b} × ${c}`, v: k * c, first: `${a} ÷ ${b} (de izquierda a derecha)`, steps: [`÷ y × tienen la misma prioridad: de izquierda a derecha.`, `${a} ÷ ${b} = ${k}`, `${k} × ${c} = <b>${k * c}</b>`], trap: a % (b * c) === 0 ? a / (b * c) : k + c }; },
    };
    const key = byLevel({ 2: ['t0', 't1', 't4s'], 3: ['t1', 't2', 't3', 't4', 't5', 't6'], 4: ['t7', 't8', 't9', 't5', 't6'] });
    const x = T[key]();
    const sym = s => s.replace(/×/g, '<span class="q-symbol" style="color:#2d6be4">×</span>').replace(/÷/g, '<span class="q-symbol" style="color:#d48806">÷</span>').replace(/−/g, '<span class="q-symbol" style="color:#e8354a">−</span>').replace(/\+/g, '<span class="q-symbol" style="color:#28a86e">+</span>');
    return {
      html: `<span style="font-size:.78em">${sym(x.e)} <span class="q-eq">= ?</span></span>`, plain: x.e, answer: x.v, steps: x.steps,
      hint: 'Paréntesis → multiplicaciones y divisiones → sumas y restas.',
      tools: [
        { t: 'Orden de las operaciones', h: `<div class="prio"><b>1.º</b><span>Paréntesis ( )</span><b>2.º</b><span>Multiplicaciones × y divisiones ÷, de izquierda a derecha</span><b>3.º</b><span>Sumas + y restas −, de izquierda a derecha</span></div>` },
        { t: 'Primer paso', h: `<p>Empieza por: <span class="big">${x.first}</span></p><p>Escribe el resultado y vuelve a copiar la operación, más corta.</p>` },
      ],
      traps: [x.trap],
    };
  },

  pot() {
    const L = state.level;
    const kind = byLevel({ 3: ['sq', 'cube', 'ten', 'pow', 'expo', 'tenx'], 4: ['pow', 'pow3', 'base', 'prod', 'expo'] });
    let html, plain, ans, steps, tools, traps = [], hint;
    const chain = (b, e) => { const s = []; let v = b; for (let i = 2; i <= e; i++) { s.push(`${fmt(v)} × ${b} = ${fmt(v * b)}`); v *= b; } return s; };
    const expand = (b, e) => Array(e).fill(b).join(' × ');
    const pw = (b, e) => `${b}<sup>${e}</sup>`;
    if (['sq', 'cube', 'pow', 'pow3'].includes(kind)) {
      let b, e;
      if (kind === 'sq') { b = R(2, 10); e = 2; }
      else if (kind === 'cube') { b = R(2, 5); e = 3; }
      else if (kind === 'pow') { do { b = R(2, 9); e = R(2, 4); } while (b ** e > 10000); }
      else { do { b = R(2, 12); e = R(2, 5); } while (b ** e > 50000 || (b > 5 && e > 3)); }
      ans = b ** e; html = `${pw(b, e)} <span class="q-eq">= ?</span>`; plain = `${b}^${e}`;
      steps = [`${pw(b, e)} = ${expand(b, e)}`, ...chain(b, e), `Resultado: <b>${fmt(ans)}</b>`];
      hint = `La base (${b}) se multiplica por sí misma ${e} veces.`;
      tools = [{ t: 'Escríbela como multiplicación', h: `<p class="big">${pw(b, e)} = ${expand(b, e)}</p><p>Multiplica de dos en dos, de izquierda a derecha.</p>` }];
      if (e === 2 && b <= 12) tools.push({ t: `${b} al cuadrado = un cuadrado de ${b} × ${b}`, h: squareSVG(b, FORMATS.pot.c) });
      if (e === 3) tools.push({ t: `${b} al cubo`, h: `<p>Imagina un cubo: ${b} capas, cada una de ${b} × ${b} = ${b * b} cubitos.</p><p class="big">${b * b} × ${b} = ?</p>` });
      traps = [b * e, b + e, b ** (e - 1)];
    } else if (kind === 'ten' || kind === 'tenx') {
      const n = R(2, 5), a = kind === 'tenx' ? R(2, 9) : 1;
      ans = a * 10 ** n; html = `${a > 1 ? a + ' × ' : ''}${pw(10, n)} <span class="q-eq">= ?</span>`; plain = `${a > 1 ? a + '×' : ''}10^${n}`;
      steps = [`${pw(10, n)} es un 1 seguido de ${n} ceros: ${fmt(10 ** n)}`, ...(a > 1 ? [`${a} × ${fmt(10 ** n)} = <b>${fmt(ans)}</b>`] : [`Resultado: <b>${fmt(ans)}</b>`])];
      hint = 'Potencias de 10: cuenta los ceros.';
      tools = [{ t: 'Potencias de 10', h: `<table class="mt">${[1, 2, 3, 4, 5].map(k => `<tr><td>10<sup>${k}</sup></td><td>${fmt(10 ** k)}</td></tr>`).join('')}</table><p>El exponente te dice cuántos ceros hay detrás del 1.</p>` }];
      traps = [a * 10 * n, a * 10 ** (n - 1), a * 10 ** (n + 1)];
    } else if (kind === 'expo') {
      const b = R(2, 9), e = R(3, 6);
      ans = e; html = `<span style="font-size:.6em">${expand(b, e)}</span><br>= ${b}<sup>?</sup>`; plain = `${expand(b, e)} = ${b}^?`;
      steps = [`Cuenta cuántas veces aparece el ${b} multiplicado: ${e} veces.`, `${expand(b, e)} = ${pw(b, e)} → exponente <b>${e}</b>`];
      hint = 'El exponente indica cuántas veces se repite la base.';
      tools = [{ t: 'Cuenta los factores', h: `<div class="chips">${Array(e).fill(0).map(() => `<span class="hl">${b}</span>`).join('<span style="border:none;background:none">×</span>')}</div>` }];
      traps = [b, e + 1, e - 1, b * e];
    } else if (kind === 'base') {
      const e = pick([2, 2, 3]), b = e === 2 ? R(4, 15) : R(2, 6);
      ans = b; const N = b ** e; html = `?<sup>${e}</sup> = ${fmt(N)}`; plain = `?^${e} = ${N}`;
      steps = [`Buscamos un número que, multiplicado ${e} veces por sí mismo, dé ${fmt(N)}.`, `${expand(b, e)} = ${fmt(N)} → la base es <b>${b}</b>`];
      hint = 'Prueba con números y compruébalo multiplicando.';
      tools = [{ t: e === 2 ? 'Tabla de cuadrados' : 'Tabla de cubos', h: `<table class="mt">${Array.from({ length: e === 2 ? 15 : 6 }, (_, i) => i + 1).map(k => `<tr><td>${k}<sup>${e}</sup></td><td>${fmt(k ** e)}</td></tr>`).join('')}</table>` }];
      traps = [Math.round(N / e), b + 1, b - 1];
    } else { // prod: misma base
      const b = R(2, 5), m = R(2, 4), n = R(2, 4);
      ans = m + n; html = `${pw(b, m)} × ${pw(b, n)} = ${b}<sup>?</sup>`; plain = `${b}^${m} × ${b}^${n} = ${b}^?`;
      steps = [`${pw(b, m)} × ${pw(b, n)} = (${expand(b, m)}) × (${expand(b, n)})`, `En total el ${b} aparece ${m} + ${n} = ${m + n} veces → exponente <b>${m + n}</b>`];
      hint = 'Misma base: escribe todos los factores y cuéntalos.';
      tools = [{ t: 'Escríbelo todo', h: `<p class="big">(${expand(b, m)}) × (${expand(b, n)})</p><p>¿Cuántas veces aparece el ${b}?</p>` }];
      traps = [m * n, m + n + 1, b];
    }
    return { html, plain, answer: ans, steps, tools, traps, hint };
  },

  raiz() {
    const L = state.level, n = L <= 3 ? R(1, 12) : R(4, 20), N = n * n;
    const top = L <= 3 ? 12 : 20;
    return {
      html: `√<span style="border-top:.08em solid currentColor;padding:0 .12em">${fmt(N)}</span> <span class="q-eq">= ?</span>`, plain: `√${N}`, answer: n,
      steps: [`Buscamos un número que multiplicado por sí mismo dé ${fmt(N)}.`, `${n} × ${n} = ${fmt(N)} → √${fmt(N)} = <b>${n}</b>`],
      hint: `¿Qué número multiplicado por sí mismo da ${fmt(N)}?`,
      tools: [
        { t: 'Piensa en un cuadrado', h: `<p>Tienes ${fmt(N)} baldosas y quieres formar un cuadrado perfecto. ¿Cuántas baldosas tendrá cada lado?</p>` },
        { t: 'Tabla de cuadrados', h: `<table class="mt">${Array.from({ length: Math.ceil(top / 2) }, (_, i) => i + 1).map(k => { const k2 = k + Math.ceil(top / 2); return `<tr><td>${k} × ${k}</td><td>${fmt(k * k)}</td>${k2 <= top ? `<td>${k2} × ${k2}</td><td>${fmt(k2 * k2)}</td>` : ''}</tr>`; }).join('')}</table>` },
      ],
      traps: [Math.round(N / 2), n + 1, n - 1, N],
    };
  },

  mcd() {
    const lim = state.level <= 3 ? 48 : 120;
    let a, b, g;
    do { g = R(2, Math.floor(lim / 3)); const m = R(1, Math.floor(lim / g)), n = R(1, Math.floor(lim / g)); a = g * m; b = g * n; }
    while (a === b || a < 4 || b < 4 || a > lim || b > lim);
    g = gcd(a, b);
    const da = divisors(a), db = divisors(b), common = da.filter(d => db.includes(d));
    return {
      html: `<span class="q-fn">m.c.d.</span> (${fmt(a)}, ${fmt(b)}) <span class="q-eq">= ?</span>`, plain: `m.c.d. (${a}, ${b})`, answer: g,
      steps: [`Divisores de ${a}: ${da.join(', ')}`, `Divisores de ${b}: ${db.join(', ')}`, `Divisores comunes: ${common.join(', ')} → el mayor es <b>${g}</b>`, `Por factores: ${a} = ${factorStr(a)} ; ${b} = ${factorStr(b)} → comunes con el menor exponente: ${factorStr(g)} = ${g}`],
      hint: 'El número MÁS GRANDE que divide a los dos sin dejar resto.',
      tools: [
        { t: 'Lista de divisores', h: `<p>Divisores de ${a}:</p>${chips(da)}<p>Divisores de ${b}:</p>${chips(db)}<p>Rodea los que se repiten. ¿Cuál es el mayor?</p>` },
        { t: 'Descomposición en factores primos', h: `${ladder(a)}${ladder(b)}<p>${a} = ${factorStr(a)} &nbsp;·&nbsp; ${b} = ${factorStr(b)}</p><p>m.c.d. = factores <b>comunes</b> con el <b>menor</b> exponente.</p>` },
      ],
      traps: [lcm(a, b), Math.min(a, b), common.length > 1 ? common[common.length - 2] : 1],
    };
  },

  mcm() {
    const [lo, hi, max] = state.level <= 3 ? [2, 15, 90] : [4, 40, 400];
    let a, b, m;
    do { a = R(lo, hi); b = R(lo, hi); m = lcm(a, b); }
    while (a === b || m > max || ((m === Math.max(a, b)) && Math.random() < .75));
    const ma = [], mb = []; for (let k = a; k <= m + a; k += a) ma.push(k); for (let k = b; k <= m + b; k += b) mb.push(k);
    return {
      html: `<span class="q-fn">m.c.m.</span> (${fmt(a)}, ${fmt(b)}) <span class="q-eq">= ?</span>`, plain: `m.c.m. (${a}, ${b})`, answer: m,
      steps: [`Múltiplos de ${a}: ${ma.slice(0, -1).join(', ')}…`, `Múltiplos de ${b}: ${mb.slice(0, -1).join(', ')}…`, `El primero que coincide (sin contar el 0): <b>${m}</b>`, `Por factores: ${a} = ${factorStr(a)} ; ${b} = ${factorStr(b)} → comunes y no comunes con el mayor exponente: ${factorStr(m)} = ${m}`],
      hint: 'El número MÁS PEQUEÑO (distinto de 0) que es múltiplo de los dos.',
      tools: [
        { t: 'Lista de múltiplos', h: `<p>Múltiplos de ${a}:</p>${chips(ma)}<p>Múltiplos de ${b}:</p>${chips(mb)}<p>¿Cuál es el primero que aparece en las dos listas?</p>` },
        { t: 'Descomposición en factores primos', h: `${ladder(a)}${ladder(b)}<p>${a} = ${factorStr(a)} &nbsp;·&nbsp; ${b} = ${factorStr(b)}</p><p>m.c.m. = factores <b>comunes y no comunes</b> con el <b>mayor</b> exponente.</p>` },
      ],
      traps: [a * b, gcd(a, b), m * 2],
    };
  },

  prob() { return problemQuestion(); },
};

function divisionQuestion(a, b, q, r, op) {
  const qr = state.remainder;
  const ld = longDiv(a, b);
  const steps = [...ld.steps, `Cociente <b>${fmt(q)}</b>${qr ? `, resto <b>${r}</b>` : ''}`, `Prueba: ${b} × ${fmt(q)}${r ? ` + ${r}` : ''} = ${fmt(a)} ✓`];
  const tools = [];
  if (op === 'div2') {
    const est = Math.round(b / 10) * 10;
    tools.push({ t: 'Estima primero', h: `<p>${b} está cerca de <b>${est}</b>.</p><p>Empieza por <b>${fmt(ld.firstPart)}</b>: ¿cuántas veces cabe ${est} en ${fmt(ld.firstPart)}? Esa es tu primera cifra (quizá haya que ajustarla una arriba o abajo).</p>` });
    tools.push({ t: `Múltiplos de ${b}`, h: multTable(b, 9) + '<p>Busca el múltiplo más grande que no se pase.</p>' });
  } else {
    tools.push({ t: `Tabla del ${b}`, h: multTable(b, 10, a) + (q > 10 ? '<p>Usa también ×10, ×20… para avanzar más deprisa.</p>' : '') });
  }
  tools.push({ t: 'Primer paso', h: `<p>${ld.steps[0]}</p><p>Sigue tú: baja la siguiente cifra y repite.</p>` });
  return {
    html: expr(a, '÷', b, op), plain: `${fmt(a)} ÷ ${b}`, kind: qr ? 'qr' : 'num',
    answer: qr ? { q, r } : q, divisor: b, steps, tools,
    hint: `¿Cuántos grupos de ${b} caben en ${fmt(a)}?${qr ? ' Lo que no llega a formar un grupo es el resto.' : ''}`,
    traps: [q + 1, q - 1, q * 10],
  };
}

/* ---------- Problemas ---------- */
const PROBS = [
  { l: 1, f: () => { const a = R(5, 30), b = R(2, 15); return { t: `Lucía tiene ${a} canicas y su abuelo le regala ${b}.`, q: '¿Cuántas canicas tiene ahora?', ans: a + b, unit: 'canicas', op: 'Juntamos → suma.', steps: [`${a} + ${b} = ${a + b}`] }; } },
  { l: 1, f: () => { const a = R(8, 30), b = R(2, a - 2); return { t: `En el árbol del patio hay ${a} pájaros. Se van volando ${b}.`, q: '¿Cuántos pájaros quedan?', ans: a - b, unit: 'pájaros', op: 'Se van → quitamos → resta.', steps: [`${a} − ${b} = ${a - b}`] }; } },
  { l: 1, f: () => { const a = R(2, 5), b = R(2, 5); return { t: `Hay ${a} platos y en cada plato hay ${b} galletas.`, q: '¿Cuántas galletas hay en total?', ans: a * b, unit: 'galletas', op: `${a} veces ${b} → podemos sumar ${Array(a).fill(b).join(' + ')} o multiplicar.`, steps: [`${Array(a).fill(b).join(' + ')} = ${a * b}`, `${a} × ${b} = ${a * b}`] }; } },
  { l: 1, f: () => { const b = R(2, 4), c = R(2, 6); return { t: `Mateo reparte ${b * c} cromos entre ${b} amigos, a partes iguales.`, q: '¿Cuántos cromos le tocan a cada amigo?', ans: c, unit: 'cromos', op: 'Repartir a partes iguales → división.', steps: [`Repartimos de uno en uno hasta que no quede ninguno.`, `${b * c} ÷ ${b} = ${c}`] }; } },
  { l: 1, f: () => { const a = R(10, 40), b = R(a + 2, a + 20); return { t: `La cinta roja mide ${b} cm y la cinta azul mide ${a} cm.`, q: '¿Cuántos centímetros más mide la cinta roja?', ans: b - a, unit: 'cm', op: 'Comparar «cuánto más» → resta.', steps: [`${b} − ${a} = ${b - a}`] }; } },
  { l: 2, f: () => { const a = R(120, 480), b = R(15, 95); return { t: `La biblioteca del cole tiene ${a} libros. Esta semana llegan ${b} libros nuevos.`, q: '¿Cuántos libros hay ahora?', ans: a + b, unit: 'libros', op: 'Juntamos dos cantidades → suma.', steps: [`${a} + ${b} = ${a + b}`] }; } },
  { l: 2, f: () => { const p = pick([45, 50, 55, 60]), s = R(20, p - 3); return { t: `El autobús de la excursión tiene ${p} plazas. Ya se han sentado ${s} alumnos.`, q: '¿Cuántas plazas quedan libres?', ans: p - s, unit: 'plazas', op: 'Lo que falta para completar → resta.', steps: [`${p} − ${s} = ${p - s}`] }; } },
  { l: 2, f: () => { const f = R(4, 9), c = R(6, 15); return { t: `En el huerto escolar hay ${f} filas con ${c} lechugas en cada fila.`, q: '¿Cuántas lechugas hay en total?', ans: f * c, unit: 'lechugas', op: 'Grupos iguales → multiplicación.', steps: [`${f} × ${c} = ${f * c}`] }; } },
  { l: 2, f: () => { const b = R(3, 9), c = R(6, 20); return { t: `Para el magosto, repartimos ${b * c} castañas en ${b} bolsas con la misma cantidad.`, q: '¿Cuántas castañas lleva cada bolsa?', ans: c, unit: 'castañas', op: 'Repartir en partes iguales → división.', steps: [`${b * c} ÷ ${b} = ${c}`] }; } },
  { l: 2, f: () => { const e = R(2, 9), s = R(4, 12); return { t: `Sara ahorra ${e} € cada semana durante ${s} semanas.`, q: '¿Cuánto dinero ahorra en total?', ans: e * s, unit: '€', op: 'La misma cantidad repetida → multiplicación.', steps: [`${e} × ${s} = ${e * s}`] }; } },
  { l: 2, f: () => { const x = R(130, 185), y = R(95, x - 6); return { t: `En salto de longitud, Ana llega a ${x} cm y Leo a ${y} cm.`, q: '¿Cuántos centímetros más salta Ana?', ans: x - y, unit: 'cm', op: 'Comparar «cuánto más» → resta.', steps: [`${x} − ${y} = ${x - y}`] }; } },
  { l: 2, f: () => { let c, p; do { c = R(3, 8); p = R(2, 6); } while (c * p > 45); return { t: `Compramos ${c} cuadernos a ${p} € cada uno y pagamos con un billete de 50 €.`, q: '¿Cuánto nos devuelven?', ans: 50 - c * p, unit: '€', op: 'Primero, cuánto cuestan los cuadernos (×); después, el cambio (−).', steps: [`Coste: ${c} × ${p} = ${c * p} €`, `Cambio: 50 − ${c * p} = ${50 - c * p} €`], traps: [c * p, 50 - c - p] }; } },
  { l: 3, f: () => { const a = R(18, 26), b = R(18, 26), e = R(3, 9); return { t: `En la carrera solidaria corren ${a} alumnos de 5.º y ${b} de 6.º. Cada corredor consigue ${e} € de patrocinio.`, q: '¿Cuánto dinero se recauda en total?', ans: (a + b) * e, unit: '€', op: 'Primero, cuántos corredores hay (+); después, el dinero (×).', steps: [`Corredores: ${a} + ${b} = ${a + b}`, `Dinero: ${a + b} × ${e} = ${(a + b) * e} €`], traps: [a + b * e, a + b] }; } },
  { l: 3, f: () => { let n = R(100, 320); if (n % 55 === 0) n++; const k = Math.ceil(n / 55); return { t: `Van de excursión ${n} personas. Cada autobús tiene 55 plazas.`, q: '¿Cuántos autobuses hacen falta como mínimo?', ans: k, unit: 'autobuses', op: 'Agrupar de 55 en 55 → división. ¡Ojo con el resto!', steps: [`${n} ÷ 55 = ${Math.floor(n / 55)}, resto ${n % 55}`, `Las ${n % 55} personas que sobran también necesitan autobús: ${Math.floor(n / 55)} + 1 = ${k}`], traps: [k - 1, k + 1] }; } },
  { l: 2, f: () => { const tot = R(90, 160), m = R(20, 40), t = R(15, 35); return { t: `En la feria del cole hay ${tot} trozos de empanada. Por la mañana se venden ${m} y por la tarde ${t}.`, q: '¿Cuántos trozos quedan?', ans: tot - m - t, unit: 'trozos', op: 'Dos restas seguidas (o suma lo vendido y resta una vez).', steps: [`Vendidos: ${m} + ${t} = ${m + t}`, `Quedan: ${tot} − ${m + t} = ${tot - m - t}`], traps: [tot - m, tot - t] }; } },
  { l: 3, f: () => { const b = pick([12, 15, 24]), c = R(8, 30), s = R(1, b - 1), n = b * c + s; return { t: `Hay ${n} botellas de agua para guardar en cajas de ${b}.`, q: '¿Cuántas cajas se llenan completas y cuántas botellas sobran?', ans: { q: c, r: s }, kind: 'qr', divisor: b, unit: '', op: `Agrupar de ${b} en ${b} → división con resto.`, steps: [`${n} ÷ ${b} = ${c}, resto ${s}`, `Se llenan ${c} cajas y sobran ${s} botellas.`] }; } },
  { l: 3, f: () => { const A = R(2, 5), P = R(6, 12), N = R(2, 6), Q = R(3, 6); return { t: `Una familia va al museo: ${A} adultos con entrada de ${P} € y ${N} niños con entrada de ${Q} €.`, q: '¿Cuánto pagan en total?', ans: A * P + N * Q, unit: '€', op: 'Calcula cada grupo (×) y súmalos (+).', steps: [`Adultos: ${A} × ${P} = ${A * P} €`, `Niños: ${N} × ${Q} = ${N * Q} €`, `Total: ${A * P} + ${N * Q} = ${A * P + N * Q} €`], traps: [(A + N) * P, A * P + N] }; } },
  { l: 3, f: () => { let a, b; do { a = pick([4, 6, 8, 10, 12, 15]); b = pick([6, 9, 10, 12, 14, 15, 20]); } while (a === b || lcm(a, b) === Math.max(a, b) || lcm(a, b) > 120); return { t: `Del puerto salen dos barcos a la vez. Uno vuelve cada ${a} minutos y el otro cada ${b} minutos.`, q: '¿Dentro de cuántos minutos volverán a coincidir por primera vez?', ans: lcm(a, b), unit: 'minutos', op: 'Buscamos el primer múltiplo común → m.c.m.', steps: [`${a} = ${factorStr(a)} ; ${b} = ${factorStr(b)}`, `m.c.m. (${a}, ${b}) = ${lcm(a, b)}`], traps: [a * b, gcd(a, b)] }; } },
  { l: 3, f: () => { let a, b, g; do { g = R(3, 12); a = g * R(2, 7); b = g * R(2, 7); } while (a === b || gcd(a, b) !== g); return { t: `Tenemos ${a} lápices rojos y ${b} azules. Queremos hacer el mayor número posible de lotes iguales, sin mezclar y sin que sobre ninguno.`, q: '¿Cuántos lotes podemos hacer?', ans: g, unit: 'lotes', op: 'El mayor número que divide a los dos → m.c.d.', steps: [`Divisores comunes de ${a} y ${b}: ${divisors(g).join(', ')}`, `m.c.d. (${a}, ${b}) = ${g}`, `Cada lote: ${a / g} rojos y ${b / g} azules.`], traps: [lcm(a, b), a + b, Math.min(a, b)] }; } },
  { l: 4, f: () => { const base = pick([2, 3, 4]), n = base === 2 ? R(4, 7) : R(3, 4); return { t: `El lunes ${base} personas reciben un mensaje. Cada día, cada persona que lo recibió se lo reenvía a ${base} personas nuevas.`, q: `¿Cuántas personas nuevas lo reciben el día ${n}?`, ans: base ** n, unit: 'personas', op: `Se multiplica por ${base} cada día → potencia ${base}<sup>${n}</sup>.`, steps: [`Día 1: ${base}; día 2: ${base} × ${base} = ${base ** 2}…`, `Día ${n}: ${base}<sup>${n}</sup> = ${base ** n}`], traps: [base * n, base ** (n - 1)] }; } },
  { l: 4, f: () => { const p = R(24, 96), L = R(12, 60), s = R(1, p - 1), N = p * L + s; return { t: `Una imprenta tiene ${N} páginas impresas. Cada libro lleva ${p} páginas.`, q: '¿Cuántos libros completos puede encuadernar?', ans: L, unit: 'libros', op: `División con divisor de 2 cifras: las páginas que sobran no forman un libro.`, steps: [`${N} ÷ ${p} = ${L}, resto ${s}`, `Libros completos: ${L} (sobran ${s} páginas).`], traps: [L + 1, L - 1] }; } },
  { l: 4, f: () => { const n = R(20, 28), c = R(9, 18), B = n * c, E = R(3, 8); return { t: `El autobús de una excursión cuesta ${B} € y se reparte entre los ${n} alumnos. Además, cada alumno paga ${E} € de entrada.`, q: '¿Cuánto paga cada alumno en total?', ans: c + E, unit: '€', op: 'Reparte el autobús (÷) y suma la entrada (+).', steps: [`Autobús por alumno: ${B} ÷ ${n} = ${c} €`, `Total: ${c} + ${E} = ${c + E} €`], traps: [c, (B + E) / n | 0, c * E] }; } },
];
function problemQuestion() {
  const pools = {}; PROBS.forEach(p => (pools[p.l] = pools[p.l] || []).push(p));
  const p = byLevel(pools).f();
  const hl = s => s.replace(/(\d[\d ]*)(\s?€|\s?cm)?/g, '<mark class="dato">$1$2</mark>');
  const nums = (p.t.match(/\d+/g) || []);
  const ansTxt = p.kind === 'qr' ? `${p.ans.q} y ${p.ans.r}` : `${fmt(p.ans)} ${p.unit}`;
  return {
    html: `<p class="prob-text">${hl(p.t)} <strong>${p.q}</strong></p>`, plain: p.t.length > 60 ? p.t.slice(0, 58) + '…' : p.t, problem: true,
    answer: p.ans, kind: p.kind || 'num', divisor: p.divisor, unit: p.unit,
    steps: [...p.steps, `Solución: <b>${ansTxt}</b>. Comprueba si tiene sentido con la pregunta.`],
    hint: 'Lee dos veces. ¿Qué te preguntan? ¿Qué datos necesitas?',
    tools: [
      { t: 'Plan en 4 pasos', h: `<p><b>1. Comprendo:</b> ${p.q}</p><p><b>2. Datos:</b></p>${chips(nums.map(Number))}<p><b>3. Pienso:</b> juntar → + · quitar o comparar → − · grupos iguales → × · repartir o agrupar → ÷</p><p><b>4. Compruebo:</b> ¿la respuesta es razonable?</p>` },
      { t: '¿Qué operación?', h: `<p>${p.op}</p>` },
      { t: 'Primer paso', h: `<p>${p.steps[0].replace(/=\s*[\d ]+(\s*€)?$/, '= ?')}</p>` },
    ],
    traps: p.traps || [],
  };
}

function generateQuestion() {
  const op = pick([...state.ops]);
  const q = GEN[op]();
  q.op = op; q.kind = q.kind || 'num'; q.unit = q.unit || '';
  return q;
}

/* ============================================================
   RESPUESTAS Y OPCIONES
============================================================ */
const keyOf = (q, v) => q.kind === 'qr' ? `${v.q}|${v.r}` : String(v);
function ansText(q, v) {
  if (v == null) return '—';
  if (q.kind === 'qr') return `cociente ${fmt(v.q)}, resto ${fmt(v.r)}`;
  return fmt(v) + (q.unit ? ' ' + q.unit : '');
}
function mcLabel(q, v) { return q.kind === 'qr' ? `${fmt(v.q)} <small style="font-size:.7em;opacity:.7">resto</small> ${fmt(v.r)}` : fmt(v); }
function mcOptions(q) {
  if (q.kind === 'qr') {
    const A = q.answer, b = q.divisor, m = new Map();
    const add = (o, big) => { if (o.q >= 0 && o.r >= 0 && (o.r < b || big) && m.size < 4) m.set(o.q + '|' + o.r, o); };
    add(A);
    add({ q: A.q - 1, r: A.r + b }, true);                                   // error típico: resto mayor que el divisor
    shuffle([{ q: A.q + 1, r: A.r }, { q: A.q - 1, r: A.r }, { q: A.q, r: (A.r + 1) % b }, { q: A.q, r: Math.max(0, A.r - 1) }, { q: A.q + 1, r: Math.max(0, A.r - 2) }, { q: A.q + 10, r: A.r }]).forEach(o => add(o));
    let k = 2; while (m.size < 4) add({ q: A.q + k++, r: A.r });
    return shuffle([...m.values()]);
  }
  const ans = q.answer, set = new Set([ans]);
  shuffle((q.traps || []).filter(t => Number.isInteger(t) && t >= 0 && t !== ans)).slice(0, 2).forEach(t => set.add(t));
  let tries = 0;
  while (set.size < 4 && tries++ < 200) {
    const spread = Math.max(3, Math.round(ans * .15) + 1);
    const d = Math.random() < .5 ? ans + R(1, spread) : ans - R(1, spread);
    if (d >= 0 && d !== ans) set.add(d);
  }
  let i = 1; while (set.size < 4) set.add(ans + i++);
  return shuffle([...set]);
}

/* ============================================================
   FLUJO DEL JUEGO
============================================================ */
function startGame() {
  state.teamNames = [];
  for (let i = 0; i < state.numTeams; i++) { const inp = $('#teamName' + i); state.teamNames.push(inp && inp.value.trim() ? inp.value.trim() : DEFAULT_TEAMS[i]); }
  state.remainder = $('#optRemainder').checked;
  state.duaHints = $('#duaHints').checked; state.duaTools = $('#duaTools').checked; state.duaPad = $('#duaPad').checked;
  state.useTimer = $('#duaTimer').checked; state.timerSecs = +$('#timerSecs').value;
  saveSettings();

  game.questions = [];
  const seen = new Set();
  for (let i = 0, guard = 0; i < state.qCount && guard < 500; guard++) {
    const q = generateQuestion();
    if (seen.has(q.plain) && guard < 400) continue;
    seen.add(q.plain); game.questions.push(q); i++;
  }
  Object.assign(game, { current:0, answers:[], correct:0, wrong:0, score:0, streak:0, maxStreak:0, currentTeam:0, teamScores:Array(state.numTeams).fill(0), locked:false });
  showScreen('game');
  $('#hudTimerWrap').classList.toggle('hidden', !state.useTimer);
  $('#teamBanner').style.display = state.useTeams ? '' : 'none';
  $('#hudScoreWrap').style.display = state.useTeams ? 'none' : '';
  $('#teamScores').classList.toggle('hidden', !state.useTeams);
  if (state.useTeams) buildTeamScoreCards();
  $('#toolsBtn').classList.toggle('hidden', !state.duaTools);
  $('#padBtn').classList.toggle('hidden', !state.duaPad);
  renderQuestion();
}

function buildTeamScoreCards() {
  const ts = $('#teamScores'); ts.innerHTML = '';
  for (let i = 0; i < state.numTeams; i++) {
    ts.insertAdjacentHTML('beforeend', `<div class="team-score-card" id="tsCard${i}" style="border-color:${state.teamColors[i]}"><div class="ts-name" style="color:${state.teamColors[i]}"></div><div class="ts-pts" id="tsPoints${i}">0</div></div>`);
    ts.lastElementChild.querySelector('.ts-name').textContent = state.teamNames[i];
  }
}

function renderQuestion() {
  if (game.current >= game.questions.length) { endGame(); return; }
  game.locked = false; game.aidLevel = 0;
  const q = game.questions[game.current], idx = game.current, total = game.questions.length, F = FORMATS[q.op];

  $('#hudQ').textContent = `${idx + 1}/${total}`;
  $('#progressBar').style.width = `${(idx / total) * 100}%`;
  $('#hudCorrect').textContent = game.correct; $('#hudWrong').textContent = game.wrong; $('#hudScore').textContent = game.score;

  if (state.useTeams) {
    const ti = game.currentTeam, c = state.teamColors[ti], bn = $('#teamBanner');
    bn.style.background = c + '22'; bn.style.borderColor = c; bn.style.color = c;
    bn.textContent = '👥 ' + state.teamNames[ti] + ' — ¡Os toca!';
    for (let i = 0; i < state.numTeams; i++) { const el = $('#tsCard' + i); if (el) el.classList.toggle('active', i === ti); }
  }

  const badge = $('#opBadge'); badge.textContent = F.badge; badge.style.setProperty('--c', F.c);
  const qEl = $('#questionText'); qEl.innerHTML = q.html; qEl.style.setProperty('--c', F.c); qEl.classList.remove('shake');
  $('#duaHint').textContent = state.duaHints ? q.hint : '';

  // ayudas
  $('#toolsPanel').classList.add('hidden'); $('#toolsBtn').setAttribute('aria-expanded', 'false');
  $('#toolsBtn').textContent = '🧰 Herramientas';
  clearPad();

  // respuesta
  const area = $('#answerArea'); area.innerHTML = '';
  if (state.mode === 'mc') {
    const opts = mcOptions(q), grid = document.createElement('div');
    grid.className = 'mc-grid';
    opts.forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'mc-btn' + (q.kind === 'qr' ? ' qr' : '');
      b.dataset.key = keyOf(q, o);
      b.innerHTML = `<span class="k" aria-hidden="true">${i + 1}</span>${mcLabel(q, o)}`;
      b.setAttribute('aria-label', `Opción ${i + 1}: ${ansText(q, o)}`);
      b.onclick = () => submitAnswer(o, b);
      grid.appendChild(b);
    });
    area.appendChild(grid);
  } else {
    const wrap = document.createElement('div'); wrap.className = 'free-input-wrap';
    const mk = (id, label, sm) => `<label class="free-field">${label}<input class="free-input${sm ? ' sm' : ''}" id="${id}" type="text" inputmode="numeric" autocomplete="off" placeholder="?"></label>`;
    wrap.innerHTML = q.kind === 'qr'
      ? mk('inQ', 'Cociente', true) + mk('inR', 'Resto', true) + '<button class="submit-btn" id="okBtn">✓ OK</button>'
      : mk('inV', 'Respuesta') + (q.unit ? `<span class="unit">${q.unit}</span>` : '') + '<button class="submit-btn" id="okBtn">✓ OK</button>';
    area.appendChild(wrap);
    const first = $(q.kind === 'qr' ? '#inQ' : '#inV');
    $('#okBtn').onclick = submitFree;
    $$('.free-input').forEach(inp => inp.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return; e.preventDefault();
      if (inp.id === 'inQ') $('#inR').focus(); else submitFree();
    }));
    setTimeout(() => first.focus(), 80);
  }
  if (state.useTimer) startTimer(q);
}

function startTimer(q) {
  clearInterval(game.timer);
  game.timerVal = state.timerSecs * (q.problem ? 2 : 1);
  $('#hudTimer').textContent = game.timerVal;
  game.timer = setInterval(() => {
    game.timerVal--; $('#hudTimer').textContent = game.timerVal;
    if (game.timerVal <= 0) { clearInterval(game.timer); if (!game.locked) { game.locked = true; processAnswer(false, q, null); showFeedback(false, q, '⏱️ ¡Se acabó el tiempo!'); } }
  }, 1000);
}

function parseNum(s) { const t = String(s).replace(/[^\d]/g, ''); return t === '' ? NaN : parseInt(t, 10); }

function submitAnswer(val, btn) {
  if (game.locked) return;
  const q = game.questions[game.current];
  game.locked = true; clearInterval(game.timer);
  const correct = keyOf(q, val) === keyOf(q, q.answer);
  $$('.mc-btn').forEach(b => { b.disabled = true; if (b.dataset.key === keyOf(q, q.answer)) b.classList.add('correct'); });
  if (!correct) btn.classList.add('wrong');
  finish(correct, q, val);
}

function submitFree() {
  if (game.locked) return;
  const q = game.questions[game.current];
  let val;
  if (q.kind === 'qr') {
    const a = parseNum($('#inQ').value), b = parseNum($('#inR').value);
    if (isNaN(a) || isNaN(b)) { shakeEmpty(); return; }
    val = { q: a, r: b };
  } else {
    val = parseNum($('#inV').value);
    if (isNaN(val)) { shakeEmpty(); return; }
  }
  game.locked = true; clearInterval(game.timer);
  const correct = keyOf(q, val) === keyOf(q, q.answer);
  $$('.free-input').forEach(inp => { inp.disabled = true; inp.style.borderColor = correct ? 'var(--green)' : 'var(--red)'; inp.style.background = correct ? 'var(--green-l)' : 'var(--red-l)'; });
  if (!correct) $('#questionText').classList.add('shake');
  finish(correct, q, val);
}
function shakeEmpty() { $$('.free-input').forEach(i => { if (!i.value.trim()) { i.classList.add('shake'); setTimeout(() => i.classList.remove('shake'), 400); } }); }

function finish(correct, q, val) {
  processAnswer(correct, q, val);
  if (correct) { showFeedback(true, q); spawnConfetti(8); setTimeout(nextQuestion, 1100); }
  else showFeedback(false, q);
}

function processAnswer(correct, q, given, skipped) {
  game.answers.push({ q, given, correct, skipped: !!skipped, aid: game.aidLevel, team: state.useTeams ? game.currentTeam : null });
  if (correct) {
    game.correct++; game.streak++; game.maxStreak = Math.max(game.maxStreak, game.streak);
    const pts = 10 + (game.streak > 1 ? (game.streak - 1) * 2 : 0);
    game.score += pts;
    if (state.useTeams) { game.teamScores[game.currentTeam] += pts; const el = $('#tsPoints' + game.currentTeam); if (el) el.textContent = game.teamScores[game.currentTeam]; }
  } else { game.wrong++; game.streak = 0; }
  $('#hudScore').textContent = game.score;
}

function nextQuestion() {
  hideFeedback();
  game.current++;
  if (state.useTeams) game.currentTeam = (game.currentTeam + 1) % state.numTeams;
  renderQuestion();
}

function skipQuestion() {
  if (game.locked) return;
  clearInterval(game.timer);
  const q = game.questions[game.current];
  game.locked = true;
  processAnswer(false, q, null, true);
  showFeedback(false, q, '⏭ Pregunta saltada');
}

let quitArmed = null;
function quitGame() {
  const b = $('#quitBtn');
  if (quitArmed) { clearTimeout(quitArmed); quitArmed = null; b.textContent = '✕ Salir'; goHome(); return; }
  b.textContent = '¿Seguro? Toca otra vez';
  quitArmed = setTimeout(() => { quitArmed = null; b.textContent = '✕ Salir'; }, 3000);
}

/* ============================================================
   AYUDAS EN JUEGO
============================================================ */
function renderTools() {
  const q = game.questions[game.current], p = $('#toolsPanel');
  const shown = q.tools.slice(0, game.aidLevel);
  p.innerHTML = shown.map((t, i) => `<div class="tool-step"><h4><span class="n">AYUDA ${i + 1}</span>${t.t}</h4><div class="tool-body">${t.h}</div></div>`).join('')
    + (game.aidLevel < q.tools.length ? `<button class="aid-btn more-aid" onclick="moreAid()">➕ Otra ayuda (${game.aidLevel + 1}/${q.tools.length})</button>` : '');
}
function toggleTools() {
  const p = $('#toolsPanel'), b = $('#toolsBtn'), open = p.classList.contains('hidden');
  if (open && game.aidLevel === 0) game.aidLevel = 1;
  p.classList.toggle('hidden', !open); b.setAttribute('aria-expanded', open);
  if (open) renderTools();
}
function moreAid() { const q = game.questions[game.current]; if (game.aidLevel < q.tools.length) { game.aidLevel++; renderTools(); } }

let padCtx = null, padColor = '#1a1a2e', drawing = false;
function togglePad() {
  const p = $('#padPanel'), b = $('#padBtn'), open = p.classList.contains('hidden');
  p.classList.toggle('hidden', !open); b.setAttribute('aria-expanded', open);
  if (open) resizePad();
}
function resizePad() {
  const c = $('#pad'); if (c.offsetWidth === 0) return;
  const dpr = window.devicePixelRatio || 1;
  c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr;
  padCtx = c.getContext('2d'); padCtx.scale(dpr, dpr);
  padCtx.lineCap = 'round'; padCtx.lineJoin = 'round'; padCtx.lineWidth = 3.2;
}
function clearPad() { const c = $('#pad'); if (padCtx) padCtx.clearRect(0, 0, c.width, c.height); }
function initPad() {
  const c = $('#pad');
  const pos = e => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  c.addEventListener('pointerdown', e => { if (!padCtx) resizePad(); drawing = true; c.setPointerCapture(e.pointerId); const [x, y] = pos(e); padCtx.strokeStyle = padColor; padCtx.beginPath(); padCtx.moveTo(x, y); padCtx.lineTo(x + .1, y + .1); padCtx.stroke(); });
  c.addEventListener('pointermove', e => { if (!drawing) return; const [x, y] = pos(e); padCtx.lineTo(x, y); padCtx.stroke(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => c.addEventListener(ev, () => drawing = false));
  $$('.pad-color').forEach(b => b.onclick = () => { padColor = b.dataset.c; $$('.pad-color').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  window.addEventListener('resize', () => { if (!$('#padPanel').classList.contains('hidden')) resizePad(); });
}

/* ============================================================
   FEEDBACK
============================================================ */
const FB_OK = ['🎉 ¡Genial!', '⭐ ¡Perfecto!', '🔥 ¡Crack!', '🏆 ¡Así se hace!', '💥 ¡Boom!', '✨ ¡Fantástico!'];
const FB_KO = ['🤔 Casi…', '💪 ¡A la próxima!', '🔍 Vamos a verlo', '🎯 ¡Sigue!'];
function showFeedback(correct, q, msg) {
  const ov = $('#feedbackOverlay');
  ov.className = 'feedback-overlay show ' + (correct ? 'ok' : 'ko');
  if (correct) {
    ov.innerHTML = `<div class="feedback-bubble ok">${pick(FB_OK)}</div>`;
    return;
  }
  ov.innerHTML = `<div class="feedback-bubble ko">${pick(FB_KO)}</div>
    <div class="fb-card">
      ${msg ? `<div class="fb-msg">${msg}</div>` : ''}
      <div>La respuesta es:</div>
      <div class="fb-ans">${ansText(q, q.answer)}</div>
      <h5>🧠 Cómo se resuelve</h5>
      <ol>${q.steps.map(s => `<li>${s}</li>`).join('')}</ol>
      <button class="fb-continue" id="fbContinue">Entendido → Seguir</button>
    </div>`;
  $('#fbContinue').onclick = nextQuestion;
  setTimeout(() => { const b = $('#fbContinue'); if (b) b.focus(); }, 60);
}
function hideFeedback() { const ov = $('#feedbackOverlay'); ov.className = 'feedback-overlay'; ov.innerHTML = ''; }

const CONF_COLORS = ['#e8354a', '#2d6be4', '#28a86e', '#f5a623', '#7c3aed', '#e8358a', '#0d9488'];
function spawnConfetti(n) {
  if (REDUCED) return;
  const wrap = $('#confettiWrap');
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div'); p.className = 'conf-piece';
    const s = 6 + Math.random() * 8;
    p.style.cssText = `left:${Math.random() * 100}%;background:${pick(CONF_COLORS)};width:${s}px;height:${s}px;border-radius:${Math.random() > .5 ? '50%' : '2px'};animation-duration:${1.2 + Math.random() * 1.2}s;animation-delay:${Math.random() * .3}s`;
    wrap.appendChild(p); p.addEventListener('animationend', () => p.remove());
  }
}

/* ============================================================
   RESULTADOS
============================================================ */
function endGame() {
  clearInterval(game.timer);
  const t = game.questions.length;
  if (game.correct >= t * .9) spawnConfetti(40); else if (game.correct >= t * .6) spawnConfetti(15);
  showScreen('results'); buildResults();
}
function buildResults() {
  const total = game.questions.length, pct = Math.round(game.correct / total * 100);
  $('#resultsTitle').textContent = pct >= 90 ? '🏆 ¡Campeón/a!' : pct >= 70 ? '⭐ ¡Muy bien!' : pct >= 50 ? '💪 ¡Buen trabajo!' : '🌱 ¡Sigue practicando!';
  if (state.useTeams) {
    $('#soloResults').style.display = 'none'; $('#teamsResults').classList.remove('hidden'); buildPodium();
  } else {
    $('#soloResults').style.display = ''; $('#teamsResults').classList.add('hidden');
    $('#soloScore').textContent = game.score;
    $('#soloScoreSub').textContent = `puntos · ${game.correct}/${total} bien`;
    $('#statCorrect').textContent = game.correct; $('#statWrong').textContent = game.wrong;
    $('#statPct').textContent = pct + '%'; $('#statStreak').textContent = game.maxStreak;
  }
  // por formato
  const by = {};
  game.answers.forEach(a => { const b = by[a.q.op] = by[a.q.op] || { n:0, ok:0, aid:0 }; b.n++; if (a.correct) b.ok++; if (a.aid) b.aid++; });
  $('#byFmt').innerHTML = `<tr><th>Formato</th><th>Bien</th><th></th><th>Con ayuda</th></tr>` + Object.entries(by).map(([op, b]) => {
    const F = FORMATS[op], p = Math.round(b.ok / b.n * 100);
    return `<tr><td style="color:${F.c}">${F.name}</td><td>${b.ok}/${b.n}</td><td><div class="bar"><i style="width:${p}%;background:${F.c}"></i></div></td><td>${b.aid ? '🧰 ' + b.aid : '—'}</td></tr>`;
  }).join('');
  // historial
  const hist = $('#historyList'); hist.innerHTML = '';
  game.answers.forEach(a => {
    const row = document.createElement('div'); row.className = 'hist-item';
    const badge = a.skipped ? '<span class="h-badge ko">⏭ Saltada</span>'
      : a.correct ? `<span class="h-badge ok">✅ ${ansText(a.q, a.given)}</span>`
      : `<span class="h-badge ko">❌ ${ansText(a.q, a.given)} → ${ansText(a.q, a.q.answer)}</span>`;
    row.innerHTML = `<div><span class="h-q"></span>${a.aid ? `<span class="h-aid">🧰 ${a.aid}</span>` : ''}<span class="h-team"></span></div>${badge}`;
    row.querySelector('.h-q').textContent = a.q.problem ? a.q.plain : a.q.plain + ' = ?';
    if (a.team !== null) row.querySelector('.h-team').textContent = state.teamNames[a.team];
    hist.appendChild(row);
  });
}
function buildPodium() {
  const ranked = state.teamNames.slice(0, state.numTeams).map((name, i) => ({ name, score: game.teamScores[i], color: state.teamColors[i] })).sort((a, b) => b.score - a.score);
  const podium = $('#podium'); podium.innerHTML = '';
  const order = ranked.length >= 3 ? [ranked[1], ranked[0], ranked[2]] : ranked.length === 2 ? [ranked[1], ranked[0]] : [ranked[0]];
  const medal = ranked.length >= 2 ? ['🥈', '🥇', '🥉'] : ['🥇'], H = ranked.length >= 2 ? [120, 160, 90] : [160];
  order.forEach((t, i) => {
    const el = document.createElement('div'); el.className = 'podium-place';
    el.innerHTML = `<div class="podium-label"></div><div class="podium-pts" style="color:${t.color}">${t.score} pts</div><div class="podium-bar" style="height:${H[i]}px;background:${t.color}22;border-color:${t.color};box-shadow:3px 3px 0 ${t.color}"><div style="font-size:1.5rem;text-align:center;padding-top:8px">${medal[i]}</div></div>`;
    el.querySelector('.podium-label').textContent = t.name;
    podium.appendChild(el);
  });
}

/* ============================================================
   PANTALLAS Y TECLADO
============================================================ */
function showScreen(id) { $$('.screen').forEach(s => s.classList.remove('active')); $('#screen-' + id).classList.add('active'); window.scrollTo(0, 0); }
function goHome() { clearInterval(game.timer); hideFeedback(); showScreen('home'); syncUI(); }

document.addEventListener('keydown', e => {
  if (!$('#screen-game').classList.contains('active')) return;
  const ov = $('#feedbackOverlay');
  if (ov.classList.contains('ko') && ov.classList.contains('show')) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextQuestion(); }
    return;
  }
  if (state.mode === 'mc' && !game.locked && /^[1-4]$/.test(e.key) && !(e.target && e.target.tagName === 'INPUT')) {
    const b = $$('.mc-btn')[+e.key - 1]; if (b) b.click();
  }
});

/* INICIO */
buildFormatGrids();
loadSettings();
syncUI();
buildTeamInputs();
initPad();

/* MODO SIN CONEXIÓN (PWA) */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
