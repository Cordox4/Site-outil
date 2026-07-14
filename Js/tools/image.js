import { el, panel, field, button, dropzone, download, readFile, status, loadScript, bytes, backendNotice } from '../ui.js';

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

export const tools = {
  'compress-image': {
    name: 'Compresser image', icon: '🗜️', desc: 'Réduisez le poids d\'une image (JPG/WebP).', cat: 'image',
    render(root) {
      const p = panel(); root.append(p);
      let file, img;
      singleImage(p, (f, i) => { file = f; img = i; go.disabled = false; });
      const q = el('input', { type: 'range', min: '0.1', max: '1', step: '0.05', value: '0.7' });
      const ql = el('span', {}, '70%'); q.addEventListener('input', () => ql.textContent = Math.round(q.value * 100) + '%');
      p.append(field('Qualité', el('div', { class: 'inline' }, q, ql)));
      const out = el('div');
      const go = button('Compresser', async () => {
        const c = imgToCanvas(img);
        const blob = await canvasToBlob(c, 'image/jpeg', +q.value);
        download(blob, file.name.replace(/\.\w+$/, '') + '-compresse.jpg', 'image/jpeg');
        out.innerHTML = ''; out.append(status(`${bytes(file.size)} → ${bytes(blob.size)} (${Math.max(0, Math.round((1 - blob.size / file.size) * 100))}% en moins)`, 'ok'));
      });
      go.disabled = true;
      p.append(el('div', { class: 'btn-row' }, go), out);
    },
  },
  'resize-image': {
    name: 'Redimensionner image', icon: '📐', desc: 'Changez les dimensions d\'une image.', cat: 'image',
    render(root) {
      const p = panel(); root.append(p);
      let file, img;
      const w = el('input', { type: 'number', min: '1' }), h = el('input', { type: 'number', min: '1' });
      const keep = el('input', { type: 'checkbox', checked: true });
      singleImage(p, (f, i) => { file = f; img = i; w.value = i.naturalWidth; h.value = i.naturalHeight; go.disabled = false; });
      w.addEventListener('input', () => { if (keep.checked && img) h.value = Math.round(w.value * img.naturalHeight / img.naturalWidth); });
      h.addEventListener('input', () => { if (keep.checked && img) w.value = Math.round(h.value * img.naturalWidth / img.naturalHeight); });
      p.append(el('div', { class: 'row' }, field('Largeur (px)', w), field('Hauteur (px)', h)));
      p.append(el('label', { class: 'check' }, keep, 'Conserver les proportions'));
      const out = el('div');
      const go = button('Redimensionner', async () => {
        const c = imgToCanvas(img, +w.value, +h.value);
        const type = /png/i.test(file.type) ? 'image/png' : 'image/jpeg';
        const blob = await canvasToBlob(c, type, 0.92);
        download(blob, file.name.replace(/\.\w+$/, '') + `-${w.value}x${h.value}` + (type === 'image/png' ? '.png' : '.jpg'), type);
        out.innerHTML = ''; out.append(status('Image redimensionnée ✔', 'ok'));
      });
      go.disabled = true;
      p.append(el('div', { class: 'btn-row' }, go), out);
    },
  },
  'crop-image': {
    name: 'Recadrer image', icon: '🔲', desc: 'Recadrez une zone rectangulaire.', cat: 'image',
    render(root) {
      const p = panel(); root.append(p);
      let file, img;
      const x = el('input', { type: 'number', value: '0', min: '0' }), y = el('input', { type: 'number', value: '0', min: '0' });
      const w = el('input', { type: 'number', min: '1' }), h = el('input', { type: 'number', min: '1' });
      singleImage(p, (f, i) => { file = f; img = i; w.value = i.naturalWidth; h.value = i.naturalHeight; go.disabled = false; });
      p.append(el('div', { class: 'row' }, field('X', x), field('Y', y), field('Largeur', w), field('Hauteur', h)));
      const out = el('div');
      const go = button('Recadrer', async () => {
        const c = el('canvas'); c.width = +w.value; c.height = +h.value;
        c.getContext('2d').drawImage(img, +x.value, +y.value, +w.value, +h.value, 0, 0, +w.value, +h.value);
        const type = /png/i.test(file.type) ? 'image/png' : 'image/jpeg';
        download(await canvasToBlob(c, type, 0.92), file.name.replace(/\.\w+$/, '') + '-recadre' + (type === 'image/png' ? '.png' : '.jpg'), type);
        out.innerHTML = ''; out.append(status('Image recadrée ✔', 'ok'));
      });
      go.disabled = true;
      p.append(el('div', { class: 'btn-row' }, go), out);
    },
  },
  ...convertTool('png-to-jpg', 'PNG → JPG', '🖼️', 'Convertissez un PNG en JPG.', 'image/jpeg', '.jpg'),
  ...convertTool('jpg-to-png', 'JPG → PNG', '🖼️', 'Convertissez un JPG en PNG.', 'image/png', '.png'),
  ...convertTool('webp-convert', 'Conversion WebP', '🖼️', 'Convertissez une image en WebP.', 'image/webp', '.webp'),
  ...convertTool('avif-convert', 'Conversion AVIF', '🖼️', 'Convertissez une image en AVIF (selon le navigateur).', 'image/avif', '.avif'),

  'watermark-image': {
    name: 'Filigrane image', icon: '💧', desc: 'Ajoutez un texte en filigrane.', cat: 'image',
    render(root) {
      const p = panel(); root.append(p);
      let file, img;
      singleImage(p, (f, i) => { file = f; img = i; go.disabled = false; });
      const txt = el('input', { type: 'text', value: '© OutilsBox' });
      const size = el('input', { type: 'number', value: '32', min: '8' });
      const opacity = el('input', { type: 'range', min: '0.1', max: '1', step: '0.1', value: '0.4' });
      const color = el('input', { type: 'color', value: '#ffffff' });
      p.append(field('Texte', txt), el('div', { class: 'row' }, field('Taille', size), field('Opacité', opacity), field('Couleur', color)));
      const out = el('div');
      const go = button('Appliquer le filigrane', async () => {
        const c = imgToCanvas(img); const ctx = c.getContext('2d');
        ctx.globalAlpha = +opacity.value; ctx.fillStyle = color.value;
        ctx.font = `bold ${size.value}px Inter, sans-serif`;
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText(txt.value, c.width - 20, c.height - 20);
        const type = /png/i.test(file.type) ? 'image/png' : 'image/jpeg';
        download(await canvasToBlob(c, type, 0.92), file.name.replace(/\.\w+$/, '') + '-filigrane' + (type === 'image/png' ? '.png' : '.jpg'), type);
        out.innerHTML = ''; out.append(status('Filigrane appliqué ✔', 'ok'));
      });
      go.disabled = true;
      p.append(el('div', { class: 'btn-row' }, go), out);
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
    },
  },
};

function convertTool(id, name, icon, desc, type, ext) {
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
      },
    },
  };
}
