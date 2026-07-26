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
    el('div', { class: 'dz-icon' }, '📂'),
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

// Placeholder page for tools that are not available yet.
export function backendNotice(what) {
  return status('⏳ ' + what + ' n\'est pas disponible pour le moment. Revenez bientôt !', 'info');
}

