/* Daily Japanese flashcards for the Nightly Technical Prep page.
   Loads japanese-deck.json (built by build_deck.py) and shows 15 vocab + 15 grammar cards.
   Cards come from a fixed shuffle of the whole deck, sliced by day, so every card is seen
   once before any repeats. The answer side is only shown when a card is clicked. */
(function () {
  var PER_DAY = 15;
  var SEED = 20261007;

  var css = '' +
    '.jp{margin-top:32px;display:flex;flex-direction:column;gap:14px}' +
    '.jp h2{font-family:var(--font-display,Georgia,serif);font-weight:600;font-size:1.6rem;margin:0;text-wrap:balance}' +
    '.jp h3{font-family:var(--font-mono,ui-monospace,monospace);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:10px 0 0;font-weight:500}' +
    '.jp .sub{color:var(--muted);font-size:14px;margin:0}' +
    '.jp .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,13.5rem),1fr));gap:12px}' +
    '.jp .card{font:inherit;color:var(--fg);text-align:left;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:14px;min-height:8.5rem;cursor:pointer;display:flex;flex-direction:column;gap:6px;min-width:0;overflow-wrap:anywhere}' +
    '.jp .card:focus-visible{outline:3px solid var(--accent);outline-offset:2px}' +
    '.jp .card.flipped{background:var(--answer-bg);border-color:var(--accent)}' +
    '.jp .n{font-family:var(--font-mono,ui-monospace,monospace);font-size:12px;color:var(--muted)}' +
    '.jp .front{font-family:"Noto Serif JP",var(--font-display,serif);font-size:1.5rem;line-height:1.3;font-weight:600}' +
    '.jp .g .front{font-size:1.2rem}' +
    '.jp .hint{margin-top:auto;font-size:13px;color:var(--accent);font-weight:600}' +
    '.jp [hidden]{display:none!important}' +
    '.jp .back{display:flex;flex-direction:column;gap:6px;font-size:14.5px}' +
    '.jp .back .rd{font-family:"Noto Serif JP",serif;color:var(--muted)}' +
    '.jp .back .mn{font-weight:600}' +
    '.jp .back .ex,.jp .back .cj{font-size:13.5px;color:var(--muted)}' +
    '.jp .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}' +
    '.jp .row .t{font-family:var(--font-mono,ui-monospace,monospace);font-size:13px}' +
    '.jp .reset{font:inherit;font-size:14px;background:none;border:1px solid var(--line);color:var(--fg);border-radius:8px;padding:6px 12px;cursor:pointer}';

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function pick(list, day, salt) {
    var order = list.map(function (_, i) { return i; });
    var rnd = mulberry32(SEED + salt);
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t;
    }
    var out = [], start = (day * PER_DAY) % order.length;
    for (var k = 0; k < Math.min(PER_DAY, order.length); k++) out.push(list[order[(start + k) % order.length]]);
    return out;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function quizDate() {
    try { if (typeof QUIZ !== 'undefined' && QUIZ.date) return QUIZ.date; } catch (e) {}
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function init() {
    var mount = document.getElementById('jp-flashcards');
    if (!mount) {
      mount = el('section'); mount.id = 'jp-flashcards';
      var done = document.querySelector('.done');
      if (done) done.parentNode.insertBefore(mount, done);
      else (document.querySelector('.wrap') || document.body).appendChild(mount);
    }
    var style = el('style'); style.textContent = css; document.head.appendChild(style);
    mount.className = 'jp';
    mount.appendChild(el('h2', '', 'Japanese flashcards'));
    var sub = el('p', 'sub', 'Loading today’s cards…'); mount.appendChild(sub);

    fetch('japanese-deck.json').then(function (r) {
      if (!r.ok) throw new Error(r.status); return r.json();
    }).then(function (deck) {
      var date = quizDate();
      var day = Math.floor(Date.parse(date + 'T00:00:00Z') / 864e5);
      var vocab = pick(deck.vocab, day, 1), grammar = pick(deck.grammar, day, 2);
      var total = vocab.length + grammar.length, flipped = new Set();
      sub.textContent = vocab.length + ' vocabulary words and ' + grammar.length + ' grammar points from your notes. Tap a card to reveal the answer.';

      var row = el('div', 'row');
      var count = el('span', 't', '0 / ' + total + ' revealed');
      var reset = el('button', 'reset', 'Hide all answers'); reset.type = 'button';
      row.appendChild(count); row.appendChild(reset); mount.appendChild(row);

      function update() { count.textContent = flipped.size + ' / ' + total + ' revealed'; }

      function addSection(title, items, kind) {
        mount.appendChild(el('h3', '', title));
        var grid = el('div', 'grid'); mount.appendChild(grid);
        items.forEach(function (c, i) {
          var id = kind + i;
          var b = el('button', 'card ' + kind); b.type = 'button'; b.setAttribute('aria-expanded', 'false');
          b.appendChild(el('span', 'n', (kind === 'v' ? 'Vocab ' : 'Grammar ') + (i + 1)));
          b.appendChild(el('span', 'front', kind === 'v' ? c.word : c.pattern));
          var hint = el('span', 'hint', 'Show meaning'); b.appendChild(hint);
          var back = el('span', 'back'); back.hidden = true;
          if (kind === 'v') {
            if (c.reading) back.appendChild(el('span', 'rd', c.reading));
            back.appendChild(el('span', 'mn', c.meaning));
          } else {
            back.appendChild(el('span', 'mn', c.meaning));
            if (c.conjugation) back.appendChild(el('span', 'cj', 'Form: ' + c.conjugation));
          }
          if (c.example) back.appendChild(el('span', 'ex', c.example));
          b.appendChild(back);
          b.addEventListener('click', function () {
            var open = back.hidden;
            back.hidden = !open; hint.hidden = open;
            b.classList.toggle('flipped', open); b.setAttribute('aria-expanded', String(open));
            if (open) flipped.add(id);
            update();
          });
          grid.appendChild(b);
        });
      }
      addSection('Vocabulary', vocab, 'v');
      addSection('Grammar', grammar, 'g');

      reset.addEventListener('click', function () {
        mount.querySelectorAll('.card').forEach(function (b) {
          b.classList.remove('flipped'); b.setAttribute('aria-expanded', 'false');
          b.querySelector('.back').hidden = true; b.querySelector('.hint').hidden = false;
        });
      });
    }).catch(function () {
      sub.textContent = 'Could not load the flashcard deck. Reload the page to try again.';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
