import { el, panel, field, button, status, copyBtn, download, dropzone, readFile, loadScript, toast } from '../ui.js';

export const tools = {
  'qr-generator': {
    name: 'Générateur QR', icon: '🔳', desc: 'Créez un QR code à partir d\'un texte ou URL.', cat: 'misc',
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
    },
  },
  'qr-reader': {
    name: 'Lecteur QR', icon: '📷', desc: 'Décodez un QR code depuis une image.', cat: 'misc',
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
    },
  },
  'password-generator': {
    name: 'Générateur de mots de passe', icon: '🔑', desc: 'Créez des mots de passe forts.', cat: 'misc',
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
    },
  },
  'password-checker': {
    name: 'Vérificateur de mot de passe', icon: '🛡️', desc: 'Évaluez la robustesse d\'un mot de passe.', cat: 'misc',
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
    },
  },
  'barcode-generator': {
    name: 'Générateur de code-barres', icon: '📇', desc: 'Créez un code-barres (EAN, Code128…).', cat: 'misc',
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
    },
  },
  'favicon-creator': {
    name: 'Créateur de favicon', icon: '⭐', desc: 'Générez des favicons depuis une image ou un emoji.', cat: 'misc',
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
    },
  },
  'calendar': {
    name: 'Calendrier', icon: '📅', desc: 'Affichez un calendrier mensuel.', cat: 'misc',
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
    },
  },
};
