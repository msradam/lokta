/* Lokta Components Reference, behavior layer.
   Icons fetched from the Iconify API (never hand-authored), components made
   genuinely keyboard-operable. Nothing here restyles the system. */
'use strict';

/* ───────────────────────── THEME + FOCUS ───────────────────────── */
function setStock(name) {
  document.documentElement.setAttribute('data-theme', name);
  document.querySelectorAll('[data-stock-btn]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.stockBtn === name));
  });
}
function toggleFocus(on) {
  document.body.classList.toggle('force-focus', on);
  const b = document.getElementById('focusToggle');
  if (b) b.setAttribute('aria-pressed', String(on));
}

/* ───────────────────────── COPY ───────────────────────── */
async function copyText(txt, btn) {
  try {
    await navigator.clipboard.writeText(txt);
  } catch (e) {
    const t = document.createElement('textarea');
    t.value = txt;
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }
  if (btn) {
    const o = btn.textContent;
    btn.textContent = 'COPIED';
    setTimeout(() => (btn.textContent = o), 1100);
  }
}
function wireCopyBlocks() {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sel = btn.getAttribute('data-copy');
      const node = sel === 'prev' ? btn.parentElement.querySelector('code') : document.querySelector(sel);
      if (node) copyText(node.textContent, btn);
    });
  });
}

/* ───────────────────────── ICONS (Iconify API) ───────────────────────── */
const ICON_API = 'https://api.iconify.design';
const SEED = [
  'check',
  'alert-triangle',
  'circle',
  'info-circle',
  'x',
  'chevron-right',
  'chevron-down',
  'chevron-left',
  'arrow-right',
  'plus',
  'minus',
  'search',
  'menu-2',
  'external-link',
  'dots',
  'trash',
  'settings',
  'download',
  'calendar',
  'user',
];
let ICON_LIB = 'tabler',
  ICON_SIZE = 24;
const iconCache = {};

function sharpenSVG(name, body, w, h) {
  const filled = /-filled$/.test(name) || (/fill="(?!none)/.test(body) && !/stroke=/.test(body));
  const vb = `0 0 ${w || 24} ${h || 24}`;
  if (filled) {
    return `<svg class="lk-icon" viewBox="${vb}" width="${ICON_SIZE}" height="${ICON_SIZE}" fill="currentColor" stroke="none" aria-hidden="true">${body}</svg>`;
  }
  return `<svg class="lk-icon" viewBox="${vb}" width="${ICON_SIZE}" height="${ICON_SIZE}" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${body}</svg>`;
}
function placeholder(name) {
  return `<span class="lk-icon icon-missing" title="failed to load ${name}" style="width:${ICON_SIZE}px;height:${ICON_SIZE}px"></span>`;
}

async function fetchBatch(prefix, names) {
  const key = prefix + ':' + names.join(',');
  if (iconCache[key]) return iconCache[key];
  const url = `${ICON_API}/${prefix}.json?icons=${names.join(',')}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('icon batch ' + res.status);
  const data = await res.json();
  iconCache[key] = data;
  return data;
}

function iconTile(name, svg) {
  return `<button class="icon-tile" data-icon="${name}" title="Click to copy sharpened SVG" aria-label="Copy ${name}">
    <span class="icon-glyph">${svg}</span>
    <span class="icon-name mono">${name}</span>
  </button>`;
}

async function renderIconGrid(names, mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  mount.innerHTML = `<div class="lk-label" style="padding:8px 0">Loading ${names.length} icons from Iconify…</div>`;
  let data;
  try {
    data = await fetchBatch(ICON_LIB, names);
  } catch (e) {
    mount.innerHTML = names.map((n) => iconTile(n, placeholder(n))).join('');
    wireIconTiles();
    return;
  }
  const dw = data.width || 24,
    dh = data.height || 24;
  mount.innerHTML = names
    .map((n) => {
      const ic = data.icons && data.icons[n];
      if (!ic || !ic.body) return iconTile(n, placeholder(n));
      return iconTile(n, sharpenSVG(n, ic.body, ic.width || dw, ic.height || dh));
    })
    .join('');
  wireIconTiles();
}
function wireIconTiles() {
  document.querySelectorAll('.icon-tile').forEach((t) => {
    t.addEventListener('click', () => {
      const svg = t.querySelector('svg');
      if (!svg) {
        return;
      }
      copyText(svg.outerHTML.replace(' width="' + ICON_SIZE + '" height="' + ICON_SIZE + '"', ''), null);
      const n = t.querySelector('.icon-name');
      const o = n.textContent;
      n.textContent = 'copied svg';
      setTimeout(() => (n.textContent = o), 1000);
    });
  });
}

async function iconSearch(q) {
  const mount = document.getElementById('iconSearchResults');
  if (!q || q.length < 2) {
    mount.innerHTML = '';
    return;
  }
  mount.innerHTML = `<div class="lk-label" style="padding:8px 0">Searching ${ICON_LIB}…</div>`;
  try {
    const res = await fetch(`${ICON_API}/search?query=${encodeURIComponent(q)}&prefix=${ICON_LIB}&limit=60`);
    const data = await res.json();
    const names = (data.icons || []).map((s) => s.split(':')[1]).filter(Boolean);
    if (!names.length) {
      mount.innerHTML = `<div class="lk-label" style="padding:8px 0">No ${ICON_LIB} icons for “${q}”.</div>`;
      return;
    }
    await renderIconGrid(names.slice(0, 48), 'iconSearchResults');
  } catch (e) {
    mount.innerHTML = `<div class="lk-label" style="padding:8px 0;color:var(--accent-danger)">Search failed.</div>`;
  }
}

function setIconLib(lib) {
  ICON_LIB = lib;
  document
    .querySelectorAll('[data-iconlib]')
    .forEach((b) => b.setAttribute('aria-selected', String(b.dataset.iconlib === lib)));
  renderIconGrid(SEED, 'iconSeedGrid');
  renderIconUsage();
  const q = document.getElementById('iconSearchInput');
  if (q && q.value) iconSearch(q.value);
}
function setIconSize(px) {
  ICON_SIZE = px;
  document
    .querySelectorAll('[data-iconsize]')
    .forEach((b) => b.setAttribute('aria-selected', String(+b.dataset.iconsize === px)));
  renderIconGrid(SEED, 'iconSeedGrid');
  const q = document.getElementById('iconSearchInput');
  if (q && q.value) iconSearch(q.value);
}

/* Icons living inside real components */
async function renderIconUsage() {
  const mount = document.getElementById('iconUsage');
  if (!mount) return;
  let data;
  try {
    data = await fetchBatch(ICON_LIB, [
      'download',
      'check',
      'alert-triangle',
      'chevron-right',
      'external-link',
    ]);
  } catch (e) {
    mount.innerHTML = `<div class="lk-label">Icon usage unavailable offline.</div>`;
    return;
  }
  const g = (n) => {
    const ic = data.icons && data.icons[n];
    return ic && ic.body ? sharpenSVG(n, ic.body, ic.width || 24, ic.height || 24) : placeholder(n);
  };
  const sz = 18;
  const old = ICON_SIZE;
  ICON_SIZE = sz;
  const dl = g('download'),
    ck = g('check'),
    al = g('alert-triangle'),
    ch = g('chevron-right'),
    ex = g('external-link');
  ICON_SIZE = old;
  mount.innerHTML = `
    <div class="usage-row">
      <button class="lk-btn lk-btn-primary">${dl} Export</button>
      <button class="lk-btn">Docs ${ex}</button>
      <span class="lk-tag">v0.2 ${ch}</span>
    </div>
    <div class="lk-note-box lk-note-success" style="margin-top:14px">
      <span class="lk-note-ico">${ck}</span>
      <div><div class="lk-note-title">Saved</div><div class="lk-note-msg">Icons inherit the text role through currentColor.</div></div>
    </div>
    <div class="usage-row" style="margin-top:14px">
      <span class="lk-status lk-status-done">DONE</span>
      <span class="lk-status lk-status-alert">DELAYED</span>
      <span class="lk-status lk-status-pending">QUEUED</span>
    </div>`;
}

/* ───────────────────────── TABS (WAI-ARIA, roving tabindex) ───────────────────────── */
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

/* ───────────────────────── ACCORDION ───────────────────────── */
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

/* ───────────────────────── DIALOG (focus trap, Esc, return focus) ───────────────────────── */
let lastTrigger = null;
function openDialog(id, trigger) {
  const back = document.getElementById(id);
  lastTrigger = trigger || document.activeElement;
  back.hidden = false;
  const focusables = back.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  const first = focusables[0],
    last = focusables[focusables.length - 1];
  if (first) first.focus();
  function onKey(e) {
    if (e.key === 'Escape') {
      closeDialog(id);
    } else if (e.key === 'Tab') {
      if (focusables.length === 0) return;
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
  back.hidden = true;
  if (back._onKey) back.removeEventListener('keydown', back._onKey);
  if (lastTrigger) lastTrigger.focus();
}

/* ───────────────────────── TOOLTIP (Escape dismiss) ───────────────────────── */
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

/* ───────────────────────── MENU / DISCLOSURE ───────────────────────── */
function wireMenus() {
  document.querySelectorAll('[data-menu]').forEach((wrap) => {
    const btn = wrap.querySelector('[data-menu-btn]');
    const list = wrap.querySelector('[data-menu-list]');
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

/* ───────────────────────── SLIDER / PROGRESS readout ───────────────────────── */
function wireSliders() {
  document.querySelectorAll('.lk-slider').forEach((s) => {
    const out = s.parentElement.querySelector('[data-slider-out]');
    const sync = () => {
      if (out) out.textContent = s.value;
      s.setAttribute('aria-valuenow', s.value);
    };
    s.addEventListener('input', sync);
    sync();
  });
}

/* ───────────────────────── TABLE SORT ───────────────────────── */
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
function sortTable(th) {
  const table = th.closest('table');
  const idx = [...th.parentElement.children].indexOf(th);
  const tbody = table.querySelector('tbody');
  const rows = [...tbody.querySelectorAll('tr')];
  const cur = th.getAttribute('aria-sort');
  const dir = cur === 'ascending' ? 'descending' : 'ascending';
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

/* ───────────────────────── INIT ───────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // theme switcher
  const sel = document.getElementById('stockSelect');
  if (sel) sel.addEventListener('change', (e) => setStock(e.target.value));
  document.querySelectorAll('[data-stock-btn]').forEach((b) =>
    b.addEventListener('click', () => {
      setStock(b.dataset.stockBtn);
      if (sel) sel.value = b.dataset.stockBtn;
    }),
  );
  const ft = document.getElementById('focusToggle');
  if (ft) ft.addEventListener('click', () => toggleFocus(!document.body.classList.contains('force-focus')));

  // icons
  renderIconGrid(SEED, 'iconSeedGrid');
  renderIconUsage();
  document
    .querySelectorAll('[data-iconlib]')
    .forEach((b) => b.addEventListener('click', () => setIconLib(b.dataset.iconlib)));
  document
    .querySelectorAll('[data-iconsize]')
    .forEach((b) => b.addEventListener('click', () => setIconSize(+b.dataset.iconsize)));
  const si = document.getElementById('iconSearchInput');
  if (si) {
    let t;
    si.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => iconSearch(si.value.trim()), 280);
    });
  }

  // components
  document.querySelectorAll('[data-tabs]').forEach(wireTabs);
  document.querySelectorAll('.lk-accordion').forEach(wireAccordion);
  wireTooltips();
  wireMenus();
  wireSliders();
  wireTables();
  wireCopyBlocks();

  // dialog triggers
  document
    .querySelectorAll('[data-open-dialog]')
    .forEach((b) => b.addEventListener('click', () => openDialog(b.dataset.openDialog, b)));
  document
    .querySelectorAll('[data-close-dialog]')
    .forEach((b) => b.addEventListener('click', () => closeDialog(b.dataset.closeDialog)));
});
