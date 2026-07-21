import { el, panel, field, button, dropzone, download, readFile, status, loadScript, bytes, adInterstitial, backendNotice } from '../ui.js';

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
          await adInterstitial();
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
              await adInterstitial();
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
              await adInterstitial();
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
          await adInterstitial();
          const { PDFDocument } = await pdflib();
          const src = await PDFDocument.load(await readFile(files[0]), { ignoreEncryption: true });
          const saved = await src.save({ useObjectStreams: true });
          const before = files[0].size, after = saved.byteLength;
          download(saved, files[0].name.replace(/\.pdf$/i, '') + '-compresse.pdf', 'application/pdf');
          out.innerHTML = '';
          out.append(status(`Avant : ${bytes(before)} → Après : ${bytes(after)} (${Math.max(0, Math.round((1 - after / before) * 100))}% en moins)`, 'ok'));
        } catch (e) { out.innerHTML = ''; out.append(status('Erreur : ' + e.message, 'err')); }
      }), out));
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
          await adInterstitial();
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
          await adInterstitial();
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
          await adInterstitial();
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
