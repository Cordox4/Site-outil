import { el, panel, field, button, status, copy, copyBtn, toast, toolArticle } from '../ui.js';

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
    name: 'Palette de couleurs', icon: 'palette', desc: 'Générez une palette harmonieuse.', cat: 'color',
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
      root.append(toolArticle({
        intro: [
          'Choisir une palette de couleurs harmonieuse est l\'une des étapes les plus délicates dans un projet de design, que ce soit pour un site web, une identité de marque ou une présentation. Cet outil génère automatiquement des palettes cohérentes à partir d\'une seule couleur de base, en s\'appuyant sur les principes classiques de la théorie des couleurs.',
          'Quatre types d\'harmonies sont proposés : analogue (couleurs voisines sur le cercle chromatique, pour une ambiance douce et cohérente), complémentaire (couleurs opposées, pour un fort contraste), triadique (trois teintes équilibrées sur le cercle chromatique) et monochrome (variations de luminosité d\'une même teinte).',
        ],
        steps: [
          'Choisissez une couleur de base à l\'aide du sélecteur.',
          'Sélectionnez le type d\'harmonie souhaité (analogue, complémentaire, triadique ou monochrome).',
          'Cliquez sur n\'importe quelle couleur générée pour copier son code HEX.',
        ],
        tips: [
          'Une harmonie "complémentaire" fonctionne bien pour mettre en valeur un bouton d\'action (call-to-action) sur un fond de couleur opposée.',
          'Une palette "monochrome" est souvent plus sûre pour un usage professionnel ou une interface, car elle garantit une bonne cohérence visuelle.',
        ],
        faq: [
          { q: 'Quelle harmonie choisir pour un logo ?', a: 'Cela dépend de l\'image recherchée : une harmonie analogue évoque la douceur et la nature, une harmonie complémentaire évoque le dynamisme et le contraste, et une palette monochrome évoque la sobriété et l\'élégance.' },
          { q: 'Comment utiliser les couleurs générées dans mon code ?', a: 'Chaque couleur est au format HEX (ex : #4f46e5), directement utilisable en CSS, dans un logiciel de design ou dans une charte graphique.' },
        ],
      }));
    },
  },
  'hex-rgb': {
    name: 'HEX ↔ RGB', icon: 'eyedropper', desc: 'Convertissez entre HEX, RGB et HSL.', cat: 'color',
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
      root.append(toolArticle({
        intro: [
          'HEX, RGB et HSL sont les trois principaux formats utilisés pour définir une couleur en informatique et en design web. Le format HEX (ex : #0ea5e9) est le plus courant en CSS ; le format RGB décompose la couleur en rouge, vert et bleu (0 à 255) ; le format HSL exprime la couleur en teinte, saturation et luminosité, souvent plus intuitif pour ajuster une nuance.',
          'Cet outil convertit instantanément entre ces trois formats, dans les deux sens, avec un sélecteur visuel pour choisir la couleur directement.',
        ],
        steps: [
          'Choisissez une couleur avec le sélecteur, ou saisissez directement un code HEX.',
          'Les valeurs RGB et HSL équivalentes s\'affichent automatiquement.',
          'Utilisez les boutons "Copier" pour récupérer le format qui vous intéresse.',
        ],
        tips: [
          'Le format HSL est particulièrement pratique pour créer des variantes d\'une même couleur : il suffit d\'ajuster la luminosité (L) pour obtenir une version plus claire ou plus foncée en gardant la même teinte.',
        ],
        faq: [
          { q: 'Quelle est la différence entre RGB et RGBA ?', a: 'RGBA ajoute un quatrième paramètre, alpha, qui définit l\'opacité de la couleur (de 0, totalement transparent, à 1, totalement opaque). RGB seul est toujours totalement opaque.' },
          { q: 'Pourquoi utiliser HSL plutôt que RGB en CSS ?', a: 'HSL permet de raisonner en termes de teinte, saturation et luminosité, ce qui rend plus intuitif l\'ajustement d\'une couleur (par exemple assombrir un bouton au survol) sans recalculer trois valeurs RGB.' },
        ],
      }));
    },
  },
  'css-gradient': {
    name: 'Gradient CSS', icon: 'gradient', desc: 'Créez un dégradé CSS visuellement.', cat: 'color',
    render(root) {
      const p = panel(); root.append(p);
      const c1 = el('input', { type: 'color', value: '#4f46e5' }), c2 = el('input', { type: 'color', value: '#0ea5e9' });
      const angle = el('input', { type: 'range', min: '0', max: '360', value: '135' });
      const preview = el('div', { style: 'height:140px;border-radius:12px;border:1px solid var(--border)' });
      const code = el('input', { type: 'text', class: 'mono', readonly: true });
      const upd = () => { const g = `linear-gradient(${angle.value}deg, ${c1.value}, ${c2.value})`; preview.style.background = g; code.value = 'background: ' + g + ';'; };
      [c1, c2, angle].forEach(e => e.addEventListener('input', upd));
      p.append(el('div', { class: 'row' }, field('Couleur 1', c1), field('Couleur 2', c2)), field('Angle', angle), preview, el('div', { style: 'margin-top:12px' }, field('CSS', code)), el('div', { class: 'btn-row' }, copyBtn(() => code.value))); upd();
      root.append(toolArticle({
        intro: [
          'Les dégradés (gradients) CSS permettent de créer des transitions douces entre plusieurs couleurs, directement en CSS, sans avoir besoin d\'une image. Ils sont très utilisés pour les arrière-plans de sites web, les boutons ou les bannières modernes.',
          'Cet outil génère un dégradé linéaire à deux couleurs avec un aperçu visuel en direct, et produit le code CSS prêt à copier-coller dans votre projet.',
        ],
        steps: [
          'Choisissez les deux couleurs du dégradé.',
          'Ajustez l\'angle du dégradé avec le curseur (0° = de bas en haut, 90° = de gauche à droite).',
          'Copiez le code CSS généré et collez-le dans la propriété "background" de votre élément.',
        ],
        tips: [
          'Un angle de 135° donne un dégradé diagonal du coin supérieur gauche vers le coin inférieur droit, très utilisé pour les fonds de section modernes.',
          'Pour un dégradé plus doux, choisissez deux couleurs proches sur le cercle chromatique ; pour un effet plus marqué, optez pour deux couleurs contrastées.',
        ],
        faq: [
          { q: 'Comment ajouter une troisième couleur au dégradé ?', a: 'La propriété CSS linear-gradient accepte plusieurs couleurs séparées par une virgule (ex : linear-gradient(135deg, #4f46e5, #0ea5e9, #22c55e)). Vous pouvez modifier le code généré pour ajouter une couleur supplémentaire.' },
          { q: 'Ce dégradé fonctionne-t-il sur tous les navigateurs ?', a: 'La propriété linear-gradient est supportée par tous les navigateurs modernes (Chrome, Firefox, Safari, Edge) sans préfixe particulier.' },
        ],
      }));
    },
  },
  'css-box-shadow': {
    name: 'Box Shadow CSS', icon: 'layers', desc: 'Générez une ombre CSS.', cat: 'color',
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
      root.append(toolArticle({
        intro: [
          'La propriété CSS box-shadow permet d\'ajouter une ombre portée à un élément pour lui donner du relief, de la profondeur ou un effet de survol. Elle se compose de plusieurs paramètres (décalages, flou, étendue, couleur) qui peuvent être difficiles à visualiser directement dans du code.',
          'Cet outil propose un aperçu visuel en direct pour ajuster chaque paramètre avec des curseurs, puis génère le code CSS correspondant, prêt à être copié.',
        ],
        steps: [
          'Ajustez les décalages horizontal (X) et vertical (Y) pour positionner l\'ombre.',
          'Réglez le flou pour adoucir les bords de l\'ombre, et l\'étendue pour l\'agrandir ou la réduire.',
          'Choisissez la couleur et l\'opacité de l\'ombre, puis copiez le code CSS généré.',
        ],
        tips: [
          'Une ombre discrète (flou élevé, opacité faible, décalage réduit) donne un effet de profondeur subtil, souvent utilisé sur les cartes et boutons modernes.',
          'Pour un effet "glow" (lueur) plutôt qu\'une ombre classique, mettez les décalages X et Y à 0 et augmentez le flou.',
        ],
        faq: [
          { q: 'Comment ajouter plusieurs ombres à un même élément ?', a: 'La propriété box-shadow accepte plusieurs valeurs séparées par une virgule, ce qui permet de superposer plusieurs ombres pour un effet plus riche.' },
          { q: 'Quelle est la différence entre le flou et l\'étendue ?', a: 'Le flou adoucit les bords de l\'ombre en les rendant progressifs, tandis que l\'étendue agrandit ou réduit la taille de l\'ombre avant l\'application du flou.' },
        ],
      }));
    },
  },
  'css-border-radius': {
    name: 'Border Radius CSS', icon: 'radius', desc: 'Ajustez les coins arrondis.', cat: 'color',
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
      root.append(toolArticle({
        intro: [
          'La propriété CSS border-radius arrondit les coins d\'un élément, et permet de définir une valeur différente pour chacun des quatre coins afin de créer des formes originales (goutte, blob, carte asymétrique…). Visualiser le résultat directement dans le code n\'est pas toujours évident.',
          'Cet outil affiche un aperçu en direct de la forme obtenue en ajustant chaque coin individuellement, avec le code CSS correspondant généré automatiquement.',
        ],
        steps: [
          'Ajustez la valeur de chacun des quatre coins avec les curseurs.',
          'Observez le résultat sur l\'aperçu visuel.',
          'Copiez le code CSS "border-radius" généré et intégrez-le à votre élément.',
        ],
        tips: [
          'Une valeur identique sur les quatre coins donne une forme classique (carré arrondi ou cercle si la valeur est égale à la moitié de la largeur).',
          'Des valeurs différentes sur des coins opposés créent des formes asymétriques, utiles pour des éléments décoratifs ou des effets de type "organique".',
        ],
        faq: [
          { q: 'Comment obtenir un cercle parfait avec border-radius ?', a: 'Appliquez une valeur de 50 % (ou une valeur en pixels égale à la moitié de la largeur/hauteur) sur les quatre coins d\'un élément carré.' },
          { q: 'border-radius fonctionne-t-il sur les images ?', a: 'Oui, border-radius s\'applique à n\'importe quel élément HTML, y compris les balises <img>, à condition que l\'élément ait une largeur et une hauteur définies.' },
        ],
      }));
    },
  },
  'minify-css': {
    name: 'Minifier CSS', icon: 'compress', desc: 'Réduisez la taille d\'un code CSS.', cat: 'color',
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
      root.append(toolArticle({
        intro: [
          'Minifier un fichier CSS consiste à retirer tout ce qui n\'est pas nécessaire à son exécution — commentaires, espaces, sauts de ligne superflus — pour réduire sa taille de fichier. Un CSS plus léger se télécharge plus vite, ce qui améliore le temps de chargement d\'un site et, indirectement, son référencement.',
          'Cet outil supprime les commentaires et les espaces inutiles de votre code CSS, et affiche le pourcentage de réduction obtenu.',
        ],
        steps: [
          'Collez votre code CSS dans le champ de saisie.',
          'Cliquez sur "Minifier" (ou laissez l\'aperçu se mettre à jour automatiquement).',
          'Copiez le résultat minifié pour l\'utiliser dans votre projet.',
        ],
        tips: [
          'Conservez toujours une version non minifiée de votre CSS dans votre code source : le fichier minifié doit servir uniquement à la mise en production.',
          'Pour un projet avec build automatisé (Webpack, Vite…), la minification est généralement gérée automatiquement à chaque déploiement.',
        ],
        faq: [
          { q: 'La minification change-t-elle le comportement de mon CSS ?', a: 'Non, seule la mise en forme du texte est modifiée (espaces, sauts de ligne, commentaires) : les règles et sélecteurs restent identiques et produisent le même rendu visuel.' },
          { q: 'Quel gain de taille peut-on espérer ?', a: 'Cela dépend du style d\'écriture initial, mais un gain de 15 à 30 % est courant sur un CSS bien indenté et commenté.' },
        ],
      }));
    },
  },
};

function hslToHex(h, s, l) {
  s /= 100; l /= 100; const k = n => (n + h / 30) % 12; const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}
