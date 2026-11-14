// Shared animal sprites (used by index.html and ascii-animals.html). Plain globals, no modules, so it works from file://.
// Sprite key: x = shaded body tile, w = highlight tile, b = dark tile (bodies, legs, pupils),
// e = accent tile (eyes, crest, spots). Each tile is a shaded square with a keyboard character on it.
// pal runs dark to light; pal[5] is the accent colour. seq is the order frames play in.
var SPRITES = {
  butterfly: { name: "Butterfly", pal: ["#0E2160", "#2752C4", "#3F7BF0", "#79A9FF", "#D2E4FF", "#FFD86B"], seq: [0, 0, 0, 1, 2, 1], frames: [[
    ".....b.....b.....",
    "xx....b...b....xx",
    "xxxx...b.b...xxxx",
    "xxxxxx..b..xxxxxx",
    "xxexxxx.b.xxxxexx",
    ".xxxxxxxbxxxxxxx.",
    "..xxwxxxbxxxwxx..",
    "...xxxxxbxxxxx...",
    "....xxx.b.xxx....",
    "...xxexxbxxexx...",
    "..xxxxxxbxxxxxx..",
    "..xxxx..b..xxxx..",
    "...xx.......xx..."], [
    "......b...b......",
    "....x..b.b..x....",
    "....xxx.b.xxx....",
    "....xxxxbxxxx....",
    "....xexxbxxex....",
    ".....xxxbxxx.....",
    ".....xwxbxwx.....",
    "......xxbxx......",
    "......x.b.x......",
    ".....xexbxex.....",
    ".....xxxbxxx.....",
    "......x.b.x......",
    "................."], [
    ".......b.b.......",
    "........b........",
    "........b........",
    ".......xbx.......",
    ".......xbx.......",
    ".......xbx.......",
    ".......wbw.......",
    ".......xbx.......",
    "........b........",
    ".......xbx.......",
    ".......xbx.......",
    "........b........",
    "................."]] },
  jellyfish: { name: "Jellyfish", pal: ["#3A1466", "#8A3FC2", "#D35DC2", "#FF94D8", "#FFE3F5", "#FFFFFF"], seq: [0, 1], frames: [[
    "....xxxxx....",
    "..xxwwxxxxx..",
    ".xxwxxxxxxxx.",
    ".xxxxexxxexx.",
    "xxxxxxxxxxxxx",
    "x.x.x.x.x.x.x",
    ".x..x.w.x..x.",
    "..x.x.w.x.x..",
    ".x...xwx...x.",
    "..x..x.x..x..",
    ".x..x...x..x.",
    "..x.......x.."], [
    ".............",
    "....xxxxx....",
    "..xxwwxxxxx..",
    ".xxwxexxexxx.",
    ".xxxxxxxxxxx.",
    "x.x.x.x.x.x.x",
    "x..x.xwx.x..x",
    ".x..x.w.x..x.",
    "x...x.w.x...x",
    ".x...xxx...x.",
    "..x..x.x..x..",
    "............."]] },
  dragonfly: { name: "Dragonfly", pal: ["#073D35", "#109C7C", "#2ED6A0", "#8CF5CF", "#E6FFF6", "#62D8FF"], seq: [0, 1], frames: [[
    "........ww...ww....",
    ".......wxx..wxx....",
    "........xxx..xxx...",
    ".........xx...xx.ee",
    "bbbbbbbbbbbbbbbbbbe",
    ".........xx...xx.ee",
    "........xxx..xxx...",
    ".......wxx..wxx....",
    "........ww...ww...."], [
    "...................",
    "...................",
    "........wx...wx....",
    ".........xx...xx.ee",
    "bbbbbbbbbbbbbbbbbbe",
    ".........xx...xx.ee",
    "........wx...wx....",
    "...................",
    "..................."]] },
  koi: { name: "Koi", pal: ["#4A1206", "#E04A1A", "#FF7A2F", "#FFC08A", "#FFF6EE", "#E8331C"], seq: [0, 1], frames: [[
    "...........xx.......",
    "xx........xxx.......",
    "xxx..xxxxwwxxxxxxe..",
    ".xxxxxxwwxxxxwwxxxxx",
    "xxx..xxxxwwxxxxxxe..",
    "xx........xxx.......",
    "...........xx......."], [
    "..........xx........",
    ".xx.......xxx.......",
    "xx...xxxxwwxxxxxxe..",
    ".xxxxxxwwxxxxwwxxxxx",
    "xxxx.xxxxwwxxxxxxe..",
    "xxx.......xxx.......",
    "..........xx........"]] },
  frog: { name: "Frog", pal: ["#103A12", "#348A2A", "#6CC23F", "#B4EC6E", "#F1FFD6", "#FFE14D"], seq: [0, 1], frames: [[
    "..ee.....ee..",
    ".xebx...xbex.",
    ".xxxxxxxxxxx.",
    "xxxxxxxxxxxxx",
    "xxxbbbbbbbxxx",
    ".xxwwwwwwwxx.",
    "xx.xwwwwwx.xx",
    "xxx.xxxxx.xxx",
    "x.x.......x.x"], [
    "..ee.....ee..",
    ".xebx...xbex.",
    ".xxxxxxxxxxx.",
    "..xxxxxxxxx..",
    "..xbbbbbbbx..",
    "..xwwwwwwwx..",
    "...xwwwwwx...",
    "..xx.....xx..",
    ".xx.......xx."]] },
  crane: { name: "Crane", pal: ["#2A3046", "#7D88A6", "#C9D0E0", "#F2F5FA", "#FFFFFF", "#FF4A3D"], seq: [0, 1, 2, 1], frames: [[
    ".....bb..............",
    "......bxx............",
    ".......xwx...........",
    "........xwx..........",
    "bbbb..xxxwwwxxxxxxeb.",
    "........xxxxx........",
    ".....................",
    "....................."], [
    ".....................",
    ".....................",
    "....bbxxxwx..........",
    "......xxwwx..........",
    "bbbb..xxxwwwxxxxxxeb.",
    "........xxxxx........",
    ".....................",
    "....................."], [
    ".....................",
    ".....................",
    ".....................",
    ".....................",
    "bbbb..xxxwwwxxxxxxeb.",
    ".......xxwwx.........",
    "......bbxwx..........",
    ".....bb.............."]] },
  crab: { name: "Crab", pal: ["#4A0C08", "#B4231A", "#EE4A34", "#FF9474", "#FFE3D8", "#FFFFFF"], seq: [0, 1], frames: [[
    ".xx.........xx.",
    "xx.x..e.e..x.xx",
    "xxx...b.b...xxx",
    ".xx.xxxxxxx.xx.",
    "...xxwxxxwxx...",
    "..xxxxxxxxxxx..",
    ".x.xxxxxxxxx.x.",
    "x.x.x.....x.x.x"], [
    "xx...........xx",
    "x.x...e.e...x.x",
    "xxx...b.b...xxx",
    ".xx.xxxxxxx.xx.",
    "...xxwxxxwxx...",
    "..xxxxxxxxxxx..",
    "x.xxxxxxxxxxx.x",
    ".x.x.......x.x."]] }
};
var ORDER = ["butterfly", "jellyfish", "dragonfly", "koi", "frog", "crane", "crab"];
var COUNT = { butterfly: 12, jellyfish: 8, dragonfly: 7, koi: 7, frog: 6, crane: 5, crab: 6 };
var SIZES = [6, 8, 10, 12];
var CHARS = ".:-=+*#%@/\\|<>01{}[]";
var TYPE = { x: 0, w: 1, b: 2, e: 3, f: 4 };   // f = see-through fin

// ---- Smooth animation: in-between frames are generated, not hand-drawn ----
var RANK = { ".": 0, f: 1, x: 2, w: 3, e: 4, b: 5 };
function grid(w, h) { var g = []; for (var y = 0; y < h; y++) g.push(new Array(w).fill(".")); return g; }
function put(g, x, y, ch, force) {
  x = Math.round(x); y = Math.round(y);
  if (y < 0 || y >= g.length || x < 0 || x >= g[0].length) return;
  if (force || RANK[ch] >= RANK[g[y][x]]) g[y][x] = ch;
}
function rowsOf(g) { return g.map(function (r) { return r.join(""); }); }
function loop(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }

// Butterfly: wings fold toward the body and open again; they rest open longer than closed.
function genButterfly(open, N) {
  var cx = 8;
  return loop(N).map(function (i) {
    var f = 0.1 + 0.9 * Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * i / N), 0.7);
    var g = grid(open[0].length, open.length);
    open.forEach(function (r, y) {
      for (var x = 0; x < r.length; x++) {
        var ch = r.charAt(x); if (ch === ".") continue;
        if (ch === "b" || x === cx) { put(g, x, y, ch, true); continue; }
        var nx = Math.round(cx + (x - cx) * f);
        put(g, x < cx ? Math.min(cx - 1, nx) : Math.max(cx + 1, nx), y, ch);
      }
    });
    return rowsOf(g);
  });
}

// Dragonfly: wings flick up and down around the body line.
function genDragonfly(base, N) {
  var by = 4;
  return loop(N).map(function (i) {
    var f = 0.3 + 0.7 * (0.5 + 0.5 * Math.cos(2 * Math.PI * i / N)), g = grid(base[0].length, base.length);
    base.forEach(function (r, y) {
      for (var x = 0; x < r.length; x++) {
        var ch = r.charAt(x); if (ch === ".") continue;
        if (y === by || ch === "e") put(g, x, y, ch, true); else put(g, x, by + (y - by) * f, ch);
      }
    });
    return rowsOf(g);
  });
}

// Jellyfish: the bell squeezes tall and narrow, then relaxes wide; tentacles wave with a lag down their length.
function genJelly(N) {
  var W = 15, H = 18, cx = 7;
  return loop(N).map(function (i) {
    var p = i / N, s = 0.5 + 0.5 * Math.sin(2 * Math.PI * p);       // 1 = relaxed, 0 = squeezed
    var rx = 4.6 + 2.2 * s, ry = 5.2 - 1.4 * s, by = 0.5 + ry, g = grid(W, H);
    for (var y = 0; y <= Math.ceil(by); y++) for (var x = 0; x < W; x++) {
      var nx = (x - cx) / rx, ny = (y - by) / ry;
      if (nx * nx + ny * ny <= 1) put(g, x, y, nx < -0.25 && ny < -0.45 ? "w" : "x", true);
    }
    put(g, cx - 2, by - 1.5, "e", true); put(g, cx + 2, by - 1.5, "e", true);
    var rimY = Math.round(by) + 1;
    for (var rx2 = Math.ceil(cx - rx); rx2 <= cx + rx; rx2++) if ((rx2 + i) % 2 === 0) put(g, rx2, rimY, "x");   // frill ripples
    var len = 9 + Math.round(2 * s);
    [-2, -1, 0, 1, 2].forEach(function (k) {
      var x0 = cx + k * rx * 0.38;
      for (var j = 1; j <= len; j++) put(g, x0 + Math.sin(2 * Math.PI * p - j * 0.55 + k) * (0.3 + j * 0.13), rimY + j, k === 0 ? "w" : "x");
    });
    return rowsOf(g);
  });
}

// Koi (seen from above, facing right): white body with orange patches and a red head,
// a wave that grows toward the tail, flowing see-through tail and fins.
function genKoi(N) {
  var W = 26, H = 13, cy = 6;
  function spine(u, p) { return { x: 23 - u * 16, y: cy + (0.1 + 1.15 * u * u) * Math.sin(2 * Math.PI * p - u * 3.2) }; }
  return loop(N).map(function (i) {
    var p = i / N, g = grid(W, H), pect = null;
    for (var u = 0; u <= 1.0001; u += 0.01) {
      var c = spine(u, p);
      var hw = u < 0.12 ? 1.3 + u / 0.12 * 1.4 : 2.7 * Math.pow(Math.max(0, 1 - (u - 0.12) / 0.88), 0.85) + 0.35;
      for (var dy = -hw; dy <= hw + 0.001; dy += 0.5) {
        var ch = "w";
        if (u < 0.2 && Math.abs(dy) < hw * 0.8) ch = "e";                 // red head
        else if (u > 0.34 && u < 0.52 && dy > -hw * 0.3) ch = "x";        // orange patches
        else if (u > 0.6 && u < 0.76 && dy < hw * 0.4) ch = "x";
        put(g, c.x, c.y + dy, ch, true);
      }
      if (Math.abs(u - 0.06) < 0.0051) { put(g, c.x, c.y - 1.4, "b", true); put(g, c.x, c.y + 1.4, "b", true); }
      if (Math.abs(u - 0.24) < 0.0051) pect = { x: c.x, y: c.y, hw: hw };
    }
    for (var v = 0; v <= 1.0001; v += 0.1) {                             // tail fan carries the wave on
      var t2 = spine(1 + v * 0.28, p), spread = 0.5 + 2.0 * v;
      for (var d2 = -spread; d2 <= spread + 0.001; d2 += 0.5) if (!(v > 0.5 && Math.abs(d2) < spread * 0.4)) put(g, t2.x, t2.y + d2, "f");   // forked tail
    }
    var flap = 0.6 + 0.4 * Math.sin(2 * Math.PI * p);                      // pectoral fins paddle
    for (var j = 1; j <= 3; j++) [-1, 1].forEach(function (side) {
      var fy = pect.y + side * (pect.hw + j * flap * 0.8);
      put(g, pect.x - j * 0.9, fy, "f"); put(g, pect.x - j * 0.9 + 1, fy, "f");
    });
    return rowsOf(g);
  });
}

// Crane: a full wing that sweeps up and down from the shoulder, black tips last.
function genCrane(body, N) {
  return loop(N).map(function (i) {
    var th = Math.sin(2 * Math.PI * i / N) * 1.15, g = grid(body[0].length, 11);
    body.forEach(function (r, y) { for (var x = 0; x < r.length; x++) if (r.charAt(x) !== ".") put(g, x, y + 5, r.charAt(x), true); });
    for (var d = 0; d <= 6; d += 0.5) {
      var x = 10 - d * (0.35 + 0.25 * (1 - Math.abs(Math.sin(th)))), y = 5 - d * Math.sin(th);
      var ch = d >= 4.8 ? "b" : d < 2 ? "w" : "x";
      put(g, x, y, ch); put(g, x + 1, y, ch);
    }
    return rowsOf(g);
  });
}

SPRITES.butterfly.frames = genButterfly(SPRITES.butterfly.frames[0], 12);
SPRITES.dragonfly.frames = genDragonfly(SPRITES.dragonfly.frames[0], 8);
SPRITES.jellyfish.frames = genJelly(16);
SPRITES.koi.frames = genKoi(12);
SPRITES.crane.frames = genCrane([SPRITES.crane.frames[1][4], SPRITES.crane.frames[1][5]], 12);
["butterfly", "dragonfly", "jellyfish", "koi", "crane"].forEach(function (k) { SPRITES[k].seq = loop(SPRITES[k].frames.length); });


// Pre-compute lit cells: type plus distance from the centre (edges render lighter).
ORDER.forEach(function (k) {
  var sp = SPRITES[k];
  sp.h = 0; sp.w = 0;
  sp.frames.forEach(function (rows) { sp.h = Math.max(sp.h, rows.length); rows.forEach(function (r) { sp.w = Math.max(sp.w, r.length); }); });
  sp.cells = sp.frames.map(function (rows) {
    var out = [], mx = (sp.w - 1) / 2, my = (sp.h - 1) / 2;
    rows.forEach(function (r, y) {
      for (var x = 0; x < r.length; x++) {
        var t = TYPE[r.charAt(x)]; if (t === undefined) continue;
        var edge = Math.hypot((x - mx) / (mx || 1), (y - my) / (my || 1)) / 1.41;
        out.push({ x: x, y: y, type: t, edge: edge });
      }
    });
    return out;
  });
});
// Frame for a running cycle counter, following the sprite's play order.
function cyc(o, n) { var q = SPRITES[o.k].seq; return q[Math.floor(n) % q.length]; }
