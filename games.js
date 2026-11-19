/* Orbit games for breaks: Snake, Bricks, Pong, Gridfill and Sudoku.
   One canvas, drawn in the current theme colours with the same ASCII tiles as the background animals.
   The animation loop only runs while a game or an effect is moving and the Games tab is open. */
(function () {
  'use strict';
  var cv, ctx, W = 0, H = 0, cur = null, id = '', raf = 0, last = 0, open = false, store = null, ready = false;
  var C = {}, held = {}, games = {}, shown = {}, now = 0;
  var CH = '.:-=+*#%@/\\|<>01{}[]', MONO = "ui-monospace, 'Cascadia Mono', Consolas, monospace";
  function $(i) { return document.getElementById(i); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function hash(a, b) { var h = Math.imul(a + 1, 374761393) ^ Math.imul(b + 7, 668265263); h = Math.imul(h ^ (h >>> 13), 1103515245); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function easeOut(k) { return 1 - Math.pow(1 - k, 3); }
  function easeBack(k) { var c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); }

  function colours() {
    var cs = getComputedStyle(document.documentElement);
    ['text', 'text-2', 'text-3', 'accent', 'separator', 'fill', 'danger', 'success', 'bg'].forEach(function (n) { C[n] = cs.getPropertyValue('--' + n).trim(); });
    C.subj = [1, 2, 3, 4, 5, 6].map(function (i) { return cs.getPropertyValue('--subj-' + i).trim(); });
    C.font = cs.getPropertyValue('--font-display').trim() || 'monospace';
  }
  function size(w, h) {
    var d = Math.min(2, window.devicePixelRatio || 1);
    W = w; H = h; cv.width = Math.round(w * d); cv.height = Math.round(h * d);
    cv.style.aspectRatio = w + ' / ' + h; cv.style.width = 'min(100%, ' + w * 1.4 + 'px)';
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function text(s, x, y, px, col, align) {
    ctx.font = px + 'px ' + C.font; ctx.fillStyle = col; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  }
  function tile(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  // An ASCII tile like the background animals: a block with a lighter top edge and characters on it.
  // Wide blocks get a row of characters. A few characters flicker, as they do in the background.
  function block(x, y, w, h, col, seed, alpha) {
    if (w < 1 || h < 1) return;
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    tile(x, y, w, h, col);
    tile(x, y, w, Math.max(1, h * 0.16), 'rgba(255,255,255,0.16)');
    var s = Math.min(w, h);
    if (s >= 8) {
      var n = Math.max(1, Math.round(w / s)), tw = Math.floor(now * 2.5);
      ctx.font = '700 ' + Math.round(s * 0.72) + 'px ' + MONO; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.36)';
      for (var k = 0; k < n; k++) {
        var r = hash(seed * 7 + k, 3), f = hash(seed * 7 + k, tw);
        ctx.fillText(CH.charAt(Math.floor((f > 0.93 ? f : r) * CH.length)), x + (k + 0.5) * w / n, y + h / 2 + 0.5);
      }
    }
    ctx.globalAlpha = 1;
  }
  function banner(title, sub) {
    ctx.globalAlpha = 0.88; tile(0, H / 2 - 42, W, 84, C.bg); ctx.globalAlpha = 1;
    text(title, W / 2, H / 2 - 12, 22, C.text); text(sub, W / 2, H / 2 + 16, 12, C['text-3']);
  }
  // Walls: solid where the ball bounces, dashed where it goes out.
  function walls(sides) {
    var t = 2;
    if (sides.indexOf('l') >= 0) tile(0, 0, t, H, C['text-3']);
    if (sides.indexOf('r') >= 0) tile(W - t, 0, t, H, C['text-3']);
    if (sides.indexOf('t') >= 0) tile(0, 0, W, t, C['text-3']);
    if (sides.indexOf('b') >= 0) tile(0, H - t, W, t, C['text-3']);
    if (sides.indexOf('T') >= 0) for (var x = 0; x < W; x += 12) tile(x, 0, 6, t, C.separator);
    if (sides.indexOf('B') >= 0) for (x = 0; x < W; x += 12) tile(x, H - t, 6, t, C.separator);
  }
  function save(v) { if (v > store.best(id)) store.save(id, v); }

  /* ---------- effects: ASCII particles, floating scores, screen shake ---------- */
  var fx = [], pops = [], shake = 0;
  function burst(x, y, col, n, sp) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, v = sp * (0.35 + Math.random() * 0.8);
      fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.4, t: 0, life: 0.45 + Math.random() * 0.45, col: col, s: 6 + rnd(6), seed: rnd(9999) });
    }
    if (fx.length > 260) fx.splice(0, fx.length - 260);
  }
  function pop(x, y, s, col, px) { pops.push({ x: x, y: y, s: s, col: col || C.text, px: px || 14, t: 0 }); }
  function quake(v) { shake = Math.max(shake, v); }
  function fxStep(dt) {
    shake = Math.max(0, shake - dt);
    for (var i = fx.length - 1; i >= 0; i--) {
      var p = fx[i]; p.t += dt;
      if (p.t >= p.life) { fx.splice(i, 1); continue; }
      p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (i = pops.length - 1; i >= 0; i--) { pops[i].t += dt; if (pops[i].t > 0.8) pops.splice(i, 1); }
  }
  function fxDraw() {
    fx.forEach(function (p) { var k = 1 - p.t / p.life; block(p.x - p.s / 2, p.y - p.s / 2, p.s * (0.5 + k * 0.5), p.s * (0.5 + k * 0.5), p.col, p.seed, k); });
    pops.forEach(function (p) {
      var k = p.t / 0.8; ctx.globalAlpha = 1 - k * k;
      text(p.s, p.x, p.y - easeOut(k) * 28, p.px + (k < 0.15 ? (0.15 - k) * 20 : 0), p.col);
      ctx.globalAlpha = 1;
    });
  }

  /* ---------- loop and screen ---------- */
  function busy() { return cur.live() || fx.length || pops.length || shake > 0 || (cur.anim && cur.anim()); }
  function draw() {
    if (!cur) return;
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 18, (Math.random() - 0.5) * shake * 18);
    cur.draw(); fxDraw();
    if (cur.over) cur.over();
    ctx.restore();
    var s = String(cur.score()), b = 'Best ' + store.best(id);
    if (shown.s !== s) $('game-score').textContent = shown.s = s;
    if (shown.b !== b) $('game-best').textContent = shown.b = b;
  }
  function tick(t) {
    raf = 0;
    if (!open || !cur) return;
    var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t; now = t / 1000;
    if (cur.update && cur.live()) cur.update(dt);
    fxStep(dt);
    draw();
    if (busy()) raf = requestAnimationFrame(tick); else last = 0;
  }
  function refresh() { now = performance.now() / 1000; draw(); if (open && !raf && cur && busy()) { last = 0; raf = requestAnimationFrame(tick); } }
  function buttons() {
    var box = $('game-ctrls'); box.textContent = '';
    (cur.buttons || []).forEach(function (b) {
      var n = document.createElement('button');
      n.type = 'button'; n.className = 'btn'; n.textContent = typeof b[0] === 'function' ? b[0]() : b[0];
      if (b[2] && b[2]()) n.setAttribute('aria-pressed', 'true');
      n.addEventListener('click', function () { b[1](); buttons(); refresh(); });
      box.appendChild(n);
    });
  }
  function pick(name) {
    if (cur && cur.pause) cur.pause();
    held = {}; fx = []; pops = []; shake = 0;
    id = name; cur = games[name] || (games[name] = MAKERS[name]());
    store.setGame(name);
    Array.prototype.forEach.call($('game-pick').children, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-game') === name)); });
    $('game-help').textContent = cur.help;
    size(cur.w, cur.h); shown = {}; buttons(); refresh();
  }

  /* ---------- shared: start, pause, game over ---------- */
  function machine(g, name, how, onStart) {
    g.state = 'ready';
    g.live = function () { return g.state === 'play'; };
    g.pause = function () { if (g.state === 'play') g.state = 'paused'; };
    g.go = function () {
      if (g.state === 'play') { g.state = 'paused'; return; }
      if (g.state === 'over') g.reset();
      g.state = 'play'; if (onStart) onStart();
    };
    g.over = function () {
      if (g.state === 'ready') banner(name, how);
      else if (g.state === 'paused') banner('Paused', 'Space or tap to carry on');
      else if (g.state === 'over') banner(g.endText(), 'Space or tap to play again');
    };
  }
  // Paddle bounce: where the ball hits sets the angle, like a real paddle.
  function bounce(ball, px, pw, up) {
    var off = clamp((ball.x - px) / (pw / 2), -1, 1), sp = Math.min(Math.hypot(ball.vx, ball.vy) * 1.03, 560), a = off * 1.05;
    ball.vx = sp * Math.sin(a); ball.vy = (up ? -1 : 1) * sp * Math.cos(a);
  }
  function trail(list, x, y) { list.push([x, y]); if (list.length > 8) list.shift(); }
  function drawTrail(list, R) {
    for (var i = 0; i < list.length; i++) { var k = (i + 1) / (list.length + 1); ctx.globalAlpha = k * 0.4; tile(list[i][0] - R * k, list[i][1] - R * k, R * 2 * k, R * 2 * k, C.accent); }
    ctx.globalAlpha = 1;
  }

  /* ---------- Snake ---------- */
  function Snake() {
    var N = 20, S = 16, g = { w: N * S, h: N * S, help: 'Arrow keys or WASD, or swipe on the board. Space or tap to start and pause. The walls are deadly.' };
    var body, from, dir, queue, food, acc, score, step, sx = 0, sy = 0;
    machine(g, 'Snake', 'Press an arrow key or swipe to start');
    g.reset = function () { body = [[10, 10], [9, 10], [8, 10]]; from = body.map(function (b) { return b.slice(); }); dir = [1, 0]; queue = []; acc = 0; score = 0; step = 0.12; g.state = 'ready'; place(); };
    function hit(p) { return function (b) { return b[0] === p[0] && b[1] === p[1]; }; }
    function place() { do { food = [rnd(N), rnd(N)]; } while (body.some(hit(food))); }
    g.score = function () { return score; };
    g.endText = function () { return 'Game over: ' + score; };
    g.update = function (dt) { acc += dt; while (acc >= step && g.state === 'play') { acc -= step; move(); } };
    function move() {
      if (queue.length) dir = queue.shift();
      var h = [body[0][0] + dir[0], body[0][1] + dir[1]], eat = h[0] === food[0] && h[1] === food[1];
      if (h[0] < 0 || h[1] < 0 || h[0] >= N || h[1] >= N || body.slice(0, eat ? body.length : body.length - 1).some(hit(h))) {
        g.state = 'over'; acc = 0; from = body.map(function (b) { return b.slice(); });
        quake(0.35); burst(body[0][0] * S + S / 2, body[0][1] * S + S / 2, C.text, 18, 160); save(score); return;
      }
      var old = body;
      body = [h].concat(eat ? old : old.slice(0, -1));
      from = body.map(function (b, i) { return (old[i] || old[old.length - 1]).slice(); });
      if (eat) {
        score++; step = Math.max(0.06, step * 0.97);
        burst(food[0] * S + S / 2, food[1] * S + S / 2, C.subj[3], 12, 140); pop(food[0] * S + S / 2, food[1] * S - 4, '+1', C.subj[3]);
        place();
      }
    }
    function turn(d) {
      if (g.state === 'over' || g.state === 'paused') return;
      var p = queue.length ? queue[queue.length - 1] : dir;
      if ((d[0] === -p[0] && d[1] === -p[1]) || (d[0] === p[0] && d[1] === p[1]) || queue.length > 2) return;
      queue.push(d);
      if (g.state === 'ready') g.go();
    }
    var KEYS = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
    g.key = function (k, down) {
      if (!down) return false;
      if (k === ' ') { g.go(); return true; }
      var d = KEYS[k.length === 1 ? k.toLowerCase() : k]; if (!d) return false;
      turn(d); return true;
    };
    g.pointer = function (type, x, y) {
      if (type === 'down') { sx = x; sy = y; return; }
      if (type !== 'up') return;
      var dx = x - sx, dy = y - sy;
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) g.go();
      else turn(Math.abs(dx) > Math.abs(dy) ? [dx > 0 ? 1 : -1, 0] : [0, dy > 0 ? 1 : -1]);
    };
    g.buttons = [['Restart', function () { g.reset(); }]];
    g.draw = function () {
      for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) tile(i * S + 7, j * S + 7, 2, 2, C.fill);
      walls('lrtb');
      var fp = Math.sin(now * 7) * 1.5;
      block(food[0] * S + 2 - fp, food[1] * S + 2 - fp, S - 4 + fp * 2, S - 4 + fp * 2, C.subj[3], 5);
      var f = g.state === 'play' ? clamp(acc / step, 0, 1) : 1;
      for (i = body.length - 1; i >= 0; i--) {
        var x = from[i][0] + (body[i][0] - from[i][0]) * f, y = from[i][1] + (body[i][1] - from[i][1]) * f;
        block(x * S + 1, y * S + 1, S - 2, S - 2, i ? C.accent : C.text, i ? i + 11 : 2);
      }
    };
    g.reset();
    return g;
  }

  /* ---------- Bricks ---------- */
  function Bricks() {
    var COLS = 8, ROWS = 6, BW = 36, BH = 13, GAP = 4, TOP = 44, PW = 60, PH = 10, R = 5;
    var g = { w: COLS * (BW + GAP) + GAP, h: 430, help: 'Move with the mouse, a finger or the arrow keys. Space or tap to launch. The ball bounces off the solid walls and is lost past the dashed line. Three lives.' };
    var PY = g.h - 32, px, ball, bricks, lives, score, level, stuck, tr = [], hitT = 0;
    machine(g, 'Bricks', 'Tap or press space to launch', function () { if (stuck) launch(); });
    g.reset = function () { lives = 3; score = 0; level = 1; build(); serve(); g.state = 'ready'; };
    function build() {
      bricks = [];
      for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) bricks.push({ x: GAP + c * (BW + GAP), y: TOP + r * (BH + GAP), c: r, on: true, born: now + (r * COLS + c) * 0.012 });
    }
    function serve() { px = g.w / 2; stuck = true; tr = []; ball = { x: px, y: PY - R, vx: 0, vy: 0 }; }
    function launch() { var sp = 250 + 30 * (level - 1); stuck = false; ball.vx = sp * 0.5 * (Math.random() < 0.5 ? -1 : 1); ball.vy = -sp * 0.87; }
    g.score = function () { return score + '  ' + '♥'.repeat(lives); };
    g.endText = function () { return 'Game over: ' + score; };
    g.update = function (dt) {
      hitT = Math.max(0, hitT - dt);
      var mv = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      if (mv) px = clamp(px + mv * 380 * dt, PW / 2, g.w - PW / 2);
      if (stuck) { ball.x = px; return; }
      for (var s = 0; s < 3 && g.state === 'play'; s++) step(dt / 3);
      trail(tr, ball.x, ball.y);
    };
    function step(dt) {
      var ox = ball.x, oy = ball.y;
      ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      if (ball.x < R + 2) { ball.x = R + 2; ball.vx = Math.abs(ball.vx); }
      if (ball.x > g.w - R - 2) { ball.x = g.w - R - 2; ball.vx = -Math.abs(ball.vx); }
      if (ball.y < R + 2) { ball.y = R + 2; ball.vy = Math.abs(ball.vy); }
      if (ball.y > g.h + R) {
        lives--; quake(0.3); burst(ball.x, g.h - 4, C.danger, 14, 180);
        if (lives <= 0) { g.state = 'over'; save(score); } else serve();
        return;
      }
      if (ball.vy > 0 && ball.y + R >= PY && oy + R <= PY + 2 && Math.abs(ball.x - px) <= PW / 2 + R) { ball.y = PY - R; bounce(ball, px, PW, true); hitT = 0.12; }
      for (var i = 0; i < bricks.length; i++) {
        var b = bricks[i];
        if (!b.on || ball.x + R < b.x || ball.x - R > b.x + BW || ball.y + R < b.y || ball.y - R > b.y + BH) continue;
        b.on = false; score += 10;
        burst(b.x + BW / 2, b.y + BH / 2, C.subj[b.c % 6], 9, 150); pop(b.x + BW / 2, b.y, '+10', C.subj[b.c % 6], 12); quake(0.06);
        if (oy + R <= b.y || oy - R >= b.y + BH) ball.vy = -ball.vy; else ball.vx = -ball.vx;
        ball.x = ox; ball.y = oy;
        break;
      }
      if (!bricks.some(function (b) { return b.on; })) { level++; pop(g.w / 2, g.h / 2, 'Level ' + level, C.accent, 20); build(); serve(); }
    }
    g.key = function (k, down) {
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { held.left = down; if (down && g.state === 'ready') g.go(); return true; }
      if (k === 'ArrowRight' || k === 'd' || k === 'D') { held.right = down; if (down && g.state === 'ready') g.go(); return true; }
      if (k === ' ' && down) { if (g.state === 'play' && stuck) launch(); else g.go(); return true; }
      return false;
    };
    g.pointer = function (type, x) {
      if (type === 'move' && g.state === 'play') px = clamp(x, PW / 2, g.w - PW / 2);
      if (type === 'down') { if (g.state === 'play' && stuck) launch(); else if (g.state !== 'play') g.go(); px = clamp(x, PW / 2, g.w - PW / 2); }
    };
    g.anim = function () { return bricks.some(function (b) { return b.on && b.born > now - 0.3; }); };
    g.buttons = [['Restart', function () { g.reset(); }]];
    g.draw = function () {
      walls('lrtB');
      bricks.forEach(function (b, i) {
        if (!b.on) return;
        var k = clamp((now - b.born) / 0.25, 0, 1), sc = easeBack(k);
        if (k <= 0) return;
        block(b.x + BW * (1 - sc) / 2, b.y + BH * (1 - sc) / 2, BW * sc, BH * sc, C.subj[b.c % 6], i + 20);
      });
      drawTrail(tr, R);
      block(px - PW / 2, PY, PW, PH, hitT > 0 ? C.accent : C.text, 3);
      block(ball.x - R, ball.y - R, R * 2, R * 2, C.accent, 1);
      text('Level ' + level, g.w / 2, 22, 12, C['text-3']);
    };
    g.reset();
    return g;
  }

  /* ---------- Pong (you at the bottom, the computer at the top) ---------- */
  function Pong() {
    var g = { w: 300, h: 430, help: 'Move with the mouse, a finger or the arrow keys. The ball bounces off the side walls; the dashed ends are goals. First to 7 wins. Best counts your wins.' };
    var PW = 64, PH = 10, R = 5, YOU = g.h - 28, CPU = 18, px, cx, ball, you, cpu, toYou, wait, tr = [], hitY = 0, hitC = 0;
    machine(g, 'Pong', 'Tap or press space to start');
    g.reset = function () { you = 0; cpu = 0; px = cx = g.w / 2; toYou = true; serve(); g.state = 'ready'; };
    function serve() { tr = []; ball = { x: g.w / 2, y: g.h / 2, vx: (Math.random() - 0.5) * 160, vy: (toYou ? 1 : -1) * 230 }; wait = 0.8; }
    g.score = function () { return 'You ' + you + '  ·  ' + cpu + ' CPU'; };
    g.endText = function () { return you > cpu ? 'You win ' + you + '–' + cpu : 'CPU wins ' + cpu + '–' + you; };
    g.update = function (dt) {
      hitY = Math.max(0, hitY - dt); hitC = Math.max(0, hitC - dt);
      var mv = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      if (mv) px = clamp(px + mv * 380 * dt, PW / 2 + 2, g.w - PW / 2 - 2);
      var target = ball.vy < 0 ? ball.x : g.w / 2;
      cx += clamp(target - cx, -210 * dt, 210 * dt); cx = clamp(cx, PW / 2 + 2, g.w - PW / 2 - 2);
      if (wait > 0) { wait -= dt; return; }
      for (var s = 0; s < 3 && g.state === 'play'; s++) step(dt / 3);
      trail(tr, ball.x, ball.y);
    };
    function step(dt) {
      var oy = ball.y;
      ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      if (ball.x < R + 2) { ball.x = R + 2; ball.vx = Math.abs(ball.vx); }
      if (ball.x > g.w - R - 2) { ball.x = g.w - R - 2; ball.vx = -Math.abs(ball.vx); }
      if (ball.vy > 0 && ball.y + R >= YOU && oy + R <= YOU + 2 && Math.abs(ball.x - px) <= PW / 2 + R) { ball.y = YOU - R; bounce(ball, px, PW, true); hitY = 0.12; burst(ball.x, YOU, C.text, 5, 90); }
      if (ball.vy < 0 && ball.y - R <= CPU + PH && oy - R >= CPU + PH - 2 && Math.abs(ball.x - cx) <= PW / 2 + R) { ball.y = CPU + PH + R; bounce(ball, cx, PW, false); hitC = 0.12; burst(ball.x, CPU + PH, C.subj[3], 5, 90); }
      if (ball.y > g.h + R || ball.y < -R) {
        var mine = ball.y < 0;
        if (mine) you++; else cpu++;
        burst(ball.x, mine ? 4 : g.h - 4, mine ? C.accent : C.danger, 16, 170); quake(0.25);
        pop(g.w / 2, g.h / 2 - 30, mine ? 'Point to you' : 'Point to CPU', mine ? C.accent : C['text-2'], 16);
        toYou = mine;
        if (you >= 7 || cpu >= 7) { g.state = 'over'; if (you > cpu) store.save(id, store.best(id) + 1); }
        else serve();
        return;
      }
    }
    g.key = function (k, down) {
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { held.left = down; if (down && g.state === 'ready') g.go(); return true; }
      if (k === 'ArrowRight' || k === 'd' || k === 'D') { held.right = down; if (down && g.state === 'ready') g.go(); return true; }
      if (k === ' ' && down) { g.go(); return true; }
      return false;
    };
    g.pointer = function (type, x) {
      if (type === 'move' && g.state === 'play') px = clamp(x, PW / 2 + 2, g.w - PW / 2 - 2);
      if (type === 'down') { if (g.state !== 'play') g.go(); px = clamp(x, PW / 2 + 2, g.w - PW / 2 - 2); }
    };
    g.buttons = [['Restart', function () { g.reset(); }]];
    g.draw = function () {
      walls('lrTB');
      for (var x = 4; x < g.w; x += 16) tile(x, g.h / 2 - 1, 8, 2, C.separator);
      text(String(cpu), g.w - 22, g.h / 2 - 22, 22, C.separator); text(String(you), g.w - 22, g.h / 2 + 22, 22, C.separator);
      block(cx - PW / 2, CPU, PW, PH, hitC > 0 ? C.text : C.subj[3], 4);
      block(px - PW / 2, YOU, PW, PH, hitY > 0 ? C.accent : C.text, 3);
      drawTrail(tr, R);
      var blink = wait > 0 && Math.floor(now * 8) % 2;
      if (!blink) block(ball.x - R, ball.y - R, R * 2, R * 2, C.accent, 1);
    };
    g.reset();
    return g;
  }

  /* ---------- Gridfill: place pieces on an 8 by 8 board, full rows and columns clear ---------- */
  var SHAPES = ['X', 'XX', 'X|X', 'XXX', 'X|X|X', 'XXXX', 'X|X|X|X', 'XXXXX', 'X|X|X|X|X', 'XX|XX', 'XXX|XXX|XXX',
    'XX|X.', 'XX|.X', 'X.|XX', '.X|XX', 'X..|XXX', '..X|XXX', 'XXX|X..', 'XXX|..X', 'X.|X.|XX', '.X|.X|XX', 'XX|X.|X.', 'XX|.X|.X',
    'XXX|.X.', '.X.|XXX', 'X.|XX|X.', '.X|XX|.X', 'XX.|.XX', '.XX|XX.'].map(function (s) {
    var rows = s.split('|'), cells = [];
    rows.forEach(function (r, i) { r.split('').forEach(function (ch, j) { if (ch === 'X') cells.push([i, j]); }); });
    return { cells: cells, rows: rows.length, cols: rows[0].length };
  });
  function Gridfill() {
    var N = 8, CELL = 34, BX = 8, BY = 8, TY = BY + N * CELL + 14, SLOT = (N * CELL + 16) / 3, MINI = 15;
    var g = { w: N * CELL + 16, h: TY + 96, help: 'Drag a piece onto the board, or tap a piece and then a square. Fill a whole row or column to clear it. Clear several at once for a bigger bonus.' };
    var board, born, tray, dealt, sel, drag, pos, score, over, clearing, shown2, endT;
    g.reset = function () {
      board = []; born = [];
      for (var i = 0; i < N * N; i++) { board.push(-1); born.push(0); }
      score = 0; shown2 = 0; over = false; sel = -1; drag = false; clearing = []; deal();
    };
    function deal() { dealt = now; tray = [0, 1, 2].map(function () { return { s: SHAPES[rnd(SHAPES.length)], c: rnd(6), seed: rnd(9999) }; }); }
    function fits(s, r, c) {
      return s.cells.every(function (p) { var rr = r + p[0], cc = c + p[1]; return rr >= 0 && cc >= 0 && rr < N && cc < N && board[rr * N + cc] < 0; });
    }
    function anyFit(s) { for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (fits(s, r, c)) return true; return false; }
    function spot(x, y, s, lift) { return [Math.round((y - lift - s.rows * CELL / 2 - BY) / CELL), Math.round((x - s.cols * CELL / 2 - BX) / CELL)]; }
    function drop(x, y, lift) {
      var t = tray[sel], at = spot(x, y, t.s, lift);
      if (!fits(t.s, at[0], at[1])) return false;
      t.s.cells.forEach(function (p, k) { var i = (at[0] + p[0]) * N + at[1] + p[1]; board[i] = t.c; born[i] = now + k * 0.02; });
      score += t.s.cells.length; tray[sel] = null; sel = -1;
      var full = {}, lines = 0;
      for (var i = 0; i < N; i++) {
        var row = true, col = true;
        for (var j = 0; j < N; j++) { if (board[i * N + j] < 0) row = false; if (board[j * N + i] < 0) col = false; }
        if (row) { lines++; for (j = 0; j < N; j++) full[i * N + j] = 1; }
        if (col) { lines++; for (j = 0; j < N; j++) full[j * N + i] = 1; }
      }
      var cx = BX + (at[1] + t.s.cols / 2) * CELL, cy = BY + (at[0] + t.s.rows / 2) * CELL;
      Object.keys(full).forEach(function (k, n) {
        k = Number(k);
        clearing.push({ i: k, c: board[k], t0: now + n * 0.008 });
        burst(BX + (k % N + 0.5) * CELL, BY + (Math.floor(k / N) + 0.5) * CELL, C.subj[board[k]], 2, 130);
        board[k] = -1;
      });
      if (lines) {
        score += lines * lines * 10; quake(0.08 + lines * 0.06);
        pop(cx, cy - 10, '+' + (t.s.cells.length + lines * lines * 10), C.text, 16);
        if (lines > 1) pop(g.w / 2, BY + N * CELL / 2, lines + ' lines!', C.accent, 22);
      } else pop(cx, cy - 10, '+' + t.s.cells.length, C['text-2'], 12);
      if (tray.every(function (t) { return !t; })) deal();
      if (!tray.some(function (t) { return t && anyFit(t.s); })) { over = true; endT = now; quake(0.3); save(score); }
      return true;
    }
    g.live = function () { return false; };
    g.anim = function () {
      return shown2 !== score || now - dealt < 0.4 || clearing.length > 0 || (over && now - endT < 1.2) ||
        born.some(function (b) { return b > now - 0.25; });
    };
    g.key = function () { return false; };
    g.pointer = function (type, x, y, isDown, lift) {
      if (over) { if (type === 'down' && now - endT > 0.6) g.reset(); return; }
      pos = [x, y, lift];
      if (type === 'down') {
        if (y >= TY) { var i = clamp(Math.floor(x / SLOT), 0, 2); if (tray[i]) { sel = i; drag = true; } return; }
        if (sel >= 0) drop(x, y, 0);
      } else if (type === 'up' && drag) {
        drag = false;
        if (y < TY - 4) drop(x, y, lift);
      }
    };
    g.buttons = [['Restart', function () { g.reset(); }]];
    g.update = null;
    g.draw = function () {
      // Score counts up rather than jumping.
      if (shown2 < score) shown2 = Math.min(score, shown2 + Math.max(1, Math.ceil((score - shown2) * 0.2)));
      else shown2 = score;
      for (var i = 0; i < N * N; i++) {
        var x = BX + (i % N) * CELL, y = BY + Math.floor(i / N) * CELL;
        tile(x + 1, y + 1, CELL - 2, CELL - 2, C.fill);
        if (board[i] < 0) { tile(x + CELL / 2 - 1, y + CELL / 2 - 1, 2, 2, C.separator); continue; }
        var k = clamp((now - born[i]) / 0.2, 0, 1), sc = k <= 0 ? 0 : 0.55 + 0.45 * easeBack(k), w = (CELL - 2) * sc;
        block(x + 1 + (CELL - 2 - w) / 2, y + 1 + (CELL - 2 - w) / 2, w, w, C.subj[board[i]], i);
      }
      clearing = clearing.filter(function (c) {
        var k = (now - c.t0) / 0.32; if (k >= 1) return false;
        var x = BX + (c.i % N) * CELL, y = BY + Math.floor(c.i / N) * CELL;
        if (k < 0) { block(x + 1, y + 1, CELL - 2, CELL - 2, C.subj[c.c], c.i); return true; }
        var w = (CELL - 2) * (1 - easeOut(k));
        block(x + 1 + (CELL - 2 - w) / 2, y + 1 + (CELL - 2 - w) / 2, w, w, k < 0.25 ? C.text : C.subj[c.c], c.i, 1 - k * 0.5);
        return true;
      });
      if (sel >= 0 && pos && drag) {
        var t = tray[sel], at = spot(pos[0], pos[1], t.s, pos[2]);
        if (fits(t.s, at[0], at[1])) {
          t.s.cells.forEach(function (p) { block(BX + (at[1] + p[1]) * CELL + 1, BY + (at[0] + p[0]) * CELL + 1, CELL - 2, CELL - 2, C.subj[t.c], 0, 0.3); });
        }
      }
      var dk = easeOut(clamp((now - dealt) / 0.35, 0, 1));
      tray.forEach(function (t, i) {
        if (!t || (drag && i === sel)) return;
        var cx = i * SLOT + SLOT / 2, cy = TY + 44 + (1 - dk) * 30, ok = anyFit(t.s), lift = i === sel ? -4 + Math.sin(now * 6) * 1.5 : 0;
        if (i === sel) tile(i * SLOT + 4, TY, SLOT - 8, 88, C.fill);
        t.s.cells.forEach(function (p, n) { block(cx - t.s.cols * MINI / 2 + p[1] * MINI + 1, cy + lift - t.s.rows * MINI / 2 + p[0] * MINI + 1, MINI - 2, MINI - 2, C.subj[t.c], t.seed + n, (ok ? 1 : 0.3) * dk); });
      });
      if (drag && pos) {
        var d = tray[sel], ox = pos[0] - d.s.cols * CELL / 2, oy = pos[1] - pos[2] - d.s.rows * CELL / 2;
        d.s.cells.forEach(function (p, n) { block(ox + p[1] * CELL + 1, oy + p[0] * CELL + 1, CELL - 2, CELL - 2, C.subj[d.c], d.seed + n, 0.92); });
      }
    };
    g.score = function () { return shown2; };
    g.over = function () { if (over) banner('No moves left: ' + score, 'Tap to play again'); };
    g.reset();
    return g;
  }

  /* ---------- Sudoku ---------- */
  function cands(b, i) {
    var r = (i / 9) | 0, c = i % 9, br = r - r % 3, bc = c - c % 3, m = 0;
    for (var k = 0; k < 9; k++) m |= (1 << b[r * 9 + k]) | (1 << b[k * 9 + c]) | (1 << b[(br + ((k / 3) | 0)) * 9 + bc + k % 3]);
    return ~m & 0x3FE;
  }
  function bits(m) { var n = 0; while (m) { m &= m - 1; n++; } return n; }
  // Counts solutions up to `limit`. With `fillRandom` it fills the first solution in place, trying digits in random order.
  function solve(b, limit, fillRandom) {
    var best = -1, bm = 0, bn = 10;
    for (var i = 0; i < 81; i++) if (!b[i]) { var m = cands(b, i), n = bits(m); if (n < bn) { bn = n; best = i; bm = m; if (!n) return 0; } }
    if (best < 0) return 1;
    var ds = [1, 2, 3, 4, 5, 6, 7, 8, 9], tot = 0;
    if (fillRandom) shuffle(ds);
    for (var k = 0; k < 9; k++) {
      var d = ds[k]; if (!(bm >> d & 1)) continue;
      b[best] = d; tot += solve(b, limit - tot, fillRandom);
      if (tot >= limit) { if (fillRandom) return tot; break; }
    }
    b[best] = 0;
    return tot;
  }
  function makeSudoku(clues) {
    var sol = []; for (var i = 0; i < 81; i++) sol.push(0);
    solve(sol, 1, true);
    var p = sol.slice(), left = 81;
    shuffle(Array.from({ length: 81 }, function (_, i) { return i; })).forEach(function (i) {
      if (left <= clues) return;
      var v = p[i]; p[i] = 0;
      if (solve(p.slice(), 2) !== 1) p[i] = v; else left--;
    });
    return { sol: sol, given: p };
  }
  function Sudoku() {
    var S = 36, X = 6, PY = X + 9 * S + 12;
    var g = { w: 9 * S + 12, h: PY + 46, help: 'Tap a square, then a number. Arrow keys and 1 to 9 work too. P turns pencil marks on and off. Mistakes show in red.' };
    var LEVELS = [['Easy', 40], ['Medium', 32], ['Hard', 26]], lvl = 0, pz, val, notes, selI, pencil = false, done, putT, glow;
    g.reset = function () { pz = makeSudoku(LEVELS[lvl][1]); val = pz.given.slice(); notes = val.map(function () { return 0; }); putT = val.map(function () { return 0; }); glow = []; selI = 40; done = false; };
    g.live = function () { return false; };
    g.anim = function () { return putT[selI] > now - 0.25 || glow.some(function (q) { return q.t > now - 0.6; }); };
    g.score = function () { return LEVELS[lvl][0] + (done ? '  ·  Solved!' : ''); };
    function unit(list) { return list.every(function (i) { return val[i] === pz.sol[i]; }); }
    function put(d) {
      if (done || pz.given[selI]) return;
      if (pencil && d) { if (!val[selI]) notes[selI] ^= 1 << d; return; }
      val[selI] = d; notes[selI] = 0; putT[selI] = now;
      if (!d || d !== pz.sol[selI]) { if (d) quake(0.12); return; }
      // A finished row, column or box lights up.
      var r = Math.floor(selI / 9), c = selI % 9, br = r - r % 3, bc = c - c % 3, R = [], Cl = [], B = [];
      for (var k = 0; k < 9; k++) { R.push(r * 9 + k); Cl.push(k * 9 + c); B.push((br + Math.floor(k / 3)) * 9 + bc + k % 3); }
      [R, Cl, B].forEach(function (u) { if (unit(u)) { glow.push({ cells: u, t: now }); u.forEach(function (i) { burst(X + (i % 9 + 0.5) * S, X + (Math.floor(i / 9) + 0.5) * S, C.accent, 1, 90); }); } });
      if (val.every(function (v, i) { return v === pz.sol[i]; })) {
        done = true; store.save(id, store.best(id) + 1);
        for (var i = 0; i < 81; i += 2) burst(X + (i % 9 + 0.5) * S, X + (Math.floor(i / 9) + 0.5) * S, C.subj[i % 6], 2, 200);
      }
    }
    g.key = function (k, down) {
      if (!down) return false;
      var mv = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[k];
      if (mv) { var n = selI + mv; if (n >= 0 && n < 81 && !(Math.abs(mv) === 1 && Math.floor(n / 9) !== Math.floor(selI / 9))) selI = n; return true; }
      if (/^[1-9]$/.test(k)) { put(Number(k)); return true; }
      if (k === 'Backspace' || k === 'Delete' || k === '0') { put(0); return true; }
      if (k === 'p' || k === 'P') { pencil = !pencil; buttons(); return true; }
      return false;
    };
    g.pointer = function (type, x, y) {
      if (type !== 'down') return;
      if (y >= PY) { var d = Math.floor((x - X) / S) + 1; if (d >= 1 && d <= 9) put(d); return; }
      var c = Math.floor((x - X) / S), r = Math.floor((y - X) / S);
      if (c >= 0 && c < 9 && r >= 0 && r < 9) selI = r * 9 + c;
    };
    g.buttons = LEVELS.map(function (L, i) { return [L[0], function () { lvl = i; g.reset(); }, function () { return lvl === i; }]; })
      .concat([[function () { return pencil ? 'Pencil: on' : 'Pencil: off'; }, function () { pencil = !pencil; }, function () { return pencil; }],
        ['Erase', function () { put(0); }]]);
    g.draw = function () {
      var sr = Math.floor(selI / 9), sc = selI % 9, sv = val[selI], count = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      glow = glow.filter(function (q) { return q.t > now - 0.6; });
      for (var i = 0; i < 81; i++) {
        var r = Math.floor(i / 9), c = i % 9, x = X + c * S, y = X + r * S;
        if (i === selI) block(x + 1, y + 1, S - 2, S - 2, C.accent, 0, 0.9);
        else if (r === sr || c === sc || (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3)) || (sv && val[i] === sv)) tile(x, y, S, S, C.fill);
        glow.forEach(function (q) { if (q.cells.indexOf(i) >= 0) { ctx.globalAlpha = 0.45 * (1 - (now - q.t) / 0.6); tile(x, y, S, S, C.accent); ctx.globalAlpha = 1; } });
        if (val[i]) {
          if (val[i] === pz.sol[i]) count[val[i]]++;
          var col = i === selI ? C.bg : pz.given[i] ? C.text : val[i] !== pz.sol[i] ? C.danger : C.accent;
          var k = clamp((now - putT[i]) / 0.22, 0, 1);
          text(String(val[i]), x + S / 2, y + S / 2 + 1, Math.round(20 * (pz.given[i] ? 1 : 0.7 + 0.3 * easeBack(k))), col);
        } else if (notes[i]) {
          for (var d = 1; d <= 9; d++) if (notes[i] >> d & 1) text(String(d), x + 7 + ((d - 1) % 3) * 11, y + 7 + Math.floor((d - 1) / 3) * 11, 9, i === selI ? C.bg : C['text-3']);
        }
      }
      for (var q = 0; q <= 9; q++) {
        var thick = q % 3 === 0;
        tile(X + q * S - (thick ? 1 : 0), X, thick ? 2 : 1, 9 * S, thick ? C['text-3'] : C.separator);
        tile(X, X + q * S - (thick ? 1 : 0), 9 * S, thick ? 2 : 1, thick ? C['text-3'] : C.separator);
      }
      for (var n = 1; n <= 9; n++) {
        var bx = X + (n - 1) * S, full = count[n] >= 9;
        block(bx + 2, PY, S - 4, 40, C.fill, 0, full ? 0.4 : 1);
        text(String(n), bx + S / 2, PY + 21, 20, full ? C['text-3'] : pencil ? C['text-2'] : C.text);
      }
    };
    g.over = function () { if (done) banner('Solved!', 'Pick a level for a new puzzle'); };
    g.reset();
    return g;
  }

  var MAKERS = { snake: Snake, bricks: Bricks, pong: Pong, gridfill: Gridfill, sudoku: Sudoku };

  /* ---------- wiring ---------- */
  function setup() {
    ready = true; cv = $('game-cv'); ctx = cv.getContext('2d');
    colours();
    new MutationObserver(function () { colours(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-palette', 'class', 'style'] });
    Array.prototype.forEach.call($('game-pick').children, function (b) { b.addEventListener('click', function () { pick(b.getAttribute('data-game')); }); });
    var down = false;
    function at(e, type) {
      var r = cv.getBoundingClientRect();
      if (!cur || !r.width) return;
      now = performance.now() / 1000;
      cur.pointer(type, (e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height, down, e.pointerType === 'mouse' ? 0 : 44);
      refresh();
    }
    cv.addEventListener('pointerdown', function (e) { down = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} at(e, 'down'); });
    cv.addEventListener('pointermove', function (e) { if (down || e.pointerType === 'mouse') at(e, 'move'); });
    cv.addEventListener('pointerup', function (e) { down = false; at(e, 'up'); });
    cv.addEventListener('pointercancel', function () { down = false; });
    // Runs before the app's own shortcuts, so game keys (space, arrows, digits) don't also start the timer or switch tabs.
    window.addEventListener('keydown', function (e) {
      if (!open || !cur || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.querySelector('dialog[open]')) return;
      if ((e.key === ' ' || e.key === 'Enter') && (tag === 'BUTTON' || tag === 'A')) return;
      now = performance.now() / 1000;
      if (cur.key(e.key, true)) { e.preventDefault(); refresh(); }
    }, true);
    window.addEventListener('keyup', function (e) { if (open && cur) cur.key(e.key, false); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && cur && cur.pause) { cur.pause(); draw(); } });
  }

  window.orbitGames = {
    init: function (s) { store = s; },
    show: function () {
      if (!ready) setup();
      open = true; colours(); now = performance.now() / 1000;
      pick(MAKERS[store.game()] ? store.game() : 'snake');
    },
    hide: function () {
      open = false; held = {};
      if (cur && cur.pause) cur.pause();
      if (raf) { cancelAnimationFrame(raf); raf = 0; } last = 0;
    }
  };
})();
