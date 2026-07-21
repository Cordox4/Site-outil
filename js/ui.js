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

import { EZOIC_IDS, ezoicShow, ezoicDestroy, ezoicPlaceholderDiv } from './ezoic.js';

// Reusable ad banner. Si ezoicId est fourni, insère un vrai emplacement Ezoic
// et demande son affichage ; sinon affiche juste un bloc décoratif (mode dev).
export function adInline(id = 'inline', ezoicId = null) {
  const slot = el('div', { class: 'ad-slot ad-inline', 'data-ad': id },
    ezoicId ? ezoicPlaceholderDiv(ezoicId) : el('span', { class: 'ad-label' }, 'Emplacement publicitaire'));
  if (ezoicId) ezoicShow(ezoicId);
  return slot;
}

// Interstitial ad: shows placeholder, resolves when user continues.
export function adInterstitial() {
  return new Promise((resolve) => {
    const backdrop = document.getElementById('adInterstitial');
    const btn = document.getElementById('adContinue');
    let n = 5;
    // Reconstruit le bouton à chaque appel : après un premier passage, le
    // span #adCountdown a été remplacé par du texte brut (voir plus bas),
    // donc on le recrée pour que le décompte fonctionne à chaque fois.
    btn.innerHTML = `Continuer (<span id="adCountdown">${n}</span>)`;
    const cd = document.getElementById('adCountdown');
    backdrop.hidden = false;
    btn.disabled = true;
    // On (re)demande une pub fraîche à Ezoic à chaque ouverture de la popup.
    ezoicShow(EZOIC_IDS.interstitial);
    const timer = setInterval(() => {
      n--; cd.textContent = n;
      if (n <= 0) { clearInterval(timer); btn.disabled = false; btn.textContent = 'Continuer'; }
    }, 1000);
    const onClick = () => {
      clearInterval(timer);
      backdrop.hidden = true;
      btn.removeEventListener('click', onClick);
      // On détruit l'emplacement pour repartir sur une pub neuve la prochaine fois.
      ezoicDestroy(EZOIC_IDS.interstitial);
      resolve();
    };
    btn.addEventListener('click', onClick);
  });
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

// Placeholder page for tools that are not available yet.
export function backendNotice(what) {
  return status('⏳ ' + what + ' n\'est pas disponible pour le moment. Revenez bientôt !', 'info');
}
