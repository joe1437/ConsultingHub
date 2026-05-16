// Scroll orchestrator — powers the redesign homepage and portfolio.
// Sets --scrollY for parallax, fires .in on reveal elements via
// IntersectionObserver, drives .rd-track scroll-progress, and
// animates NumberTicker elements.
(function () {
  var root = document.documentElement;
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      root.style.setProperty('--scrollY', String(y));

      // Drive scroll-lifecycle progress:
      // p = 0 when section top hits viewport top, p = 1 when section bottom hits viewport bottom.
      // This ensures the puck is at Discover when the section first scrolls into view.
      document.querySelectorAll('.rd-track').forEach(function (el) {
        var r = el.getBoundingClientRect();
        var vh = window.innerHeight;
        var scrollRange = Math.max(1, r.height - vh);
        var traveled = Math.max(0, -r.top);
        var p = Math.min(1, traveled / scrollRange);
        el.style.setProperty('--p', String(p));
      });

      ticking = false;
    });
  }

  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  function bootReveals() {
    document.querySelectorAll('.rd-rise, .rd-fade, .rd-blur, .rd-stagger')
      .forEach(function (el) { revealObs.observe(el); });
  }
  window.__rdRebindReveals = bootReveals;

  // NumberTicker — animates data-ticker elements from 0 to data-to.
  function bootTickers() {
    document.querySelectorAll('[data-ticker]').forEach(function (el) {
      var to = Number(el.dataset.to || 0);
      var suffix = el.dataset.suffix || '';
      var dur = Number(el.dataset.dur || 1400);
      var started = false;

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !started) {
            started = true;
            io.disconnect();
            var start = performance.now();
            function ease(t) { return 1 - Math.pow(1 - t, 3); }
            function step(now) {
              var t = Math.min(1, (now - start) / dur);
              el.textContent = Math.round(to * ease(t)) + suffix;
              if (t < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
          }
        });
      }, { threshold: 0.4 });
      io.observe(el);
    });
  }

  setTimeout(function () {
    bootReveals();
    bootTickers();
    onScroll();
  }, 60);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
})();
