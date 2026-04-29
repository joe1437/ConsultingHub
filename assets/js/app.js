/* =========================================================
   D365 F&O Consulting Hub — Shared scripts
   - Shared footer (single source of truth — edit here, every page updates)
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
