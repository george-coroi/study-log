/* Orbit games for breaks: Snake, Bricks, Pong, Gridfill and Sudoku.
   One canvas, drawn in the current theme colours. The animation loop only runs while a game is moving
   and the Games tab is open, so it costs nothing the rest of the time. */
(function () {
  'use strict';
  var cv, ctx, W = 0, H = 0, cur = null, id = '', raf = 0, last = 0, open = false, store = null, ready = false;
  var C = {}, held = {}, games = {}, shown = {};
  function $(i) { return document.getElementById(i); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

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
  function banner(title, sub) {
    ctx.globalAlpha = 0.86; tile(0, H / 2 - 42, W, 84, C.bg); ctx.globalAlpha = 1;
    text(title, W / 2, H / 2 - 12, 22, C.text); text(sub, W / 2, H / 2 + 16, 12, C['text-3']);
  }
  function save(v) { if (v > store.best(id)) store.save(id, v); }

  /* ---------- loop and screen ---------- */
  function draw() {
    if (!cur) return;
    ctx.clearRect(0, 0, W, H);
    cur.draw();
    var s = String(cur.score()), b = 'Best ' + store.best(id);
    if (shown.s !== s) $('game-score').textContent = shown.s = s;
    if (shown.b !== b) $('game-best').textContent = shown.b = b;
  }
  function tick(t) {
    raf = 0;
    if (!open || !cur) return;
    var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
    if (cur.update) cur.update(dt);
    draw();
    if (cur.live()) raf = requestAnimationFrame(tick); else last = 0;
  }
  function refresh() { draw(); if (open && !raf && cur && cur.live()) { last = 0; raf = requestAnimationFrame(tick); } }
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
    held = {}; id = name; cur = games[name] || (games[name] = MAKERS[name]());
    store.setGame(name);
    Array.prototype.forEach.call($('game-pick').children, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-game') === name)); });
    $('game-help').textContent = cur.help;
    size(cur.w, cur.h); shown = {}; buttons(); refresh();
  }

  /* ---------- shared: start, pause, game over ---------- */
  function machine(g, onStart) {
    g.state = 'ready';
    g.live = function () { return g.state === 'play'; };
    g.pause = function () { if (g.state === 'play') g.state = 'paused'; };
    g.go = function () {
      if (g.state === 'play') { g.state = 'paused'; return; }
      if (g.state === 'over') g.reset();
      g.state = 'play'; if (onStart) onStart();
    };
    g.overlay = function (name, how) {
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

  /* ---------- Snake ---------- */
  function Snake() {
    var N = 20, S = 16, g = { w: N * S, h: N * S, help: 'Arrow keys or WASD, or swipe on the board. Space or tap to start and pause.' };
    var body, dir, queue, food, acc, score, step, sx = 0, sy = 0;
    machine(g);
    g.reset = function () { body = [[10, 10], [9, 10], [8, 10]]; dir = [1, 0]; queue = []; acc = 0; score = 0; step = 0.12; g.state = 'ready'; place(); };
    function hit(p) { return function (b) { return b[0] === p[0] && b[1] === p[1]; }; }
    function place() { do { food = [rnd(N), rnd(N)]; } while (body.some(hit(food))); }
    g.score = function () { return score; };
    g.endText = function () { return 'Game over: ' + score; };
    g.update = function (dt) { acc += dt; while (acc >= step && g.state === 'play') { acc -= step; move(); } };
    function move() {
      if (queue.length) dir = queue.shift();
      var h = [body[0][0] + dir[0], body[0][1] + dir[1]], eat = h[0] === food[0] && h[1] === food[1];
      if (h[0] < 0 || h[1] < 0 || h[0] >= N || h[1] >= N || body.slice(0, eat ? body.length : body.length - 1).some(hit(h))) { g.state = 'over'; save(score); return; }
      body.unshift(h);
      if (eat) { score++; step = Math.max(0.06, step * 0.97); place(); } else body.pop();
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
      tile(food[0] * S + 2, food[1] * S + 2, S - 4, S - 4, C.subj[3]);
      body.forEach(function (b, i) { tile(b[0] * S + 1, b[1] * S + 1, S - 2, S - 2, i ? C.accent : C.text); });
      g.overlay('Snake', 'Press an arrow key or swipe to start');
    };
    g.reset();
    return g;
  }

  /* ---------- Bricks ---------- */
  function Bricks() {
    var COLS = 8, ROWS = 6, BW = 36, BH = 12, GAP = 4, TOP = 44, PW = 60, PH = 8, R = 5;
    var g = { w: COLS * (BW + GAP) + GAP, h: 430, help: 'Move with the mouse, a finger or the arrow keys. Space or tap to launch the ball. Three lives.' };
    var PY = g.h - 30, px, ball, bricks, lives, score, level, stuck;
    machine(g, function () { if (stuck) launch(); });
    g.reset = function () { lives = 3; score = 0; level = 1; build(); serve(); g.state = 'ready'; };
    function build() {
      bricks = [];
      for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) bricks.push({ x: GAP + c * (BW + GAP), y: TOP + r * (BH + GAP), c: r, on: true });
    }
    function serve() { px = g.w / 2; stuck = true; ball = { x: px, y: PY - R, vx: 0, vy: 0 }; }
    function launch() { var sp = 250 + 30 * (level - 1); stuck = false; ball.vx = sp * 0.5 * (Math.random() < 0.5 ? -1 : 1); ball.vy = -sp * 0.87; }
    g.score = function () { return score + '  ' + '♥'.repeat(lives); };
    g.endText = function () { return 'Game over: ' + score; };
    g.update = function (dt) {
      var mv = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      if (mv) px = clamp(px + mv * 380 * dt, PW / 2, g.w - PW / 2);
      if (stuck) { ball.x = px; return; }
      for (var s = 0; s < 3 && g.state === 'play'; s++) step(dt / 3);
    };
    function step(dt) {
      var ox = ball.x, oy = ball.y;
      ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx); }
      if (ball.x > g.w - R) { ball.x = g.w - R; ball.vx = -Math.abs(ball.vx); }
      if (ball.y < R) { ball.y = R; ball.vy = Math.abs(ball.vy); }
      if (ball.y > g.h + R) {
        lives--;
        if (lives <= 0) { g.state = 'over'; save(score); } else serve();
        return;
      }
      if (ball.vy > 0 && ball.y + R >= PY && oy + R <= PY + 2 && Math.abs(ball.x - px) <= PW / 2 + R) { ball.y = PY - R; bounce(ball, px, PW, true); }
      for (var i = 0; i < bricks.length; i++) {
        var b = bricks[i];
        if (!b.on || ball.x + R < b.x || ball.x - R > b.x + BW || ball.y + R < b.y || ball.y - R > b.y + BH) continue;
        b.on = false; score += 10;
        if (oy + R <= b.y || oy - R >= b.y + BH) ball.vy = -ball.vy; else ball.vx = -ball.vx;
        ball.x = ox; ball.y = oy;
        break;
      }
      if (!bricks.some(function (b) { return b.on; })) { level++; build(); serve(); }
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
    g.buttons = [['Restart', function () { g.reset(); }]];
    g.draw = function () {
      bricks.forEach(function (b) { if (b.on) tile(b.x, b.y, BW, BH, C.subj[b.c % 6]); });
      tile(px - PW / 2, PY, PW, PH, C.text);
      tile(ball.x - R, ball.y - R, R * 2, R * 2, C.accent);
      text('Level ' + level, g.w / 2, 20, 12, C['text-3']);
      g.overlay('Bricks', 'Tap or press space to launch');
    };
    g.reset();
    return g;
  }

  /* ---------- Pong (you at the bottom, the computer at the top) ---------- */
  function Pong() {
    var g = { w: 300, h: 430, help: 'Move with the mouse, a finger or the arrow keys. First to 7 wins. Best counts your wins.' };
    var PW = 64, PH = 8, R = 5, YOU = g.h - 26, CPU = 18, px, cx, ball, you, cpu, toYou, wait;
    machine(g);
    g.reset = function () { you = 0; cpu = 0; px = cx = g.w / 2; toYou = true; serve(); g.state = 'ready'; };
    function serve() { ball = { x: g.w / 2, y: g.h / 2, vx: (Math.random() - 0.5) * 160, vy: (toYou ? 1 : -1) * 230 }; wait = 0.8; }
    g.score = function () { return 'You ' + you + '  ·  ' + cpu + ' CPU'; };
    g.endText = function () { return you > cpu ? 'You win ' + you + '–' + cpu : 'CPU wins ' + cpu + '–' + you; };
    g.update = function (dt) {
      var mv = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      if (mv) px = clamp(px + mv * 380 * dt, PW / 2, g.w - PW / 2);
      var target = ball.vy < 0 ? ball.x : g.w / 2;
      cx += clamp(target - cx, -210 * dt, 210 * dt); cx = clamp(cx, PW / 2, g.w - PW / 2);
      if (wait > 0) { wait -= dt; return; }
      for (var s = 0; s < 3 && g.state === 'play'; s++) step(dt / 3);
    };
    function step(dt) {
      var oy = ball.y;
      ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx); }
      if (ball.x > g.w - R) { ball.x = g.w - R; ball.vx = -Math.abs(ball.vx); }
      if (ball.vy > 0 && ball.y + R >= YOU && oy + R <= YOU + 2 && Math.abs(ball.x - px) <= PW / 2 + R) { ball.y = YOU - R; bounce(ball, px, PW, true); }
      if (ball.vy < 0 && ball.y - R <= CPU + PH && oy - R >= CPU + PH - 2 && Math.abs(ball.x - cx) <= PW / 2 + R) { ball.y = CPU + PH + R; bounce(ball, cx, PW, false); }
      if (ball.y > g.h + R || ball.y < -R) {
        if (ball.y < 0) you++; else cpu++;
        toYou = ball.y < 0;
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
      if (type === 'move' && g.state === 'play') px = clamp(x, PW / 2, g.w - PW / 2);
      if (type === 'down') { if (g.state !== 'play') g.go(); px = clamp(x, PW / 2, g.w - PW / 2); }
    };
    g.buttons = [['Restart', function () { g.reset(); }]];
    g.draw = function () {
      for (var x = 4; x < g.w; x += 16) tile(x, g.h / 2 - 1, 8, 2, C.separator);
      tile(cx - PW / 2, CPU, PW, PH, C.subj[3]);
      tile(px - PW / 2, YOU, PW, PH, C.text);
      tile(ball.x - R, ball.y - R, R * 2, R * 2, C.accent);
      g.overlay('Pong', 'Tap or press space to start');
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
    var g = { w: N * CELL + 16, h: TY + 96, help: 'Drag a piece onto the board, or tap a piece and then a square. Fill a whole row or column to clear it.' };
    var board, tray, sel, drag, pos, score, over;
    g.reset = function () { board = []; for (var i = 0; i < N * N; i++) board.push(-1); score = 0; over = false; sel = -1; drag = false; deal(); };
    function deal() { tray = [0, 1, 2].map(function () { var s = SHAPES[rnd(SHAPES.length)]; return { s: s, c: rnd(6) }; }); }
    function fits(s, r, c) {
      return s.cells.every(function (p) { var rr = r + p[0], cc = c + p[1]; return rr >= 0 && cc >= 0 && rr < N && cc < N && board[rr * N + cc] < 0; });
    }
    function anyFit(s) { for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (fits(s, r, c)) return true; return false; }
    function spot(x, y, s, lift) { return [Math.round((y - lift - s.rows * CELL / 2 - BY) / CELL), Math.round((x - s.cols * CELL / 2 - BX) / CELL)]; }
    function drop(x, y, lift) {
      var t = tray[sel], at = spot(x, y, t.s, lift);
      if (!fits(t.s, at[0], at[1])) return false;
      t.s.cells.forEach(function (p) { board[(at[0] + p[0]) * N + at[1] + p[1]] = t.c; });
      score += t.s.cells.length; tray[sel] = null; sel = -1;
      var full = [];
      for (var i = 0; i < N; i++) {
        var row = true, col = true;
        for (var j = 0; j < N; j++) { if (board[i * N + j] < 0) row = false; if (board[j * N + i] < 0) col = false; }
        if (row) for (j = 0; j < N; j++) full.push(i * N + j);
        if (col) for (j = 0; j < N; j++) full.push(j * N + i);
      }
      var lines = full.length ? Math.round(full.length / N) : 0;
      full.forEach(function (k) { board[k] = -1; });
      score += lines * lines * 10;
      if (tray.every(function (t) { return !t; })) deal();
      if (!tray.some(function (t) { return t && anyFit(t.s); })) { over = true; save(score); }
      return true;
    }
    g.live = function () { return false; };
    g.score = function () { return score; };
    g.key = function () { return false; };
    g.pointer = function (type, x, y, isDown, lift) {
      if (over) { if (type === 'down') g.reset(); return; }
      pos = [x, y, lift];
      if (type === 'down') {
        if (y >= TY) { var i = clamp(Math.floor(x / SLOT), 0, 2); if (tray[i]) { sel = i; drag = true; } return; }
        if (sel >= 0) drop(x, y, 0);
      } else if (type === 'up' && drag) {
        drag = false;
        if (y < TY - 4 && drop(x, y, lift)) return;
      }
    };
    g.buttons = [['Restart', function () { g.reset(); }]];
    g.draw = function () {
      for (var i = 0; i < N * N; i++) {
        var x = BX + (i % N) * CELL, y = BY + Math.floor(i / N) * CELL;
        tile(x + 1, y + 1, CELL - 2, CELL - 2, board[i] < 0 ? C.fill : C.subj[board[i]]);
      }
      if (sel >= 0 && pos && drag) {
        var t = tray[sel], at = spot(pos[0], pos[1], t.s, pos[2]);
        if (fits(t.s, at[0], at[1])) {
          ctx.globalAlpha = 0.35;
          t.s.cells.forEach(function (p) { tile(BX + (at[1] + p[1]) * CELL + 1, BY + (at[0] + p[0]) * CELL + 1, CELL - 2, CELL - 2, C.subj[t.c]); });
          ctx.globalAlpha = 1;
        }
      }
      tray.forEach(function (t, i) {
        if (!t || (drag && i === sel)) return;
        var cx = i * SLOT + SLOT / 2, cy = TY + 44, ok = anyFit(t.s);
        if (i === sel) tile(i * SLOT + 4, TY, SLOT - 8, 88, C.fill);
        ctx.globalAlpha = ok ? 1 : 0.3;
        t.s.cells.forEach(function (p) { tile(cx - t.s.cols * MINI / 2 + p[1] * MINI + 1, cy - t.s.rows * MINI / 2 + p[0] * MINI + 1, MINI - 2, MINI - 2, C.subj[t.c]); });
        ctx.globalAlpha = 1;
      });
      if (drag && pos) {
        var d = tray[sel], ox = pos[0] - d.s.cols * CELL / 2, oy = pos[1] - pos[2] - d.s.rows * CELL / 2;
        ctx.globalAlpha = 0.9;
        d.s.cells.forEach(function (p) { tile(ox + p[1] * CELL + 1, oy + p[0] * CELL + 1, CELL - 2, CELL - 2, C.subj[d.c]); });
        ctx.globalAlpha = 1;
      }
      if (over) banner('No moves left: ' + score, 'Tap to play again');
    };
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
    var LEVELS = [['Easy', 40], ['Medium', 32], ['Hard', 26]], lvl = 0, pz, val, notes, selI, pencil = false, done;
    g.reset = function () { pz = makeSudoku(LEVELS[lvl][1]); val = pz.given.slice(); notes = val.map(function () { return 0; }); selI = 40; done = false; };
    g.live = function () { return false; };
    g.score = function () { return LEVELS[lvl][0] + (done ? '  ·  Solved!' : ''); };
    function put(d) {
      if (done || pz.given[selI]) return;
      if (pencil && d) { if (!val[selI]) notes[selI] ^= 1 << d; return; }
      val[selI] = d; notes[selI] = 0;
      if (val.every(function (v, i) { return v === pz.sol[i]; })) { done = true; store.save(id, store.best(id) + 1); }
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
      for (var i = 0; i < 81; i++) {
        var r = Math.floor(i / 9), c = i % 9, x = X + c * S, y = X + r * S;
        if (i === selI) tile(x, y, S, S, C.accent);
        else if (r === sr || c === sc || (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3)) || (sv && val[i] === sv)) tile(x, y, S, S, C.fill);
        if (val[i]) {
          if (val[i] === pz.sol[i]) count[val[i]]++;
          var col = i === selI ? C.bg : pz.given[i] ? C.text : val[i] !== pz.sol[i] ? C.danger : C.accent;
          text(String(val[i]), x + S / 2, y + S / 2 + 1, 20, col);
        } else if (notes[i]) {
          for (var d = 1; d <= 9; d++) if (notes[i] >> d & 1) text(String(d), x + 7 + ((d - 1) % 3) * 11, y + 7 + Math.floor((d - 1) / 3) * 11, 9, i === selI ? C.bg : C['text-3']);
        }
      }
      for (var k = 0; k <= 9; k++) {
        var thick = k % 3 === 0;
        tile(X + k * S - (thick ? 1 : 0), X, thick ? 2 : 1, 9 * S, thick ? C['text-3'] : C.separator);
        tile(X, X + k * S - (thick ? 1 : 0), 9 * S, thick ? 2 : 1, thick ? C['text-3'] : C.separator);
      }
      for (var n = 1; n <= 9; n++) {
        var bx = X + (n - 1) * S;
        tile(bx + 2, PY, S - 4, 40, C.fill);
        text(String(n), bx + S / 2, PY + 21, 20, count[n] >= 9 ? C['text-3'] : pencil ? C['text-2'] : C.text);
      }
      if (done) banner('Solved!', 'Pick a level for a new puzzle');
    };
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
      if (cur.key(e.key, true)) { e.preventDefault(); refresh(); }
    }, true);
    window.addEventListener('keyup', function (e) { if (open && cur) cur.key(e.key, false); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && cur && cur.pause) { cur.pause(); draw(); } });
  }

  window.orbitGames = {
    init: function (s) { store = s; },
    show: function () {
      if (!ready) setup();
      open = true; colours();
      pick(MAKERS[store.game()] ? store.game() : 'snake');
    },
    hide: function () {
      open = false; held = {};
      if (cur && cur.pause) cur.pause();
      if (raf) { cancelAnimationFrame(raf); raf = 0; } last = 0;
    }
  };
})();
