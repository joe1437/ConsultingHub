/* =========================================================
   D365 F&O Consulting Hub - Shared scripts
   - Shared footer (single source of truth - edit here, every page updates)
   - Mobile nav toggle
   - Workspace sidebar (item switching, deep links via #id)
   - Mobile sidebar collapse
   - Article-page TOC scroll-spy
   ========================================================= */

(function () {
  'use strict';

  /* ---------- Shared footer ----------
     Edit this once and every page picks it up. Each page just needs
     <footer class="site-footer" data-footer></footer> as a placeholder. */
  const FOOTER_HTML =
    '<div class="container site-footer__inner">' +
      '<p>D365 F&amp;O Consulting Hub</p>' +
      '<p>Built by Joe El Hajj. Last updated <time>2026-04-29</time>.</p>' +
    '</div>';

  document.querySelectorAll('footer.site-footer[data-footer]').forEach(el => {
    el.innerHTML = FOOTER_HTML;
  });

  /* ---------- Theme toggle (light/dark) ----------
     The dark-mode class is set in an inline <head> script on each page
     to avoid a flash. Here we just inject the toggle button and wire it. */
  const SUN_SVG =
    '<svg class="theme-toggle__sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4"/>' +
      '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>' +
    '</svg>';
  const MOON_SVG =
    '<svg class="theme-toggle__moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' +
    '</svg>';

  function injectThemeToggle() {
    const headerInner = document.querySelector('.site-header__inner');
    if (!headerInner) return;
    const nav = headerInner.querySelector('.site-nav');
    if (!nav) return;
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    btn.title = 'Toggle dark mode';
    btn.innerHTML = SUN_SVG + MOON_SVG;
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      if (next === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
    });
    // Insert just before the nav so it sits next to the search trigger
    headerInner.insertBefore(btn, nav);
  }
  injectThemeToggle();

  /* ---------- Header: mobile nav ---------- */
  const navToggle = document.querySelector('.site-nav__toggle');
  const navList = document.querySelector('.site-nav__list');
  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const open = navList.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- Workspace: sidebar item switching ---------- */
  const workspace = document.querySelector('[data-workspace]');
  if (workspace) {
    const navLinks = workspace.querySelectorAll('[data-item-link]');
    const panes = workspace.querySelectorAll('[data-item-pane]');
    const sidebar = workspace.querySelector('.workspace__sidebar');
    const sidebarToggle = workspace.querySelector('.workspace__sidebar-toggle');

    function activate(id, opts) {
      opts = opts || {};
      let found = false;
      panes.forEach(p => {
        const isActive = p.dataset.itemPane === id;
        p.classList.toggle('is-active', isActive);
        if (isActive) found = true;
      });
      if (!found && panes.length) {
        // fall back to first pane
        const fallback = panes[0].dataset.itemPane;
        panes[0].classList.add('is-active');
        id = fallback;
      }
      navLinks.forEach(l => {
        l.classList.toggle('is-active', l.dataset.itemLink === id);
      });
      if (sidebarToggle) {
        const activeLink = workspace.querySelector('[data-item-link].is-active');
        sidebarToggle.querySelector('.workspace__sidebar-current').textContent =
          activeLink ? activeLink.textContent.trim() : 'Browse';
      }
      // close sidebar on mobile after click
      if (opts.closeSidebar && sidebar) sidebar.classList.remove('is-open');
      if (opts.updateHash) {
        history.replaceState(null, '', '#' + id);
      }
    }

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        activate(link.dataset.itemLink, { closeSidebar: true, updateHash: true });
        // scroll content area into view on mobile
        if (window.matchMedia('(max-width: 900px)').matches) {
          const main = workspace.querySelector('.workspace__main');
          if (main) main.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('is-open');
      });
    }

    // Initial: from hash, or first item
    const initialId = (location.hash || '').replace(/^#/, '');
    if (initialId) {
      activate(initialId);
    } else if (panes.length) {
      activate(panes[0].dataset.itemPane);
    }

    window.addEventListener('hashchange', () => {
      const id = (location.hash || '').replace(/^#/, '');
      if (id) activate(id);
    });
  }

  /* ---------- Modern motion layer ---------- */
  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Page enter on load */
  document.body.classList.add('page-enter');
  window.addEventListener('load', () => {
    // Let it play, then drop the class so it doesn't replay if classes are toggled later
    setTimeout(() => document.body.classList.remove('page-enter'), 600);
  });

  /* Page exit on internal navigation */
  if (!prefersReducedMotion) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href) return;
      // Skip: external, new tab, hash-only, mailto/tel, modified clicks, download
      if (a.target === '_blank') return;
      if (a.hasAttribute('download')) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
      if (href.startsWith('#')) return;
      // Only intercept same-origin links
      let url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      // Same page (different hash)? skip
      if (url.pathname === location.pathname && url.search === location.search) return;

      e.preventDefault();
      document.body.classList.add('page-exit');
      setTimeout(() => { window.location.href = a.href; }, 220);
    });

    // If the user navigates back, make sure the exit class isn't stuck
    window.addEventListener('pageshow', () => {
      document.body.classList.remove('page-exit');
    });
  }

  /* Header elevation on scroll */
  const header = document.querySelector('.site-header');
  if (header) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Theme toggle: brief spin animation on click */
  const themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      themeBtn.classList.add('is-spinning');
      setTimeout(() => themeBtn.classList.remove('is-spinning'), 360);
    });
  }

  /* Scroll reveal via IntersectionObserver */
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    // Auto-tag common building blocks so existing pages get reveals for free
    const autoTargets = document.querySelectorAll(
      '.card-grid, .timeline, .section-block > .container > .article, ' +
      '.section-block > .container > h2'
    );
    autoTargets.forEach(el => {
      if (el.classList.contains('card-grid')) {
        el.classList.add('reveal-stagger');
      } else if (el.classList.contains('timeline')) {
        // timeline uses its own per-step animation; just toggle is-visible
      } else {
        el.classList.add('reveal');
      }
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    document.querySelectorAll('.reveal, .reveal-stagger, .timeline').forEach(el => io.observe(el));
  } else {
    // Reduced motion or no IO: make sure nothing stays hidden
    document.querySelectorAll('.reveal, .reveal-stagger, .timeline').forEach(el => {
      el.classList.add('is-visible');
    });
  }

  /* Article-page TOC: smooth scroll with a tiny accent flash */
  document.querySelectorAll('.article-page__toc a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
    });
  });

  /* ---------- Article-page TOC scroll-spy ---------- */
  const tocLinks = document.querySelectorAll('.article-page__toc a[href^="#"]');
  if (tocLinks.length) {
    const sections = Array.from(tocLinks).map(l => {
      const id = l.getAttribute('href').slice(1);
      return document.getElementById(id);
    }).filter(Boolean);

    function onScroll() {
      const scrollPos = window.scrollY + 100;
      let activeId = sections[0] ? sections[0].id : null;
      for (const s of sections) {
        if (s.offsetTop <= scrollPos) activeId = s.id;
      }
      tocLinks.forEach(l => {
        l.classList.toggle('is-active', l.getAttribute('href') === '#' + activeId);
      });
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
