# Authoring guide — D365 F&O Consulting Hub

This site is built as plain HTML/CSS/JS, no build step. To add or edit content, you just edit the relevant `.html` file in any text editor (VS Code recommended) and refresh the browser.

---

## File map

| File | Section |
|------|---------|
| `index.html` | Home (cards linking to every section) |
| `consulting.html` | Consulting & D365 — flowing article-style page |
| `lifecycle.html` | ERP lifecycle — sidebar + 10 phase panes |
| `business-processes.html` | Business processes — sidebar + 14 process panes |
| `modules.html` | Modules — sidebar + 31 module panes |
| `accounting.html` | Accounting by transaction — sidebar + 14 process panes |
| `ai.html` | AI in D365 F&O — flowing article-style page |
| `customizations.html` | Customizations & integrations — flowing article-style page |
| `advanced.html` | Advanced features — flowing article-style page |
| `assets/css/styles.css` | All styling |
| `assets/js/app.js` | Mobile nav, sidebar switching, TOC scroll-spy |

---

## The two page layouts

### Layout A — Sidebar + panes
Used for: lifecycle, business-processes, modules, accounting.
The left sidebar lists items; clicking one shows its pane. The URL hash updates so links are shareable: e.g. `modules.html#general-ledger`.

### Layout B — Flowing article page with TOC
Used for: consulting, ai, customizations, advanced.
A sticky table of contents on the left; sections flow top-to-bottom on the right.

---

## Adding an article (the unit of content)

Every page already has placeholder articles styled with a dashed border. To turn a placeholder into real content, replace its inner block. The base pattern is:

```html
<article class="article">
  <h2>Article title</h2>
  <p class="article__meta">Tag · Last updated 2026-04-28</p>

  <p>Opening paragraph that frames the topic in one or two sentences.</p>

  <h3>A subheading</h3>
  <p>More detail. Use <code>&lt;ul&gt;</code> for bullet lists and <code>&lt;ol&gt;</code> for numbered ones.</p>

  <ul>
    <li>Point one.</li>
    <li>Point two.</li>
  </ul>

  <div class="callout">
    <strong>Tip —</strong> A callout for things worth highlighting (gotchas, exceptions, project tips).
  </div>
</article>
```

Callout variants — change the class to color the left bar:
- `callout` — accent gold (default)
- `callout callout--info` — blue
- `callout callout--warn` — amber
- `callout callout--success` — green

---

## Adding a transaction table (accounting page)

```html
<article class="article">
  <h3>Transaction name (e.g., Vendor invoice posting)</h3>
  <p class="article__meta">Transaction · Source-to-pay</p>
  <p>One sentence: what this transaction is and when it fires.</p>
  <div class="entry-table-wrap">
    <table class="entry-table">
      <thead>
        <tr><th>Account</th><th>Description</th><th>Dr</th><th>Cr</th></tr>
      </thead>
      <tbody>
        <tr><td>200100</td><td>Inventory received not invoiced</td><td class="num">1,000.00</td><td class="num"></td></tr>
        <tr><td>210100</td><td>Vendor balance (AP)</td><td class="num"></td><td class="num">1,000.00</td></tr>
        <tr class="total-row"><td colspan="2">Totals</td><td class="num">1,000.00</td><td class="num">1,000.00</td></tr>
      </tbody>
    </table>
  </div>
  <div class="callout">
    <strong>Note —</strong> Posting profile: ledger posting group on the vendor.
  </div>
</article>
```

The `accounting.html` Order-to-cash pane has a fully populated example you can copy.

---

## Adding a brand-new item (e.g., a new module or process)

1. Add an entry to the sidebar list at the top of the file:
   ```html
   <li><a class="workspace__nav-link" data-item-link="my-new-item" href="#my-new-item">My new item</a></li>
   ```
2. Add the matching pane in the main column:
   ```html
   <article class="item-pane" data-item-pane="my-new-item">
     <header class="item-pane__header">
       <span class="item-pane__eyebrow">Module</span>
       <h2 class="item-pane__title">My new item</h2>
       <p class="item-pane__lead">One sentence describing it.</p>
     </header>
     <article class="article">
       <p>Your content...</p>
     </article>
   </article>
   ```
3. The `data-item-link` and `data-item-pane` values must match (use lowercase with hyphens — they become URL fragments).

---

## Adding a section to a flowing article page

In any of consulting/ai/customizations/advanced:

1. Add the link in the TOC `<ul>`:
   ```html
   <li><a href="#new-section">New section</a></li>
   ```
2. Add the section anywhere down the article column:
   ```html
   <section id="new-section">
     <article class="article">
       <h2>Section title</h2>
       <p class="article__meta">Topic · Last updated 2026-04-28</p>
       <p>Your content...</p>
     </article>
   </section>
   ```
The TOC will auto-highlight as you scroll past it.

---

## House style for content

- **One concept per article.** If a topic needs two `<h2>`s, it's actually two articles — split it.
- **Lead with the "what and why,"** then the "how." Articles are read top-down by people who may stop after one paragraph.
- **Use callouts sparingly** — one or two per article, for the truly non-obvious.
- **Date your edits** in `article__meta` so future-you knows when you last looked at this.
- **Show, don't tell** — accounting articles work better with the entry table; configuration articles work better with a numbered list of steps.
- **Avoid screenshots that age fast.** When you do include them, name the form path in the caption ("Modules > General ledger > Setup > Ledger") so the topic survives a UI refresh.

---

## Updating the top navigation

The header is duplicated in every page (intentional, so the site works opened directly from disk with no server). To change a nav link:

1. Update it in `index.html`.
2. Find/replace the same block across the other 8 pages (the only difference between pages is which `site-nav__link` has `is-active`).

Or open all 9 files in VS Code, multi-cursor edit, save.

---

## Running the site

You can:
- Double-click `index.html` to open it in your browser. Everything works.
- Or, for a slightly nicer experience (clean URLs, no `file://` weirdness), run a tiny local server:
  ```
  python -m http.server 8080
  ```
  and visit `http://localhost:8080`.
- To publish: any static host works (GitHub Pages, Netlify, Azure Static Web Apps, Vercel). Just upload the folder.
