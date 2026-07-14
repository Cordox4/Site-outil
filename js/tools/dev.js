import { el, panel, field, button, status, copyBtn, loadScript } from '../ui.js';

function textTool({ inLabel = 'Entrée', outLabel = 'Résultat', run, actionLabel = 'Exécuter', mono = true, sample = '' }) {
  return (root) => {
    const p = panel(); root.append(p);
    const inp = el('textarea', { class: mono ? 'mono' : '', placeholder: 'Collez ici…' });
    const out = el('pre', { class: 'output mono' });
    const st = el('div');
    const go = () => {
      try { const r = run(inp.value); out.textContent = r; st.innerHTML = ''; }
      catch (e) { out.textContent = ''; st.innerHTML = ''; st.append(status('Erreur : ' + e.message, 'err')); }
    };
    if (sample) inp.value = sample;
    p.append(field(inLabel, inp), el('div', { class: 'btn-row' }, button(actionLabel, go), copyBtn(() => out.textContent)), field(outLabel, out));
    go();
  };
}

async function sha(algo, str) {
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export const tools = {
  'json-formatter': {
    name: 'JSON Formatter', icon: '{ }', desc: 'Indentez et embellissez du JSON.', cat: 'dev',
    render: textTool({ actionLabel: 'Formater', sample: '{"nom":"Devin","tags":["a","b"],"actif":true}', run: v => JSON.stringify(JSON.parse(v), null, 2) }),
  },
  'json-validator': {
    name: 'JSON Validator', icon: '✅', desc: 'Vérifiez la validité d\'un JSON.', cat: 'dev',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono' });
      const st = el('div', { style: 'margin-top:10px' });
      const go = () => { try { JSON.parse(inp.value); st.innerHTML = ''; st.append(status('JSON valide ✔', 'ok')); } catch (e) { st.innerHTML = ''; st.append(status('Invalide : ' + e.message, 'err')); } };
      inp.addEventListener('input', go);
      p.append(field('JSON', inp), st); go();
    },
  },
  'xml-formatter': {
    name: 'XML Formatter', icon: '</>', desc: 'Indentez du XML.', cat: 'dev',
    render: textTool({
      actionLabel: 'Formater', sample: '<a><b>1</b><c>2</c></a>',
      run: v => {
        const doc = new DOMParser().parseFromString(v, 'application/xml');
        if (doc.querySelector('parsererror')) throw new Error('XML mal formé');
        let out = '', indent = 0;
        v.replace(/>\s*</g, '><').split(/(?=<)/).forEach(node => {
          if (/^<\/\w/.test(node)) indent--;
          out += '  '.repeat(Math.max(0, indent)) + node.trim() + '\n';
          if (/^<\w[^>]*[^\/]>$/.test(node) && !/^<.*<\/.*>$/.test(node)) indent++;
        });
        return out.trim();
      },
    }),
  },
  'yaml-validator': {
    name: 'YAML Validator', icon: '📑', desc: 'Validez du YAML et convertissez-le en JSON.', cat: 'dev',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono', placeholder: 'clé: valeur\nliste:\n  - a\n  - b' });
      const out = el('pre', { class: 'output mono' }); const st = el('div');
      const go = async () => {
        await loadScript('https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js');
        try { const o = window.jsyaml.load(inp.value); out.textContent = JSON.stringify(o, null, 2); st.innerHTML = ''; st.append(status('YAML valide ✔', 'ok')); }
        catch (e) { out.textContent = ''; st.innerHTML = ''; st.append(status('Invalide : ' + e.message, 'err')); }
      };
      inp.addEventListener('input', go);
      p.append(field('YAML', inp), st, field('JSON équivalent', out));
    },
  },
  'csv-viewer': {
    name: 'CSV Viewer', icon: '📊', desc: 'Visualisez un CSV sous forme de tableau.', cat: 'dev',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono', placeholder: 'nom,age\nAlice,30\nBob,25' });
      const sep = el('input', { type: 'text', value: ',', maxlength: '1', style: 'max-width:60px' });
      const out = el('div', { class: 'output' });
      const parse = (text, d) => {
        const rows = []; let row = [], cur = '', q = false;
        for (let i = 0; i < text.length; i++) {
          const c = text[i];
          if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
          else if (c === '"') q = true;
          else if (c === d) { row.push(cur); cur = ''; }
          else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
          else if (c !== '\r') cur += c;
        }
        if (cur || row.length) { row.push(cur); rows.push(row); }
        return rows;
      };
      const go = () => {
        const rows = parse(inp.value.trim(), sep.value || ',');
        out.innerHTML = '';
        if (!rows.length) return;
        const t = el('table', { class: 'data' });
        t.append(el('thead', {}, el('tr', {}, ...rows[0].map(h => el('th', {}, h)))));
        t.append(el('tbody', {}, ...rows.slice(1).map(r => el('tr', {}, ...r.map(c => el('td', {}, c))))));
        out.append(t);
      };
      inp.addEventListener('input', go); sep.addEventListener('input', go);
      p.append(field('CSV', inp), field('Séparateur', sep), field('Tableau', out)); inp.value = 'nom,age\nAlice,30\nBob,25'; go();
    },
  },
  'base64-encode': {
    name: 'Encodeur Base64', icon: '🔠', desc: 'Encodez du texte en Base64.', cat: 'dev',
    render: textTool({ actionLabel: 'Encoder', sample: 'Bonjour le monde', run: v => btoa(unescape(encodeURIComponent(v))) }),
  },
  'base64-decode': {
    name: 'Décodeur Base64', icon: '🔡', desc: 'Décodez du Base64 en texte.', cat: 'dev',
    render: textTool({ actionLabel: 'Décoder', sample: 'Qm9uam91ciBsZSBtb25kZQ==', run: v => decodeURIComponent(escape(atob(v.trim()))) }),
  },
  'jwt-decoder': {
    name: 'JWT Decoder', icon: '🎫', desc: 'Décodez l\'en-tête et le payload d\'un JWT.', cat: 'dev',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono', placeholder: 'eyJ...' });
      const h = el('pre', { class: 'output mono' }), pl = el('pre', { class: 'output mono' });
      const dec = s => JSON.stringify(JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))))), null, 2);
      const go = () => {
        try { const [a, b] = inp.value.trim().split('.'); h.textContent = dec(a); pl.textContent = dec(b); }
        catch (e) { h.textContent = ''; pl.textContent = 'JWT invalide : ' + e.message; }
      };
      inp.addEventListener('input', go);
      p.append(field('JWT', inp), field('En-tête', h), field('Payload', pl));
    },
  },
  'sha256': {
    name: 'Hash SHA-256', icon: '#️⃣', desc: 'Calculez l\'empreinte SHA-256 d\'un texte.', cat: 'dev',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', {}); const out = el('input', { type: 'text', class: 'mono', readonly: true });
      const go = async () => { out.value = await sha('SHA-256', inp.value); };
      inp.addEventListener('input', go);
      p.append(field('Texte', inp), el('div', { class: 'btn-row' }, copyBtn(() => out.value)), field('SHA-256', out)); go();
    },
  },
  'md5': {
    name: 'Hash MD5', icon: '#️⃣', desc: 'Calculez l\'empreinte MD5 d\'un texte.', cat: 'dev',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', {}); const out = el('input', { type: 'text', class: 'mono', readonly: true });
      const go = async () => { await loadScript('https://cdn.jsdelivr.net/npm/blueimp-md5@2.19.0/js/md5.min.js'); out.value = window.md5(inp.value); };
      inp.addEventListener('input', go);
      p.append(field('Texte', inp), el('div', { class: 'btn-row' }, copyBtn(() => out.value)), field('MD5', out));
    },
  },
  'uuid': {
    name: 'Générateur UUID', icon: '🆔', desc: 'Générez des identifiants UUID v4.', cat: 'dev',
    render(root) {
      const p = panel(); root.append(p);
      const n = el('input', { type: 'number', value: '5', min: '1', max: '1000' });
      const out = el('textarea', { class: 'mono', readonly: true });
      const go = () => { out.value = Array.from({ length: +n.value }, () => crypto.randomUUID()).join('\n'); };
      p.append(field('Combien ?', n), el('div', { class: 'btn-row' }, button('Générer', go), copyBtn(() => out.value)), field('UUID', out)); go();
    },
  },
  'regex-tester': {
    name: 'Regex Tester', icon: '🧪', desc: 'Testez une expression régulière.', cat: 'dev',
    render(root) {
      const p = panel(); root.append(p);
      const pat = el('input', { type: 'text', class: 'mono', placeholder: '\\b\\w+@\\w+\\.\\w+\\b' });
      const flags = el('input', { type: 'text', value: 'g', style: 'max-width:80px' });
      const txt = el('textarea', { placeholder: 'Texte à tester…' });
      const out = el('div', { class: 'output' }); const st = el('div');
      const go = () => {
        st.innerHTML = '';
        try {
          const re = new RegExp(pat.value, flags.value);
          let count = 0;
          const html = txt.value.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
            .replace(new RegExp(pat.value, flags.value.includes('g') ? flags.value : flags.value + 'g'), m => { count++; return `<mark style="background:var(--primary-soft);color:var(--primary);border-radius:3px">${m.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</mark>`; });
          out.innerHTML = html || '<span style="color:var(--muted)">(vide)</span>';
          st.append(status(count + ' correspondance(s)', count ? 'ok' : 'info'));
        } catch (e) { st.append(status('Regex invalide : ' + e.message, 'err')); }
      };
      pat.addEventListener('input', go); flags.addEventListener('input', go); txt.addEventListener('input', go);
      p.append(el('div', { class: 'row' }, field('Expression', pat), field('Options', flags)), field('Texte', txt), st, field('Résultat surligné', out));
    },
  },
  'cron-parser': {
    name: 'Cron Parser', icon: '⏰', desc: 'Traduisez une expression cron en langage clair.', cat: 'dev',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('input', { type: 'text', class: 'mono', value: '*/15 9-17 * * 1-5' });
      const out = el('div'); const st = el('div');
      const go = async () => {
        st.innerHTML = '';
        try { await loadScript('https://cdn.jsdelivr.net/npm/cronstrue@2/dist/cronstrue.min.js'); out.textContent = window.cronstrue.toString(inp.value, { locale: 'fr' }); }
        catch (e) { out.textContent = ''; st.append(status('Expression invalide : ' + e.message, 'err')); }
      };
      inp.addEventListener('input', go);
      p.append(field('Expression cron', inp, 'minute heure jour mois jour-semaine'), field('Signification', out), st); go();
    },
  },
  'minify-js': {
    name: 'Minifier JS', icon: '📉', desc: 'Réduisez la taille d\'un code JavaScript.', cat: 'dev',
    render: textTool({
      actionLabel: 'Minifier', sample: 'function add(a, b) {\n  // somme\n  return a + b;\n}',
      run: v => v.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1').replace(/\s*([{}();,:=<>+\-*/])\s*/g, '$1').replace(/\s+/g, ' ').trim(),
    }),
  },
  'beautify-html': {
    name: 'Beautifier HTML', icon: '🎀', desc: 'Ré-indentez et embellissez du HTML.', cat: 'dev',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono', placeholder: '<div><p>Salut</p></div>' });
      const out = el('pre', { class: 'output mono' });
      const go = async () => {
        await loadScript('https://cdn.jsdelivr.net/npm/js-beautify@1.15.1/js/lib/beautify-html.min.js');
        out.textContent = window.html_beautify(inp.value, { indent_size: 2 });
      };
      inp.addEventListener('input', go);
      p.append(field('HTML', inp), el('div', { class: 'btn-row' }, button('Embellir', go), copyBtn(() => out.textContent)), field('Résultat', out));
      inp.value = '<div><p>Salut <b>toi</b></p><ul><li>1</li><li>2</li></ul></div>'; go();
    },
  },
};
