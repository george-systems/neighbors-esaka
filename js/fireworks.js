(function () {
  'use strict';

  var COLORS = [
    '#ff3d6e', '#ffc300', '#00e0ff', '#9ad33f', '#ff7a1a',
    '#c14bff', '#ff4fd8', '#5b8cff', '#fff3b0', '#3ef2a0'
  ];
  var GRAVITY = 0.03;
  var FRICTION = 0.986;
  var MAX_SPARKS = 2200;
  var MAX_ROCKETS = 7;
  var GLYPHS = ['♪', '♫', '♬', '♩'];

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function start(canvas) {
    var ctx = canvas.getContext('2d');
    var rockets = [];
    var sparks = [];
    var notes = [];
    var width = 0;
    var height = 0;
    var nextLaunch = 0;

    function resize() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function launch() {
      rockets.push({
        x: width * (0.08 + Math.random() * 0.84),
        y: height,
        px: width * 0.5,
        py: height,
        vy: -(5.2 + Math.random() * 2.6),
        goal: height * (0.08 + Math.random() * 0.4),
        color: pick(COLORS)
      });
    }

    function ring(x, y, color, count, scale, mixed) {
      if (sparks.length > MAX_SPARKS) return;

      for (var i = 0; i < count; i += 1) {
        var angle = (Math.PI * 2 * i) / count + Math.random() * 0.14;
        var speed = (1.1 + Math.random() * 3.4) * scale;
        sparks.push({
          x: x,
          y: y,
          px: x,
          py: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.007 + Math.random() * 0.011,
          width: 1.6 + Math.random() * 1.6,
          color: mixed && Math.random() < 0.4 ? pick(COLORS) : color
        });
      }
    }

    function noteBurst(x, y, color) {
      var count = width < 620 ? 5 : 8;

      for (var i = 0; i < count; i += 1) {
        var angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        var speed = 1.4 + Math.random() * 2.2;
        notes.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.005 + Math.random() * 0.005,
          size: 18 + Math.random() * 16,
          angle: (Math.random() - 0.5) * 0.6,
          spin: (Math.random() - 0.5) * 0.06,
          glyph: pick(GLYPHS),
          color: color
        });
      }
    }

    function explode(rocket) {
      var base = width < 620 ? 62 : 104;
      var mixed = Math.random() < 0.45;

      if (Math.random() < 0.34) {
        ring(rocket.x, rocket.y, rocket.color, Math.round(base * 0.45), 0.6, mixed);
        noteBurst(rocket.x, rocket.y, rocket.color);
        return;
      }

      ring(rocket.x, rocket.y, rocket.color, base, 1, mixed);

      if (Math.random() < 0.55) {
        ring(rocket.x, rocket.y, pick(COLORS), Math.round(base * 0.5), 0.52, mixed);
      }
    }

    function frame(now) {
      ctx.clearRect(0, 0, width, height);

      if (now > nextLaunch && rockets.length < MAX_ROCKETS) {
        launch();
        if (Math.random() < 0.35) launch();
        nextLaunch = now + 260 + Math.random() * 620;
      }

      ctx.lineCap = 'round';
      ctx.globalCompositeOperation = 'lighter';

      for (var i = rockets.length - 1; i >= 0; i -= 1) {
        var rocket = rockets[i];
        rocket.px = rocket.x;
        rocket.py = rocket.y;
        rocket.y += rocket.vy;
        rocket.vy += 0.07;

        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = rocket.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rocket.px, rocket.py);
        ctx.lineTo(rocket.x, rocket.y);
        ctx.stroke();

        if (rocket.y <= rocket.goal || rocket.vy >= -0.6) {
          explode(rocket);
          rockets.splice(i, 1);
        }
      }

      for (var j = sparks.length - 1; j >= 0; j -= 1) {
        var spark = sparks[j];
        spark.px = spark.x;
        spark.py = spark.y;
        spark.vx *= FRICTION;
        spark.vy = spark.vy * FRICTION + GRAVITY;
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.life -= spark.decay;

        if (spark.life <= 0) {
          sparks.splice(j, 1);
          continue;
        }

        ctx.globalAlpha = Math.max(spark.life, 0);
        ctx.strokeStyle = spark.color;
        ctx.lineWidth = spark.width;
        ctx.beginPath();
        ctx.moveTo(spark.px, spark.py);
        ctx.lineTo(spark.x, spark.y);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (var k = notes.length - 1; k >= 0; k -= 1) {
        var note = notes[k];
        note.vx *= 0.99;
        note.vy = note.vy * 0.99 + GRAVITY * 0.7;
        note.x += note.vx;
        note.y += note.vy;
        note.angle += note.spin;
        note.life -= note.decay;

        if (note.life <= 0) {
          notes.splice(k, 1);
          continue;
        }

        ctx.globalAlpha = Math.min(note.life * 1.4, 1);
        ctx.fillStyle = note.color;
        ctx.font = note.size + "px 'Noto Sans JP', sans-serif";
        ctx.save();
        ctx.translate(note.x, note.y);
        ctx.rotate(note.angle);
        ctx.fillText(note.glyph, 0, 0);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      window.requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    window.requestAnimationFrame(frame);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var targets = document.querySelectorAll('[data-fireworks]');
    for (var i = 0; i < targets.length; i += 1) start(targets[i]);
  });
})();
