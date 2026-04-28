/* =========================================================
   D365 F&O Consulting Hub — Site search
   - Indexes all 9 pages on first open (lazy)
   - Modal UI, keyboard-first (Cmd/Ctrl+K, /, arrows, Enter)
   - Works whenever the site is served via http(s)://
     (file:// is blocked from fetching local pages by browsers)
   ========================================================= */
(function () {
  'use strict';

  const PAGES = [
    { url: 'index.html',              title: 'Home' },
    { url: 'consulting.html',         title: 'Consulting & D365' },
    { url: 'lifecycle.html',          title: 'Lifecycle' },
    { url: 'business-processes.html', title: 'Processes' },
    { url: 'modules.html',            title: 'Modules' },
    { url: 'accounting.html',         title: 'Accounting' },
    { url: 'ai.html',                 title: 'AI' },
    { url: 'customizations.html',     title: 'Customizations' },
    { url: 'advanced.html',           title: 'Advanced' }
  ];

  let searchIndex = null;
  let isIndexing = false;
  let isModalOpen = false;
  let activeIdx = 0;
  let currentResults = [];

  /* ---------- Build URL relative to current page ---------- */
  function pageUrl(filename) {
    const path = location.pathname;
    const lastSlash = path.lastIndexOf('/');
    return path.substring(0, lastSlash + 1) + filename;
  }

  /* ---------- Inject the trigger button into the header ---------- */
  function injectTrigger() {
    const headerInner = document.querySelector('.site-header__inner');
    if (!headerInner) return;
    const nav = headerInner.querySelector('.site-nav');
    if (!nav) return;

    const btn = document.createElement('button');
    btn.className = 'search-trigger';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Search');
    btn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="7" cy="7" r="5"/><path d="m11 11 3.2 3.2"/></svg>' +
      '<span class="search-trigger__label">Search the hub...</span>' +
      '<span class="search-trigger__shortcut">' + (isMac() ? '⌘K' : 'Ctrl K') + '</span>';
    btn.addEventListener('click', openModal);

    headerInner.insertBefore(btn, nav);
  }

  function isMac() {
    return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  }

  /* ---------- Inject the modal ---------- */
  function injectModal() {
    const modal = document.createElement('div');
    modal.className = 'search-modal';
    modal.id = 'searchModal';
    modal.innerHTML =
      '<div class="search-modal__backdrop" data-close></div>' +
      '<div class="search-modal__panel" role="dialog" aria-label="Search">' +
        '<div class="search-modal__input-wrap">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="7" cy="7" r="5"/><path d="m11 11 3.2 3.2"/></svg>' +
          '<input type="text" class="search-modal__input" placeholder="Search modules, processes, articles..." autocomplete="off" spellcheck="false" />' +
          '<button type="button" class="search-modal__close" data-close>Esc</button>' +
        '</div>' +
        '<div class="search-modal__results"></div>' +
        '<div class="search-modal__footer">' +
          '<span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>' +
          '<span><kbd>↵</kbd> Open</span>' +
          '<span><kbd>Esc</kbd> Close</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
    const input = modal.querySelector('.search-modal__input');
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onInputKeydown);
  }

  /* ---------- Build the index (lazy, once) ---------- */
  async function buildIndex() {
    if (searchIndex || isIndexing) return;
    isIndexing = true;
    showStatus('Indexing site content...');

    if (location.protocol === 'file:') {
      isIndexing = false;
      searchIndex = [];
      showStatus(
        'Search needs the site to be served via a web server. ' +
        'Either deploy to GitHub Pages, or run <code>python -m http.server 8080</code> ' +
        'in this folder and open <code>http://localhost:8080</code>.'
      );
      return;
    }

    const parser = new DOMParser();
    const idx = [];

    await Promise.all(PAGES.map(async (page) => {
      try {
        const res = await fetch(pageUrl(page.url));
        if (!res.ok) return;
        const html = await res.text();
        const doc = parser.parseFromString(html, 'text/html');

        // Page-level entry (so a search for "lifecycle" still hits the page)
        const pageHeaderTitle = doc.querySelector('.page-header__title')?.textContent?.trim();
        const pageHeaderLead = doc.querySelector('.page-header__lead')?.textContent?.trim() || '';
        const heroTitle = doc.querySelector('.hero__title')?.textContent?.trim();
        const heroLead = doc.querySelector('.hero__subtitle')?.textContent?.trim() || '';
        const topTitle = pageHeaderTitle || heroTitle || page.title;
        const topLead = pageHeaderLead || heroLead;
        idx.push({
          pageUrl: page.url,
          pageTitle: page.title,
          sectionId: '',
          sectionTitle: topTitle,
          lead: topLead,
          body: (topTitle + ' ' + topLead).slice(0, 600)
        });

        // Item panes (modules, processes, lifecycle, accounting)
        doc.querySelectorAll('.item-pane[data-item-pane]').forEach(pane => {
          const id = pane.dataset.itemPane;
          const title = pane.querySelector('.item-pane__title')?.textContent?.trim() || '';
          const lead = pane.querySelector('.item-pane__lead')?.textContent?.trim() || '';
          const bodyText = pane.textContent.replace(/\s+/g, ' ').trim();
          idx.push({
            pageUrl: page.url,
            pageTitle: page.title,
            sectionId: id,
            sectionTitle: title,
            lead: lead,
            body: bodyText
          });
        });

        // TOC sections (consulting, ai, customizations, advanced)
        doc.querySelectorAll('section[id]').forEach(sec => {
          if (sec.closest('.item-pane')) return; // skip if already inside an item pane
          const id = sec.id;
          const title = sec.querySelector('h2')?.textContent?.trim() || '';
          if (!title) return;
          const bodyText = sec.textContent.replace(/\s+/g, ' ').trim();
          idx.push({
            pageUrl: page.url,
            pageTitle: page.title,
            sectionId: id,
            sectionTitle: title,
            lead: '',
            body: bodyText
          });
        });
      } catch (e) {
        console.warn('Search index: failed to fetch', page.url, e);
      }
    }));

    searchIndex = idx;
    isIndexing = false;

    // Re-run the current query if any
    const inp = document.querySelector('.search-modal__input');
    if (inp) onInput({ target: inp });
  }

  /* ---------- Ranking ---------- */
  function search(q) {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];

    const scored = searchIndex.map(entry => {
      const titleLower = (entry.sectionTitle + ' ' + entry.pageTitle).toLowerCase();
      const leadLower = (entry.lead || '').toLowerCase();
      const bodyLower = entry.body.toLowerCase();

      let score = 0;
      let allTokensFound = true;

      tokens.forEach(t => {
        const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(escaped, 'g');
        let tokenScore = 0;

        if (titleLower === t) tokenScore += 30;
        if (titleLower.startsWith(t)) tokenScore += 15;
        if (titleLower.includes(t)) tokenScore += 10;
        if (leadLower.includes(t)) tokenScore += 4;

        const occurrences = (bodyLower.match(re) || []).length;
        tokenScore += Math.min(occurrences, 5);

        if (tokenScore === 0) allTokensFound = false;
        score += tokenScore;
      });

      // Require all tokens to match somewhere
      if (!allTokensFound) score = 0;
      return { entry, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(s => s.entry);
  }

  /* ---------- Rendering ---------- */
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function highlight(text, tokens) {
    let out = escapeHtml(text);
    tokens.forEach(t => {
      if (!t) return;
      const re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }

  function buildSnippet(entry, tokens) {
    if (entry.lead) return entry.lead;
    const body = entry.body || '';
    if (!body) return '';
    // Find first token occurrence and grab around it
    const lower = body.toLowerCase();
    let pos = -1;
    for (const t of tokens) {
      const i = lower.indexOf(t);
      if (i >= 0 && (pos === -1 || i < pos)) pos = i;
    }
    if (pos === -1) return body.slice(0, 200);
    const start = Math.max(0, pos - 60);
    const end = Math.min(body.length, pos + 160);
    return (start > 0 ? '…' : '') + body.slice(start, end) + (end < body.length ? '…' : '');
  }

  function renderResults(results, tokens) {
    const r = document.querySelector('.search-modal__results');
    if (!results.length) {
      r.innerHTML = '<div class="search-modal__empty">No results.</div>';
      return;
    }
    r.innerHTML = results.map((entry, i) => {
      const url = entry.pageUrl + (entry.sectionId ? '#' + entry.sectionId : '');
      const titleHtml = highlight(entry.sectionTitle || entry.pageTitle, tokens);
      const snippet = buildSnippet(entry, tokens);
      const snippetHtml = highlight(snippet.length > 220 ? snippet.slice(0, 220) + '…' : snippet, tokens);
      return (
        '<a class="search-result' + (i === 0 ? ' is-active' : '') + '" href="' + url + '" data-idx="' + i + '">' +
          '<div class="search-result__page">' + escapeHtml(entry.pageTitle) + '</div>' +
          '<div class="search-result__title">' + titleHtml + '</div>' +
          '<div class="search-result__snippet">' + snippetHtml + '</div>' +
        '</a>'
      );
    }).join('');

    r.querySelectorAll('.search-result').forEach((el, i) => {
      el.addEventListener('mouseenter', () => setActive(i));
    });
  }

  function showStatus(html) {
    const r = document.querySelector('.search-modal__results');
    if (r) r.innerHTML = '<div class="search-modal__empty">' + html + '</div>';
  }
  function showInitial() {
    showStatus('Start typing to search across modules, processes, lifecycle phases, and articles.');
    currentResults = [];
  }

  function setActive(i) {
    activeIdx = i;
    document.querySelectorAll('.search-result').forEach((el, j) => {
      el.classList.toggle('is-active', i === j);
    });
    // Scroll into view if needed
    const active = document.querySelector('.search-result.is-active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  /* ---------- Event handlers ---------- */
  function onInput(e) {
    const q = (e.target.value || '').trim();
    if (!searchIndex) {
      buildIndex();
      return;
    }
    if (!q) {
      showInitial();
      return;
    }
    currentResults = search(q);
    activeIdx = 0;
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    renderResults(currentResults, tokens);
  }

  function onInputKeydown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentResults.length) setActive((activeIdx + 1) % currentResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentResults.length) setActive((activeIdx - 1 + currentResults.length) % currentResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const items = document.querySelectorAll('.search-result');
      if (items[activeIdx]) items[activeIdx].click();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
    }
  }

  function openModal() {
    const modal = document.getElementById('searchModal');
    if (!modal) return;
    modal.classList.add('is-open');
    document.body.classList.add('has-search-open');
    isModalOpen = true;
    // Push a history entry so the browser/Android back button closes the
    // modal first instead of leaving the site.
    try {
      history.pushState({ searchOpen: true }, '', location.href);
    } catch (e) { /* ignore */ }
    const inp = modal.querySelector('.search-modal__input');
    inp.value = '';
    showInitial();
    setTimeout(() => inp.focus(), 30);
    if (!searchIndex) buildIndex();
  }

  // When closeModal is called from a user action (Esc, click backdrop,
  // close button) we want to roll back the history entry pushed by
  // openModal, so the URL/state stays clean. When called in response to
  // a popstate event (back button), we must NOT call history.back() or
  // we'd loop. The flag distinguishes the two paths.
  function closeModal(fromPopState) {
    const modal = document.getElementById('searchModal');
    if (!modal) return;
    if (!isModalOpen) return;
    modal.classList.remove('is-open');
    document.body.classList.remove('has-search-open');
    isModalOpen = false;
    if (!fromPopState) {
      try {
        if (history.state && history.state.searchOpen) history.back();
      } catch (e) { /* ignore */ }
    }
  }

  window.addEventListener('popstate', () => {
    if (isModalOpen) closeModal(true);
  });

  /* ---------- Global keyboard shortcuts ---------- */
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      isModalOpen ? closeModal() : openModal();
      return;
    }
    if (e.key === '/' && !isModalOpen) {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        openModal();
      }
    }
  });

  /* ---------- Init ---------- */
  function init() {
    injectTrigger();
    injectModal();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
