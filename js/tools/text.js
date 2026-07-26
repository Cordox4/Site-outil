import { el, panel, field, button, status, copyBtn, loadScript, toolArticle } from '../ui.js';

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
      root.append(toolArticle({
        intro: [
          'Compter précisément les mots d\'un texte est indispensable pour respecter une contrainte de longueur : devoir scolaire, article optimisé pour le référencement, description produit, ou réponse à une offre d\'emploi limitée en caractères. Cet outil analyse votre texte en temps réel et affiche le nombre de mots, de phrases, de paragraphes et de lignes.',
        ],
        steps: [
          'Collez ou tapez votre texte dans la zone prévue.',
          'Les statistiques (mots, phrases, paragraphes, lignes) se mettent à jour automatiquement à chaque frappe.',
        ],
        tips: [
          'Le nombre de phrases est estimé à partir de la ponctuation (points, points d\'exclamation, points d\'interrogation) : des abréviations comme "M." peuvent légèrement fausser le compte.',
          'Pour un texte destiné au web, viser un nombre de mots suffisant par page aide généralement au référencement naturel, à condition que le contenu reste pertinent et non artificiellement rallongé.',
        ],
        faq: [
          { q: 'Comment est calculé le nombre de paragraphes ?', a: 'Un paragraphe correspond à un bloc de texte séparé par au moins une ligne vide ; si le texte n\'a aucune ligne vide, il est compté comme un seul paragraphe.' },
          { q: 'Le comptage prend-il en compte les espaces ?', a: 'Le nombre de mots est basé sur les suites de caractères séparées par des espaces ou sauts de ligne, indépendamment du nombre d\'espaces entre eux.' },
        ],
      }));
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
      root.append(toolArticle({
        intro: [
          'De nombreuses plateformes imposent une limite stricte de caractères : une méta-description pour le référencement (environ 155-160 caractères), une bio Twitter/X (280 caractères), un titre de fiche produit, ou une annonce publicitaire. Cet outil compte les caractères de votre texte en temps réel, avec et sans les espaces.',
        ],
        steps: [
          'Collez ou tapez votre texte.',
          'Le nombre de caractères (avec et sans espaces), de mots et de lignes s\'affiche instantanément.',
        ],
        tips: [
          'Pour une méta-description Google, visez environ 150 à 160 caractères espaces compris afin d\'éviter qu\'elle ne soit tronquée dans les résultats de recherche.',
          'Le nombre "sans espaces" est utile pour les limites de caractères qui excluent les espaces, comme certains formulaires ou certaines API.',
        ],
        faq: [
          { q: 'Pourquoi le nombre "sans espaces" est-il différent selon la mise en forme ?', a: 'Les espaces multiples, tabulations et sauts de ligne comptent tous comme des espaces retirés du calcul "sans espaces" ; un texte avec beaucoup d\'espacement aura donc un écart plus important entre les deux compteurs.' },
          { q: 'Les emojis et caractères spéciaux sont-ils comptés correctement ?', a: 'La majorité des emojis et caractères spéciaux sont comptés comme un ou plusieurs caractères selon leur encodage ; pour une limite très stricte (comme certains SMS), vérifiez toujours directement sur la plateforme cible.' },
        ],
      }));
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
      root.append(toolArticle({
        intro: [
          'Estimer le temps de lecture d\'un texte est utile pour un article de blog, un script de vidéo ou de podcast, ou une présentation à préparer. Cet outil calcule le temps de lecture silencieuse à partir du nombre de mots et d\'une vitesse de lecture ajustable, ainsi qu\'une estimation du temps de lecture à voix haute.',
        ],
        steps: [
          'Collez votre texte dans la zone prévue.',
          'Ajustez la vitesse de lecture (200 mots par minute par défaut, une moyenne courante pour un adulte).',
          'Le temps de lecture estimé et le nombre de mots s\'affichent automatiquement.',
        ],
        tips: [
          'Une vitesse de 200 à 250 mots/minute correspond à une lecture silencieuse standard ; un texte technique ou complexe se lit généralement plus lentement.',
          'Pour un script de vidéo ou de podcast, l\'estimation "à voix haute" (environ 130 mots/minute) donne une durée plus réaliste qu\'une simple lecture silencieuse.',
        ],
        faq: [
          { q: 'Pourquoi ma vitesse de lecture personnelle diffère-t-elle de l\'estimation ?', a: 'La vitesse de lecture varie fortement d\'une personne à l\'autre et selon la complexité du texte : ajustez le champ "Vitesse" pour obtenir une estimation plus proche de votre propre rythme.' },
          { q: 'Ce temps de lecture est-il utilisé par les blogs et sites d\'actualité ?', a: 'Oui, l\'indication "temps de lecture" affichée en haut de nombreux articles de blog utilise un calcul similaire, basé sur le nombre de mots divisé par une vitesse moyenne de lecture.' },
        ],
      }));
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
      root.append(toolArticle({
        intro: [
          'Le Lorem Ipsum est un texte de remplissage utilisé depuis des décennies par les designers et développeurs pour visualiser la mise en page d\'une maquette avant que le contenu définitif ne soit disponible. Son avantage est de ressembler visuellement à du texte normal (longueur des mots, ponctuation) sans distraire l\'œil avec un vrai contenu lisible.',
          'Cet outil génère du faux texte en paragraphes, phrases ou mots, en quantité personnalisable, pour remplir rapidement une maquette, un gabarit HTML ou un document de test.',
        ],
        steps: [
          'Indiquez la quantité souhaitée (nombre de paragraphes, phrases ou mots).',
          'Choisissez le type d\'unité correspondant.',
          'Cliquez sur "Générer" puis copiez le texte obtenu.',
        ],
        tips: [
          'Pour tester la mise en page d\'un article complet, privilégiez plusieurs paragraphes ; pour tester un titre ou un bouton, quelques mots suffisent.',
          'Le Lorem Ipsum ne doit jamais être laissé dans un contenu publié : pensez à le remplacer par le texte définitif avant la mise en ligne.',
        ],
        faq: [
          { q: 'D\'où vient le texte Lorem Ipsum ?', a: 'Il est dérivé d\'un texte latin classique (le "De Finibus Bonorum et Malorum" de Cicéron), utilisé dans l\'imprimerie depuis le XVIe siècle comme texte de composition type.' },
          { q: 'Pourquoi ne pas utiliser un vrai texte à la place ?', a: 'Un vrai texte, familier au lecteur, attire l\'attention sur son contenu plutôt que sur la mise en page, ce qui rend plus difficile l\'évaluation objective d\'une maquette visuelle.' },
        ],
      }));
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
      root.append(toolArticle({
        intro: [
          'Comparer deux versions d\'un texte ligne par ligne permet de repérer rapidement ce qui a changé entre deux versions d\'un document, d\'un contrat, d\'un article ou d\'un extrait de code. Cet outil met en évidence les lignes ajoutées (en vert) et supprimées (en rouge) entre le texte original et le texte modifié.',
          'L\'algorithme utilisé (plus longue sous-séquence commune) est le même principe que celui employé par la plupart des outils de contrôle de version comme Git.',
        ],
        steps: [
          'Collez le texte original dans le premier champ.',
          'Collez la version modifiée dans le second champ.',
          'Cliquez sur "Comparer" : les lignes ajoutées et supprimées s\'affichent avec un code couleur.',
        ],
        tips: [
          'Cette comparaison fonctionne ligne par ligne : si une seule ligne contient plusieurs modifications, elle apparaîtra en entier comme supprimée puis ajoutée, plutôt que surlignée mot par mot.',
          'Pour comparer efficacement deux paragraphes, assurez-vous que les retours à la ligne sont similaires dans les deux versions.',
        ],
        faq: [
          { q: 'Cet outil compare-t-il le texte mot par mot ?', a: 'Non, la comparaison se fait ligne par ligne : deux lignes identiques sauf pour un mot seront toutes deux signalées comme modifiées (une suppression et un ajout), pas surlignées au mot près.' },
          { q: 'Puis-je comparer du code source avec cet outil ?', a: 'Oui, l\'outil fonctionne avec n\'importe quel texte, y compris du code, tant qu\'il est structuré en lignes.' },
        ],
      }));
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
      root.append(toolArticle({
        intro: [
          'Le Markdown est un langage de mise en forme léger, très utilisé pour rédiger de la documentation technique, des fichiers README sur GitHub, des articles de blog ou des messages sur certaines plateformes. Il permet de structurer un texte (titres, listes, gras, citations…) avec une syntaxe simple, sans avoir à écrire de HTML.',
          'Cet outil affiche un aperçu en direct du rendu HTML de votre Markdown, ce qui permet de vérifier la mise en forme avant de publier votre contenu.',
        ],
        steps: [
          'Écrivez ou collez votre texte en Markdown dans la zone de gauche.',
          'L\'aperçu du rendu final s\'affiche automatiquement dans la zone de droite.',
        ],
        tips: [
          'Un dièse (#) crée un titre, deux astérisques (**texte**) mettent en gras, un tiret (-) crée une liste à puces, et un chevron (>) crée une citation.',
          'Le Markdown est reconnu tel quel par de nombreuses plateformes (GitHub, Discord, Notion…), ce qui en fait un format pratique à réutiliser tel quel une fois rédigé.',
        ],
        faq: [
          { q: 'Quelle est la différence entre Markdown et HTML ?', a: 'Le Markdown utilise une syntaxe simplifiée, plus rapide à écrire et à lire qu\'en HTML brut, puis est converti en HTML au moment de l\'affichage — c\'est exactement ce que fait cet outil.' },
          { q: 'Puis-je copier le résultat pour l\'utiliser ailleurs ?', a: 'L\'aperçu affiche le rendu visuel ; pour réutiliser le contenu, il est généralement préférable de copier directement le texte Markdown source, reconnu nativement par la plupart des plateformes compatibles.' },
        ],
      }));
    },
  },
};
