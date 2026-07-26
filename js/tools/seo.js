import { el, panel, field, button, status, copyBtn, toolArticle } from '../ui.js';

export const tools = {
  'sitemap-generator': {
    name: 'Générateur de sitemap', icon: '🗺️', desc: 'Créez un sitemap.xml à partir d\'une liste d\'URL.', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono', placeholder: 'https://exemple.com/\nhttps://exemple.com/blog' });
      const freq = el('select', {}, ...['always', 'daily', 'weekly', 'monthly', 'yearly'].map(f => el('option', {}, f)));
      const out = el('pre', { class: 'output mono' });
      const go = () => {
        const urls = inp.value.split('\n').map(u => u.trim()).filter(Boolean);
        const today = new Date().toISOString().slice(0, 10);
        out.textContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          urls.map(u => `  <url>\n    <loc>${u.replace(/&/g, '&amp;')}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq.value}</changefreq>\n  </url>`).join('\n') +
          `\n</urlset>`;
      };
      inp.addEventListener('input', go); freq.addEventListener('change', go);
      p.append(field('Une URL par ligne', inp), field('Fréquence', freq), el('div', { class: 'btn-row' }, button('Générer', go), copyBtn(() => out.textContent)), field('sitemap.xml', out));
      root.append(toolArticle({
        intro: [
          'Un sitemap XML est un fichier qui liste toutes les pages importantes d\'un site web, afin d\'aider les moteurs de recherche comme Google à les découvrir et les indexer plus efficacement. C\'est un élément recommandé pour le référencement naturel, en particulier pour les sites récents ou volumineux.',
          'Cet outil génère un fichier sitemap.xml valide à partir d\'une simple liste d\'URL, avec la date de dernière modification et la fréquence de mise à jour de votre choix.',
        ],
        steps: [
          'Collez la liste de vos URL, une par ligne.',
          'Choisissez la fréquence de mise à jour approximative de vos pages.',
          'Copiez le fichier XML généré et enregistrez-le sous le nom "sitemap.xml" à la racine de votre site.',
        ],
        tips: [
          'Une fois votre sitemap en ligne, soumettez-le dans Google Search Console pour accélérer sa prise en compte par Google.',
          'N\'incluez que les pages que vous souhaitez réellement voir indexées ; évitez d\'y lister des pages de connexion, d\'administration ou dupliquées.',
        ],
        faq: [
          { q: 'Où dois-je placer le fichier sitemap.xml ?', a: 'Il doit être accessible à la racine de votre site, généralement à l\'adresse https://votresite.com/sitemap.xml, puis référencé dans votre fichier robots.txt.' },
          { q: 'Un sitemap améliore-t-il directement mon classement Google ?', a: 'Non, il n\'a pas d\'effet direct sur le classement, mais il facilite la découverte et l\'indexation de vos pages par les moteurs de recherche, ce qui est une condition préalable à un bon référencement.' },
        ],
      }));
    },
  },
  'robots-txt': {
    name: 'Générateur robots.txt', icon: '🤖', desc: 'Créez un fichier robots.txt.', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const agent = el('input', { type: 'text', value: '*' });
      const allow = el('textarea', { placeholder: '/', style: 'min-height:70px' });
      const disallow = el('textarea', { placeholder: '/admin\n/private', style: 'min-height:70px' });
      const sitemap = el('input', { type: 'url', placeholder: 'https://exemple.com/sitemap.xml' });
      const out = el('pre', { class: 'output mono' });
      const go = () => {
        let t = `User-agent: ${agent.value || '*'}\n`;
        disallow.value.split('\n').map(x => x.trim()).filter(Boolean).forEach(x => t += `Disallow: ${x}\n`);
        allow.value.split('\n').map(x => x.trim()).filter(Boolean).forEach(x => t += `Allow: ${x}\n`);
        if (sitemap.value) t += `\nSitemap: ${sitemap.value}\n`;
        out.textContent = t.trim();
      };
      [agent, allow, disallow, sitemap].forEach(e => e.addEventListener('input', go));
      p.append(field('User-agent', agent), el('div', { class: 'row' }, field('Autoriser (Allow)', allow), field('Interdire (Disallow)', disallow)), field('Sitemap', sitemap), el('div', { class: 'btn-row' }, button('Générer', go), copyBtn(() => out.textContent)), field('robots.txt', out)); go();
      root.append(toolArticle({
        intro: [
          'Le fichier robots.txt indique aux robots des moteurs de recherche quelles parties de votre site ils sont autorisés ou non à explorer. Il se place à la racine du site (https://votresite.com/robots.txt) et est lu automatiquement par Google, Bing et les autres moteurs avant d\'explorer vos pages.',
          'Cet outil génère un fichier robots.txt valide à partir de règles simples : autoriser ou interdire certains chemins, et indiquer l\'emplacement de votre sitemap.',
        ],
        steps: [
          'Indiquez le robot concerné (laissez "*" pour s\'appliquer à tous les robots).',
          'Listez les chemins à autoriser et/ou à interdire, un par ligne.',
          'Ajoutez l\'URL de votre sitemap si vous en avez un.',
          'Copiez le résultat et enregistrez-le sous le nom "robots.txt" à la racine de votre site.',
        ],
        tips: [
          'Bloquer une page dans robots.txt empêche son exploration, mais ne garantit pas qu\'elle ne sera jamais indexée si d\'autres sites pointent vers elle ; pour empêcher totalement l\'indexation, utilisez plutôt une balise meta "noindex" sur la page elle-même.',
          'Un fichier robots.txt mal configuré peut accidentellement bloquer l\'exploration de tout votre site : vérifiez toujours le résultat avant de le publier.',
        ],
        faq: [
          { q: 'Le fichier robots.txt est-il obligatoire ?', a: 'Non, il n\'est pas obligatoire ; en son absence, les moteurs de recherche explorent généralement l\'ensemble du site accessible publiquement.' },
          { q: 'Comment interdire l\'exploration de tout le site ?', a: 'Indiquez "/" dans le champ "Interdire (Disallow)" avec le user-agent "*" ; attention, cela empêchera tous les moteurs de recherche d\'explorer votre site tant que cette règle reste active.' },
        ],
      }));
    },
  },
  'meta-analyzer': {
    name: 'Analyse meta', icon: '🏷️', desc: 'Analysez les balises meta d\'une page (collez le HTML).', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono', placeholder: 'Collez le code source HTML de la page…' });
      const out = el('div');
      const go = () => {
        const doc = new DOMParser().parseFromString(inp.value, 'text/html');
        const get = (sel, attr = 'content') => { const e = doc.querySelector(sel); return e ? (attr === 'text' ? e.textContent : e.getAttribute(attr)) : null; };
        const checks = [
          ['Titre', get('title', 'text'), t => t && t.length >= 10 && t.length <= 60],
          ['Description', get('meta[name="description"]'), t => t && t.length >= 50 && t.length <= 160],
          ['Canonical', get('link[rel="canonical"]', 'href'), t => !!t],
          ['Open Graph title', get('meta[property="og:title"]'), t => !!t],
          ['Open Graph image', get('meta[property="og:image"]'), t => !!t],
          ['Viewport', get('meta[name="viewport"]'), t => !!t],
          ['Robots', get('meta[name="robots"]'), () => true],
        ];
        out.innerHTML = '';
        const t = el('table', { class: 'data' }, el('tbody', {}, ...checks.map(([label, val, ok]) =>
          el('tr', {}, el('th', {}, label), el('td', {}, val || '—'), el('td', { style: 'color:' + (ok(val) ? 'var(--success)' : 'var(--danger)') }, ok(val) ? '✔' : '✕')))));
        out.append(t);
      };
      inp.addEventListener('input', go);
      p.append(field('Code HTML', inp), field('Analyse', out));
      root.append(toolArticle({
        intro: [
          'Les balises meta (titre, description, Open Graph, viewport…) situées dans l\'en-tête d\'une page HTML jouent un rôle important pour le référencement et l\'aperçu affiché lors d\'un partage sur les réseaux sociaux. Cet outil analyse le code source d\'une page et vérifie la présence et la longueur des balises meta les plus importantes.',
        ],
        steps: [
          'Ouvrez le code source de la page à analyser (clic droit → "Afficher le code source" dans votre navigateur) et copiez-le.',
          'Collez le code HTML dans la zone prévue.',
          'Le tableau d\'analyse indique, pour chaque balise, sa valeur et si elle respecte les bonnes pratiques courantes.',
        ],
        tips: [
          'Une balise titre efficace fait généralement entre 10 et 60 caractères ; une meta description efficace fait entre 50 et 160 caractères pour éviter d\'être tronquée dans les résultats Google.',
          'Les balises Open Graph (og:title, og:image) contrôlent l\'aperçu affiché lorsque votre page est partagée sur Facebook, LinkedIn ou d\'autres réseaux sociaux : leur absence peut donner un aperçu de partage peu engageant.',
        ],
        faq: [
          { q: 'Où trouver le code source HTML d\'une page ?', a: 'Dans la plupart des navigateurs, faites un clic droit sur la page puis choisissez "Afficher le code source de la page", ou utilisez le raccourci Ctrl+U (Cmd+Option+U sur Mac).' },
          { q: 'Que faire si une balise importante est manquante ?', a: 'Ajoutez la balise manquante dans le <head> de votre page HTML ; pour la meta description par exemple : <meta name="description" content="Votre description ici">.' },
        ],
      }));
    },
  },
  'heading-analyzer': {
    name: 'Analyse des titres SEO', icon: '📰', desc: 'Vérifiez la structure H1-H6 (collez le HTML).', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono', placeholder: 'Collez le HTML…' });
      const out = el('div'); const st = el('div');
      const go = () => {
        const doc = new DOMParser().parseFromString(inp.value, 'text/html');
        const hs = [...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')];
        out.innerHTML = ''; st.innerHTML = '';
        const h1 = hs.filter(h => h.tagName === 'H1').length;
        st.append(status(`${hs.length} titre(s) — ${h1} H1` + (h1 === 1 ? ' ✔' : h1 === 0 ? ' (aucun H1 !)' : ' (plusieurs H1 !)'), h1 === 1 ? 'ok' : 'err'));
        out.append(el('div', { class: 'output' }, ...hs.map(h => el('div', { style: 'padding-left:' + (+h.tagName[1] - 1) * 18 + 'px' }, `${h.tagName} — ${h.textContent.trim().slice(0, 90)}`))));
      };
      inp.addEventListener('input', go);
      p.append(field('Code HTML', inp), st, field('Structure', out));
      root.append(toolArticle({
        intro: [
          'La structure des titres (H1 à H6) d\'une page web aide les moteurs de recherche et les lecteurs à comprendre l\'organisation hiérarchique du contenu, un peu comme un plan ou une table des matières. Une bonne pratique SEO largement reconnue consiste à n\'utiliser qu\'un seul H1 par page (le titre principal), puis à structurer le reste du contenu avec des H2, H3, etc.',
          'Cet outil analyse le code HTML d\'une page et affiche la hiérarchie complète de ses titres, en signalant si la règle du H1 unique est respectée.',
        ],
        steps: [
          'Collez le code source HTML de la page à analyser.',
          'La structure des titres s\'affiche avec leur niveau hiérarchique visuel.',
          'Vérifiez le message concernant le nombre de H1 détectés.',
        ],
        tips: [
          'Un H1 unique et clair, reprenant le sujet principal de la page, est une bonne pratique SEO largement recommandée.',
          'Évitez de sauter des niveaux (passer directement d\'un H2 à un H4 sans H3), ce qui peut nuire à la clarté de la structure pour les moteurs de recherche et les lecteurs d\'écran.',
        ],
        faq: [
          { q: 'Pourquoi avoir plusieurs H1 pose-t-il problème ?', a: 'Plusieurs H1 peuvent diluer le signal donné aux moteurs de recherche sur le sujet principal de la page ; la pratique recommandée reste un seul H1 par page pour une hiérarchie claire.' },
          { q: 'La structure des titres a-t-elle un impact direct sur le classement Google ?', a: 'Son impact direct est modéré, mais une structure claire améliore l\'accessibilité (notamment pour les lecteurs d\'écran) et aide les moteurs de recherche à mieux comprendre le contenu, ce qui reste bénéfique indirectement.' },
        ],
      }));
    },
  },
  'keyword-density': {
    name: 'Densité de mots-clés', icon: '📈', desc: 'Analysez la fréquence des mots d\'un texte.', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { placeholder: 'Collez votre texte…' });
      const out = el('div');
      const stop = new Set('le la les un une des de du et à a en au aux ce cette ces pour par sur dans que qui est sont avec ne pas plus se son sa ses on nous vous ils elles il elle its the a an of to and in is are for on with'.split(' '));
      const go = () => {
        const words = (inp.value.toLowerCase().match(/[\p{L}\p{N}'-]{3,}/gu) || []).filter(w => !stop.has(w));
        const total = words.length; const freq = {}; words.forEach(w => freq[w] = (freq[w] || 0) + 1);
        const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20);
        out.innerHTML = '';
        out.append(el('table', { class: 'data' }, el('thead', {}, el('tr', {}, el('th', {}, 'Mot'), el('th', {}, 'Occurrences'), el('th', {}, 'Densité'))),
          el('tbody', {}, ...top.map(([w, c]) => el('tr', {}, el('td', {}, w), el('td', {}, c), el('td', {}, (c / total * 100).toFixed(2) + '%'))))));
      };
      inp.addEventListener('input', go);
      p.append(field('Texte', inp), field('Top 20 mots-clés', out));
      root.append(toolArticle({
        intro: [
          'La densité de mots-clés mesure la fréquence à laquelle un mot apparaît dans un texte, en pourcentage du nombre total de mots. Cet outil analyse un texte, retire automatiquement les mots outils très courants (comme "le", "de", "et"), et affiche les 20 mots les plus fréquents avec leur densité.',
          'Cette analyse est utile pour vérifier qu\'un article de blog ou une fiche produit met suffisamment en avant ses mots-clés cibles, sans pour autant tomber dans la répétition excessive, mal perçue par les moteurs de recherche.',
        ],
        steps: [
          'Collez le texte à analyser.',
          'Le tableau des mots les plus fréquents s\'affiche automatiquement, avec leur nombre d\'occurrences et leur densité en pourcentage.',
        ],
        tips: [
          'Une densité de mot-clé principal autour de 1 à 2 % est généralement considérée comme naturelle ; au-delà de 3-4 %, le texte peut paraître sur-optimisé et artificiel, tant pour les lecteurs que pour les moteurs de recherche.',
          'Privilégiez toujours un texte naturel et utile au lecteur : les moteurs de recherche modernes évaluent la pertinence globale d\'un contenu, pas uniquement la répétition mécanique de mots-clés.',
        ],
        faq: [
          { q: 'Une densité élevée améliore-t-elle le référencement ?', a: 'Non, répéter artificiellement un mot-clé (pratique appelée "bourrage de mots-clés") est généralement pénalisé par Google plutôt que récompensé ; la qualité et la pertinence du contenu comptent davantage que la simple répétition.' },
          { q: 'Pourquoi certains mots courants n\'apparaissent-ils pas dans le tableau ?', a: 'L\'outil filtre automatiquement les mots outils très fréquents (articles, prépositions, pronoms) qui n\'apportent pas d\'information sur le sujet du texte, afin de se concentrer sur les mots réellement significatifs.' },
        ],
      }));
    },
  },
  'keyword-extractor': {
    name: 'Extracteur de mots-clés', icon: '🔑', desc: 'Extrayez les expressions clés (bigrammes).', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { placeholder: 'Collez votre texte…' });
      const out = el('div');
      const stop = new Set('le la les un une des de du et à a en au aux ce cette ces pour par sur dans que qui est sont avec ne pas plus'.split(' '));
      const go = () => {
        const words = (inp.value.toLowerCase().match(/[\p{L}\p{N}'-]{3,}/gu) || []);
        const grams = {};
        for (let i = 0; i < words.length - 1; i++) { if (stop.has(words[i]) || stop.has(words[i + 1])) continue; const g = words[i] + ' ' + words[i + 1]; grams[g] = (grams[g] || 0) + 1; }
        const top = Object.entries(grams).filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]).slice(0, 15);
        out.innerHTML = '';
        out.append(top.length ? el('table', { class: 'data' }, el('tbody', {}, ...top.map(([g, c]) => el('tr', {}, el('td', {}, g), el('td', {}, c + '×')))))
          : status('Ajoutez plus de texte pour extraire des expressions récurrentes.', 'info'));
      };
      inp.addEventListener('input', go);
      p.append(field('Texte', inp), field('Expressions clés', out));
      root.append(toolArticle({
        intro: [
          'Au-delà des mots isolés, ce sont souvent des expressions de deux mots (bigrammes) qui reflètent le mieux le sujet réel d\'un texte : "intelligence artificielle" est plus précis que "intelligence" et "artificielle" pris séparément. Cet outil détecte automatiquement les expressions de deux mots qui reviennent plusieurs fois dans votre texte, en ignorant les mots outils.',
        ],
        steps: [
          'Collez le texte à analyser.',
          'Les expressions clés récurrentes s\'affichent automatiquement, classées par fréquence.',
        ],
        tips: [
          'Utilisez les expressions extraites pour vérifier que votre contenu couvre bien les thématiques attendues, ou pour identifier des expressions à cibler dans votre stratégie de contenu.',
          'Un texte trop court ne fera apparaître aucune expression récurrente : l\'analyse nécessite un minimum de contenu pour être pertinente.',
        ],
        faq: [
          { q: 'Pourquoi aucune expression ne s\'affiche-t-elle ?', a: 'L\'outil n\'affiche que les expressions apparaissant au moins deux fois dans le texte ; un texte trop court ou trop varié peut ne générer aucune répétition détectable.' },
          { q: 'Cet outil peut-il extraire des expressions de trois mots ou plus ?', a: 'Non, il se limite aux bigrammes (expressions de deux mots), qui offrent un bon compromis entre pertinence et simplicité de détection pour ce type d\'analyse rapide.' },
        ],
      }));
    },
  },
  'slug-generator': {
    name: 'Générateur de slug', icon: '🔗', desc: 'Créez un slug URL propre.', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('input', { type: 'text', placeholder: 'Mon Super Article !' });
      const out = el('input', { type: 'text', class: 'mono', readonly: true });
      const go = () => { out.value = inp.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); };
      inp.addEventListener('input', go);
      p.append(field('Texte', inp), el('div', { class: 'btn-row' }, copyBtn(() => out.value)), field('Slug', out));
      root.append(toolArticle({
        intro: [
          'Un slug est la partie d\'une URL qui identifie une page de façon lisible, comme "mon-super-article" dans www.exemple.com/blog/mon-super-article. Un bon slug est court, en minuscules, sans accents ni caractères spéciaux, avec des mots séparés par des tirets — un format à la fois lisible pour les humains et bien interprété par les moteurs de recherche.',
          'Cet outil transforme automatiquement n\'importe quel titre ou texte en slug propre et conforme aux bonnes pratiques SEO.',
        ],
        steps: [
          'Saisissez le titre ou le texte à transformer.',
          'Le slug généré s\'affiche instantanément, prêt à être copié.',
        ],
        tips: [
          'Un slug court et descriptif, incluant si possible le mot-clé principal de la page, est généralement recommandé pour le référencement.',
          'Une fois une page publiée et indexée, évitez de modifier son slug sans mettre en place une redirection, sous peine de casser les liens existants et de perdre le référencement acquis.',
        ],
        faq: [
          { q: 'Pourquoi les accents sont-ils supprimés ?', a: 'Les URL doivent utiliser un jeu de caractères limité pour rester compatibles avec tous les navigateurs et systèmes ; les accents sont donc retirés et remplacés par leur équivalent sans accent.' },
          { q: 'Quelle est la différence entre un slug et une URL complète ?', a: 'Le slug est uniquement la partie finale et lisible de l\'URL identifiant une page précise, tandis que l\'URL complète inclut aussi le protocole, le nom de domaine et éventuellement des dossiers intermédiaires.' },
        ],
      }));
    },
  },
  'url-encode': {
    name: 'URL Encoder', icon: '🔗', desc: 'Encodez une chaîne pour une URL.', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono' }); const out = el('textarea', { class: 'mono', readonly: true });
      const go = () => { out.value = encodeURIComponent(inp.value); }; inp.addEventListener('input', go);
      p.append(field('Texte', inp), el('div', { class: 'btn-row' }, copyBtn(() => out.value)), field('Encodé', out));
      root.append(toolArticle({
        intro: [
          'L\'encodage d\'URL (URL encoding, ou "percent-encoding") convertit les caractères spéciaux, espaces et accents d\'un texte en une représentation sûre pour être utilisée dans une URL, où seuls certains caractères sont autorisés tels quels. C\'est indispensable, par exemple, pour transmettre un paramètre contenant des espaces ou des caractères accentués dans un lien.',
        ],
        steps: [
          'Collez le texte à encoder.',
          'Le résultat encodé s\'affiche automatiquement, prêt à être copié.',
        ],
        tips: [
          'Un espace devient "%20", un "é" devient "%C3%A9" : ces séquences peuvent sembler complexes, mais elles garantissent que le texte reste interprété correctement une fois inséré dans une URL.',
          'Cet encodage est couramment utilisé pour construire des paramètres d\'URL, par exemple dans une requête de recherche ou un lien de partage sur les réseaux sociaux.',
        ],
        faq: [
          { q: 'Pourquoi certains caractères ne changent-ils pas après l\'encodage ?', a: 'Les lettres, chiffres et quelques symboles (comme le tiret ou le point) sont déjà valides dans une URL et n\'ont donc pas besoin d\'être encodés.' },
          { q: 'Dois-je encoder une URL complète avec cet outil ?', a: 'Non, cet outil encode un texte entier, y compris les caractères "/" et ":" qui doivent rester tels quels dans une URL complète ; il est destiné à encoder un fragment de texte ou un paramètre, pas une adresse entière.' },
        ],
      }));
    },
  },
  'url-decode': {
    name: 'URL Decoder', icon: '🔗', desc: 'Décodez une chaîne URL.', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono' }); const out = el('textarea', { class: 'mono', readonly: true });
      const go = () => { try { out.value = decodeURIComponent(inp.value); } catch { out.value = 'Séquence invalide'; } }; inp.addEventListener('input', go);
      p.append(field('Encodé', inp), el('div', { class: 'btn-row' }, copyBtn(() => out.value)), field('Décodé', out));
      root.append(toolArticle({
        intro: [
          'Cet outil effectue l\'opération inverse de l\'encodage d\'URL : il convertit une chaîne encodée (contenant des séquences comme "%20" ou "%C3%A9") en texte lisible normal. C\'est utile pour comprendre le contenu réel d\'un lien complexe copié depuis un navigateur, ou pour déboguer un paramètre d\'URL.',
        ],
        steps: [
          'Collez la chaîne encodée (contenant des symboles %XX) dans le champ prévu.',
          'Le texte décodé s\'affiche automatiquement.',
        ],
        tips: [
          'Si le résultat affiche "Séquence invalide", vérifiez que le texte collé est bien une chaîne encodée valide (les séquences % doivent être suivies de deux chiffres hexadécimaux).',
        ],
        faq: [
          { q: 'Pourquoi obtenir "Séquence invalide" comme résultat ?', a: 'Ce message apparaît lorsque le texte contient un caractère "%" qui n\'est pas suivi d\'un code hexadécimal valide, ce qui indique que le texte n\'est pas (ou plus) correctement encodé.' },
          { q: 'Puis-je décoder une URL complète avec ce champ ?', a: 'Oui, vous pouvez coller une URL entière : les parties non encodées resteront inchangées, seules les séquences encodées seront converties en texte lisible.' },
        ],
      }));
    },
  },
};
