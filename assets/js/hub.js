/* hub.js — shared JS for all 8 D365 F&O hub pages.
   Handles: The Hub nav dropdown, workspace sidebar mobile toggle,
   article-page TOC scroll-spy, header elevation on scroll. */
(function () {
  'use strict';

  /* ── The Hub nav dropdown ── */
  var dd = document.querySelector('.rd-nav-dropdown');
  if (dd) {
    var btn = dd.querySelector('.rd-nav-dropdown__btn');
    if (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = dd.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', function () {
        dd.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      });
    }
  }

  /* ── Header elevation on scroll ── */
  var header = document.querySelector('.rd-header');
  if (header) {
    var ticking = false;
    function onHeaderScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        header.style.boxShadow = window.scrollY > 8
          ? '0 2px 12px rgba(14,27,51,0.10)'
          : '';
        ticking = false;
      });
    }
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
  }

  /* ── Article-page TOC scroll-spy ── */
  /* app.js already handles this, but we also run it here as a safety net
     in case app.js's version doesn't fire (class name compatibility). */
  var tocLinks = document.querySelectorAll('.article-page__toc a[href^="#"]');
  if (tocLinks.length) {
    var sections = Array.from(tocLinks).map(function (l) {
      return document.getElementById(l.getAttribute('href').slice(1));
    }).filter(Boolean);

    function updateToc() {
      var scrollPos = window.scrollY + 90;
      var activeId = sections[0] ? sections[0].id : null;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= scrollPos) activeId = sections[i].id;
      }
      tocLinks.forEach(function (l) {
        var isActive = l.getAttribute('href') === '#' + activeId;
        l.classList.toggle('is-active', isActive);
      });
    }
    updateToc();
    window.addEventListener('scroll', updateToc, { passive: true });
  }

  /* ── Details/topic open + close animation ── */
  document.querySelectorAll('details.topic').forEach(function (d) {
    var summary = d.querySelector('summary');
    var body = d.querySelector('.topic__body');
    if (!summary || !body) return;

    summary.addEventListener('click', function (e) {
      e.preventDefault();

      if (d.open) {
        /* Animate out, then close */
        body.style.animation = 'topic-close 300ms var(--rd-ease-snap) both';
        body.addEventListener('animationend', function onEnd() {
          body.removeEventListener('animationend', onEnd);
          body.style.animation = '';
          d.open = false;
        });
      } else {
        /* Open first so the body is in the DOM, then restart the open animation */
        d.open = true;
        body.style.animation = 'none';
        body.offsetHeight; /* force reflow */
        body.style.animation = '';
      }
    });
  });

  /* ── Workspace: sidebar mobile toggle ── */
  /* app.js handles the full workspace panel switching.
     We only need to handle the mobile sidebar toggle here if app.js
     isn't loaded, which shouldn't happen — but just in case: */
  var sidebarToggle = document.querySelector('.workspace__sidebar-toggle');
  var sidebar = document.querySelector('.workspace__sidebar');
  if (sidebarToggle && sidebar && !document.querySelector('[data-workspace]')) {
    sidebarToggle.addEventListener('click', function () {
      sidebar.classList.toggle('is-open');
    });
  }

})();
