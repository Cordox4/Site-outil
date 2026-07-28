// ===== UI helpers shared by all tools =====

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

// Build DOM from an HTML string, return the container.
export function html(str) {
  const t = document.createElement('div');
  t.innerHTML = str.trim();
  return t;
}

export function $(sel, root = document) { return root.querySelector(sel); }
export function $all(sel, root = document) { return [...root.querySelectorAll(sel)]; }

let toastTimer;
export function toast(msg, ms = 2200) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), ms);
}

export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copié dans le presse-papiers');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    toast('Copié');
  }
}

export function download(data, filename, type = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function bytes(n) {
  if (n < 1024) return n + ' o';
  const u = ['Ko', 'Mo', 'Go']; let i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1);
  return n.toFixed(n < 10 ? 1 : 0) + ' ' + u[i];
}

// Reusable ad banner (emplacement générique, prêt à recevoir un bloc AdSense
// plus tard). N'affiche rien de publicitaire tant qu'aucun code n'est ajouté.
export function adInline(id = 'inline') {
  return el('div', { class: 'ad-slot ad-inline', 'data-ad': id });
}

// Drag & drop file zone. onFiles receives a FileList/array.
export function dropzone(onFiles, { accept = '', multiple = true, label = 'Glissez vos fichiers ici ou cliquez pour parcourir' } = {}) {
  const input = el('input', { type: 'file', accept, multiple, class: 'hidden' });
  const zone = el('div', { class: 'dropzone', tabindex: '0', role: 'button' },
    el('div', { class: 'dz-icon' }, icon('upload')),
    el('div', {}, label),
    el('div', { class: 'hint', style: 'margin-top:6px' }, accept ? 'Formats : ' + accept : ''),
    input);
  const trigger = () => input.click();
  zone.addEventListener('click', (e) => { if (e.target !== input) trigger(); });
  zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger(); } });
  input.addEventListener('change', () => { if (input.files.length) onFiles([...input.files]); });
  ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('drag'); }));
  zone.addEventListener('drop', e => { if (e.dataTransfer.files.length) onFiles([...e.dataTransfer.files]); });
  return zone;
}

export function status(msg, kind = 'info') {
  return el('div', { class: 'status ' + kind }, msg);
}

export function field(labelText, control, hint) {
  const l = el('label', {}, labelText, hint ? el('span', { class: 'hint' }, ' — ' + hint) : null);
  return el('div', { class: 'field' }, l, control);
}

// ===== Pub au clic (popunder) =====
// 👉 Mets ton lien publicitaire ici (fourni par ta régie pub / réseau d'affiliation).
// Tant que AD_CLICK_CONFIG.url est vide, aucune pub ne se déclenche.
export const AD_CLICK_CONFIG = {
  url: '',   // ex: 'https://exemple-regie-pub.com/xxxxx'
  chance: 0.60, // 60% de chances qu'un clic sur un bouton déclenche la pub (pas à chaque fois)
};

function maybeTriggerAdClick() {
  if (!AD_CLICK_CONFIG.url) return;
  if (Math.random() > AD_CLICK_CONFIG.chance) return;
  try {
    const w = window.open(AD_CLICK_CONFIG.url, '_blank');
    // Tente de garder le site au premier plan (comportement "popunder")
    if (w) window.focus();
  } catch {}
}

export function button(label, onClick, { primary = true, sm = false } = {}) {
  return el('button', {
    class: 'btn' + (primary ? ' btn-primary' : '') + (sm ? ' btn-sm' : ''),
    onclick: (e) => { maybeTriggerAdClick(); onClick(e); },
  }, label);
}

export function copyBtn(getText, label = 'Copier') {
  return button(label, () => copy(typeof getText === 'function' ? getText() : getText), { primary: false, sm: true });
}

// Read a file as ArrayBuffer / text / dataURL
export function readFile(file, as = 'arraybuffer') {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    if (as === 'text') r.readAsText(file);
    else if (as === 'dataurl') r.readAsDataURL(file);
    else r.readAsArrayBuffer(file);
  });
}

// Lazy-load an external script once (returns a promise).
const _scripts = {};
export function loadScript(src) {
  if (_scripts[src]) return _scripts[src];
  _scripts[src] = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = () => rej(new Error('Échec du chargement : ' + src));
    document.head.appendChild(s);
  });
  return _scripts[src];
}

// Convenience: a panel wrapper
export function panel(...children) {
  return el('div', { class: 'panel' }, ...children.flat());
}

// Bloc de contenu éditorial affiché sous un outil : introduction, mode
// d'emploi, astuces et FAQ. Sert à donner du contexte utile aux visiteurs
// (et du contenu unique et substantiel sur chaque page d'outil).
export function toolArticle({ title, intro = [], steps = [], tips = [], faq = [] } = {}) {
  const parts = [];
  if (title) parts.push(el('h2', { class: 'article-title' }, title));
  intro.forEach(t => parts.push(el('p', {}, t)));
  if (steps.length) {
    parts.push(el('h3', {}, 'Comment utiliser cet outil'));
    parts.push(el('ol', { class: 'article-steps' }, ...steps.map(s => el('li', {}, s))));
  }
  if (tips.length) {
    parts.push(el('h3', {}, 'Bon à savoir'));
    parts.push(el('ul', { class: 'article-tips' }, ...tips.map(t => el('li', {}, t))));
  }
  if (faq.length) {
    parts.push(el('h3', {}, 'Questions fréquentes'));
    parts.push(el('div', { class: 'article-faq' },
      ...faq.map(({ q, a }) => el('details', {}, el('summary', {}, q), el('p', {}, a)))));
  }
  return el('div', { class: 'panel article-panel' }, ...parts);
}

// ===== Icônes SVG (style trait unique, cohérent sur tout le site) =====
// Chaque entrée est le contenu interne d'un <svg viewBox="0 0 24 24">.
// L'émoji 🧰 du logo/favicon reste un émoji (identité visuelle du site) ;
// tout le reste de l'interface utilise ce jeu d'icônes vectorielles.
const ICONS = {
  // Navigation / UI générale
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9"/>',
  menu: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
  heart: '<path d="M12 20.2s-7.6-4.6-9.9-9.1C.6 7.6 2.3 4 6 4c2.1 0 3.6 1.2 4.5 2.6.4.6.7 1.1 1.5 1.1s1.1-.5 1.5-1.1C14.4 5.2 15.9 4 18 4c3.7 0 5.4 3.6 3.9 7.1-2.3 4.5-9.9 9.1-9.9 9.1Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.2" y2="16.2"/>',
  upload: '<path d="M4 16.5v2.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5"/><path d="M12 15V4M12 4 7.5 8.5M12 4l4.5 4.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.7" r="1"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/>',
  scroll: '<path d="M6 4h11a2 2 0 0 1 2 2v13a1.5 1.5 0 0 1-1.5 1.5H8"/><path d="M6 4a2 2 0 0 0-2 2v13a1.5 1.5 0 0 0 3 0V6a2 2 0 0 0-1-1Z"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/>',
  tool: '<path d="M14.6 6.4a4 4 0 0 0-5.4 5l-6 6 2 2 6-6a4 4 0 0 0 5-5.4l-2.8 2.8-2-2Z"/>',

  // Catégories
  file: '<path d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/>',
  image: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="8.3" cy="10" r="1.6"/><path d="m4 17 4.7-4.7a1.5 1.5 0 0 1 2.1 0L15 16.5M14 15l1.6-1.6a1.5 1.5 0 0 1 2.1 0L21 17"/>',
  pencil: '<path d="M4 20.5 5 16.7 15.6 6a1.8 1.8 0 0 1 2.5 0l0 0a1.8 1.8 0 0 1 0 2.5L7.6 19.2 4 20.5Z"/><line x1="14" y1="7.6" x2="17" y2="10.5"/>',
  code: '<polyline points="9 8 4.5 12 9 16"/><polyline points="15 8 19.5 12 15 16"/>',
  calculator: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><line x1="7.5" y1="7" x2="16.5" y2="7"/><line x1="7.8" y1="12" x2="7.8" y2="12"/><line x1="12" y1="12" x2="12" y2="12"/><line x1="16.2" y1="12" x2="16.2" y2="12"/><line x1="7.8" y1="15.5" x2="7.8" y2="15.5"/><line x1="12" y1="15.5" x2="12" y2="15.5"/><line x1="16.2" y1="15.5" x2="16.2" y2="15.5"/><line x1="7.8" y1="19" x2="7.8" y2="19"/><line x1="12" y1="19" x2="12" y2="19"/><line x1="16.2" y1="17.5" x2="16.2" y2="19"/>',
  refresh: '<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5"/><path d="M20 4.5v4h-4"/><path d="M20 12a8 8 0 0 1-13.7 5.7L4 15.5"/><path d="M4 19.5v-4h4"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H16a4 4 0 0 0 4-4c0-4.4-3.6-8-8-8Z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.2" cy="10.2" r="1"/>',
  headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14.5" width="4" height="6" rx="1.5"/><rect x="17" y="14.5" width="4" height="6" rx="1.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><line x1="3" y1="12" x2="21" y2="12"/>',
  bot: '<rect x="4.5" y="9" width="15" height="10.5" rx="2.5"/><line x1="12" y1="9" x2="12" y2="5.5"/><circle cx="12" cy="4" r="1.2"/><circle cx="9" cy="14" r="1.3"/><circle cx="15" cy="14" r="1.3"/><line x1="2.3" y1="12.5" x2="4.5" y2="12.5"/><line x1="19.5" y1="12.5" x2="21.7" y2="12.5"/>',
  puzzle: '<path d="M9 4.5h3.2a1.4 1.4 0 0 1 1.4 1.6c-.1.6.4 1.2 1 1.2h1.9A1.5 1.5 0 0 1 18 8.8v2.7c.7-.2 1.5.3 1.5 1.3a1.7 1.7 0 0 1-1.7 1.7 1.4 1.4 0 0 0-1.3 1.4v1.6a1.5 1.5 0 0 1-1.5 1.5h-2.6c.2-.6-.3-1.4-1.2-1.4a1.7 1.7 0 0 0-1.7 1.7c0 .3.1.6.2.8H6.5A1.5 1.5 0 0 1 5 18.6v-2.6c-.7.2-1.5-.3-1.5-1.2 0-1 .8-1.8 1.8-1.8.5 0 .9.3 1.2.7V10a1.5 1.5 0 0 1 1.5-1.5h1.6c.6 0 1-.5.9-1.1A1.4 1.4 0 0 1 9 4.5Z"/>',

  // Documents / PDF
  merge: '<path d="M7 3.5v9a3 3 0 0 0 3 3h3.5"/><path d="M11.5 12.5 15 16l-3.5 3.5"/><circle cx="7" cy="3.5" r="0" /><path d="M7 12.5v6a2 2 0 0 0 2 2h1"/>',
  scissors: '<circle cx="6.3" cy="7" r="2.3"/><circle cx="6.3" cy="17" r="2.3"/><line x1="8.2" y1="8.4" x2="20" y2="19.5"/><line x1="8.2" y1="15.6" x2="20" y2="4.5"/>',
  compress: '<path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M20 9V5.5A1.5 1.5 0 0 0 18.5 4H15M4 15v3.5A1.5 1.5 0 0 0 5.5 20H9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15"/><line x1="9" y1="12" x2="15" y2="12"/>',
  rotate: '<path d="M4 12a8 8 0 1 0 2.6-5.9"/><polyline points="3 4 3.4 7.6 7 7.1"/>',
  unlock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V7.8a4 4 0 0 1 7.4-2.1"/>',
  crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
  droplet: '<path d="M12 3s6 6.8 6 11.2A6 6 0 1 1 6 14.2C6 9.8 12 3 12 3Z"/>',
  camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z"/><circle cx="12" cy="13" r="3.4"/>',
  wand: '<path d="m4 20 8-8"/><path d="M14 4v3M19 6.5 17 8.5M21 11h-3M11 4h-.01M8 7h-.01M6 11h-.01" stroke-linecap="round"/><path d="M14 4 4 20l0 0M17 4.5l2.5 2.5L14 12.5 11.5 10Z"/>',

  // Texte / dev
  hash: '<line x1="9" y1="4" x2="7" y2="20"/><line x1="17" y1="4" x2="15" y2="20"/><line x1="4.5" y1="9" x2="20" y2="9"/><line x1="3.5" y1="15" x2="19" y2="15"/>',
  type: '<polyline points="5 6.5 5 4.5 19 4.5 19 6.5"/><line x1="12" y1="4.5" x2="12" y2="19.5"/><line x1="9" y1="19.5" x2="15" y2="19.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
  fileText: '<path d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="16.5" x2="14" y2="16.5"/>',
  shuffle: '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/>',
  braces: '<path d="M8 4.5c-2 0-2.5 1-2.5 2.5v2.6c0 1.2-.4 1.9-1.5 2.4 1.1.5 1.5 1.2 1.5 2.4v2.6c0 1.5.5 2.5 2.5 2.5"/><path d="M16 4.5c2 0 2.5 1 2.5 2.5v2.6c0 1.2.4 1.9 1.5 2.4-1.1.5-1.5 1.2-1.5 2.4v2.6c0 1.5-.5 2.5-2.5 2.5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><polyline points="7.8 12.3 10.6 15 16.2 9"/>',
  list: '<line x1="9.5" y1="6.5" x2="20" y2="6.5"/><line x1="9.5" y1="12" x2="20" y2="12"/><line x1="9.5" y1="17.5" x2="20" y2="17.5"/><circle cx="5" cy="6.5" r="1.2"/><circle cx="5" cy="12" r="1.2"/><circle cx="5" cy="17.5" r="1.2"/>',
  table: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><line x1="3.5" y1="9.5" x2="20.5" y2="9.5"/><line x1="3.5" y1="14.5" x2="20.5" y2="14.5"/><line x1="10" y1="4.5" x2="10" y2="19.5"/>',
  ticket: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5v1.7a1.8 1.8 0 0 0 0 3.6v1.7A1.5 1.5 0 0 1 18.5 17h-13A1.5 1.5 0 0 1 4 15.5v-1.7a1.8 1.8 0 0 0 0-3.6Z"/><line x1="13.5" y1="7.5" x2="13.5" y2="16.5" stroke-dasharray="2 2"/>',
  id: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5.5 15.5c.5-1.5 1.7-2.2 2.5-2.2s2 .7 2.5 2.2"/><line x1="13.5" y1="9" x2="18" y2="9"/><line x1="13.5" y1="12.5" x2="18" y2="12.5"/>',
  flask: '<path d="M9.5 3.5h5M10 3.5v6.3L5.6 18a2 2 0 0 0 1.8 2.9h9.2a2 2 0 0 0 1.8-2.9L14 9.8V3.5"/><line x1="8" y1="15" x2="16" y2="15"/>',

  // Chiffres / finances
  receipt: '<path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21Z"/><line x1="8.5" y1="7.5" x2="15.5" y2="7.5"/><line x1="8.5" y1="11" x2="15.5" y2="11"/><line x1="8.5" y1="14.5" x2="13" y2="14.5"/>',
  percent: '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="7.3" cy="7.3" r="2.3"/><circle cx="16.7" cy="16.7" r="2.3"/>',
  scale: '<line x1="12" y1="3" x2="12" y2="21"/><line x1="6" y1="21" x2="18" y2="21"/><line x1="4" y1="6" x2="20" y2="6"/><path d="M4 6 1.5 12a2.5 2.5 0 0 0 5 0Z"/><path d="M20 6l-2.5 6a2.5 2.5 0 0 0 5 0Z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><line x1="3.5" y1="9.5" x2="20.5" y2="9.5"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
  trendUp: '<polyline points="4 16 10 10 14 14 20 6"/><polyline points="14 6 20 6 20 12"/>',
  home2: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9"/>',
  flame: '<path d="M12 3s4.5 4 4.5 8.5a4.5 4.5 0 0 1-9 0c0-1 .3-1.8.8-2.6.3.9 1 1.5 1.7 1.5-.4-2.5.5-4.8 2-6.4Z"/><path d="M12 21a5 5 0 0 0 5-5c0-2.5-2-4.5-2-4.5s.5 2-1 3.5c0-1.5-1-2.5-1-2.5s-1 2.5-3 3.5A3.3 3.3 0 0 0 12 21Z"/>',
  ruler: '<rect x="3" y="8" width="18" height="8" rx="1.5" transform="rotate(0 12 12)"/><line x1="7" y1="8" x2="7" y2="11"/><line x1="10.5" y1="8" x2="10.5" y2="10"/><line x1="14" y1="8" x2="14" y2="11"/><line x1="17.5" y1="8" x2="17.5" y2="10"/>',
  thermometer: '<path d="M12 14.5V5.5a2 2 0 1 0-4 0v9a4 4 0 1 0 4 0Z"/><line x1="10" y1="8" x2="12" y2="8"/>',
  exchange: '<polyline points="7 4 7 16"/><polyline points="4 13 7 16 10 13"/><polyline points="17 20 17 8"/><polyline points="14 11 17 8 20 11"/>',
  eyedropper: '<path d="m9.5 14.5 6-6 2.6 2.6-6 6L9.5 20 7 20l0-2.5Z"/><path d="M14 7.5 16.5 5a2.1 2.1 0 0 1 3 3L17 10.5"/>',
  gradient: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M3.5 15 9 9.5a2 2 0 0 1 2.8 0l5.7 5.7"/><circle cx="8.5" cy="7.5" r="1.3"/>',
  layers: '<polygon points="12 3 21 8 12 13 3 8"/><polyline points="3 13 12 18 21 13"/><polyline points="3 17.5 12 22 21 17.5"/>',
  radius: '<path d="M4 20V10a6 6 0 0 1 6-6h10"/><line x1="4" y1="20" x2="20" y2="20"/>',
  map: '<polygon points="9 4 3 6.5 3 20 9 17.5 15 20 21 17.5 21 4 15 6.5 9 4"/><line x1="9" y1="4" x2="9" y2="17.5"/><line x1="15" y1="6.5" x2="15" y2="20"/>',
  tag: '<path d="M12.5 3.5H6A1.5 1.5 0 0 0 4.5 5v6.5a1.5 1.5 0 0 0 .44 1.06l8 8a1.5 1.5 0 0 0 2.12 0l6.5-6.5a1.5 1.5 0 0 0 0-2.12l-8-8a1.5 1.5 0 0 0-1.06-.44Z"/><circle cx="9" cy="8.5" r="1.3"/>',
  heading: '<path d="M5 4.5v15M13 4.5v15M5 12h8"/><path d="M16.5 10.5c.5-.6 1.2-1 2-1 1.4 0 2.5 1 2.5 2.2 0 2-4.5 2-4.5 4.8 0 .4.3.5.6.5H21"/>',
  key: '<circle cx="7.5" cy="14.5" r="3.5"/><path d="M10.6 12 18 4.6M16 6.6l2 2M13.2 9.4l2 2"/>',
  link: '<path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5 13.5 4a3.5 3.5 0 0 1 5 5L16 11.5"/><path d="M13 17.5 10.5 20a3.5 3.5 0 0 1-5-5L8 12.5"/>',
  volume: '<polygon points="5 9.5 5 14.5 8.5 14.5 13 18.5 13 5.5 8.5 9.5"/><path d="M16.5 9a4 4 0 0 1 0 6M18.7 6.8a7 7 0 0 1 0 10.4"/>',
  mic: '<rect x="9" y="3.5" width="6" height="10.5" rx="3"/><path d="M6 11a6 6 0 0 0 12 0"/><line x1="12" y1="17" x2="12" y2="20.5"/><line x1="9" y1="20.5" x2="15" y2="20.5"/>',
  film: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><line x1="8" y1="4.5" x2="8" y2="19.5"/><line x1="16" y1="4.5" x2="16" y2="19.5"/><line x1="3.5" y1="9" x2="8" y2="9"/><line x1="3.5" y1="15" x2="8" y2="15"/><line x1="16" y1="9" x2="20.5" y2="9"/><line x1="16" y1="15" x2="20.5" y2="15"/>',
  music: '<path d="M9 17.5V5.5l10-2v12"/><circle cx="7" cy="17.5" r="2.3"/><circle cx="17" cy="15.5" r="2.3"/>',
  server: '<rect x="3.5" y="4.5" width="17" height="6" rx="1.5"/><rect x="3.5" y="13.5" width="17" height="6" rx="1.5"/><circle cx="7" cy="7.5" r=".8"/><circle cx="7" cy="16.5" r=".8"/>',
  message: '<path d="M4 5.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9l-4.5 4V16H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z"/>',
  qrcode: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><line x1="14" y1="14" x2="14" y2="20.5"/><line x1="20.5" y1="14" x2="20.5" y2="20.5"/><line x1="17.3" y1="14" x2="17.3" y2="17.3"/><line x1="14" y1="17.3" x2="20.5" y2="17.3"/>',
  scan: '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><line x1="4" y1="12" x2="20" y2="12"/>',
  shield: '<path d="M12 3.5 19 6v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6Z"/><polyline points="9 12 11.2 14.2 15.5 9.5"/>',
  barcode: '<line x1="4" y1="4" x2="4" y2="20"/><line x1="7.5" y1="4" x2="7.5" y2="20"/><line x1="10" y1="4" x2="10" y2="20"/><line x1="13" y1="4" x2="13" y2="20"/><line x1="14.5" y1="4" x2="14.5" y2="20"/><line x1="17.5" y1="4" x2="17.5" y2="20"/><line x1="20" y1="4" x2="20" y2="20"/>',
  star: '<polygon points="12 3.5 14.6 9 20.5 9.8 16.2 13.8 17.3 19.8 12 16.8 6.7 19.8 7.8 13.8 3.5 9.8 9.4 9"/>',
  play: '<polygon points="7 4.5 19 12 7 19.5"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
};

// Rend une icône SVG en ligne, à partir de sa clé dans ICONS.
// Se comporte comme un caractère : sa taille suit le font-size du parent
// (comme le faisaient les émojis), sa couleur suit le "color" du parent.
export function icon(name, extraClass = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.7');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'icon' + (extraClass ? ' ' + extraClass : ''));
  svg.innerHTML = ICONS[name] || ICONS.tool;
  return svg;
}

// Placeholder page for tools that are not available yet.
export function backendNotice(what) {
  return el('div', { class: 'status info' }, icon('clock'), ' ' + what + ' n\'est pas disponible pour le moment. Revenez bientôt !');
}
