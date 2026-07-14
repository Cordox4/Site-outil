import { el, panel, field, button, dropzone, download, readFile, status, loadScript, bytes, adInterstitial, backendNotice } from '../ui.js';

const PDFLIB_SRC = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const PDFJS_SRC = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

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
      fileCollector(p, { multiple: false, accept: '.pdf', onChange: f => { files = f; } });
      const range = el('input', { type: 'text', placeholder: 'Ex : 1-3, 5, 8-10 (vide = chaque page)' });
      p.append(field('Pages à extraire', range, 'Laissez vide pour obtenir un PDF par page'));
      const out = el('div');
      p.append(el('div', { class: 'btn-row' }, button('Diviser', async () => {
        if (!files.length) { out.innerHTML = ''; out.append(status('Ajoutez un PDF.', 'err')); return; }
        try {
          await adInterstitial();
          const { PDFDocument } = await pdflib();
          const src = await PDFDocument.load(await readFile(files[0]), { ignoreEncryption: true });
          const total = src.getPageCount();
          const parse = s => {
            const idx = new Set();
            s.split(',').forEach(part => {
              part = part.trim(); if (!part) return;
              const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
              if (m) { for (let i = +m[1]; i <= +m[2]; i++) if (i >= 1 && i <= total) idx.add(i - 1); }
              else { const n = +part; if (n >= 1 && n <= total) idx.add(n - 1); }
            });
            return [...idx].sort((a, b) => a - b);
          };
          if (range.value.trim()) {
            const idx = parse(range.value);
            if (!idx.length) throw new Error('Aucune page valide.');
            const doc = await PDFDocument.create();
            const pages = await doc.copyPages(src, idx);
            pages.forEach(pg => doc.addPage(pg));
            download(await doc.save(), 'extrait.pdf', 'application/pdf');
          } else {
            for (let i = 0; i < total; i++) {
              const doc = await PDFDocument.create();
              const [pg] = await doc.copyPages(src, [i]); doc.addPage(pg);
              download(await doc.save(), `page-${i + 1}.pdf`, 'application/pdf');
            }
          }
          out.innerHTML = ''; out.append(status('Division terminée ✔', 'ok'));
        } catch (e) { out.innerHTML = ''; out.append(status('Erreur : ' + e.message, 'err')); }
      }), out));
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
      const scale = el('input', { type: 'range', min: '1', max: '3', step: '0.5', value: '2' });
      p.append(field('Qualité / résolution', scale));
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
            const viewport = page.getViewport({ scale: +scale.value });
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
    name: 'Rotation PDF', icon: '🔄', desc: 'Faites pivoter toutes les pages.', cat: 'pdf',
    render(root) {
      const p = panel(); root.append(p);
      let files = [];
      fileCollector(p, { multiple: false, accept: '.pdf', onChange: f => { files = f; } });
      const angle = el('select', {}, ...[90, 180, 270].map(a => el('option', { value: a }, a + '°')));
      p.append(field('Angle de rotation', angle));
      const out = el('div');
      p.append(el('div', { class: 'btn-row' }, button('Pivoter', async () => {
        if (!files.length) { out.innerHTML = ''; out.append(status('Ajoutez un PDF.', 'err')); return; }
        try {
          const { PDFDocument, degrees } = await pdflib();
          const doc = await PDFDocument.load(await readFile(files[0]), { ignoreEncryption: true });
          doc.getPages().forEach(pg => pg.setRotation(degrees((pg.getRotation().angle + +angle.value) % 360)));
          download(await doc.save(), 'pivote.pdf', 'application/pdf');
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
