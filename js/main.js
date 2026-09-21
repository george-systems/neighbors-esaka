(function () {
  'use strict';

  /* テスト用の現在時刻。空文字なら実時刻。
     例: '2026-09-25T20:10' 開催中 / '2026-09-25T18:59:50' 開演直前 / '2026-09-26T01:00' 終了後
     URL でも可: index.html?now=2026-09-25T20:10#info （? は # より前） */
  var TEST_NOW = '';

  /* 写真はここだけ直す。HTML には data-photo / data-slot-photo のキーを書く。
     署名付き S3 URL は数分で切れるので、ファイルを img/ に置いて相対パスを書く。
     george: https://placehold.jp/24/ff3d6e/ffffff/640x420.png?text=DJ%20George
     genji: https://placehold.jp/24/00a5c8/ffffff/640x360.png?text=DJ%20GENJI
  */
  var PHOTOS = {
    george: './img/IMG_6877.PNG',
    genji: './img/IMG_8693.JPG',
    ume: 'https://placehold.jp/24/ff3d6e/ffffff/240x240.png?text=%E6%A2%85%E9%85%92',
    makanai: 'https://placehold.jp/20/9ad33f/241a12/240x240.png?text=%E5%BD%93%E6%97%A5%E3%81%AE%E4%B8%80%E7%9A%BF'
  };

  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function parseFakeNow(text) {
    if (!text) return NaN;
    return new Date(decodeURIComponent(text).replace(/\s/g, '+')).getTime();
  }

  function paramFrom(source) {
    var query = source.replace(/^[?#]/, '');
    var hashQuery = query.indexOf('?');
    if (hashQuery !== -1) query = query.slice(hashQuery + 1);

    var parts = query.split('&');
    for (var i = 0; i < parts.length; i += 1) {
      var pair = parts[i].split('=');
      if (pair[0] === 'now' && pair[1]) return pair[1];
    }
    return '';
  }

  /* 優先順: TEST_NOW → ?now= → #...now= */
  function clockOffset() {
    var fake = parseFakeNow(TEST_NOW || paramFrom(window.location.search) || paramFrom(window.location.hash));
    return isNaN(fake) ? 0 : fake - Date.now();
  }

  var offset = clockOffset();

  function now() {
    return Date.now() + offset;
  }

  function showTestClock() {
    if (!offset) return;

    var badge = document.createElement('p');
    badge.className = 'test-clock';
    badge.textContent = 'テスト時刻 ' + new Date(now()).toLocaleString('ja-JP');
    document.body.appendChild(badge);
  }

  function stageAt(startTime, moment) {
    var cells = document.querySelectorAll('[data-slot-stage="dj"]');

    for (var i = 0; i < cells.length; i += 1) {
      var range = (cells[i].getAttribute('data-slot-time') || '').split('〜');
      if (range.length !== 2) continue;

      var from = atTime(startTime, range[0]);
      var to = atTime(startTime, range[1]);

      if (moment >= from && moment < to) {
        return range[0] + '〜' + range[1] + '　' + cells[i].getAttribute('data-slot-title');
      }
    }

    return 'ネイバーズ江坂 1st でお待ちしています';
  }

  function atTime(startTime, hhmm) {
    var parts = hhmm.split(':');
    var day = new Date(startTime);
    day.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
    return day.getTime();
  }

  function setupCountdown(root) {
    var start = new Date(root.getAttribute('data-countdown-start')).getTime();
    var end = new Date(root.getAttribute('data-countdown-end')).getTime();
    var timer = root.querySelector('[data-countdown-timer]');
    var live = root.querySelector('[data-countdown-live]');
    var done = root.querySelector('[data-countdown-done]');
    var current = root.querySelector('[data-countdown-current]');
    var slots = {
      days: root.querySelector('[data-countdown-days]'),
      hours: root.querySelector('[data-countdown-hours]'),
      minutes: root.querySelector('[data-countdown-minutes]'),
      seconds: root.querySelector('[data-countdown-seconds]')
    };

    function show(shown) {
      timer.hidden = shown !== timer;
      live.hidden = shown !== live;
      done.hidden = shown !== done;
    }

    function tick() {
      var moment = now();

      if (moment < start) {
        var seconds = Math.floor((start - moment) / 1000);
        slots.days.textContent = String(Math.floor(seconds / 86400));
        slots.hours.textContent = pad(Math.floor(seconds / 3600) % 24);
        slots.minutes.textContent = pad(Math.floor(seconds / 60) % 60);
        slots.seconds.textContent = pad(seconds % 60);
        show(timer);
      } else if (moment < end) {
        current.textContent = stageAt(start, moment);
        show(live);
      } else {
        show(done);
      }

      window.setTimeout(tick, 1000);
    }

    tick();
  }

  function revealOnScroll(items) {
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < items.length; i += 1) items[i].classList.add('is-visible');
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '-12% 0px' });

    for (var j = 0; j < items.length; j += 1) observer.observe(items[j]);
  }

  function setupSlotPopup() {
    var modal = document.querySelector('[data-modal]');
    if (!modal) return;

    var time = modal.querySelector('[data-modal-time]');
    var title = modal.querySelector('[data-modal-title]');
    var by = modal.querySelector('[data-modal-by]');
    var photo = modal.querySelector('[data-modal-photo]');
    var image = modal.querySelector('[data-modal-image]');
    var desc = modal.querySelector('[data-modal-desc]');
    var closer = modal.querySelector('.modal__close');
    var opener = null;

    function open(slot) {
      opener = slot;
      time.textContent = slot.getAttribute('data-slot-time') || '';
      title.textContent = slot.getAttribute('data-slot-title') || '';
      by.textContent = slot.getAttribute('data-slot-by') || '';
      desc.textContent = slot.getAttribute('data-slot-desc') || '';

      var src = slot.getAttribute('data-slot-img');
      if (src) {
        image.src = src;
        image.alt = slot.getAttribute('data-slot-title') || '';
        photo.hidden = false;
      } else {
        image.removeAttribute('src');
        photo.hidden = true;
      }

      modal.hidden = false;
      closer.focus();
    }

    function close() {
      modal.hidden = true;
      if (opener) opener.focus();
      opener = null;
    }

    var slots = document.querySelectorAll('[data-slot]');
    for (var i = 0; i < slots.length; i += 1) {
      slots[i].addEventListener('click', function () { open(this); });
    }

    modal.addEventListener('click', function (event) {
      if (event.target.hasAttribute('data-modal-close')) close();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) close();
    });
  }

  function applyPhotos() {
    var imgs = document.querySelectorAll('[data-photo]');
    for (var i = 0; i < imgs.length; i += 1) {
      var src = PHOTOS[imgs[i].getAttribute('data-photo')];
      if (src) imgs[i].src = src;
    }

    var slots = document.querySelectorAll('[data-slot-photo]');
    for (var j = 0; j < slots.length; j += 1) {
      var slotSrc = PHOTOS[slots[j].getAttribute('data-slot-photo')];
      if (slotSrc) slots[j].setAttribute('data-slot-img', slotSrc);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyPhotos();
    var countdown = document.querySelector('[data-countdown]');
    if (countdown) setupCountdown(countdown);
    showTestClock();
    revealOnScroll(document.querySelectorAll('[data-reveal]'));
    setupSlotPopup();
  });
})();
