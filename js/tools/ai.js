import { el, panel, field, button, status, copyBtn, backendNotice } from '../ui.js';

const LANGS = { fr: 'Français', en: 'Anglais', es: 'Espagnol', de: 'Allemand', it: 'Italien', pt: 'Portugais', nl: 'Néerlandais', ar: 'Arabe', ru: 'Russe', zh: 'Chinois', ja: 'Japonais' };

export const tools = {
  'summarize': {
    name: 'Résumé automatique', icon: '📝', desc: 'Résumé extractif d\'un texte (les phrases clés).', cat: 'ai',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { placeholder: 'Collez un texte long…', style: 'min-height:160px' });
      const n = el('input', { type: 'number', value: '3', min: '1', max: '10' });
      const out = el('div', { class: 'output' });
      const go = () => {
        const text = inp.value.trim();
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        const words = text.toLowerCase().match(/[\p{L}]{4,}/gu) || [];
        const freq = {}; words.forEach(w => freq[w] = (freq[w] || 0) + 1);
        const scored = sentences.map((s, i) => ({ s, i, score: (s.toLowerCase().match(/[\p{L}]{4,}/gu) || []).reduce((a, w) => a + (freq[w] || 0), 0) / Math.max(1, s.split(' ').length) }));
        const top = scored.sort((a, b) => b.score - a.score).slice(0, +n.value).sort((a, b) => a.i - b.i);
        out.textContent = top.map(x => x.s.trim()).join(' ') || '—';
      };
      inp.addEventListener('input', go); n.addEventListener('input', go);
      p.append(field('Texte', inp), field('Nombre de phrases', n), el('div', { class: 'btn-row' }, button('Résumer', go), copyBtn(() => out.textContent)), field('Résumé', out));
      p.append(el('p', { class: 'result-note' }, 'Résumé extractif local. Pour un résumé génératif de qualité, un service IA (OpenAI, etc.) peut être branché.'));
    },
  },
  'translate': {
    name: 'Traducteur', icon: '🌐', desc: 'Traduisez un texte (via MyMemory).', cat: 'ai', badge: 'Live',
    render(root) {
      const p = panel(); root.append(p);
      const from = el('select', {}, ...Object.entries(LANGS).map(([k, v]) => el('option', { value: k }, v)));
      const to = el('select', {}, ...Object.entries(LANGS).map(([k, v]) => el('option', { value: k }, v))); to.value = 'en';
      const inp = el('textarea', {}); const out = el('textarea', { readonly: true }); const st = el('div');
      const go = async () => {
        if (!inp.value.trim()) return;
        st.innerHTML = ''; st.append(status('Traduction…', 'info'));
        try {
          const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(inp.value)}&langpair=${from.value}|${to.value}`);
          const d = await r.json();
          out.value = d.responseData.translatedText; st.innerHTML = '';
        } catch (e) { st.innerHTML = ''; st.append(status('Erreur : ' + e.message, 'err')); }
      };
      p.append(el('div', { class: 'row' }, field('De', from), field('Vers', to)), field('Texte', inp), el('div', { class: 'btn-row' }, button('Traduire', go), copyBtn(() => out.value)), st, field('Traduction', out));
    },
  },
  'language-detect': {
    name: 'Détecteur de langue', icon: '🗣️', desc: 'Devinez la langue d\'un texte.', cat: 'ai',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { placeholder: 'Collez du texte…' });
      const out = el('div');
      const profiles = {
        Français: ['le', 'la', 'les', 'de', 'et', 'un', 'une', 'est', 'que', 'pour', 'dans', 'pas', 'vous', 'nous'],
        Anglais: ['the', 'and', 'is', 'of', 'to', 'in', 'that', 'you', 'for', 'with', 'this', 'are'],
        Espagnol: ['el', 'la', 'los', 'de', 'que', 'y', 'en', 'un', 'una', 'para', 'con', 'es', 'por'],
        Allemand: ['der', 'die', 'das', 'und', 'ist', 'nicht', 'ein', 'eine', 'mit', 'für', 'auch', 'ich'],
        Italien: ['il', 'la', 'che', 'di', 'e', 'un', 'una', 'per', 'con', 'sono', 'non', 'gli'],
        Portugais: ['o', 'a', 'de', 'que', 'e', 'um', 'uma', 'para', 'com', 'não', 'os', 'as'],
      };
      const go = () => {
        const words = (inp.value.toLowerCase().match(/[\p{L}]+/gu) || []);
        if (!words.length) { out.innerHTML = ''; return; }
        const scores = Object.entries(profiles).map(([lang, set]) => [lang, words.filter(w => set.includes(w)).length]);
        scores.sort((a, b) => b[1] - a[1]);
        out.innerHTML = '';
        out.append(el('div', { class: 'kpi' }, el('div', { class: 'k' }, el('b', {}, scores[0][1] ? scores[0][0] : '?'), el('span', {}, 'Langue probable'))));
        out.append(el('table', { class: 'data', style: 'margin-top:12px' }, el('tbody', {}, ...scores.map(([l, s]) => el('tr', {}, el('th', {}, l), el('td', {}, s + ' mots courants'))))));
      };
      inp.addEventListener('input', go);
      p.append(field('Texte', inp), out);
    },
  },
  'paraphrase': {
    name: 'Reformulation IA', icon: '♻️', desc: 'Reformulez un texte avec l\'IA.', cat: 'ai', badge: 'API',
    render(root) { root.append(panel(backendNotice('La reformulation générative'))); },
  },
};
