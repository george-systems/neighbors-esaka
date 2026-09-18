(function () {
  'use strict';

  var MARQUEE_TEXT =
    '★ 第1回関西SA DJフェス ★ 9.25 FRI 19:00〜22:00 ★ ネイバーズ江坂 1st ★ 住む場所を越えて、音楽でつながろう。 ';
  var MARQUEE_REPEAT = 4;
  var ACCENTS = ['#ff3d6e', '#ffc300', '#00a5c8', '#8ec63f', '#ff7a1a'];
  var SPEED = 1.8;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function buildCard() {
    var card = el('div', 'saver__card');
    card.appendChild(el('span', 'saver__label', '第1回'));
    card.appendChild(el('strong', 'saver__title', '関西SA'));
    card.appendChild(el('strong', 'saver__title', 'DJフェス'));
    card.appendChild(el('span', 'saver__date', '9.25 FRI 19:00〜22:00'));
    card.appendChild(el('span', 'saver__place', 'ネイバーズ江坂 1st'));
    return card;
  }

  function buildMarquee(position) {
    var wrap = el('div', 'saver__marquee saver__marquee--' + position);
    var inner = el('div', 'saver__marquee-inner');
    for (var i = 0; i < MARQUEE_REPEAT; i += 1) {
      inner.appendChild(el('span', i % 2 ? 'saver__marquee-text is-outline' : 'saver__marquee-text', MARQUEE_TEXT));
    }
    wrap.appendChild(inner);
    return wrap;
  }

  function bounce(root, card, insetTop, insetBottom) {
    var x = 64;
    var y = insetTop + 64;
    var angle = 0.62;
    var vx = Math.cos(angle) * SPEED;
    var vy = Math.sin(angle) * SPEED;
    var accent = 0;

    function frame() {
      var maxX = root.clientWidth - card.offsetWidth;
      var maxY = root.clientHeight - insetBottom - card.offsetHeight;
      var hit = false;

      x += vx;
      y += vy;

      if (x <= 0) { x = 0; vx = Math.abs(vx); hit = true; }
      if (x >= maxX) { x = Math.max(maxX, 0); vx = -Math.abs(vx); hit = true; }
      if (y <= insetTop) { y = insetTop; vy = Math.abs(vy); hit = true; }
      if (y >= maxY) { y = Math.max(maxY, insetTop); vy = -Math.abs(vy); hit = true; }

      if (hit) {
        accent = (accent + 1) % ACCENTS.length;
        root.style.setProperty('--saver-accent', ACCENTS[accent]);
      }

      card.style.transform = 'translate(' + Math.round(x) + 'px, ' + Math.round(y) + 'px)';
      window.requestAnimationFrame(frame);
    }

    frame();
  }

  function start(root) {
    var withMarquee = root.getAttribute('data-saver-marquee') !== 'off';
    var top = null;
    var bottom = null;

    if (withMarquee) {
      top = buildMarquee('top');
      bottom = buildMarquee('bottom');
      root.appendChild(top);
      root.appendChild(bottom);
    }

    var card = buildCard();
    root.appendChild(card);

    var exit = root.getAttribute('data-saver-exit');
    if (exit) {
      var leave = function () { window.location.href = exit; };
      document.addEventListener('click', leave);
      document.addEventListener('keydown', leave);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      card.classList.add('saver__card--still');
      return;
    }

    bounce(root, card, top ? top.offsetHeight : 0, bottom ? bottom.offsetHeight : 0);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var savers = document.querySelectorAll('[data-saver]');
    for (var i = 0; i < savers.length; i += 1) start(savers[i]);
  });
})();
