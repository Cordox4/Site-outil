// ===== App bootstrap: router, layout, search, theme =====
import { categories, tools, toolList, toolsByCategory } from './registry.js';
import { el, adInline } from './ui.js';

const content = document.getElementById('main');
const nav = document.getElementById('categoryNav');
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('sidebarBackdrop');

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Theme ---------- */
const themeBtn = document.getElementById('themeToggle');
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
  try { localStorage.setItem('ob-theme', t); } catch {}
}
setTheme(localStorage.getItem('ob-theme') || 'light');
themeBtn.addEventListener('click', () =>
  setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

/* ---------- Sidebar (mobile) ---------- */
function toggleSidebar(open) {
  sidebar.classList.toggle('open', open);
  backdrop.classList.toggle('open', open);
}
document.getElementById('menuToggle').addEventListener('click', () => toggleSidebar(!sidebar.classList.contains('open')));
backdrop.addEventListener('click', () => toggleSidebar(false));

/* ---------- Category nav ---------- */
function buildNav(activeCat) {
  nav.innerHTML = '';
  nav.append(el('button', {
    class: 'nav-cat' + (!activeCat ? ' active' : ''),
    onclick: () => { location.hash = '#/'; },
  }, el('span', {}, '🏠'), el('span', {}, 'Accueil')));
  for (const c of categories) {
    nav.append(el('button', {
      class: 'nav-cat' + (activeCat === c.id ? ' active' : ''),
      onclick: () => { location.hash = '#/cat/' + c.id; },
    }, el('span', {}, c.emoji), el('span', {}, c.name),
      el('span', { class: 'cat-count' }, toolsByCategory(c.id).length)));
  }
}

/* ---------- Views ---------- */
function toolCard(t) {
  const unavailable = t.badge === 'API';
  return el('a', {
    class: 'tool-card' + (unavailable ? ' t-card-off' : ''),
    href: '#/tool/' + t.id,
    title: unavailable ? 'Pas disponible pour le moment' : '',
  },
    t.badge ? el('span', { class: 't-badge' + (unavailable ? ' t-badge-off' : '') }, unavailable ? 'Indisponible' : t.badge) : null,
    el('span', { class: 't-icon' }, t.icon || '🛠️'),
    el('span', { class: 't-name' }, t.name),
    el('span', { class: 't-desc' }, t.desc || ''));
}

function renderHome() {
  buildNav(null);
  content.innerHTML = '';
  content.append(el('section', { class: 'hero' },
    el('h1', {}, 'Tous vos outils au même endroit'),
    el('p', {}, `${toolList.filter(t => t.cat).length}+ outils gratuits pour vos PDF, images, textes, code, calculs et bien plus — directement dans votre navigateur, sans installation.`)));

  categories.forEach((c, i) => {
    const items = toolsByCategory(c.id);
    if (!items.length) return;
    content.append(el('h2', { class: 'section-title' },
      el('span', { class: 'emoji' }, c.emoji), c.name,
      el('span', { class: 'count' }, `(${items.length})`)));
    const grid = el('div', { class: 'tool-grid' });
    items.forEach(t => grid.append(toolCard(t)));
    content.append(grid);
    if (i === 1) content.append(adInline('home-mid')); // ad after 2nd category
  });
  window.scrollTo(0, 0);
}

function renderCategory(catId) {
  const c = categories.find(x => x.id === catId);
  if (!c) return renderHome();
  buildNav(catId);
  content.innerHTML = '';
  content.append(el('div', { class: 'tool-header' },
    el('div', { class: 'breadcrumb' }, el('a', { href: '#/' }, 'Accueil'), ' / ' + c.name),
    el('h1', {}, el('span', {}, c.emoji), ' ' + c.name)));
  const grid = el('div', { class: 'tool-grid' });
  toolsByCategory(catId).forEach(t => grid.append(toolCard(t)));
  content.append(grid);
  window.scrollTo(0, 0);
}

async function renderTool(id) {
  const t = tools[id];
  if (!t) return renderHome();
  buildNav(t.cat);
  content.innerHTML = '';
  const cat = categories.find(c => c.id === t.cat);
  content.append(el('div', { class: 'tool-header' },
    el('div', { class: 'breadcrumb' },
      el('a', { href: '#/' }, 'Accueil'),
      cat ? ' / ' : '', cat ? el('a', { href: '#/cat/' + cat.id }, cat.name) : '',
      ' / ' + t.name),
    el('h1', {}, el('span', {}, t.icon || '🛠️'), ' ' + t.name),
    t.desc ? el('p', {}, t.desc) : null));

  const body = el('div', {});
  content.append(body);
  try {
    await t.render(body);
  } catch (err) {
    console.error(err);
    body.append(el('div', { class: 'status err' }, 'Erreur lors du chargement de l\'outil : ' + err.message));
  }
  window.scrollTo(0, 0);
}

/* ---------- Router ---------- */
function route() {
  toggleSidebar(false);
  const hash = location.hash || '#/';
  const parts = hash.replace(/^#\//, '').split('/').filter(Boolean);
  if (parts[0] === 'tool' && parts[1]) return renderTool(parts[1]);
  if (parts[0] === 'cat' && parts[1]) return renderCategory(parts[1]);
  return renderHome();
}
window.addEventListener('hashchange', route);

/* ---------- Global search ---------- */
const searchInput = document.getElementById('globalSearch');
const searchResults = document.getElementById('searchResults');
function norm(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function search(q) {
  const nq = norm(q);
  if (!nq) { searchResults.hidden = true; return; }
  const catName = id => (categories.find(c => c.id === id) || {}).name || '';
  const matches = toolList.filter(t => t.cat && (norm(t.name).includes(nq) || norm(t.desc || '').includes(nq) || norm(catName(t.cat)).includes(nq))).slice(0, 12);
  searchResults.innerHTML = '';
  if (!matches.length) { searchResults.append(el('a', {}, 'Aucun résultat')); }
  matches.forEach(t => searchResults.append(
    el('a', { href: '#/tool/' + t.id, onclick: () => { searchResults.hidden = true; searchInput.value = ''; } },
      (t.icon || '🛠️') + ' ' + t.name,
      el('span', { class: 'sr-cat' }, '  ·  ' + catName(t.cat)))));
  searchResults.hidden = false;
}
searchInput.addEventListener('input', () => search(searchInput.value));
searchInput.addEventListener('focus', () => { if (searchInput.value) search(searchInput.value); });
document.addEventListener('click', e => { if (!e.target.closest('.search-wrap')) searchResults.hidden = true; });

route();
