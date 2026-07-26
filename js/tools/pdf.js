import { el, panel, field, button, dropzone, download, readFile, status, loadScript, bytes, backendNotice, toolArticle } from '../ui.js';

const PDFLIB_SRC = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const PDFJS_SRC = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

// Styles pour les nouveaux contrôles (sélecteur de pages, chips qualité, cadran de rotation)
if (!document.getElementById('pdf-tools-extra-style')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'pdf-tools-extra-style';
  styleTag.textContent = `
.page-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:10px 0}
.page-toolbar .pt-count{font-size:.85rem;color:var(--muted);margin-right:auto}
.mini-btn{padding:7px 12px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2,transparent);cursor:pointer;font:inherit;font-size:.85rem}
.mini-btn:hover{border-color:var(--primary)}

.page-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px;max-height:440px;overflow-y:auto;padding:6px;border:1px solid var(--border);border-radius:12px}
.page-tile{position:relative;border:2px solid var(--border);border-radius:10px;padding:6px 6px 22px;cursor:pointer;background:var(--surface-2,transparent);transition:border-color .15s ease,box-shadow .15s ease}
.page-tile canvas{width:100%;height:auto;display:block;border-radius:4px}
.page-tile:hover{border-color:var(--primary)}
.page-tile.selected{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft,rgba(79,70,229,.25))}
.page-tile .pt-num{position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:.72rem;color:var(--muted)}
.page-tile .pt-check{display:none;position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;background:var(--primary);color:#fff;align-items:center;justify-content:center;font-size:.72rem;line-height:1}
.page-tile.selected .pt-check{display:flex}

.quality-row{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 4px}
.quality-chip{padding:10px 16px;border-radius:999px;border:1px solid var(--border);background:var(--surface-2,transparent);cursor:pointer;font:inherit;font-size:.88rem;font-weight:600;transition:all .15s ease}
.quality-chip:hover{border-color:var(--primary)}
.quality-chip.active{background:var(--primary);border-color:var(--primary);color:#fff}

.dial-wrap{text-align:center;margin:8px 0}
.dial{position:relative;width:180px;height:180px;border-radius:50%;border:1px solid var(--border);background:var(--surface-2,transparent);margin:6px auto;touch-action:none;user-select:none;cursor:pointer}
.dial-ticks{position:absolute;inset:0;pointer-events:none}
.dial-tick{position:absolute;top:0;left:50%;width:2px;height:9px;background:var(--border);transform-origin:1px 90px}
.dial-tick.major{width:3px;height:14px;background:var(--muted)}
.dial-arrow{position:absolute;top:50%;left:50%;width:4px;height:72px;background:var(--primary);border-radius:2px;transform-origin:50% 100%;transform:translate(-50%,-100%);pointer-events:none}
.dial-handle{position:absolute;top:-9px;left:50%;transform:translateX(-50%);width:20px;height:20px;border-radius:50%;background:var(--primary);box-shadow:0 0 0 4px var(--primary-soft,rgba(79,70,229,.25));pointer-events:none}
.dial-label{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:700;font-size:1.05rem;pointer-events:none}
.dial-presets{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin-top:10px}
.dial-preset{padding:6px 12px;border-radius:999px;border:1px solid var(--border);background:var(--surface-2,transparent);cursor:pointer;font:inherit;font-size:.82rem}
.dial-preset:hover{border-color:var(--primary)}
`;
  document.head.appendChild(styleTag);
}

async function pdflib() { await loadScript(PDFLIB_SRC); return window.PDFLib; }
async function pdfjs() {
  await loadScript(PDFJS_SRC);
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  return window.pdfjsLib;
}

// Generic file collector UI returning a live array
function fileCollector(root, { accept, onChange, multiple = true }) {
  const files = [];
  const list = el('ul', { class: 'file-list' });
  function redraw() {
    list.innerHTML = '';
    files.forEach((f, i) => {
      const li = el('li', { draggable: multiple },
        el('span', {}, '📄 ' + f.name),
        el('span', { class: 'fl-size' }, bytes(f.size)),
        el('button', { class: 'fl-del', title: 'Retirer', onclick: () => { files.splice(i, 1); redraw(); } }, '✕'));
      if (multiple) {
        li.addEventListener('dragstart', e => e.dataTransfer.setData('i', i));
        li.addEventListener('dragover', e => e.preventDefault());
        li.addEventListener('drop', e => {
          e.preventDefault();
          const from = +e.dataTransfer.getData('i');
          const [m] = files.splice(from, 1); files.splice(i, 0, m); redraw();
        });
      }
      list.append(li);
    });
    onChange && onChange(files);
  }
  const dz = dropzone(fs => { files.push(...(multiple ? fs : fs.slice(0, 1))); if (!multiple) files.splice(0, files.length - 1, files[files.length - 1]); redraw(); }, { accept, multiple });
  root.append(dz, list);
  return { files, redraw };
}

export const tools = {
  'merge-pdf': {
    name: 'Fusion PDF', icon: '📎', desc: 'Combinez plusieurs PDF en un seul.', cat: 'pdf',
    render(root) {
      const p = panel(); root.append(p);
      let files = [];
      fileCollector(p, { accept: '.pdf', onChange: f => { files = f; go.disabled = f.length < 2; } });
      const out = el('div');
      const go = button('Fusionner les PDF', async () => {
        go.disabled = true; go.textContent = 'Fusion…';
        try {
          const { PDFDocument } = await pdflib();
          const merged = await PDFDocument.create();
          for (const f of files) {
            const doc = await PDFDocument.load(await readFile(f), { ignoreEncryption: true });
            const pages = await merged.copyPages(doc, doc.getPageIndices());
            pages.forEach(pg => merged.addPage(pg));
          }
          download(await merged.save(), 'fusion.pdf', 'application/pdf');
          out.innerHTML = ''; out.append(status('PDF fusionné téléchargé ✔', 'ok'));
        } catch (e) { out.innerHTML = ''; out.append(status('Erreur : ' + e.message, 'err')); }
        go.disabled = false; go.textContent = 'Fusionner les PDF';
      });
      go.disabled = true;
      p.append(el('div', { class: 'btn-row' }, go), out);
      root.append(toolArticle({
        intro: [
          'Fusionner plusieurs fichiers PDF en un seul document est une tâche courante : rassembler des factures, constituer un dossier administratif, ou regrouper plusieurs chapitres d\'un rapport. Cet outil combine vos fichiers PDF dans l\'ordre de votre choix, sans perte de qualité ni de mise en page.',
          'La fusion s\'effectue entièrement dans votre navigateur grâce à la bibliothèque pdf-lib : vos documents ne sont jamais envoyés vers un serveur, ce qui est particulièrement important pour des documents sensibles comme des contrats ou des pièces d\'identité.',
        ],
        steps: [
          'Glissez-déposez au moins deux fichiers PDF, ou cliquez pour les sélectionner.',
          'Réorganisez l\'ordre des fichiers par glisser-déposer dans la liste si nécessaire.',
          'Cliquez sur "Fusionner les PDF" : le document combiné se télécharge automatiquement.',
        ],
        tips: [
          'L\'ordre dans lequel les fichiers apparaissent dans la liste détermine l\'ordre des pages dans le PDF final : vérifiez-le avant de lancer la fusion.',
          'Cet outil fonctionne aussi bien pour deux fichiers que pour plusieurs dizaines à la fois.',
        ],
        faq: [
          { q: 'Y a-t-il une limite au nombre de fichiers que je peux fusionner ?', a: 'Il n\'y a pas de limite fixée par l\'outil ; la seule contrainte pratique est la mémoire disponible sur votre appareil pour des fichiers très volumineux.' },
          { q: 'La fusion fonctionne-t-elle avec des PDF protégés par mot de passe ?', a: 'Les PDF protégés en lecture (nécessitant un mot de passe pour s\'ouvrir) ne peuvent pas être traités ; utilisez d\'abord l\'outil de déverrouillage si le mot de passe restreint uniquement l\'impression ou la copie.' },
        ],
      }));
    },
  },

  'split-pdf': {
    name: 'Division PDF', icon: '✂️', desc: 'Extrayez des pages ou séparez chaque page.', cat: 'pdf',
    render(root) {
      const p = panel(); root.append(p);
      let files = [];
      const zone = el('div');
      const out = el('div');

      fileCollector(p, {
        multiple: false, accept: '.pdf',
        onChange: f => { files = f; out.innerHTML = ''; zone.innerHTML = ''; if (files.length) loadPages(); },
      });
      p.append(zone, out);
      root.append(toolArticle({
        intro: [
          'Extraire certaines pages d\'un PDF ou séparer un document en plusieurs fichiers indépendants est utile pour ne partager qu\'une partie d\'un dossier, isoler un chapitre, ou transmettre uniquement une page spécifique sans dévoiler le reste du document.',
          'Cet outil affiche un aperçu visuel de chaque page du PDF, ce qui permet de choisir précisément les pages à extraire avant de générer le nouveau fichier.',
        ],
        steps: [
          'Importez votre fichier PDF : l\'aperçu de chaque page s\'affiche automatiquement.',
          'Cliquez sur les pages que vous souhaitez garder (ou utilisez "Tout cocher").',
          'Cliquez sur "Extraire la sélection" pour obtenir un PDF avec uniquement ces pages, ou sur "Séparer chaque page" pour télécharger un fichier PDF par page.',
        ],
        tips: [
          'Utilisez "Séparer chaque page" lorsque vous devez transmettre chaque page individuellement, par exemple pour un archivage page par page.',
          'Utilisez "Extraire la sélection" pour créer un seul nouveau PDF regroupant uniquement les pages choisies, dans leur ordre d\'origine.',
        ],
        faq: [
          { q: 'Puis-je sélectionner des pages non consécutives ?', a: 'Oui, vous pouvez cocher n\'importe quelle combinaison de pages, consécutives ou non ; elles seront réunies dans l\'ordre d\'origine du document dans le fichier extrait.' },
          { q: 'Le document original est-il modifié ?', a: 'Non, l\'outil crée un nouveau fichier à partir de votre PDF d\'origine, qui reste intact sur votre appareil.' },
        ],
      }));

      async function loadPages() {
        zone.innerHTML = '';
        const toolbar = el('div', { class: 'page-toolbar' });
        const grid = el('div', { class: 'page-grid' });
        zone.append(status('Touchez les pages à garder, ou séparez-les toutes d\'un coup.', 'info'), toolbar, grid);
        grid.append(status('Chargement des pages…', 'info'));
        try {
          const lib = await pdfjs();
          const data = new Uint8Array(await readFile(files[0]));
          const docjs = await lib.getDocument({ data }).promise;
          const total = docjs.numPages;
          const selected = new Set();
          const tiles = [];
          grid.innerHTML = '';
          for (let i = 1; i <= total; i++) {
            const page = await docjs.getPage(i);
            const base = page.getViewport({ scale: 1 });
            const scale = 110 / base.width;
            const viewport = page.getViewport({ scale });
            const canvas = el('canvas'); canvas.width = viewport.width; canvas.height = viewport.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            const tile = el('div', { class: 'page-tile', tabindex: '0' },
              canvas, el('div', { class: 'pt-check' }, '✓'), el('div', { class: 'pt-num' }, i));
            const toggle = () => {
              if (selected.has(i - 1)) { selected.delete(i - 1); tile.classList.remove('selected'); }
              else { selected.add(i - 1); tile.classList.add('selected'); }
              updateCount();
            };
            tile.addEventListener('click', toggle);
            tile.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
            tiles.push(tile);
            grid.append(tile);
          }

          const countEl = el('span', { class: 'pt-count' }, '');
          const selAll = el('button', {
            type: 'button', class: 'mini-btn',
            onclick: () => { tiles.forEach((t, i) => { selected.add(i); t.classList.add('selected'); }); updateCount(); },
          }, 'Tout cocher');
          const selNone = el('button', {
            type: 'button', class: 'mini-btn',
            onclick: () => { tiles.forEach((t, i) => { selected.delete(i); t.classList.remove('selected'); }); updateCount(); },
          }, 'Tout décocher');
          toolbar.append(countEl, selAll, selNone);

          const goExtract = button('Extraire la sélection', async () => {
            if (!selected.size) return;
            out.innerHTML = ''; out.append(status('Extraction en cours…', 'info'));
            try {
              const { PDFDocument } = await pdflib();
              const src = await PDFDocument.load(await readFile(files[0]), { ignoreEncryption: true });
              const idx = [...selected].sort((a, b) => a - b);
              const outDoc = await PDFDocument.create();
              const pages = await outDoc.copyPages(src, idx);
              pages.forEach(pg => outDoc.addPage(pg));
              download(await outDoc.save(), 'extrait.pdf', 'application/pdf');
              out.innerHTML = ''; out.append(status('PDF extrait ✔', 'ok'));
            } catch (e) { out.innerHTML = ''; out.append(status('Erreur : ' + e.message, 'err')); }
          });
          const goEach = button('Séparer chaque page', async () => {
            out.innerHTML = ''; out.append(status('Séparation en cours…', 'info'));
            try {
              const { PDFDocument } = await pdflib();
              const src = await PDFDocument.load(await readFile(files[0]), { ignoreEncryption: true });
              for (let i = 0; i < total; i++) {
                const doc = await PDFDocument.create();
                const [pg] = await doc.copyPages(src, [i]); doc.addPage(pg);
                download(await doc.save(), `page-${i + 1}.pdf`, 'application/pdf');
              }
              out.innerHTML = ''; out.append(status('Division terminée ✔', 'ok'));
            } catch (e) { out.innerHTML = ''; out.append(status('Erreur : ' + e.message, 'err')); }
          }, { primary: false });

          function updateCount() {
            countEl.textContent = `${selected.size} page(s) sélectionnée(s)`;
            goExtract.disabled = selected.size === 0;
          }
          updateCount();
          zone.append(el('div', { class: 'btn-row' }, goExtract, goEach));
        } catch (e) { grid.innerHTML = ''; grid.append(status('Erreur de chargement : ' + e.message, 'err')); }
      }
    },
  },

  'compress-pdf': {
    name: 'Compression PDF', icon: '🗜️', desc: 'Réduisez la taille d\'un PDF.', cat: 'pdf',
    render(root) {
      const p = panel(); root.append(p);
      let files = [];
      fileCollector(p, { multiple: false, accept: '.pdf', onChange: f => { files = f; } });
      const out = el('div');
      p.append(status('La compression côté navigateur réécrit et optimise la structure du PDF (objets, flux). Pour une compression d\'images agressive, un service serveur est recommandé.', 'info'));
      p.append(el('div', { class: 'btn-row' }, button('Compresser', async () => {
        if (!files.length) { out.innerHTML = ''; out.append(status('Ajoutez un PDF.', 'err')); return; }
        try {
          const { PDFDocument } = await pdflib();
          const src = await PDFDocument.load(await readFile(files[0]), { ignoreEncryption: true });
          const saved = await src.save({ useObjectStreams: true });
          const before = files[0].size, after = saved.byteLength;
          download(saved, files[0].name.replace(/\.pdf$/i, '') + '-compresse.pdf', 'application/pdf');
          out.innerHTML = '';
          out.append(status(`Avant : ${bytes(before)} → Après : ${bytes(after)} (${Math.max(0, Math.round((1 - after / before) * 100))}% en moins)`, 'ok'));
        } catch (e) { out.innerHTML = ''; out.append(status('Erreur : ' + e.message, 'err')); }
      }), out));
      root.append(toolArticle({
        intro: [
          'Un PDF trop volumineux peut être refusé par un formulaire d\'envoi de dossier, dépasser la limite d\'une pièce jointe e-mail, ou simplement ralentir son partage. Cet outil réécrit la structure interne du fichier (objets, flux de données) pour réduire son poids, sans passer par un serveur externe.',
          'Cette compression fonctionne particulièrement bien sur des PDF générés par certains logiciels qui ajoutent des données redondantes. Pour des PDF contenant surtout des images très lourdes (scans haute résolution), le gain peut être plus limité côté navigateur, un traitement serveur pouvant alors offrir une compression plus agressive.',
        ],
        steps: [
          'Importez le fichier PDF à compresser.',
          'Cliquez sur "Compresser".',
          'Le fichier optimisé se télécharge, avec le pourcentage de réduction obtenu affiché.',
        ],
        tips: [
          'Si le gain de compression est faible, votre PDF est probablement déjà composé essentiellement d\'images : pensez à compresser les images avant de les insérer dans le document source.',
          'Comparez toujours le fichier compressé à l\'original pour vérifier que la qualité visuelle reste satisfaisante pour votre usage.',
        ],
        faq: [
          { q: 'La compression dégrade-t-elle le texte du PDF ?', a: 'Non, cette compression optimise la structure interne du fichier sans altérer le texte ni les images : le contenu reste identique, seul le poids du fichier est réduit.' },
          { q: 'Pourquoi le gain de compression est-il parfois faible ?', a: 'Un PDF déjà optimisé par le logiciel qui l\'a généré, ou composé principalement d\'images déjà compressées, laisse moins de marge de réduction supplémentaire.' },
        ],
      }));
    },
  },

  'pdf-to-jpg': {
    name: 'PDF → JPG', icon: '🖼️', desc: 'Convertissez chaque page en image JPG.', cat: 'pdf',
    render(root) {
      const p = panel(); root.append(p);
      let files = [];
      fileCollector(p, { multiple: false, accept: '.pdf', onChange: f => { files = f; } });
      let qualityValue = 2;
      const levels = [
        { label: 'Standard', value: 1 },
        { label: 'Bonne qualité', value: 1.5 },
        { label: 'Haute qualité', value: 2 },
        { label: 'Qualité maximale', value: 3 },
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
      p.append(field('Qualité de l\'image', chipRow));
      const out = el('div');
      p.append(el('div', { class: 'btn-row' }, button('Convertir en JPG', async () => {
        if (!files.length) { out.innerHTML = ''; out.append(status('Ajoutez un PDF.', 'err')); return; }
        try {
          const lib = await pdfjs();
          const data = new Uint8Array(await readFile(files[0]));
          const doc = await lib.getDocument({ data }).promise;
          for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const viewport = page.getViewport({ scale: qualityValue });
            const canvas = el('canvas'); canvas.width = viewport.width; canvas.height = viewport.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92));
            download(blob, `page-${i}.jpg`, 'image/jpeg');
          }
          out.innerHTML = ''; out.append(status(`${doc.numPages} page(s) converties ✔`, 'ok'));
        } catch (e) { out.innerHTML = ''; out.append(status('Erreur : ' + e.message, 'err')); }
      }), out));
      root.append(toolArticle({
        intro: [
          'Convertir les pages d\'un PDF en images JPG permet de les insérer facilement dans une présentation, un article de blog, ou de les partager sur un support qui n\'accepte pas les fichiers PDF. Cet outil génère une image JPG distincte pour chaque page du document.',
        ],
        steps: [
          'Importez le fichier PDF à convertir.',
          'Choisissez la qualité d\'image souhaitée (standard à maximale).',
          'Cliquez sur "Convertir en JPG" : une image par page se télécharge automatiquement.',
        ],
        tips: [
          'Une qualité "Haute" ou "Maximale" est recommandée si vous prévoyez d\'agrandir ou d\'imprimer les images obtenues.',
          'Pour un document de nombreuses pages, votre navigateur peut demander une confirmation avant de télécharger plusieurs fichiers d\'un coup : acceptez le téléchargement multiple pour récupérer toutes les pages.',
        ],
        faq: [
          { q: 'Le texte du PDF reste-t-il sélectionnable dans les images obtenues ?', a: 'Non, chaque page est convertie en image (pixels), le texte n\'est donc plus sélectionnable ni copiable une fois converti en JPG.' },
          { q: 'Puis-je convertir uniquement certaines pages ?', a: 'Cet outil convertit toutes les pages du document. Pour ne convertir qu\'une sélection, utilisez d\'abord l\'outil de division PDF pour extraire les pages souhaitées.' },
        ],
      }));
    },
  },

  'jpg-to-pdf': {
    name: 'JPG → PDF', icon: '📄', desc: 'Assemblez des images en un PDF.', cat: 'pdf',
    render(root) {
      const p = panel(); root.append(p);
      let files = [];
      fileCollector(p, { accept: 'image/*', onChange: f => { files = f; } });
      const out = el('div');
      p.append(el('div', { class: 'btn-row' }, button('Créer le PDF', async () => {
        if (!files.length) { out.innerHTML = ''; out.append(status('Ajoutez des images.', 'err')); return; }
        try {
          const { PDFDocument } = await pdflib();
          const doc = await PDFDocument.create();
          for (const f of files) {
            const buf = await readFile(f);
            const img = /png$/i.test(f.type) ? await doc.embedPng(buf) : await doc.embedJpg(buf);
            const page = doc.addPage([img.width, img.height]);
            page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
          }
          download(await doc.save(), 'images.pdf', 'application/pdf');
          out.innerHTML = ''; out.append(status('PDF créé ✔', 'ok'));
        } catch (e) { out.innerHTML = ''; out.append(status('Erreur (PNG/JPG uniquement) : ' + e.message, 'err')); }
      }), out));
      root.append(toolArticle({
        intro: [
          'Assembler plusieurs images en un seul document PDF est pratique pour envoyer un ensemble de photos ou de scans sous forme d\'un fichier unique et facilement imprimable, par exemple des photos de justificatifs, des pages scannées à la main, ou une série de captures d\'écran.',
          'Chaque image devient une page du PDF, dans l\'ordre où elle apparaît dans la liste, à sa taille d\'origine.',
        ],
        steps: [
          'Importez une ou plusieurs images (PNG ou JPG).',
          'Réorganisez-les par glisser-déposer si l\'ordre des pages doit être différent.',
          'Cliquez sur "Créer le PDF" pour télécharger le document final.',
        ],
        tips: [
          'Pour un rendu homogène, utilisez des images de proportions similaires : des images très différentes en taille produiront des pages PDF de dimensions différentes.',
          'Cet outil accepte les formats PNG et JPG ; pour d\'autres formats (WebP, HEIC…), convertissez d\'abord l\'image avec l\'outil de conversion d\'image adapté.',
        ],
        faq: [
          { q: 'Puis-je mélanger des images PNG et JPG dans le même PDF ?', a: 'Oui, l\'outil gère les deux formats simultanément et les assemble dans un même document, dans l\'ordre choisi.' },
          { q: 'La qualité des images est-elle réduite lors de la conversion ?', a: 'Non, chaque image est intégrée à sa résolution d\'origine dans le PDF, sans recompression supplémentaire.' },
        ],
      }));
    },
  },

  'rotate-pdf': {
    name: 'Rotation PDF', icon: '🔄', desc: 'Faites pivoter toutes les pages, à n\'importe quel angle.', cat: 'pdf',
    render(root) {
      const p = panel(); root.append(p);
      let files = [];
      fileCollector(p, { multiple: false, accept: '.pdf', onChange: f => { files = f; } });

      let currentAngle = 90;
      const label = el('div', { class: 'dial-label' }, '90°');
      const arrow = el('div', { class: 'dial-arrow' }, el('div', { class: 'dial-handle' }));
      const ticks = el('div', { class: 'dial-ticks' });
      for (let d = 0; d < 360; d += 10) {
        ticks.append(el('div', { class: 'dial-tick' + (d % 90 === 0 ? ' major' : ''), style: `transform: rotate(${d}deg)` }));
      }
      const dial = el('div', { class: 'dial' }, ticks, arrow, label);
      const presetsRow = el('div', { class: 'dial-presets' });
      [0, 90, 180, 270].forEach(a => {
        presetsRow.append(el('button', { type: 'button', class: 'dial-preset', onclick: () => setAngle(a) }, a + '°'));
      });

      let dragging = false;
      function angleFromEvent(e) {
        const rect = dial.getBoundingClientRect();
        const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy;
        let a = Math.atan2(dx, -dy) * 180 / Math.PI;
        if (a < 0) a += 360;
        return Math.round(a);
      }
      function setAngle(a) {
        currentAngle = ((Math.round(a) % 360) + 360) % 360;
        arrow.style.transform = `translate(-50%,-100%) rotate(${currentAngle}deg)`;
        label.textContent = currentAngle + '°';
      }
      dial.addEventListener('pointerdown', e => { dial.setPointerCapture(e.pointerId); dragging = true; setAngle(angleFromEvent(e)); });
      dial.addEventListener('pointermove', e => { if (dragging) setAngle(angleFromEvent(e)); });
      dial.addEventListener('pointerup', () => { dragging = false; });
      dial.addEventListener('pointercancel', () => { dragging = false; });
      setAngle(90);

      p.append(field('Angle de rotation', el('div', { class: 'dial-wrap' }, dial, presetsRow), 'Touchez ou faites glisser autour du cercle'));

      const out = el('div');
      p.append(el('div', { class: 'btn-row' }, button('Pivoter', async () => {
        if (!files.length) { out.innerHTML = ''; out.append(status('Ajoutez un PDF.', 'err')); return; }
        out.innerHTML = ''; out.append(status('Rotation en cours…', 'info'));
        try {
          const angle = currentAngle;
          if (angle % 90 === 0) {
            const { PDFDocument, degrees } = await pdflib();
            const doc = await PDFDocument.load(await readFile(files[0]), { ignoreEncryption: true });
            doc.getPages().forEach(pg => pg.setRotation(degrees((((pg.getRotation().angle + angle) % 360) + 360) % 360)));
            download(await doc.save(), 'pivote.pdf', 'application/pdf');
          } else {
            // Angle libre : impossible avec l'attribut de rotation natif du PDF (multiples de 90° uniquement),
            // on redessine donc chaque page pivotée en image dans un nouveau PDF.
            const { PDFDocument } = await pdflib();
            const lib = await pdfjs();
            const data = new Uint8Array(await readFile(files[0]));
            const docjs = await lib.getDocument({ data }).promise;
            const outDoc = await PDFDocument.create();
            const rad = angle * Math.PI / 180;
            for (let i = 1; i <= docjs.numPages; i++) {
              const page = await docjs.getPage(i);
              const viewport = page.getViewport({ scale: 2 });
              const srcCanvas = el('canvas'); srcCanvas.width = viewport.width; srcCanvas.height = viewport.height;
              await page.render({ canvasContext: srcCanvas.getContext('2d'), viewport }).promise;
              const w = srcCanvas.width, h = srcCanvas.height;
              const newW = Math.round(Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad)));
              const newH = Math.round(Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad)));
              const outCanvas = el('canvas'); outCanvas.width = newW; outCanvas.height = newH;
              const ctx = outCanvas.getContext('2d');
              ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, newW, newH);
              ctx.translate(newW / 2, newH / 2);
              ctx.rotate(rad);
              ctx.drawImage(srcCanvas, -w / 2, -h / 2);
              const blob = await new Promise(r => outCanvas.toBlob(r, 'image/jpeg', 0.93));
              const imgBytes = new Uint8Array(await blob.arrayBuffer());
              const img = await outDoc.embedJpg(imgBytes);
              const pdfPage = outDoc.addPage([newW, newH]);
              pdfPage.drawImage(img, { x: 0, y: 0, width: newW, height: newH });
            }
            download(await outDoc.save(), 'pivote.pdf', 'application/pdf');
          }
          out.innerHTML = ''; out.append(status('PDF pivoté ✔', 'ok'));
        } catch (e) { out.innerHTML = ''; out.append(status('Erreur : ' + e.message, 'err')); }
      }), out));
      root.append(toolArticle({
        intro: [
          'Il arrive fréquemment qu\'un document scanné ou photographié soit enregistré à l\'envers ou de travers. Cet outil fait pivoter toutes les pages d\'un PDF selon l\'angle de votre choix : les angles classiques (90°, 180°, 270°) grâce à la rotation native du format PDF, mais aussi n\'importe quel angle libre grâce au cadran interactif, pour corriger une légère inclinaison de scan.',
        ],
        steps: [
          'Importez le fichier PDF à faire pivoter.',
          'Choisissez un angle prédéfini (90°, 180°, 270°) ou faites glisser le cadran pour un angle personnalisé.',
          'Cliquez sur "Pivoter" pour télécharger le document corrigé.',
        ],
        tips: [
          'Pour une simple erreur d\'orientation (page à l\'envers ou sur le côté), les angles de 90°, 180° ou 270° suffisent et préservent le texte sélectionnable du PDF.',
          'Pour un scan légèrement de travers (par exemple 3° ou 7°), le mode angle libre redessine chaque page en image afin d\'appliquer une rotation précise : dans ce cas, le texte n\'est plus sélectionnable dans le résultat.',
        ],
        faq: [
          { q: 'Quelle est la différence entre un angle de 90° et un angle libre ?', a: 'Un angle multiple de 90° utilise l\'attribut de rotation natif du PDF, qui préserve le texte sélectionnable. Un angle libre (non multiple de 90°) nécessite de redessiner chaque page comme une image, car le format PDF ne permet pas nativement une rotation à un angle quelconque.' },
          { q: 'La rotation s\'applique-t-elle à toutes les pages ?', a: 'Oui, l\'angle choisi est appliqué uniformément à l\'ensemble des pages du document.' },
        ],
      }));
    },
  },

  'unlock-pdf': {
    name: 'Déverrouillage PDF', icon: '🔓', desc: 'Retirez la protection d\'un PDF que vous possédez.', cat: 'pdf',
    render(root) {
      const p = panel(); root.append(p);
      let files = [];
      fileCollector(p, { multiple: false, accept: '.pdf', onChange: f => { files = f; } });
      p.append(status('N\'utilisez cet outil que sur des PDF vous appartenant. La restriction de propriétaire (impression/copie) est retirée en réécrivant le document.', 'info'));
      const out = el('div');
      p.append(el('div', { class: 'btn-row' }, button('Déverrouiller', async () => {
        if (!files.length) { out.innerHTML = ''; out.append(status('Ajoutez un PDF.', 'err')); return; }
        try {
          const { PDFDocument } = await pdflib();
          const doc = await PDFDocument.load(await readFile(files[0]), { ignoreEncryption: true });
          download(await doc.save(), 'deverrouille.pdf', 'application/pdf');
          out.innerHTML = ''; out.append(status('PDF déverrouillé ✔', 'ok'));
        } catch (e) { out.innerHTML = ''; out.append(status('Erreur (mot de passe utilisateur requis) : ' + e.message, 'err')); }
      }), out));
      root.append(toolArticle({
        intro: [
          'Certains PDF sont protégés par un mot de passe "propriétaire", qui restreint des actions comme l\'impression, la copie de texte ou la modification, sans pour autant demander de mot de passe à l\'ouverture du fichier. Cet outil retire ce type de restriction en réécrivant la structure du document, pour les fichiers PDF qui vous appartiennent.',
          'Il ne permet pas de contourner un mot de passe d\'ouverture (le PDF doit s\'ouvrir sans mot de passe pour être traité) : il agit uniquement sur les restrictions d\'usage appliquées par le propriétaire du document.',
        ],
        steps: [
          'Importez le fichier PDF concerné.',
          'Cliquez sur "Déverrouiller".',
          'Le fichier sans restriction d\'impression ou de copie se télécharge.',
        ],
        tips: [
          'N\'utilisez cet outil que sur des documents que vous possédez ou que vous avez le droit de modifier : retirer une protection sur un document appartenant à un tiers, sans autorisation, peut constituer une violation de ses droits.',
          'Si le fichier demande un mot de passe pour s\'ouvrir, cet outil ne peut pas le déverrouiller : ce type de protection nécessite le mot de passe correct pour être retiré.',
        ],
        faq: [
          { q: 'Quelle est la différence entre un mot de passe d\'ouverture et une restriction propriétaire ?', a: 'Le mot de passe d\'ouverture empêche d\'accéder au contenu du PDF sans le saisir. La restriction propriétaire, elle, permet d\'ouvrir et de lire le document librement, mais bloque certaines actions comme l\'impression ou la copie de texte.' },
          { q: 'Est-il légal de retirer cette protection ?', a: 'Oui, dans la mesure où vous êtes le propriétaire du document ou que vous disposez de l\'autorisation de le modifier. Retirer la protection d\'un document appartenant à un tiers sans son accord n\'est pas approprié.' },
        ],
      }));
    },
  },

  'protect-pdf': {
    name: 'Protection PDF', icon: '🔐', desc: 'Ajoutez un mot de passe à un PDF.', cat: 'pdf', badge: 'API',
    render(root) {
      const p = panel(); root.append(p);
      p.append(backendNotice('Le chiffrement d\'un PDF avec mot de passe'));
    },
  },

  'pdf-to-word': {
    name: 'PDF → Word', icon: '📝', desc: 'Convertissez un PDF en document Word.', cat: 'pdf', badge: 'API',
    render(root) { root.append(panel(backendNotice('La conversion PDF → Word (mise en page fidèle)'))); },
  },
  'word-to-pdf': {
    name: 'Word → PDF', icon: '📄', desc: 'Convertissez un document Word en PDF.', cat: 'pdf', badge: 'API',
    render(root) { root.append(panel(backendNotice('La conversion Word → PDF (rendu fidèle)'))); },
  },
};
