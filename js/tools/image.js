import { el, panel, field, button, dropzone, download, readFile, status, loadScript, bytes, backendNotice } from '../ui.js';

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
    },
  },
  ...convertTool('png-to-jpg', 'PNG → JPG', '🖼️', 'Convertissez un PNG en JPG.', 'image/jpeg', '.jpg'),
  ...convertTool('jpg-to-png', 'JPG → PNG', '🖼️', 'Convertissez un JPG en PNG.', 'image/png', '.png'),
  ...convertTool('webp-convert', 'Conversion WebP', '🖼️', 'Convertissez une image en WebP.', 'image/webp', '.webp'),
  ...convertTool('avif-convert', 'Conversion AVIF', '🖼️', 'Convertissez une image en AVIF (selon le navigateur).', 'image/avif', '.avif'),

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
