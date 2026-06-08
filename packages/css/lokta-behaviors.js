/* @lokta/css behaviors. The ARIA and keyboard wiring for the interactive
   components, lifted from the components reference. Pure DOM, no dependencies,
   no network. Pairs with the markup patterns shown on the components reference
   page (see components.html). Load it once; it self-wires on DOMContentLoaded
   and every hook is guarded, so it is a no-op when a component is absent.

   Hooks: [data-tabs] with [role=tab]/[aria-controls]; .lk-accordion with
   .lk-acc-head[aria-controls]; [data-open-dialog]/[data-close-dialog] + a
   dialog element; [data-menu] with [data-menu-btn]/[data-menu-list]; .lk-tip;
   .lk-slider with [data-slider-out]; [data-sortable] tables. */
'use strict';

// ── Tabs (roving tabindex, arrow keys) ──────────────────────────────────────
function wireTabs(root) {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  function select(i, focus) {
    tabs.forEach((t, n) => {
      const on = n === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (panels[n]) panels[n].hidden = !on;
    });
    if (focus) tabs[i].focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i, true));
    t.addEventListener('keydown', (e) => {
      let n = null;
      if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      if (n !== null) {
        e.preventDefault();
        select(n, true);
      }
    });
  });
  select(0, false);
}

// ── Accordion (button + aria-expanded controlling a region) ─────────────────
function wireAccordion(root) {
  root.querySelectorAll('.lk-acc-head').forEach((head) => {
    head.addEventListener('click', () => {
      const open = head.getAttribute('aria-expanded') === 'true';
      head.setAttribute('aria-expanded', String(!open));
      const panel = document.getElementById(head.getAttribute('aria-controls'));
      if (panel) panel.hidden = open;
    });
  });
}

// ── Dialog (focus trap, Escape, return focus) ───────────────────────────────
let lastTrigger = null;
function openDialog(id, trigger) {
  const back = document.getElementById(id);
  if (!back) return;
  lastTrigger = trigger || document.activeElement;
  back.hidden = false;
  const focusables = back.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  const first = focusables[0],
    last = focusables[focusables.length - 1];
  if (first) first.focus();
  function onKey(e) {
    if (e.key === 'Escape') closeDialog(id);
    else if (e.key === 'Tab' && focusables.length) {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  back._onKey = onKey;
  back.addEventListener('keydown', onKey);
}
function closeDialog(id) {
  const back = document.getElementById(id);
  if (!back) return;
  back.hidden = true;
  if (back._onKey) back.removeEventListener('keydown', back._onKey);
  if (lastTrigger) lastTrigger.focus();
}

// ── Tooltip (Escape dismiss) ────────────────────────────────────────────────
function wireTooltips() {
  document.querySelectorAll('.lk-tip').forEach((tip) => {
    tip.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        tip.blur();
        const a = tip.querySelector('[tabindex],button,a');
        if (a) a.blur();
      }
    });
  });
}

// ── Menu / disclosure (arrow keys, Escape, outside click) ───────────────────
function wireMenus() {
  document.querySelectorAll('[data-menu]').forEach((wrap) => {
    const btn = wrap.querySelector('[data-menu-btn]');
    const list = wrap.querySelector('[data-menu-list]');
    if (!btn || !list) return;
    const items = [...list.querySelectorAll('[role="menuitem"]')];
    let open = false;
    function setOpen(o, focusFirst) {
      open = o;
      btn.setAttribute('aria-expanded', String(o));
      list.hidden = !o;
      if (o && focusFirst && items[0]) items[0].focus();
      if (!o) btn.focus();
    }
    btn.addEventListener('click', () => setOpen(!open, true));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true, true);
      }
    });
    items.forEach((it, i) => {
      it.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          items[(i + 1) % items.length].focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          items[(i - 1 + items.length) % items.length].focus();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setOpen(false);
        } else if (e.key === 'Home') {
          e.preventDefault();
          items[0].focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          items[items.length - 1].focus();
        }
      });
      it.addEventListener('click', () => setOpen(false));
    });
    document.addEventListener('click', (e) => {
      if (open && !wrap.contains(e.target)) setOpen(false);
    });
  });
}

// ── Slider readout + aria-valuenow ──────────────────────────────────────────
function wireSliders() {
  document.querySelectorAll('.lk-slider').forEach((s) => {
    const out = s.parentElement && s.parentElement.querySelector('[data-slider-out]');
    const sync = () => {
      if (out) out.textContent = s.value;
      s.setAttribute('aria-valuenow', s.value);
    };
    s.addEventListener('input', sync);
    sync();
  });
}

// ── Sortable table ──────────────────────────────────────────────────────────
function sortTable(th) {
  const table = th.closest('table');
  const idx = [...th.parentElement.children].indexOf(th);
  const tbody = table.querySelector('tbody');
  const rows = [...tbody.querySelectorAll('tr')];
  const dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
  table.querySelectorAll('th[data-sort]').forEach((h) => h.setAttribute('aria-sort', 'none'));
  th.setAttribute('aria-sort', dir);
  const num = th.dataset.sort === 'num';
  rows.sort((a, b) => {
    let x = a.children[idx].textContent.trim(),
      y = b.children[idx].textContent.trim();
    if (num) {
      x = parseFloat(x.replace(/[^0-9.-]/g, '')) || 0;
      y = parseFloat(y.replace(/[^0-9.-]/g, '')) || 0;
      return dir === 'ascending' ? x - y : y - x;
    }
    return dir === 'ascending' ? x.localeCompare(y) : y.localeCompare(x);
  });
  rows.forEach((r) => tbody.appendChild(r));
}
function wireTables() {
  document.querySelectorAll('[data-sortable] th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => sortTable(th));
    th.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sortTable(th);
      }
    });
  });
}

// ── Interactive grid (ARIA APG pattern: roving tabindex + arrow keys) ───────
function wireGrid(grid) {
  const rows = [...grid.querySelectorAll('[role="row"]')];
  const M = rows.map((r) => [...r.querySelectorAll('[role="gridcell"], [role="columnheader"]')]);
  if (!M.length || !M[0].length) return;
  let cur = { r: 0, c: 0 };
  const all = M.flat();
  const setTab = () => {
    all.forEach((c) => (c.tabIndex = -1));
    if (M[cur.r] && M[cur.r][cur.c]) M[cur.r][cur.c].tabIndex = 0;
  };
  const focusCell = (r, c) => {
    r = Math.max(0, Math.min(M.length - 1, r));
    if (!M[r]) return;
    c = Math.max(0, Math.min(M[r].length - 1, c));
    cur = { r, c };
    setTab();
    M[r][c].focus();
  };
  setTab();
  M.forEach((row, r) => row.forEach((cell, c) => cell.addEventListener('focus', () => (cur = { r, c }))));
  grid.addEventListener('keydown', (e) => {
    const k = e.key;
    let h = true;
    if (k === 'ArrowRight') focusCell(cur.r, cur.c + 1);
    else if (k === 'ArrowLeft') focusCell(cur.r, cur.c - 1);
    else if (k === 'ArrowDown') focusCell(cur.r + 1, cur.c);
    else if (k === 'ArrowUp') focusCell(cur.r - 1, cur.c);
    else if (k === 'Home') focusCell(e.ctrlKey ? 0 : cur.r, 0);
    else if (k === 'End') focusCell(e.ctrlKey ? M.length - 1 : cur.r, (M[cur.r] || []).length - 1);
    else h = false;
    if (h) e.preventDefault();
  });
}

// ── Bar chart from data (bars + synced legend from one source) ──────────────
// <div class="lk-bars" data-bars='[{"label":"North","value":72,"series":0}]'
//   data-series='["North","South"]' data-label="...">. Colour + pattern can never
// drift, since both derive from the series index.
function wireBars(el) {
  let data, names;
  try {
    data = JSON.parse(el.dataset.bars || '[]');
    names = JSON.parse(el.dataset.series || '[]');
  } catch (e) {
    return;
  }
  if (!data.length) return;
  const max = Math.max(...data.map((d) => d.value));
  const cls = (s) => `lk-viz-${s + 1}${s > 0 ? ` lk-pat-${s + 1}` : ''}`;
  const bars = data
    .map(
      (d) =>
        `<div class="lk-barlist-row"><span class="lk-barlist-label">${d.label}</span><span class="lk-bar-track"><span class="lk-bar-fill ${cls(d.series || 0)}" style="--pct:${Math.round((d.value / max) * 100)}%"></span></span><span class="lk-barlist-val">${d.value}</span></div>`,
    )
    .join('');
  const used = [...new Set(data.map((d) => d.series || 0))].sort((a, b) => a - b);
  const legend = names.length
    ? `<div class="lk-legend" aria-hidden="true">${used.map((s) => `<span class="lk-legend-item"><span class="lk-swatch ${cls(s)}"></span>${names[s] || ''}</span>`).join('')}</div>`
    : '';
  el.innerHTML = `<div class="lk-barlist">${bars}</div>${legend}`;
  if (!el.getAttribute('role')) {
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', el.dataset.label || data.map((d) => `${d.label} ${d.value}`).join(', '));
  }
}

function initLoktaBehaviors() {
  document.querySelectorAll('.lk-bars[data-bars]').forEach(wireBars);
  document.querySelectorAll('[role="grid"]').forEach(wireGrid);
  document.querySelectorAll('[data-tabs]').forEach(wireTabs);
  document.querySelectorAll('.lk-accordion').forEach(wireAccordion);
  wireTooltips();
  wireMenus();
  wireSliders();
  wireTables();
  document
    .querySelectorAll('[data-open-dialog]')
    .forEach((b) => b.addEventListener('click', () => openDialog(b.dataset.openDialog, b)));
  document
    .querySelectorAll('[data-close-dialog]')
    .forEach((b) => b.addEventListener('click', () => closeDialog(b.dataset.closeDialog)));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLoktaBehaviors);
  else initLoktaBehaviors();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initLoktaBehaviors, wireTabs, wireAccordion, openDialog, closeDialog, wireMenus, wireGrid, wireBars };
}
