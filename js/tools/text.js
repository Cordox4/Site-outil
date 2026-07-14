import { el, panel, field, button, status, copyBtn, loadScript } from '../ui.js';

function countStats(s) {
  const words = (s.trim().match(/\S+/g) || []).length;
  const chars = s.length;
  const charsNoSpace = s.replace(/\s/g, '').length;
  const lines = s ? s.split(/\r\n|\r|\n/).length : 0;
  const sentences = (s.match(/[.!?]+(\s|$)/g) || []).length;
  const paragraphs = (s.split(/\n{2,}/).filter(x => x.trim()).length) || (s.trim() ? 1 : 0);
  return { words, chars, charsNoSpace, lines, sentences, paragraphs };
}
function kpi(items) {
  return el('div', { class: 'kpi' }, ...items.map(([v, l]) => el('div', { class: 'k' }, el('b', {}, v), el('span', {}, l))));
}

export const tools = {
  'word-counter': {
    name: 'Compteur de mots', icon: '🔢', desc: 'Comptez mots, phrases et paragraphes.', cat: 'text',
    render(root) {
      const p = panel(); root.append(p);
      const ta = el('textarea', { placeholder: 'Collez votre texte…' });
      const out = el('div', { style: 'margin-top:14px' });
      const upd = () => { const s = countStats(ta.value); out.innerHTML = ''; out.append(kpi([[s.words, 'Mots'], [s.sentences, 'Phrases'], [s.paragraphs, 'Paragraphes'], [s.lines, 'Lignes']])); };
      ta.addEventListener('input', upd);
      p.append(field('Texte', ta), out); upd();
    },
  },
  'char-counter': {
    name: 'Compteur de caractères', icon: '🔡', desc: 'Comptez les caractères (avec/sans espaces).', cat: 'text',
    render(root) {
      const p = panel(); root.append(p);
      const ta = el('textarea', { placeholder: 'Collez votre texte…' });
      const out = el('div', { style: 'margin-top:14px' });
      const upd = () => { const s = countStats(ta.value); out.innerHTML = ''; out.append(kpi([[s.chars, 'Caractères'], [s.charsNoSpace, 'Sans espaces'], [s.words, 'Mots'], [s.lines, 'Lignes']])); };
      ta.addEventListener('input', upd);
      p.append(field('Texte', ta), out); upd();
    },
  },
  'reading-time': {
    name: 'Lecture estimée', icon: '⏱️', desc: 'Estimez le temps de lecture.', cat: 'text',
    render(root) {
      const p = panel(); root.append(p);
      const ta = el('textarea', { placeholder: 'Collez votre texte…' });
      const wpm = el('input', { type: 'number', value: '200', min: '50' });
      const out = el('div', { style: 'margin-top:14px' });
      const upd = () => {
        const w = countStats(ta.value).words; const min = w / (+wpm.value || 200);
        const m = Math.floor(min), s = Math.round((min - m) * 60);
        out.innerHTML = ''; out.append(kpi([[w, 'Mots'], [`${m} min ${s}s`, 'Temps de lecture'], [Math.ceil(w / 130) + ' min', 'À voix haute']]));
      };
      ta.addEventListener('input', upd); wpm.addEventListener('input', upd);
      p.append(field('Texte', ta), field('Vitesse (mots/min)', wpm), out); upd();
    },
  },
  'lorem-ipsum': {
    name: 'Lorem Ipsum', icon: '📃', desc: 'Générez du faux texte de remplissage.', cat: 'text',
    render(root) {
      const p = panel(); root.append(p);
      const n = el('input', { type: 'number', value: '3', min: '1', max: '100' });
      const unit = el('select', {}, el('option', { value: 'p' }, 'Paragraphes'), el('option', { value: 's' }, 'Phrases'), el('option', { value: 'w' }, 'Mots'));
      const out = el('textarea', { class: 'mono', readonly: true });
      const W = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat'.split(' ');
      const word = () => W[Math.floor(Math.random() * W.length)];
      const sentence = () => { const len = 6 + Math.floor(Math.random() * 10); let s = Array.from({ length: len }, word).join(' '); return s[0].toUpperCase() + s.slice(1) + '.'; };
      const para = () => Array.from({ length: 4 + Math.floor(Math.random() * 4) }, sentence).join(' ');
      const gen = () => {
        const c = +n.value; let t = '';
        if (unit.value === 'w') t = Array.from({ length: c }, word).join(' ');
        else if (unit.value === 's') t = Array.from({ length: c }, sentence).join(' ');
        else t = Array.from({ length: c }, para).join('\n\n');
        out.value = t;
      };
      n.addEventListener('input', gen); unit.addEventListener('change', gen);
      p.append(el('div', { class: 'row' }, field('Quantité', n), field('Type', unit)));
      p.append(el('div', { class: 'btn-row' }, button('Générer', gen), copyBtn(() => out.value)), field('Résultat', out)); gen();
    },
  },
  'text-diff': {
    name: 'Diff texte', icon: '🔀', desc: 'Comparez deux textes ligne par ligne.', cat: 'text',
    render(root) {
      const p = panel(); root.append(p);
      const a = el('textarea', { placeholder: 'Texte original…' }), b = el('textarea', { placeholder: 'Texte modifié…' });
      const out = el('pre', { class: 'output mono' });
      const diff = () => {
        const A = a.value.split('\n'), B = b.value.split('\n');
        const m = A.length, nn = B.length; const dp = Array.from({ length: m + 1 }, () => new Array(nn + 1).fill(0));
        for (let i = m - 1; i >= 0; i--) for (let j = nn - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        const res = []; let i = 0, j = 0;
        while (i < m && j < nn) {
          if (A[i] === B[j]) { res.push('  ' + A[i]); i++; j++; }
          else if (dp[i + 1][j] >= dp[i][j + 1]) { res.push('- ' + A[i]); i++; }
          else { res.push('+ ' + B[j]); j++; }
        }
        while (i < m) res.push('- ' + A[i++]);
        while (j < nn) res.push('+ ' + B[j++]);
        out.innerHTML = '';
        res.forEach(line => {
          const c = line[0] === '+' ? 'var(--success)' : line[0] === '-' ? 'var(--danger)' : 'inherit';
          out.append(el('div', { style: 'color:' + c }, line));
        });
      };
      a.addEventListener('input', diff); b.addEventListener('input', diff);
      p.append(el('div', { class: 'row' }, field('Original', a), field('Modifié', b)));
      p.append(el('div', { class: 'btn-row' }, button('Comparer', diff)), out);
    },
  },
  'markdown-preview': {
    name: 'Markdown Preview', icon: '📝', desc: 'Prévisualisez du Markdown en direct.', cat: 'text',
    render(root) {
      const p = panel(); root.append(p);
      const src = el('textarea', { class: 'mono', placeholder: '# Titre\n\nVotre **markdown** ici…' });
      const prev = el('div', { class: 'output', style: 'min-height:120px' });
      const render = async () => {
        await loadScript('https://cdn.jsdelivr.net/npm/marked@12/marked.min.js');
        prev.innerHTML = window.marked.parse(src.value || '');
      };
      src.addEventListener('input', render);
      p.append(el('div', { class: 'row' }, field('Markdown', src), field('Aperçu', prev)));
      src.value = '# Bonjour 👋\n\nCeci est un **aperçu** Markdown.\n\n- Élément 1\n- Élément 2\n\n> Citation'; render();
    },
  },
};
