import { el, panel, field, button, status, copyBtn, backendNotice, toolArticle } from '../ui.js';

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
      root.append(toolArticle({
        intro: [
          'Ce résumeur repère automatiquement les phrases les plus représentatives d\'un texte, en s\'appuyant sur la fréquence des mots importants qu\'elles contiennent. C\'est ce qu\'on appelle un résumé "extractif" : il ne reformule pas le texte, il sélectionne et assemble directement les phrases jugées les plus significatives.',
          'Cette approche, entièrement calculée dans votre navigateur, est rapide et ne nécessite aucun service externe, mais reste plus simple qu\'un résumé "génératif" produit par une intelligence artificielle qui reformulerait le contenu avec ses propres mots.',
        ],
        steps: [
          'Collez le texte à résumer dans la zone prévue.',
          'Choisissez le nombre de phrases souhaitées dans le résumé.',
          'Le résumé se génère automatiquement à partir des phrases les plus représentatives.',
        ],
        tips: [
          'Ce type de résumé fonctionne mieux sur des textes structurés (articles, rapports) que sur des textes très courts ou très familiers.',
          'Pour un texte très long, commencez avec un nombre de phrases plus élevé, puis réduisez progressivement pour ne garder que l\'essentiel.',
        ],
        faq: [
          { q: 'Pourquoi le résumé n\'est-il pas reformulé avec d\'autres mots ?', a: 'Ce résumeur fonctionne par extraction : il sélectionne les phrases originales les plus importantes plutôt que de générer un nouveau texte, contrairement à un résumé produit par une IA générative.' },
          { q: 'Le texte est-il envoyé à un serveur pour être résumé ?', a: 'Non, l\'analyse se fait entièrement dans votre navigateur : le texte que vous collez n\'est jamais transmis à un serveur externe.' },
        ],
      }));
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
      root.append(toolArticle({
        intro: [
          'Ce traducteur permet de traduire un texte entre onze langues, en s\'appuyant sur l\'API publique MyMemory, une base de données de traductions collaborative largement utilisée. Il convient pour traduire rapidement un message, une phrase ou un court paragraphe.',
        ],
        steps: [
          'Choisissez la langue de départ et la langue d\'arrivée.',
          'Saisissez ou collez le texte à traduire.',
          'Cliquez sur "Traduire" pour obtenir le résultat, puis copiez-le si besoin.',
        ],
        tips: [
          'Pour des textes courts et des phrases courantes, la traduction automatique est généralement fiable ; pour un contenu professionnel ou sensible (contrat, document officiel), une relecture humaine reste recommandée.',
          'Des phrases simples et bien ponctuées se traduisent généralement mieux que des tournures complexes ou des expressions idiomatiques.',
        ],
        faq: [
          { q: 'Cette traduction est-elle aussi précise qu\'un traducteur professionnel ?', a: 'Non, il s\'agit d\'une traduction automatique, utile pour comprendre ou communiquer rapidement, mais elle peut manquer de nuances qu\'un traducteur humain saisirait, notamment pour les expressions idiomatiques ou les textes techniques.' },
          { q: 'Y a-t-il une limite de longueur de texte ?', a: 'Le service utilisé applique une limite raisonnable par requête ; pour un texte très long, il est préférable de le diviser en plusieurs paragraphes traduits séparément.' },
        ],
      }));
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
      root.append(toolArticle({
        intro: [
          'Ce détecteur identifie la langue la plus probable d\'un texte en comptant la présence de mots très fréquents et caractéristiques de chaque langue (articles, pronoms, conjonctions comme "le", "the", "der" ou "el"). Il couvre six langues européennes courantes : français, anglais, espagnol, allemand, italien et portugais.',
        ],
        steps: [
          'Collez le texte dont vous souhaitez identifier la langue.',
          'La langue la plus probable s\'affiche automatiquement, avec le détail du nombre de mots reconnus pour chaque langue.',
        ],
        tips: [
          'Plus le texte est long, plus la détection est fiable : quelques mots seulement peuvent donner un résultat incertain.',
          'Un texte mélangeant plusieurs langues peut donner un résultat ambigu, l\'outil se basant sur la langue majoritaire.',
        ],
        faq: [
          { q: 'Pourquoi la détection est-elle incorrecte sur un texte très court ?', a: 'Avec peu de mots, la méthode statistique utilisée dispose de moins d\'indices fiables pour distinguer les langues, ce qui peut fausser le résultat.' },
          { q: 'Cet outil peut-il détecter d\'autres langues que les six proposées ?', a: 'Non, il compare uniquement le texte aux profils de mots fréquents des six langues intégrées ; une langue non couverte (comme le japonais ou l\'arabe) ne sera pas correctement identifiée.' },
        ],
      }));
    },
  },
  'paraphrase': {
    name: 'Reformulation IA', icon: '♻️', desc: 'Reformulez un texte avec l\'IA.', cat: 'ai', badge: 'API',
    render(root) { root.append(panel(backendNotice('La reformulation générative'))); },
  },
};
