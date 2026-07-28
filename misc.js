import { el, panel, field, button, status, copyBtn, download, dropzone, readFile, loadScript, toast, toolArticle } from '../ui.js';

export const tools = {
  'qr-generator': {
    name: 'Générateur QR', icon: 'qrcode', desc: 'Créez un QR code à partir d\'un texte ou URL.', cat: 'misc',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { placeholder: 'Texte, URL, contact…', style: 'min-height:80px' });
      const size = el('input', { type: 'range', min: '128', max: '512', step: '32', value: '256' });
      const holder = el('div', { style: 'display:flex;justify-content:center;margin:16px 0' });
      const canvas = el('canvas'); holder.append(canvas);
      let QR;
      const go = async () => {
        if (!QR) QR = (await import('https://cdn.jsdelivr.net/npm/qrcode@1.5.3/+esm')).default;
        if (!inp.value) { canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); return; }
        QR.toCanvas(canvas, inp.value, { width: +size.value, margin: 2 }, e => { if (e) console.error(e); });
      };
      inp.addEventListener('input', go); size.addEventListener('input', go);
      p.append(field('Contenu', inp), field('Taille', size), holder,
        el('div', { class: 'btn-row' }, button('Télécharger PNG', () => canvas.toBlob(b => download(b, 'qrcode.png', 'image/png')))));
      inp.value = 'https://'; go();
      root.append(toolArticle({
        intro: [
          'Un QR code encode un texte, un lien ou d\'autres informations sous forme d\'un motif graphique lisible par la caméra d\'un smartphone. Il est très utilisé pour partager rapidement une URL, un menu de restaurant, une carte de visite ou les informations d\'un réseau Wi-Fi sans avoir à les retaper.',
          'Cet outil génère un QR code à partir de n\'importe quel texte ou lien, avec une taille ajustable, prêt à être téléchargé en image PNG et imprimé ou intégré à un support de communication.',
        ],
        steps: [
          'Saisissez le texte, le lien ou le contenu à encoder.',
          'Ajustez la taille du QR code si nécessaire.',
          'Cliquez sur "Télécharger PNG" pour récupérer l\'image.',
        ],
        tips: [
          'Pour un lien, veillez à inclure "https://" au début afin que les smartphones l\'ouvrent directement dans le navigateur plutôt que de le traiter comme un simple texte.',
          'Une taille plus grande (400 px et plus) est recommandée pour une impression, afin de garantir une lecture fiable par les smartphones même à distance.',
        ],
        faq: [
          { q: 'Y a-t-il une limite à la quantité de texte encodable ?', a: 'Un QR code peut encoder jusqu\'à plusieurs milliers de caractères, mais plus le contenu est long, plus le motif devient dense et donc plus difficile à scanner rapidement ; privilégiez un lien court pour un usage pratique.' },
          { q: 'Le QR code généré expire-t-il ?', a: 'Non, un QR code n\'expire jamais : il encode directement le contenu, sans dépendre d\'un service en ligne. Si le lien encodé change de destination ou disparaît, seul le contenu pointé devient obsolète, pas le QR code lui-même.' },
        ],
      }));
    },
  },
  'qr-reader': {
    name: 'Lecteur QR', icon: 'camera', desc: 'Décodez un QR code depuis une image.', cat: 'misc',
    render(root) {
      const p = panel(); root.append(p);
      const out = el('div');
      const dz = dropzone(async fs => {
        out.innerHTML = '';
        try {
          await loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js');
          const img = new Image(); img.src = await readFile(fs[0], 'dataurl');
          await img.decode();
          const c = el('canvas'); c.width = img.width; c.height = img.height;
          const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, c.width, c.height);
          const code = window.jsQR(data.data, data.width, data.height);
          if (!code) { out.append(status('Aucun QR code détecté.', 'err')); return; }
          const val = code.data;
          out.append(status('QR décodé ✔', 'ok'));
          const res = el('textarea', { class: 'mono', readonly: true }); res.value = val;
          out.append(field('Contenu', res));
          if (/^https?:\/\//.test(val)) out.append(el('a', { href: val, target: '_blank', rel: 'noopener' }, 'Ouvrir le lien ↗'));
        } catch (e) { out.append(status('Erreur : ' + e.message, 'err')); }
      }, { accept: 'image/*', multiple: false });
      p.append(dz, out);
      root.append(toolArticle({
        intro: [
          'Cet outil décode le contenu d\'un QR code à partir d\'une image (capture d\'écran, photo prise avec un appareil photo), sans avoir besoin d\'un smartphone à proximité. Il est utile pour vérifier le contenu d\'un QR code avant de le scanner sur son propre téléphone, ou pour extraire un lien depuis une image reçue par e-mail.',
        ],
        steps: [
          'Glissez-déposez une image contenant un QR code, ou cliquez pour la sélectionner.',
          'Le contenu décodé s\'affiche automatiquement.',
          'Si le contenu est un lien, un bouton permet de l\'ouvrir directement.',
        ],
        tips: [
          'Pour un bon résultat, utilisez une image nette où le QR code est bien visible et pas trop petit.',
          'Un QR code endommagé, flou ou partiellement masqué peut ne pas être détecté correctement.',
        ],
        faq: [
          { q: 'Pourquoi mon QR code n\'est-il pas détecté ?', a: 'Vérifiez que l\'image est suffisamment nette et que le QR code n\'est pas trop petit, incliné à l\'excès ou partiellement masqué par un reflet ou un élément graphique.' },
          { q: 'Cet outil peut-il lire un QR code contenant des informations Wi-Fi ou une carte de contact ?', a: 'Oui, il décode le contenu brut du QR code quel que soit son type ; pour les formats structurés (Wi-Fi, contact vCard…), le texte brut s\'affiche tel qu\'encodé, à interpréter manuellement selon le format.' },
        ],
      }));
    },
  },
  'password-generator': {
    name: 'Générateur de mots de passe', icon: 'key', desc: 'Créez des mots de passe forts.', cat: 'misc',
    render(root) {
      const p = panel(); root.append(p);
      const len = el('input', { type: 'range', min: '6', max: '64', value: '16' });
      const lenL = el('span', {}, '16'); len.addEventListener('input', () => lenL.textContent = len.value);
      const opts = { maj: true, min: true, num: true, sym: true };
      const checks = Object.entries({ maj: 'Majuscules', min: 'Minuscules', num: 'Chiffres', sym: 'Symboles' }).map(([k, l]) => {
        const c = el('input', { type: 'checkbox', checked: opts[k] }); c.addEventListener('change', () => { opts[k] = c.checked; gen(); });
        return el('label', { class: 'check' }, c, l);
      });
      const out = el('input', { type: 'text', class: 'mono', readonly: true, style: 'font-size:1.1rem' });
      const gen = () => {
        let set = ''; if (opts.maj) set += 'ABCDEFGHJKLMNPQRSTUVWXYZ'; if (opts.min) set += 'abcdefghijkmnpqrstuvwxyz'; if (opts.num) set += '23456789'; if (opts.sym) set += '!@#$%^&*-_=+?';
        if (!set) { out.value = ''; return; }
        const arr = new Uint32Array(+len.value); crypto.getRandomValues(arr);
        out.value = [...arr].map(n => set[n % set.length]).join('');
      };
      len.addEventListener('input', gen);
      p.append(field('Longueur', el('div', { class: 'inline' }, len, lenL)), el('div', { class: 'inline' }, ...checks),
        el('div', { class: 'btn-row', style: 'margin-top:12px' }, button('Générer', gen), copyBtn(() => out.value)), field('Mot de passe', out)); gen();
      root.append(toolArticle({
        intro: [
          'Un mot de passe fort est la première ligne de défense contre le piratage de vos comptes en ligne. Cet outil génère des mots de passe aléatoires à partir de l\'API cryptographique sécurisée de votre navigateur (crypto.getRandomValues), ce qui garantit un tirage réellement aléatoire, contrairement à de simples fonctions pseudo-aléatoires.',
          'Vous pouvez personnaliser la longueur et les types de caractères inclus (majuscules, minuscules, chiffres, symboles) selon les exigences du site ou du service pour lequel vous créez ce mot de passe.',
        ],
        steps: [
          'Ajustez la longueur souhaitée du mot de passe.',
          'Cochez ou décochez les types de caractères à inclure.',
          'Copiez le mot de passe généré avec le bouton dédié.',
        ],
        tips: [
          'Une longueur d\'au moins 16 caractères, combinant majuscules, minuscules, chiffres et symboles, est recommandée pour un compte sensible (e-mail principal, banque…).',
          'Utilisez un mot de passe différent pour chaque service important, et envisagez un gestionnaire de mots de passe pour tous les mémoriser en sécurité.',
        ],
        faq: [
          { q: 'Ce générateur est-il vraiment sécurisé ?', a: 'Oui, il utilise l\'API cryptographique native du navigateur (Web Crypto API), conçue spécifiquement pour générer des valeurs aléatoires imprévisibles, adaptées à un usage de sécurité comme la génération de mots de passe.' },
          { q: 'Le mot de passe généré est-il stocké ou envoyé quelque part ?', a: 'Non, le mot de passe est généré et affiché entièrement dans votre navigateur, sans être transmis ni conservé par OutilsBox.' },
        ],
      }));
    },
  },
  'password-checker': {
    name: 'Vérificateur de mot de passe', icon: 'shield', desc: 'Évaluez la robustesse d\'un mot de passe.', cat: 'misc',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('input', { type: 'text', placeholder: 'Tapez un mot de passe…', class: 'mono' });
      const bar = el('div', { style: 'height:10px;border-radius:6px;background:var(--surface-2);overflow:hidden;margin:10px 0' });
      const fill = el('div', { style: 'height:100%;width:0;transition:.2s' }); bar.append(fill);
      const out = el('div');
      const go = () => {
        const s = inp.value; let pool = 0;
        if (/[a-z]/.test(s)) pool += 26; if (/[A-Z]/.test(s)) pool += 26; if (/[0-9]/.test(s)) pool += 10; if (/[^a-zA-Z0-9]/.test(s)) pool += 32;
        const entropy = s ? Math.round(s.length * Math.log2(pool || 1)) : 0;
        const level = entropy < 40 ? ['Faible', 'var(--danger)', '25%'] : entropy < 60 ? ['Moyen', '#d97706', '55%'] : entropy < 80 ? ['Fort', '#16a34a', '80%'] : ['Excellent', '#16a34a', '100%'];
        fill.style.width = s ? level[2] : '0'; fill.style.background = level[1];
        out.innerHTML = '';
        out.append(el('div', { class: 'kpi' }, el('div', { class: 'k' }, el('b', { style: 'color:' + level[1] }, s ? level[0] : '—'), el('span', {}, 'Robustesse')), el('div', { class: 'k' }, el('b', {}, entropy + ' bits'), el('span', {}, 'Entropie')), el('div', { class: 'k' }, el('b', {}, s.length), el('span', {}, 'Caractères'))));
      };
      inp.addEventListener('input', go);
      p.append(field('Mot de passe', inp), bar, out); go();
      root.append(toolArticle({
        intro: [
          'Cet outil évalue la robustesse d\'un mot de passe en calculant son entropie, c\'est-à-dire une estimation du nombre de combinaisons possibles qu\'un attaquant devrait tester pour le deviner par force brute. Plus l\'entropie (exprimée en bits) est élevée, plus le mot de passe est difficile à casser.',
          'Le calcul se fait entièrement dans votre navigateur : le mot de passe que vous saisissez pour le tester n\'est jamais envoyé ni enregistré nulle part.',
        ],
        steps: [
          'Tapez le mot de passe à évaluer dans le champ prévu.',
          'La robustesse (faible, moyen, fort, excellent) et l\'entropie en bits s\'affichent en temps réel.',
        ],
        tips: [
          'Un mot de passe long (16 caractères et plus) est généralement plus sûr qu\'un mot de passe court mais très complexe, car la longueur augmente fortement le nombre de combinaisons possibles.',
          'Évitez les mots de passe basés sur des informations personnelles (date de naissance, prénom) ou des mots du dictionnaire, même combinés à des chiffres : ils restent vulnérables aux attaques par dictionnaire, indépendamment de leur entropie théorique.',
        ],
        faq: [
          { q: 'Le mot de passe que je tape est-il envoyé sur un serveur ?', a: 'Non, l\'analyse est effectuée entièrement en local dans votre navigateur ; aucune donnée n\'est transmise ni stockée.' },
          { q: 'Un mot de passe jugé "Excellent" est-il vraiment inviolable ?', a: 'Aucun mot de passe n\'est totalement inviolable, mais un score élevé rend une attaque par force brute beaucoup plus longue et coûteuse à mener, ce qui réduit fortement le risque en pratique.' },
        ],
      }));
    },
  },
  'barcode-generator': {
    name: 'Générateur de code-barres', icon: 'barcode', desc: 'Créez un code-barres (EAN, Code128…).', cat: 'misc',
    render(root) {
      const p = panel(); root.append(p);
      const val = el('input', { type: 'text', value: '123456789012' });
      const fmt = el('select', {}, ...['CODE128', 'EAN13', 'EAN8', 'UPC', 'CODE39', 'ITF14'].map(f => el('option', {}, f)));
      const svg = el('svg'); const holder = el('div', { style: 'display:flex;justify-content:center;margin:16px 0;background:#fff;border-radius:10px;padding:10px' }); holder.append(svg);
      const st = el('div');
      const go = async () => {
        await loadScript('https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js');
        st.innerHTML = '';
        try { window.JsBarcode(svg, val.value, { format: fmt.value, displayValue: true }); }
        catch (e) { st.append(status('Valeur invalide pour ' + fmt.value, 'err')); }
      };
      val.addEventListener('input', go); fmt.addEventListener('change', go);
      p.append(el('div', { class: 'row' }, field('Valeur', val), field('Format', fmt)), holder, st,
        el('div', { class: 'btn-row' }, button('Télécharger SVG', () => download(new XMLSerializer().serializeToString(svg), 'barcode.svg', 'image/svg+xml')))); go();
      root.append(toolArticle({
        intro: [
          'Les codes-barres restent largement utilisés pour l\'identification de produits, la gestion de stock ou l\'étiquetage. Cet outil génère un code-barres au format vectoriel SVG, dans plusieurs standards courants : CODE128 (le plus polyvalent), EAN13/EAN8 (produits de grande distribution), UPC (marché nord-américain), CODE39 et ITF14 (logistique et emballages).',
        ],
        steps: [
          'Saisissez la valeur (numéro ou texte) à encoder.',
          'Choisissez le format de code-barres adapté à votre usage.',
          'Téléchargez le fichier SVG généré.',
        ],
        tips: [
          'Le format EAN13 nécessite généralement exactement 12 ou 13 chiffres pour être valide ; une valeur invalide affichera un message d\'erreur.',
          'Le format vectoriel SVG conserve une qualité parfaite à n\'importe quelle taille d\'impression, contrairement à une image bitmap qui peut devenir floue en l\'agrandissant.',
        ],
        faq: [
          { q: 'Quel format choisir pour vendre un produit en magasin ?', a: 'EAN13 est le standard le plus répandu pour les produits de grande consommation en Europe ; UPC est son équivalent pour le marché nord-américain. Le code doit généralement être obtenu auprès d\'un organisme officiel (comme GS1) pour être valide commercialement.' },
          { q: 'Pourquoi ma valeur est-elle refusée ?', a: 'Chaque format de code-barres impose des règles précises (nombre de chiffres, caractères autorisés) ; vérifiez que votre valeur respecte le format sélectionné, ou essayez CODE128, qui accepte le plus large éventail de caractères.' },
        ],
      }));
    },
  },
  'favicon-creator': {
    name: 'Créateur de favicon', icon: 'star', desc: 'Générez des favicons depuis une image ou un emoji.', cat: 'misc',
    render(root) {
      const p = panel(); root.append(p);
      const emoji = el('input', { type: 'text', value: '🚀', maxlength: '4', style: 'max-width:120px;font-size:1.4rem;text-align:center' });
      const bg = el('input', { type: 'color', value: '#4f46e5' });
      const preview = el('div', { style: 'display:flex;gap:16px;align-items:center;margin:14px 0' });
      const out = el('div');
      let uploaded = null;
      const dz = dropzone(async fs => { const img = new Image(); img.src = await readFile(fs[0], 'dataurl'); await img.decode(); uploaded = img; render(); }, { accept: 'image/*', multiple: false, label: 'Ou déposez une image (elle sera recadrée en carré)' });
      const draw = (size) => {
        const c = el('canvas'); c.width = c.height = size; const ctx = c.getContext('2d');
        if (uploaded) { const m = Math.min(uploaded.width, uploaded.height); ctx.drawImage(uploaded, (uploaded.width - m) / 2, (uploaded.height - m) / 2, m, m, 0, 0, size, size); }
        else { ctx.fillStyle = bg.value; ctx.fillRect(0, 0, size, size); ctx.font = `${size * 0.7}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(emoji.value, size / 2, size / 2 + size * 0.05); }
        return c;
      };
      const render = () => {
        preview.innerHTML = ''; out.innerHTML = '';
        [16, 32, 48].forEach(s => { const c = draw(s); c.style.border = '1px solid var(--border)'; c.style.borderRadius = '6px'; preview.append(c); });
        const row = el('div', { class: 'btn-row' });
        [16, 32, 64, 180, 512].forEach(s => row.append(button(`PNG ${s}px`, () => draw(s).toBlob(b => download(b, `favicon-${s}.png`, 'image/png')), { primary: false, sm: true })));
        out.append(row);
      };
      emoji.addEventListener('input', () => { uploaded = null; render(); }); bg.addEventListener('input', () => { uploaded = null; render(); });
      p.append(el('div', { class: 'row' }, field('Emoji / lettre', emoji), field('Fond', bg)), dz, preview, out); render();
      root.append(toolArticle({
        intro: [
          'Le favicon est la petite icône affichée dans l\'onglet du navigateur, les favoris et les résultats de recherche mobiles à côté du nom de votre site. Cet outil génère un favicon soit à partir d\'un emoji ou d\'une lettre sur un fond coloré, soit à partir d\'une image que vous importez, dans toutes les tailles couramment utilisées par les sites web.',
        ],
        steps: [
          'Choisissez un emoji ou une lettre avec une couleur de fond, ou déposez votre propre image (elle sera automatiquement recadrée en carré).',
          'Vérifiez l\'aperçu aux différentes tailles.',
          'Téléchargez les fichiers PNG dans les tailles dont vous avez besoin (16, 32, 64, 180, 512 px).',
        ],
        tips: [
          'La taille 32×32 px est le standard le plus utilisé pour l\'onglet du navigateur ; la taille 180×180 px correspond à l\'icône utilisée par les appareils Apple lors de l\'ajout à l\'écran d\'accueil.',
          'Pour un favicon lisible même en très petite taille, privilégiez un symbole simple avec un fort contraste plutôt qu\'un détail complexe.',
        ],
        faq: [
          { q: 'Comment installer le favicon généré sur mon site ?', a: 'Placez le fichier téléchargé à la racine de votre site et référencez-le dans le <head> de votre HTML avec une balise <link rel="icon" href="/favicon-32.png">, en adaptant le nom de fichier à la taille souhaitée.' },
          { q: 'Pourquoi générer plusieurs tailles différentes ?', a: 'Les navigateurs, systèmes d\'exploitation et appareils mobiles utilisent des tailles différentes selon le contexte (onglet, favoris, écran d\'accueil) ; fournir plusieurs tailles garantit un rendu net partout.' },
        ],
      }));
    },
  },
  'calendar': {
    name: 'Calendrier', icon: 'calendar', desc: 'Affichez un calendrier mensuel.', cat: 'misc',
    render(root) {
      const p = panel(); root.append(p);
      let cur = new Date(); cur.setDate(1);
      const head = el('h2', { style: 'text-align:center;margin:0' });
      const grid = el('div', { style: 'display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:14px' });
      const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      const render = () => {
        head.textContent = months[cur.getMonth()] + ' ' + cur.getFullYear();
        grid.innerHTML = '';
        ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].forEach(d => grid.append(el('div', { style: 'text-align:center;font-weight:700;color:var(--muted);font-size:.8rem' }, d)));
        const first = (new Date(cur.getFullYear(), cur.getMonth(), 1).getDay() + 6) % 7;
        const days = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
        const today = new Date();
        for (let i = 0; i < first; i++) grid.append(el('div'));
        for (let d = 1; d <= days; d++) {
          const isToday = d === today.getDate() && cur.getMonth() === today.getMonth() && cur.getFullYear() === today.getFullYear();
          grid.append(el('div', { style: `text-align:center;padding:10px 0;border-radius:8px;${isToday ? 'background:var(--primary);color:#fff;font-weight:700' : 'background:var(--surface-2)'}` }, d));
        }
      };
      p.append(el('div', { class: 'inline', style: 'justify-content:space-between' },
        button('‹', () => { cur.setMonth(cur.getMonth() - 1); render(); }, { primary: false, sm: true }), head,
        button('›', () => { cur.setMonth(cur.getMonth() + 1); render(); }, { primary: false, sm: true })), grid); render();
      root.append(toolArticle({
        intro: [
          'Ce calendrier mensuel affiche rapidement les jours d\'un mois donné, avec le jour actuel mis en évidence. Il est utile pour vérifier un jour de la semaine, planifier un événement ou simplement consulter un calendrier sans ouvrir une application dédiée.',
        ],
        steps: [
          'Le mois en cours s\'affiche automatiquement à l\'ouverture, avec la date du jour surlignée.',
          'Utilisez les flèches "‹" et "›" pour naviguer vers le mois précédent ou suivant.',
        ],
        tips: [
          'La semaine commence le lundi, conformément à la convention utilisée en France et dans la majorité de l\'Europe.',
          'Ce calendrier est purement consultatif : il n\'enregistre pas d\'événements. Pour planifier des rendez-vous, utilisez l\'application calendrier de votre téléphone ou de votre ordinateur.',
        ],
        faq: [
          { q: 'Puis-je ajouter des événements à ce calendrier ?', a: 'Non, cet outil affiche uniquement la structure du calendrier ; il ne permet pas d\'enregistrer de rendez-vous ou de rappels.' },
          { q: 'Comment revenir rapidement au mois actuel après avoir navigué ?', a: 'Rechargez la page de l\'outil : le calendrier se réinitialise automatiquement sur le mois en cours.' },
        ],
      }));
    },
  },
};
