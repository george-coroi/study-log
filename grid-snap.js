// Exercise Book: round what CSS can't to whole 24px squares,
// so boxes, rows and buttons start and end on the page's square lines.
(function () {
  var U = 24, queued = false;
  var saved = new Map();   // element -> its own inline style before snapping, so it can be put back
  function mark(el) { if (!saved.has(el)) saved.set(el, el.style.cssText); return el; }
  var up = function (v) { return Math.ceil(v / U - 0.01) * U; };   // -0.01: ignore sub-pixel rounding
  // how far el's left/top edge is from the next square line of its pane (.main or .side)
  function off(el, side) {
    var pane = el.closest('.main, .side'), p = pane.getBoundingClientRect(), cs = getComputedStyle(pane), r = el.getBoundingClientRect();
    var v = side === 'top' ? r.top - p.top - parseFloat(cs.borderTopWidth) + pane.scrollTop : r.left - p.left - parseFloat(cs.borderLeftWidth) + pane.scrollLeft;
    return up(v) - v;
  }
  // layout items: push down with margin, re-measured until the edge sits on a line
  function nudgeDown(el) {
    mark(el).style.marginTop = '';
    // a margin can merge into the one above it; move that gap onto this item so the push always counts
    var prev = el.previousElementSibling;
    if (prev) {
      mark(prev).style.marginBottom = '';
      var pmb = parseFloat(getComputedStyle(prev).marginBottom);
      if (pmb > 0 && getComputedStyle(el.parentElement).display.indexOf('grid') < 0 && getComputedStyle(el.parentElement).display.indexOf('flex') < 0) {
        prev.style.marginBottom = '0px'; el.style.marginTop = Math.max(pmb, parseFloat(getComputedStyle(el).marginTop)) + 'px';
      }
    }
    for (var i = 0, d = off(el, 'top'); d > 0.5 && i < 4; i++, d = off(el, 'top')) {
      el.style.marginTop = (parseFloat(getComputedStyle(el).marginTop) + d) + 'px';
    }
  }
  function shiftButton(b) {
    mark(b).style.translate = '';
    var near = function (d) { return d > U / 2 ? d - U : d; };   // nearest line, up or down
    var dx = near(off(b, 'left')), dy = near(off(b, 'top'));
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) b.style.translate = dx + 'px ' + dy + 'px';
  }
  function run() {
    queued = false;
    // only the Exercise Book look, and not on phones: otherwise undo any snapping and stop
    if (document.documentElement.getAttribute('data-skin') !== 'book' || matchMedia('(max-width: 720px)').matches) {
      saved.forEach(function (css, el) { el.style.cssText = css; }); saved.clear();
      return;
    }
    var vis = function (sel) { return Array.prototype.filter.call(document.querySelectorAll(sel), function (e) { return e.getBoundingClientRect().width; }); };
    // 1. buttons: whole squares wide (at least 4 for a normal button, 2 for a tab)
    vis(':is(.main, .side) :is(.btn, .seg button, .tab)').forEach(function (b) {
      if (b.closest('.side .seg, #habit-days')) return;   // fixed sizes in CSS
      mark(b).style.width = '';
      b.style.width = Math.max(up(b.getBoundingClientRect().width), b.closest('.seg, .tabs') ? 2 * U : 4 * U) + 'px';
    });
    var boxes = function () {   // boxes: whole squares tall
      vis(':is(.main, .side) :is(.block, .trow)').forEach(function (el) { mark(el).style.minHeight = ''; el.style.minHeight = up(el.getBoundingClientRect().height) + 'px'; });
    };
    var stacked = function () {   // everything stacked down the page starts on a line (document order: outer before inner)
      vis('.main :is(:is(.stack, .grid12, .split, .page-head + *, .block, .block > form, details.add > form) > *, .block, .row-between, .sum, :is(div, section):has(> h2 + .block))').forEach(nudgeDown);
    };
    // heights and positions depend on each other, so settle them twice
    boxes(); stacked(); boxes(); stacked();
    // 2. buttons last, once everything around them has settled
    vis(':is(.main, .side) :is(.btn, .tab)').forEach(shiftButton);
  }
  function later() { if (!queued) { queued = true; requestAnimationFrame(run); } }
  addEventListener('resize', later);
  addEventListener('load', later);
  document.fonts && document.fonts.ready.then(later);
  new MutationObserver(later).observe(document.getElementById('app'), { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'class', 'aria-pressed'] });
  new MutationObserver(later).observe(document.documentElement, { attributes: true, attributeFilter: ['data-skin'] });
  later();
})();
