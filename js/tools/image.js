import { el, panel, field, button, dropzone, download, readFile, status, loadScript, bytes, backendNotice, toolArticle } from '../ui.js';

// Styles pour les nouveaux contrôles (grille de préréglages, cadre de recadrage)
if (!document.getElementById('image-tools-extra-style')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'image-tools-extra-style';
  styleTag.textContent = `
.opt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin:6px 0 4px}
.opt-tile{border:2px solid var(--border);border-radius:12px;padding:12px 10px;cursor:pointer;background:var(--surface-2,transparent);text-align:center;transition:border-color .15s ease,box-shadow .15s ease;user-select:none}
.opt-tile:hover{border-color:var(--primary)}
.opt-tile.active{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft,rgba(79,70,229,.25))}
.opt-tile .opt-title{font-weight:700;font-size:.92rem}
.opt-tile .opt-sub{font-size:.78rem;color:var(--muted);margin-top:2px}

.crop-stage{position:relative;display:inline-block;max-width:100%;margin-top:6px;line-height:0;overflow:hidden;border-radius:10px}
.crop-stage img{display:block;max-width:100%;max-height:420px;border-radius:10px}
.crop-box{position:absolute;border:2px solid var(--primary);box-shadow:0 0 0 9999px rgba(0,0,0,.5);cursor:move;touch-action:none}
.crop-handle{position:absolute;width:16px;height:16px;background:var(--primary);border:2px solid #fff;border-radius:50%;touch-action:none}
.crop-handle.nw{left:-8px;top:-8px;cursor:nwse-resize}
.crop-handle.ne{right:-8px;top:-8px;cursor:nesw-resize}
.crop-handle.sw{left:-8px;bottom:-8px;cursor:nesw-resize}
.crop-handle.se{right:-8px;bottom:-8px;cursor:nwse-resize}
.crop-dims{margin-top:8px;font-size:.85rem;color:var(--muted);font-family:var(--font-mono)}
`;
  document.head.appendChild(styleTag);
}

function loadImage(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}
function canvasToBlob(canvas, type, q) {
  return new Promise(r => canvas.toBlob(r, type, q));
}
function imgToCanvas(img, w, h) {
  const c = el('canvas'); c.width = w || img.naturalWidth; c.height = h || img.naturalHeight;
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c;
}

// Shared single-image picker with preview
function singleImage(root, onPick) {
  const preview = el('div', { style: 'margin-top:14px' });
  const dz = dropzone(async fs => {
    const f = fs[0]; const img = await loadImage(f);
    preview.innerHTML = '';
    const im = el('img', { src: img.src, style: 'max-width:100%;max-height:260px;border-radius:10px;border:1px solid var(--border)' });
    preview.append(im, el('div', { class: 'result-note' }, `${f.name} — ${img.naturalWidth}×${img.naturalHeight} — ${bytes(f.size)}`));
    onPick(f, img);
  }, { accept: 'image/*', multiple: false });
  root.append(dz, preview);
}

// Reusable selectable tile for grids of presets (tailles, ratios, etc.)
function tile(container, title, sub, onClick) {
  const t = el('div', {
    class: 'opt-tile',
    onclick: () => { [...container.children].forEach(c => c.classList.remove('active')); t.classList.add('active'); onClick(); },
  }, el('div', { class: 'opt-title' }, title), el('div', { class: 'opt-sub' }, sub));
  container.append(t);
  return t;
}

export const tools = {
  'compress-image': {
    name: 'Compresser image', icon: '🗜️', desc: 'Réduisez le poids d\'une image (JPG/WebP).', cat: 'image',
    render(root) {
      const p = panel(); root.append(p);
      let file, img;
      singleImage(p, (f, i) => { file = f; img = i; go.disabled = false; });
      let qualityValue = 0.7;
      const levels = [
        { label: 'Standard', value: 0.5 },
        { label: 'Bonne qualité', value: 0.7 },
        { label: 'Haute qualité', value: 0.85 },
        { label: 'Qualité maximale', value: 0.95 },
      ];
      const chipRow = el('div', { class: 'quality-row' });
      const chips = levels.map(lv => {
        const chip = el('button', {
          type: 'button',
          class: 'quality-chip' + (lv.value === qualityValue ? ' active' : ''),
          onclick: () => { qualityValue = lv.value; chips.forEach(c => c.classList.remove('active')); chip.classList.add('active'); },
        }, lv.label);
        chipRow.append(chip);
        return chip;
      });
      p.append(field('Qualité', chipRow));
      const out = el('div');
      const go = button('Compresser', async () => {
        const c = imgToCanvas(img);
        const blob = await canvasToBlob(c, 'image/jpeg', qualityValue);
        download(blob, file.name.replace(/\.\w+$/, '') + '-compresse.jpg', 'image/jpeg');
        out.innerHTML = ''; out.append(status(`${bytes(file.size)} → ${bytes(blob.size)} (${Math.max(0, Math.round((1 - blob.size / file.size) * 100))}% en moins)`, 'ok'));
      });
      go.disabled = true;
      p.append(el('div', { class: 'btn-row' }, go), out);
      root.append(toolArticle({
        intro: [
          'Une image trop lourde ralentit le chargement d\'un site web, prend inutilement de la place de stockage et complique l\'envoi par e-mail. Ce compresseur réduit le poids d\'une image en ajustant sa qualité JPEG, tout en gardant un rendu visuellement très proche de l\'original — l\'essentiel de la perte de qualité se joue sur des détails difficilement perceptibles à l\'œil nu.',
          'Tout le traitement se fait dans votre navigateur via l\'API Canvas : votre image n\'est jamais envoyée sur un serveur externe.',
        ],
        steps: [
          'Glissez-déposez votre image ou cliquez pour la sélectionner.',
          'Choisissez le niveau de qualité souhaité (standard, bonne, haute ou maximale).',
          'Cliquez sur "Compresser" : le fichier compressé se télécharge automatiquement.',
        ],
        tips: [
          'Le niveau "Bonne qualité" (70 %) offre généralement le meilleur compromis entre poids de fichier et qualité visuelle pour un usage web.',
          'Pour des photos destinées à l\'impression, préférez "Qualité maximale" afin de limiter la perte de détails.',
        ],
        faq: [
          { q: 'Quelle est la différence entre ce compresseur et une conversion PNG → JPG ?', a: 'La conversion change le format du fichier, tandis que la compression ajuste le niveau de qualité JPEG pour réduire le poids sans forcément changer le format d\'origine (le résultat est toujours exporté en JPEG ici).' },
          { q: 'Puis-je compresser une image PNG avec cet outil ?', a: 'Oui, l\'image est convertie en JPEG lors de la compression, ce qui réduit fortement son poids ; si vous devez conserver la transparence du PNG, utilisez plutôt l\'outil de redimensionnement, qui préserve le format d\'origine.' },
        ],
      }));
    },
  },
  'resize-image': {
    name: 'Redimensionner image', icon: '📐', desc: 'Changez les dimensions d\'une image.', cat: 'image',
    render(root) {
      const p = panel(); root.append(p);
      let file, img, targetW = 0, targetH = 0;

      const w = el('input', { type: 'number', min: '1' }), h = el('input', { type: 'number', min: '1' });
      const keep = el('input', { type: 'checkbox', checked: true });
      const customWrap = el('div', { class: 'row', style: 'display:none;margin-top:10px' }, field('Largeur (px)', w), field('Hauteur (px)', h));
      const keepLabel = el('label', { class: 'check', style: 'display:none;margin-top:-6px' }, keep, 'Conserver les proportions');

      function setSize(wv, hv) {
        targetW = Math.max(1, Math.round(wv)); targetH = Math.max(1, Math.round(hv));
        w.value = targetW; h.value = targetH;
      }
      function selectPreset(wv, hv) { customWrap.style.display = 'none'; keepLabel.style.display = 'none'; setSize(wv, hv); }
      function selectCustom(ow, oh) { customWrap.style.display = 'flex'; keepLabel.style.display = 'flex'; setSize(ow, oh); }

      w.addEventListener('input', () => { if (keep.checked && img) h.value = Math.round(w.value * img.naturalHeight / img.naturalWidth); targetW = +w.value; targetH = +h.value; });
      h.addEventListener('input', () => { if (keep.checked && img) w.value = Math.round(h.value * img.naturalWidth / img.naturalHeight); targetW = +w.value; targetH = +h.value; });

      const grid = el('div', { class: 'opt-grid' });

      singleImage(p, (f, i) => {
        file = f; img = i;
        grid.innerHTML = '';
        const ow = i.naturalWidth, oh = i.naturalHeight;
        tile(grid, 'Original', `${ow}×${oh}`, () => selectPreset(ow, oh));
        tile(grid, 'Grand', '75 %', () => selectPreset(ow * 0.75, oh * 0.75));
        tile(grid, 'Moyen', '50 %', () => selectPreset(ow * 0.5, oh * 0.5));
        tile(grid, 'Petit', '25 %', () => selectPreset(ow * 0.25, oh * 0.25));
        tile(grid, 'Réseaux sociaux', '1080×1080', () => selectPreset(1080, 1080));
        tile(grid, 'Story / Reel', '1080×1920', () => selectPreset(1080, 1920));
        tile(grid, 'Miniature vidéo', '1280×720', () => selectPreset(1280, 720));
        tile(grid, 'Avatar', '512×512', () => selectPreset(512, 512));
        tile(grid, 'Personnalisé', 'mes valeurs', () => selectCustom(ow, oh));
        grid.firstChild.click();
        go.disabled = false;
      });

      p.append(field('Choisissez une taille', grid), customWrap, keepLabel);
      const out = el('div');
      const go = button('Redimensionner', async () => {
        const c = imgToCanvas(img, targetW, targetH);
        const type = /png/i.test(file.type) ? 'image/png' : 'image/jpeg';
        const blob = await canvasToBlob(c, type, 0.92);
        download(blob, file.name.replace(/\.\w+$/, '') + `-${targetW}x${targetH}` + (type === 'image/png' ? '.png' : '.jpg'), type);
        out.innerHTML = ''; out.append(status('Image redimensionnée ✔', 'ok'));
      });
      go.disabled = true;
      p.append(el('div', { class: 'btn-row' }, go), out);
      root.append(toolArticle({
        intro: [
          'Redimensionner une image permet d\'adapter ses dimensions à un usage précis : format carré pour Instagram, bannière pour LinkedIn, miniature pour une vidéo YouTube, ou simplement réduire la taille d\'une photo avant de l\'envoyer par e-mail. Cet outil propose des préréglages prêts à l\'emploi pour les usages les plus courants, ainsi qu\'un mode personnalisé pour saisir vos propres dimensions.',
          'Le traitement s\'effectue entièrement dans votre navigateur, l\'image d\'origine est redimensionnée sans jamais quitter votre appareil.',
        ],
        steps: [
          'Importez votre image par glisser-déposer ou en cliquant sur la zone de dépôt.',
          'Choisissez un format préréglé (réseaux sociaux, story, avatar…) ou sélectionnez "Personnalisé" pour saisir vos propres dimensions.',
          'Cliquez sur "Redimensionner" pour télécharger l\'image à la nouvelle taille.',
        ],
        tips: [
          'Laissez l\'option "Conserver les proportions" activée en mode personnalisé pour éviter de déformer votre image.',
          'Pour publier sur les réseaux sociaux, utilisez le préréglage correspondant : chaque plateforme recadre ou compresse différemment les images qui ne respectent pas ses dimensions recommandées.',
        ],
        faq: [
          { q: 'Le redimensionnement dégrade-t-il la qualité de l\'image ?', a: 'Réduire la taille d\'une image ne dégrade pas visiblement la qualité. En revanche, l\'agrandir au-delà de sa résolution d\'origine peut la rendre floue, car aucun détail supplémentaire n\'est inventé.' },
          { q: 'Quel format de sortie est utilisé ?', a: 'L\'outil conserve le format d\'origine de votre image (PNG si l\'image de départ est un PNG, JPEG sinon), afin de préserver la transparence si elle existe.' },
        ],
      }));
    },
  },
  'crop-image': {
    name: 'Recadrer image', icon: '🔲', desc: 'Recadrez une zone rectangulaire.', cat: 'image',
    render(root) {
      const p = panel(); root.append(p);
      let file, img, dispW = 0, dispH = 0;
      let bx = 0, by = 0, bw = 100, bh = 100, currentRatio = null;

      const stage = el('div', { class: 'crop-stage' });
      const box = el('div', { class: 'crop-box' });
      const handles = ['nw', 'ne', 'sw', 'se'].map(dir => el('div', { class: 'crop-handle ' + dir, 'data-dir': dir }));
      box.append(...handles);
      const dims = el('div', { class: 'crop-dims' });

      function updateDims() {
        if (!img || !dispW) return;
        const scaleX = img.naturalWidth / dispW, scaleY = img.naturalHeight / dispH;
        dims.textContent = `Zone sélectionnée : ${Math.round(bw * scaleX)} × ${Math.round(bh * scaleY)} px`;
      }
      function setBox(x, y, w, h) {
        w = Math.min(Math.max(w, 20), dispW);
        h = Math.min(Math.max(h, 20), dispH);
        x = Math.max(0, Math.min(x, dispW - w));
        y = Math.max(0, Math.min(y, dispH - h));
        bx = x; by = y; bw = w; bh = h;
        box.style.left = bx + 'px'; box.style.top = by + 'px';
        box.style.width = bw + 'px'; box.style.height = bh + 'px';
        updateDims();
      }

      box.addEventListener('pointerdown', e => {
        if (e.target !== box) return;
        e.preventDefault();
        const startX = e.clientX, startY = e.clientY, ox = bx, oy = by;
        box.setPointerCapture(e.pointerId);
        const move = ev => setBox(ox + (ev.clientX - startX), oy + (ev.clientY - startY), bw, bh);
        const up = () => { box.removeEventListener('pointermove', move); box.removeEventListener('pointerup', up); };
        box.addEventListener('pointermove', move);
        box.addEventListener('pointerup', up);
      });
      handles.forEach(hd => {
        hd.addEventListener('pointerdown', e => {
          e.preventDefault(); e.stopPropagation();
          const dir = hd.dataset.dir;
          const startX = e.clientX, startY = e.clientY;
          const ox = bx, oy = by, ow = bw, oh = bh;
          hd.setPointerCapture(e.pointerId);
          const move = ev => {
            const dx = ev.clientX - startX, dy = ev.clientY - startY;
            const leftX = dir.includes('w') ? ox + dx : ox;
            const rightX = dir.includes('e') ? ox + ow + dx : ox + ow;
            const topY = dir.includes('n') ? oy + dy : oy;
            const bottomY = dir.includes('s') ? oy + oh + dy : oy + oh;
            let nx = Math.min(leftX, rightX), nw = Math.abs(rightX - leftX);
            let ny = Math.min(topY, bottomY), nh = Math.abs(bottomY - topY);
            if (currentRatio) {
              nh = nw / currentRatio;
              ny = dir.includes('n') ? (oy + oh) - nh : oy;
            }
            setBox(nx, ny, nw, nh);
          };
          const up = () => { hd.removeEventListener('pointermove', move); hd.removeEventListener('pointerup', up); };
          hd.addEventListener('pointermove', move);
          hd.addEventListener('pointerup', up);
        });
      });

      const grid = el('div', { class: 'opt-grid' });
      const ratios = [
        { label: 'Libre', sub: 'sans contrainte', value: null },
        { label: 'Carré', sub: '1:1', value: 1 },
        { label: 'Portrait', sub: '4:5', value: 4 / 5 },
        { label: 'Paysage', sub: '3:2', value: 3 / 2 },
        { label: 'Écran', sub: '16:9', value: 16 / 9 },
        { label: 'Story', sub: '9:16', value: 9 / 16 },
      ];
      function setRatio(rv) {
        currentRatio = rv;
        if (!dispW) return;
        let bw2, bh2;
        if (rv) {
          bw2 = dispW * 0.8; bh2 = bw2 / rv;
          if (bh2 > dispH * 0.8) { bh2 = dispH * 0.8; bw2 = bh2 * rv; }
        } else { bw2 = dispW * 0.8; bh2 = dispH * 0.8; }
        setBox((dispW - bw2) / 2, (dispH - bh2) / 2, bw2, bh2);
      }
      ratios.forEach(r => tile(grid, r.label, r.sub, () => setRatio(r.value)));

      const note = el('div', { style: 'margin-top:12px' });
      const dz = dropzone(async fs => {
        const f = fs[0]; const i = await loadImage(f);
        file = f; img = i;
        stage.innerHTML = ''; stage.append(el('img', { src: i.src }));
        note.innerHTML = ''; note.append(el('div', { class: 'result-note' }, `${f.name} — ${i.naturalWidth}×${i.naturalHeight} — ${bytes(f.size)}`));
        requestAnimationFrame(() => {
          const imEl = stage.querySelector('img');
          dispW = imEl.clientWidth; dispH = imEl.clientHeight;
          stage.append(box);
          grid.firstChild.click();
          go.disabled = false;
        });
      }, { accept: 'image/*', multiple: false });

      p.append(dz, stage, note, field('Format', grid), dims);
      const out = el('div');
      const go = button('Recadrer', async () => {
        const scaleX = img.naturalWidth / dispW, scaleY = img.naturalHeight / dispH;
        const sx = Math.round(bx * scaleX), sy = Math.round(by * scaleY);
        const sw = Math.round(bw * scaleX), sh = Math.round(bh * scaleY);
        const c = el('canvas'); c.width = sw; c.height = sh;
        c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        const type = /png/i.test(file.type) ? 'image/png' : 'image/jpeg';
        download(await canvasToBlob(c, type, 0.92), file.name.replace(/\.\w+$/, '') + '-recadre' + (type === 'image/png' ? '.png' : '.jpg'), type);
        out.innerHTML = ''; out.append(status('Image recadrée ✔', 'ok'));
      });
      go.disabled = true;
      p.append(el('div', { class: 'btn-row' }, go), out);
      root.append(toolArticle({
        intro: [
          'Le recadrage permet d\'isoler la partie intéressante d\'une photo, de corriger un cadrage imparfait ou d\'adapter une image à un format précis (carré, portrait, écran large…). Cet outil affiche un cadre de sélection déplaçable et redimensionnable directement sur l\'image, avec des ratios prédéfinis pour les usages les plus courants.',
        ],
        steps: [
          'Importez votre image.',
          'Choisissez un ratio (carré, portrait, paysage, écran, story) ou laissez le mode "Libre" pour un recadrage sans contrainte.',
          'Déplacez et redimensionnez le cadre à l\'aide des poignées, puis cliquez sur "Recadrer" pour télécharger le résultat.',
        ],
        tips: [
          'Le ratio "9:16" (Story) est idéal pour Instagram et TikTok, tandis que "16:9" (Écran) convient aux miniatures YouTube et aux présentations.',
          'Utilisez le mode "Libre" lorsque vous devez isoler un détail précis sans respecter un format standard.',
        ],
        faq: [
          { q: 'Puis-je recadrer une image directement sur mobile ?', a: 'Oui, le cadre de recadrage répond au toucher aussi bien qu\'à la souris : vous pouvez le déplacer et le redimensionner du bout du doigt.' },
          { q: 'Le recadrage réduit-il la résolution de l\'image ?', a: 'La résolution finale correspond à la taille réelle de la zone sélectionnée sur l\'image d\'origine : plus la zone recadrée est petite, plus l\'image obtenue aura une résolution basse.' },
        ],
      }));
    },
  },
  ...convertTool('png-to-jpg', 'PNG → JPG', '🖼️', 'Convertissez un PNG en JPG.', 'image/jpeg', '.jpg', {
    intro: [
      'PNG et JPG sont deux formats d\'image aux usages très différents. Le PNG utilise une compression sans perte et gère la transparence, ce qui le rend idéal pour les logos, captures d\'écran ou illustrations avec du texte, mais il produit des fichiers plus lourds sur des photos. Le JPG utilise une compression avec perte, beaucoup plus efficace pour les photographies, au prix d\'une transparence non gérée (l\'arrière-plan transparent devient blanc).',
      'Convertir un PNG en JPG permet donc de réduire significativement le poids d\'une photo destinée au web, à condition de ne pas avoir besoin de transparence.',
    ],
    faq: [
      { q: 'Que devient la transparence d\'un PNG après conversion en JPG ?', a: 'Le format JPG ne supporte pas la transparence : les zones transparentes du PNG d\'origine sont remplacées par un fond blanc lors de la conversion.' },
      { q: 'La conversion réduit-elle beaucoup le poids du fichier ?', a: 'Oui, sur une photographie, un JPG est généralement plusieurs fois plus léger qu\'un PNG équivalent, grâce à sa compression avec perte optimisée pour les images complexes.' },
    ],
  }),
  ...convertTool('jpg-to-png', 'JPG → PNG', '🖼️', 'Convertissez un JPG en PNG.', 'image/png', '.png', {
    intro: [
      'Convertir un JPG en PNG est utile lorsque vous devez ajouter de la transparence à une image (par exemple avant de la détourer dans un logiciel d\'édition), ou lorsqu\'un outil ou une plateforme exige spécifiquement ce format sans perte.',
      'Attention : convertir un JPG en PNG n\'ajoute pas de transparence automatiquement et n\'améliore pas la qualité d\'origine — le PNG obtenu conserve fidèlement les pixels du JPG, sans les artefacts de compression supplémentaires que produirait un nouvel enregistrement en JPG.',
    ],
    faq: [
      { q: 'Cette conversion améliore-t-elle la qualité de mon image ?', a: 'Non : la qualité d\'un JPG est fixée dès sa création. La conversion en PNG fige cette qualité dans un format sans perte, mais ne peut pas récupérer des détails déjà perdus lors de la compression JPEG initiale.' },
      { q: 'Pourquoi le fichier PNG est-il plus lourd que le JPG d\'origine ?', a: 'Le PNG utilise une compression sans perte, généralement moins efficace que la compression JPEG sur des photographies, ce qui donne un fichier plus volumineux à qualité visuelle équivalente.' },
    ],
  }),
  ...convertTool('webp-convert', 'Conversion WebP', '🖼️', 'Convertissez une image en WebP.', 'image/webp', '.webp', {
    intro: [
      'WebP est un format d\'image développé par Google, conçu spécifiquement pour le web. Il offre une compression plus efficace que le JPG et le PNG à qualité équivalente, ce qui réduit le poids des pages et améliore les temps de chargement — un critère pris en compte par Google dans le référencement d\'un site.',
      'Ce format supporte à la fois la compression avec et sans perte, ainsi que la transparence, ce qui en fait une alternative polyvalente aux formats plus anciens.',
    ],
    faq: [
      { q: 'Le format WebP est-il compatible avec tous les navigateurs ?', a: 'Oui, WebP est aujourd\'hui supporté par tous les navigateurs modernes (Chrome, Firefox, Safari, Edge). Pour les très anciens navigateurs, il est recommandé de conserver une version de secours en JPG ou PNG.' },
      { q: 'Pourquoi utiliser WebP plutôt que JPG sur un site web ?', a: 'À qualité visuelle égale, un fichier WebP est généralement 25 à 35 % plus léger qu\'un JPG équivalent, ce qui accélère le chargement des pages.' },
    ],
  }),
  ...convertTool('avif-convert', 'Conversion AVIF', '🖼️', 'Convertissez une image en AVIF (selon le navigateur).', 'image/avif', '.avif', {
    intro: [
      'AVIF est un format d\'image nouvelle génération, basé sur la technologie de compression vidéo AV1, qui permet d\'obtenir des fichiers encore plus légers que le WebP à qualité comparable. Il est de plus en plus utilisé pour optimiser les performances des sites web les plus exigeants.',
      'Le support de l\'export AVIF dépend du navigateur utilisé : cet outil s\'appuie sur les capacités natives de votre navigateur pour générer le fichier, et vous informe si votre navigateur ne le prend pas en charge.',
    ],
    faq: [
      { q: 'Pourquoi la conversion échoue-t-elle parfois ?', a: 'L\'export AVIF dépend du support natif du navigateur utilisé. Si la conversion échoue, essayez avec une version récente de Chrome ou Firefox, qui prennent en charge l\'encodage AVIF.' },
      { q: 'AVIF remplace-t-il le WebP ?', a: 'AVIF offre généralement une meilleure compression que WebP, mais son support et ses outils d\'édition sont un peu moins répandus. Le choix dépend souvent de la compatibilité requise pour votre projet.' },
    ],
  }),

  'watermark-image': {
    name: 'Filigrane image', icon: '💧', desc: 'Ajoutez un filigrane répété sur toute l\'image.', cat: 'image',
    render(root) {
      const p = panel(); root.append(p);
      let file, img;
      singleImage(p, (f, i) => { file = f; img = i; go.disabled = false; });
      const txt = el('input', { type: 'text', value: '© OutilsBox' });
      const opacity = el('input', { type: 'range', min: '0.05', max: '0.6', step: '0.05', value: '0.2' });
      const color = el('input', { type: 'color', value: '#ffffff' });
      p.append(field('Texte du filigrane', txt), el('div', { class: 'row' }, field('Opacité', opacity), field('Couleur', color)));
      const out = el('div');
      const go = button('Appliquer le filigrane', async () => {
        const c = imgToCanvas(img); const ctx = c.getContext('2d');
        const cols = 2, rows = 2;
        const stepX = c.width / cols, stepY = c.height / rows;
        // Ajuste automatiquement la taille du texte pour qu'il tienne dans chaque case
        let fontSize = Math.round(stepX / 5);
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        while (ctx.measureText(txt.value).width > stepX * 0.95 && fontSize > 10) {
          fontSize -= 2;
          ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        }
        ctx.globalAlpha = +opacity.value; ctx.fillStyle = color.value;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let ry = 0; ry < rows; ry++) {
          for (let rx = 0; rx < cols; rx++) {
            ctx.save();
            ctx.translate(stepX * rx + stepX / 2, stepY * ry + stepY / 2);
            ctx.rotate(-Math.PI / 8);
            ctx.fillText(txt.value, 0, 0);
            ctx.restore();
          }
        }
        const type = /png/i.test(file.type) ? 'image/png' : 'image/jpeg';
        download(await canvasToBlob(c, type, 0.92), file.name.replace(/\.\w+$/, '') + '-filigrane' + (type === 'image/png' ? '.png' : '.jpg'), type);
        out.innerHTML = ''; out.append(status('Filigrane appliqué ✔', 'ok'));
      });
      go.disabled = true;
      p.append(el('div', { class: 'btn-row' }, go), out);
      root.append(toolArticle({
        intro: [
          'Ajouter un filigrane (watermark) à une image permet de protéger vos photos ou créations contre une réutilisation non autorisée, tout en signant visuellement votre travail. Cet outil applique un texte personnalisé en filigrane répété sur toute la surface de l\'image, ce qui rend son retrait bien plus difficile qu\'un filigrane unique placé dans un coin.',
        ],
        steps: [
          'Importez l\'image à protéger.',
          'Saisissez le texte du filigrane (par exemple votre nom, votre marque ou une mention de droits d\'auteur).',
          'Ajustez l\'opacité et la couleur pour un rendu discret ou marqué, puis cliquez sur "Appliquer le filigrane".',
        ],
        tips: [
          'Une opacité basse (10 à 20 %) protège l\'image tout en restant discrète ; une opacité plus élevée dissuade davantage toute réutilisation.',
          'Choisissez une couleur qui contraste avec votre image (blanc sur une photo sombre, noir sur une photo claire) pour que le filigrane reste lisible.',
        ],
        faq: [
          { q: 'Le filigrane peut-il être facilement retiré ?', a: 'Parce qu\'il est répété plusieurs fois sur toute l\'image, ce filigrane est nettement plus difficile à effacer qu\'un filigrane unique placé dans un coin, mais aucun filigrane n\'offre une protection absolue.' },
          { q: 'Puis-je utiliser un logo au lieu de texte ?', a: 'Cet outil fonctionne uniquement avec du texte. Pour un filigrane sous forme de logo ou d\'image, un logiciel d\'édition d\'image sera nécessaire.' },
        ],
      }));
    },
  },

  'ocr-image': {
    name: 'OCR image', icon: '🔤', desc: 'Extrayez le texte d\'une image.', cat: 'image',
    render(root) {
      const p = panel(); root.append(p);
      let file;
      singleImage(p, (f) => { file = f; go.disabled = false; });
      const out = el('div'); const result = el('textarea', { class: 'mono', placeholder: 'Le texte extrait apparaîtra ici…' });
      const go = button('Extraire le texte', async () => {
        out.innerHTML = ''; out.append(status('Chargement du moteur OCR (première fois : ~quelques Mo)…', 'info'));
        try {
          await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
          const { data } = await window.Tesseract.recognize(await readFile(file, 'dataurl'), 'fra+eng', {
            logger: m => { if (m.status === 'recognizing text') out.firstChild && (out.firstChild.textContent = 'Reconnaissance : ' + Math.round(m.progress * 100) + '%'); },
          });
          result.value = data.text; out.innerHTML = ''; out.append(status('Texte extrait ✔', 'ok'));
        } catch (e) { out.innerHTML = ''; out.append(status('Erreur OCR : ' + e.message, 'err')); }
      });
      go.disabled = true;
      p.append(el('div', { class: 'btn-row' }, go), out, field('Résultat', result));
      root.append(toolArticle({
        intro: [
          'L\'OCR (reconnaissance optique de caractères) permet d\'extraire le texte contenu dans une image — capture d\'écran, photo de document, panneau photographié — pour le récupérer sous forme de texte modifiable et copiable. Cet outil s\'appuie sur Tesseract.js, un moteur de reconnaissance de texte open source reconnu, capable de lire aussi bien le français que l\'anglais.',
          'Le traitement se fait directement dans votre navigateur après le chargement du moteur OCR (quelques mégaoctets la première fois), sans envoi de votre image vers un serveur.',
        ],
        steps: [
          'Importez l\'image contenant le texte à extraire.',
          'Cliquez sur "Extraire le texte" et patientez pendant l\'analyse (la progression s\'affiche en pourcentage).',
          'Le texte reconnu apparaît dans la zone de résultat, prêt à être copié.',
        ],
        tips: [
          'Pour un meilleur résultat, utilisez une image nette, bien cadrée et avec un bon contraste entre le texte et l\'arrière-plan.',
          'Une écriture manuscrite ou une police très stylisée est généralement moins bien reconnue qu\'un texte imprimé standard.',
        ],
        faq: [
          { q: 'L\'OCR fonctionne-t-il avec des langues autres que le français et l\'anglais ?', a: 'Cet outil est configuré pour reconnaître le français et l\'anglais simultanément, ce qui couvre la majorité des cas d\'usage courants.' },
          { q: 'Pourquoi la première extraction est-elle plus lente ?', a: 'Le moteur de reconnaissance (quelques mégaoctets) doit être téléchargé une première fois par votre navigateur ; les extractions suivantes démarrent plus rapidement.' },
        ],
      }));
    },
  },

  'remove-bg': {
    name: 'Suppression arrière-plan', icon: '🎭', desc: 'Détourez le sujet d\'une image.', cat: 'image', badge: 'API',
    render(root) { root.append(panel(backendNotice('La suppression d\'arrière-plan par IA'))); },
  },

  'exif-viewer': {
    name: 'Exif viewer', icon: '📷', desc: 'Affichez les métadonnées EXIF d\'une photo.', cat: 'image',
    render(root) {
      const p = panel(); root.append(p);
      let file;
      singleImage(p, (f) => { file = f; go.disabled = false; });
      const out = el('div');
      const go = button('Lire les métadonnées', async () => {
        try {
          await loadScript('https://cdn.jsdelivr.net/npm/exifr@7.1.3/dist/full.umd.js');
          const data = await window.exifr.parse(file, true);
          out.innerHTML = '';
          if (!data) { out.append(status('Aucune métadonnée EXIF trouvée.', 'info')); return; }
          const rows = Object.entries(data).filter(([, v]) => typeof v !== 'object' || v instanceof Date)
            .map(([k, v]) => el('tr', {}, el('th', {}, k), el('td', {}, String(v))));
          out.append(el('table', { class: 'data' }, el('tbody', {}, ...rows)));
        } catch (e) { out.innerHTML = ''; out.append(status('Erreur : ' + e.message, 'err')); }
      });
      go.disabled = true;
      p.append(el('div', { class: 'btn-row' }, go), out);
      root.append(toolArticle({
        intro: [
          'Les métadonnées EXIF sont des informations techniques enregistrées automatiquement par un appareil photo ou un smartphone au moment de la prise de vue : modèle de l\'appareil, réglages (ouverture, vitesse, ISO), date et heure, et parfois les coordonnées GPS du lieu de la photo. Cet outil affiche l\'ensemble de ces métadonnées lisibles dans un fichier image.',
          'Consulter ces informations est utile pour un photographe souhaitant analyser ses réglages, mais aussi pour vérifier quelles données personnelles (comme la localisation) sont potentiellement partagées avant de publier une photo en ligne.',
        ],
        steps: [
          'Importez la photo dont vous souhaitez consulter les métadonnées.',
          'Cliquez sur "Lire les métadonnées".',
          'Le tableau des informations disponibles s\'affiche (appareil, réglages, date, position GPS si présente…).',
        ],
        tips: [
          'Si vous partagez une photo publiquement, vérifiez la présence de coordonnées GPS dans les métadonnées : de nombreux réseaux sociaux les suppriment automatiquement, mais pas tous les moyens de partage (e-mail, messagerie).',
          'Certaines images (captures d\'écran, images déjà partagées sur les réseaux sociaux) ne contiennent aucune métadonnée EXIF, car elle a été supprimée lors d\'un traitement précédent.',
        ],
        faq: [
          { q: 'Pourquoi certaines photos n\'ont aucune métadonnée ?', a: 'Les réseaux sociaux et certains outils d\'édition suppriment automatiquement les métadonnées EXIF lors de l\'enregistrement ou de la publication d\'une image, notamment pour protéger la vie privée des utilisateurs.' },
          { q: 'Cet outil modifie-t-il ou supprime-t-il les métadonnées ?', a: 'Non, cet outil se contente de lire et d\'afficher les métadonnées existantes ; il ne modifie pas le fichier original.' },
        ],
      }));
    },
  },
};

function convertTool(id, name, icon, desc, type, ext, article) {
  return {
    [id]: {
      name, icon, desc, cat: 'image',
      render(root) {
        const p = panel(); root.append(p);
        let file, img;
        singleImage(p, (f, i) => { file = f; img = i; go.disabled = false; });
        const out = el('div');
        const go = button('Convertir', async () => {
          const c = imgToCanvas(img);
          const blob = await canvasToBlob(c, type, 0.92);
          if (!blob || blob.type !== type) { out.innerHTML = ''; out.append(status('Format non pris en charge par ce navigateur.', 'err')); return; }
          download(blob, file.name.replace(/\.\w+$/, '') + ext, type);
          out.innerHTML = ''; out.append(status('Converti ✔', 'ok'));
        });
        go.disabled = true;
        p.append(el('div', { class: 'btn-row' }, go), out);
        if (article) root.append(toolArticle({ title: name, ...article }));
      },
    },
  };
}
