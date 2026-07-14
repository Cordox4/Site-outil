import { el, panel, field, button, status, copy, copyBtn, toast } from '../ui.js';

function hexToRgb(h) {
  h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHex(r, g, b) { return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join(''); }
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b); let h, s, l = (max + min) / 2;
  if (max === min) h = s = 0; else { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export const tools = {
  'color-palette': {
    name: 'Palette de couleurs', icon: '🎨', desc: 'Générez une palette harmonieuse.', cat: 'color',
    render(root) {
      const p = panel(); root.append(p);
      const base = el('input', { type: 'color', value: '#4f46e5' });
      const mode = el('select', {}, el('option', { value: 'ana' }, 'Analogue'), el('option', { value: 'comp' }, 'Complémentaire'), el('option', { value: 'tri' }, 'Triadique'), el('option', { value: 'mono' }, 'Monochrome'));
      const grid = el('div', { class: 'tool-grid', style: 'grid-template-columns:repeat(auto-fill,minmax(110px,1fr))' });
      const gen = () => {
        const { r, g, b } = hexToRgb(base.value); const { h, s, l } = rgbToHsl(r, g, b);
        const mk = (hh, ss, ll) => { hh = (hh + 360) % 360; ss = Math.max(0, Math.min(100, ss)); ll = Math.max(0, Math.min(100, ll)); const c = hslToHex(hh, ss, ll); return c; };
        let cols = [];
        if (mode.value === 'ana') cols = [-30, -15, 0, 15, 30].map(d => mk(h + d, s, l));
        else if (mode.value === 'comp') cols = [mk(h, s, l), mk(h, s, l + 20), mk(h + 180, s, l), mk(h + 180, s, l + 20), mk(h, s * .5, l)];
        else if (mode.value === 'tri') cols = [mk(h, s, l), mk(h + 120, s, l), mk(h + 240, s, l), mk(h + 120, s, l + 15), mk(h + 240, s, l + 15)];
        else cols = [20, 35, 50, 65, 80].map(ll => mk(h, s, ll));
        grid.innerHTML = '';
        cols.forEach(c => grid.append(el('div', { class: 'swatch', style: 'background:' + c, title: 'Copier ' + c, onclick: () => copy(c) }, c)));
      };
      base.addEventListener('input', gen); mode.addEventListener('change', gen);
      p.append(el('div', { class: 'row' }, field('Couleur de base', base), field('Harmonie', mode)), grid);
      p.append(el('p', { class: 'result-note' }, 'Cliquez sur une couleur pour la copier.')); gen();
    },
  },
  'hex-rgb': {
    name: 'HEX ↔ RGB', icon: '🌈', desc: 'Convertissez entre HEX, RGB et HSL.', cat: 'color',
    render(root) {
      const p = panel(); root.append(p);
      const pick = el('input', { type: 'color', value: '#0ea5e9' });
      const hex = el('input', { type: 'text', class: 'mono', value: '#0ea5e9' });
      const rgb = el('input', { type: 'text', class: 'mono', readonly: true });
      const hsl = el('input', { type: 'text', class: 'mono', readonly: true });
      const upd = (h) => { const { r, g, b } = hexToRgb(h); const s = rgbToHsl(r, g, b); rgb.value = `rgb(${r}, ${g}, ${b})`; hsl.value = `hsl(${s.h}, ${s.s}%, ${s.l}%)`; pick.value = rgbToHex(r, g, b); hex.value = rgbToHex(r, g, b); };
      pick.addEventListener('input', () => upd(pick.value));
      hex.addEventListener('input', () => { try { upd(hex.value); } catch {} });
      p.append(el('div', { class: 'row' }, field('Sélecteur', pick), field('HEX', hex)), el('div', { class: 'row' }, field('RGB', rgb), field('HSL', hsl)));
      p.append(el('div', { class: 'btn-row' }, copyBtn(() => hex.value, 'Copier HEX'), copyBtn(() => rgb.value, 'Copier RGB'), copyBtn(() => hsl.value, 'Copier HSL')));
      upd('#0ea5e9');
    },
  },
  'css-gradient': {
    name: 'Gradient CSS', icon: '🌅', desc: 'Créez un dégradé CSS visuellement.', cat: 'color',
    render(root) {
      const p = panel(); root.append(p);
      const c1 = el('input', { type: 'color', value: '#4f46e5' }), c2 = el('input', { type: 'color', value: '#0ea5e9' });
      const angle = el('input', { type: 'range', min: '0', max: '360', value: '135' });
      const preview = el('div', { style: 'height:140px;border-radius:12px;border:1px solid var(--border)' });
      const code = el('input', { type: 'text', class: 'mono', readonly: true });
      const upd = () => { const g = `linear-gradient(${angle.value}deg, ${c1.value}, ${c2.value})`; preview.style.background = g; code.value = 'background: ' + g + ';'; };
      [c1, c2, angle].forEach(e => e.addEventListener('input', upd));
      p.append(el('div', { class: 'row' }, field('Couleur 1', c1), field('Couleur 2', c2)), field('Angle', angle), preview, el('div', { style: 'margin-top:12px' }, field('CSS', code)), el('div', { class: 'btn-row' }, copyBtn(() => code.value))); upd();
    },
  },
  'css-box-shadow': {
    name: 'Box Shadow CSS', icon: '🌫️', desc: 'Générez une ombre CSS.', cat: 'color',
    render(root) {
      const p = panel(); root.append(p);
      const x = el('input', { type: 'range', min: '-50', max: '50', value: '0' });
      const y = el('input', { type: 'range', min: '-50', max: '50', value: '10' });
      const blur = el('input', { type: 'range', min: '0', max: '100', value: '20' });
      const spread = el('input', { type: 'range', min: '-50', max: '50', value: '0' });
      const col = el('input', { type: 'color', value: '#000000' });
      const alpha = el('input', { type: 'range', min: '0', max: '1', step: '0.05', value: '0.25' });
      const box = el('div', { style: 'width:120px;height:120px;margin:20px auto;border-radius:16px;background:var(--surface-2)' });
      const code = el('input', { type: 'text', class: 'mono', readonly: true });
      const upd = () => {
        const { r, g, b } = hexToRgb(col.value);
        const sh = `${x.value}px ${y.value}px ${blur.value}px ${spread.value}px rgba(${r},${g},${b},${alpha.value})`;
        box.style.boxShadow = sh; code.value = 'box-shadow: ' + sh + ';';
      };
      [x, y, blur, spread, col, alpha].forEach(e => e.addEventListener('input', upd));
      p.append(el('div', { class: 'row' }, field('Décalage X', x), field('Décalage Y', y)), el('div', { class: 'row' }, field('Flou', blur), field('Étendue', spread)), el('div', { class: 'row' }, field('Couleur', col), field('Opacité', alpha)), box, field('CSS', code), el('div', { class: 'btn-row' }, copyBtn(() => code.value))); upd();
    },
  },
  'css-border-radius': {
    name: 'Border Radius CSS', icon: '⬜', desc: 'Ajustez les coins arrondis.', cat: 'color',
    render(root) {
      const p = panel(); root.append(p);
      const tl = el('input', { type: 'range', min: '0', max: '100', value: '20' });
      const tr = el('input', { type: 'range', min: '0', max: '100', value: '20' });
      const br = el('input', { type: 'range', min: '0', max: '100', value: '20' });
      const bl = el('input', { type: 'range', min: '0', max: '100', value: '20' });
      const box = el('div', { style: 'width:160px;height:160px;margin:20px auto;background:linear-gradient(135deg,var(--primary),var(--accent))' });
      const code = el('input', { type: 'text', class: 'mono', readonly: true });
      const upd = () => { const v = `${tl.value}px ${tr.value}px ${br.value}px ${bl.value}px`; box.style.borderRadius = v; code.value = 'border-radius: ' + v + ';'; };
      [tl, tr, br, bl].forEach(e => e.addEventListener('input', upd));
      p.append(el('div', { class: 'row' }, field('Haut gauche', tl), field('Haut droit', tr)), el('div', { class: 'row' }, field('Bas droit', br), field('Bas gauche', bl)), box, field('CSS', code), el('div', { class: 'btn-row' }, copyBtn(() => code.value))); upd();
    },
  },
  'minify-css': {
    name: 'Minifier CSS', icon: '📉', desc: 'Réduisez la taille d\'un code CSS.', cat: 'color',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono', placeholder: '.a { color: red; }' });
      const out = el('pre', { class: 'output mono' }); const st = el('div');
      const go = () => {
        const r = inp.value.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').replace(/\s+/g, ' ').trim();
        out.textContent = r; st.innerHTML = '';
        if (inp.value.length) st.append(status(`${inp.value.length} → ${r.length} caractères (${Math.round((1 - r.length / inp.value.length) * 100)}% en moins)`, 'ok'));
      };
      inp.addEventListener('input', go);
      p.append(field('CSS', inp), el('div', { class: 'btn-row' }, button('Minifier', go), copyBtn(() => out.textContent)), st, field('Résultat', out));
    },
  },
};

function hslToHex(h, s, l) {
  s /= 100; l /= 100; const k = n => (n + h / 30) % 12; const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}
