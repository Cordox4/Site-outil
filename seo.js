import { el, panel, field, button, status, copyBtn } from '../ui.js';

export const tools = {
  'sitemap-generator': {
    name: 'Générateur de sitemap', icon: '🗺️', desc: 'Créez un sitemap.xml à partir d\'une liste d\'URL.', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono', placeholder: 'https://exemple.com/\nhttps://exemple.com/blog' });
      const freq = el('select', {}, ...['always', 'daily', 'weekly', 'monthly', 'yearly'].map(f => el('option', {}, f)));
      const out = el('pre', { class: 'output mono' });
      const go = () => {
        const urls = inp.value.split('\n').map(u => u.trim()).filter(Boolean);
        const today = new Date().toISOString().slice(0, 10);
        out.textContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          urls.map(u => `  <url>\n    <loc>${u.replace(/&/g, '&amp;')}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq.value}</changefreq>\n  </url>`).join('\n') +
          `\n</urlset>`;
      };
      inp.addEventListener('input', go); freq.addEventListener('change', go);
      p.append(field('Une URL par ligne', inp), field('Fréquence', freq), el('div', { class: 'btn-row' }, button('Générer', go), copyBtn(() => out.textContent)), field('sitemap.xml', out));
    },
  },
  'robots-txt': {
    name: 'Générateur robots.txt', icon: '🤖', desc: 'Créez un fichier robots.txt.', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const agent = el('input', { type: 'text', value: '*' });
      const allow = el('textarea', { placeholder: '/', style: 'min-height:70px' });
      const disallow = el('textarea', { placeholder: '/admin\n/private', style: 'min-height:70px' });
      const sitemap = el('input', { type: 'url', placeholder: 'https://exemple.com/sitemap.xml' });
      const out = el('pre', { class: 'output mono' });
      const go = () => {
        let t = `User-agent: ${agent.value || '*'}\n`;
        disallow.value.split('\n').map(x => x.trim()).filter(Boolean).forEach(x => t += `Disallow: ${x}\n`);
        allow.value.split('\n').map(x => x.trim()).filter(Boolean).forEach(x => t += `Allow: ${x}\n`);
        if (sitemap.value) t += `\nSitemap: ${sitemap.value}\n`;
        out.textContent = t.trim();
      };
      [agent, allow, disallow, sitemap].forEach(e => e.addEventListener('input', go));
      p.append(field('User-agent', agent), el('div', { class: 'row' }, field('Autoriser (Allow)', allow), field('Interdire (Disallow)', disallow)), field('Sitemap', sitemap), el('div', { class: 'btn-row' }, button('Générer', go), copyBtn(() => out.textContent)), field('robots.txt', out)); go();
    },
  },
  'meta-analyzer': {
    name: 'Analyse meta', icon: '🏷️', desc: 'Analysez les balises meta d\'une page (collez le HTML).', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono', placeholder: 'Collez le code source HTML de la page…' });
      const out = el('div');
      const go = () => {
        const doc = new DOMParser().parseFromString(inp.value, 'text/html');
        const get = (sel, attr = 'content') => { const e = doc.querySelector(sel); return e ? (attr === 'text' ? e.textContent : e.getAttribute(attr)) : null; };
        const checks = [
          ['Titre', get('title', 'text'), t => t && t.length >= 10 && t.length <= 60],
          ['Description', get('meta[name="description"]'), t => t && t.length >= 50 && t.length <= 160],
          ['Canonical', get('link[rel="canonical"]', 'href'), t => !!t],
          ['Open Graph title', get('meta[property="og:title"]'), t => !!t],
          ['Open Graph image', get('meta[property="og:image"]'), t => !!t],
          ['Viewport', get('meta[name="viewport"]'), t => !!t],
          ['Robots', get('meta[name="robots"]'), () => true],
        ];
        out.innerHTML = '';
        const t = el('table', { class: 'data' }, el('tbody', {}, ...checks.map(([label, val, ok]) =>
          el('tr', {}, el('th', {}, label), el('td', {}, val || '—'), el('td', { style: 'color:' + (ok(val) ? 'var(--success)' : 'var(--danger)') }, ok(val) ? '✔' : '✕')))));
        out.append(t);
      };
      inp.addEventListener('input', go);
      p.append(field('Code HTML', inp), field('Analyse', out));
    },
  },
  'heading-analyzer': {
    name: 'Analyse des titres SEO', icon: '📰', desc: 'Vérifiez la structure H1-H6 (collez le HTML).', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono', placeholder: 'Collez le HTML…' });
      const out = el('div'); const st = el('div');
      const go = () => {
        const doc = new DOMParser().parseFromString(inp.value, 'text/html');
        const hs = [...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')];
        out.innerHTML = ''; st.innerHTML = '';
        const h1 = hs.filter(h => h.tagName === 'H1').length;
        st.append(status(`${hs.length} titre(s) — ${h1} H1` + (h1 === 1 ? ' ✔' : h1 === 0 ? ' (aucun H1 !)' : ' (plusieurs H1 !)'), h1 === 1 ? 'ok' : 'err'));
        out.append(el('div', { class: 'output' }, ...hs.map(h => el('div', { style: 'padding-left:' + (+h.tagName[1] - 1) * 18 + 'px' }, `${h.tagName} — ${h.textContent.trim().slice(0, 90)}`))));
      };
      inp.addEventListener('input', go);
      p.append(field('Code HTML', inp), st, field('Structure', out));
    },
  },
  'keyword-density': {
    name: 'Densité de mots-clés', icon: '📈', desc: 'Analysez la fréquence des mots d\'un texte.', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { placeholder: 'Collez votre texte…' });
      const out = el('div');
      const stop = new Set('le la les un une des de du et à a en au aux ce cette ces pour par sur dans que qui est sont avec ne pas plus se son sa ses on nous vous ils elles il elle its the a an of to and in is are for on with'.split(' '));
      const go = () => {
        const words = (inp.value.toLowerCase().match(/[\p{L}\p{N}'-]{3,}/gu) || []).filter(w => !stop.has(w));
        const total = words.length; const freq = {}; words.forEach(w => freq[w] = (freq[w] || 0) + 1);
        const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20);
        out.innerHTML = '';
        out.append(el('table', { class: 'data' }, el('thead', {}, el('tr', {}, el('th', {}, 'Mot'), el('th', {}, 'Occurrences'), el('th', {}, 'Densité'))),
          el('tbody', {}, ...top.map(([w, c]) => el('tr', {}, el('td', {}, w), el('td', {}, c), el('td', {}, (c / total * 100).toFixed(2) + '%'))))));
      };
      inp.addEventListener('input', go);
      p.append(field('Texte', inp), field('Top 20 mots-clés', out));
    },
  },
  'keyword-extractor': {
    name: 'Extracteur de mots-clés', icon: '🔑', desc: 'Extrayez les expressions clés (bigrammes).', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { placeholder: 'Collez votre texte…' });
      const out = el('div');
      const stop = new Set('le la les un une des de du et à a en au aux ce cette ces pour par sur dans que qui est sont avec ne pas plus'.split(' '));
      const go = () => {
        const words = (inp.value.toLowerCase().match(/[\p{L}\p{N}'-]{3,}/gu) || []);
        const grams = {};
        for (let i = 0; i < words.length - 1; i++) { if (stop.has(words[i]) || stop.has(words[i + 1])) continue; const g = words[i] + ' ' + words[i + 1]; grams[g] = (grams[g] || 0) + 1; }
        const top = Object.entries(grams).filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]).slice(0, 15);
        out.innerHTML = '';
        out.append(top.length ? el('table', { class: 'data' }, el('tbody', {}, ...top.map(([g, c]) => el('tr', {}, el('td', {}, g), el('td', {}, c + '×')))))
          : status('Ajoutez plus de texte pour extraire des expressions récurrentes.', 'info'));
      };
      inp.addEventListener('input', go);
      p.append(field('Texte', inp), field('Expressions clés', out));
    },
  },
  'slug-generator': {
    name: 'Générateur de slug', icon: '🔗', desc: 'Créez un slug URL propre.', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('input', { type: 'text', placeholder: 'Mon Super Article !' });
      const out = el('input', { type: 'text', class: 'mono', readonly: true });
      const go = () => { out.value = inp.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); };
      inp.addEventListener('input', go);
      p.append(field('Texte', inp), el('div', { class: 'btn-row' }, copyBtn(() => out.value)), field('Slug', out));
    },
  },
  'url-encode': {
    name: 'URL Encoder', icon: '🔗', desc: 'Encodez une chaîne pour une URL.', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono' }); const out = el('textarea', { class: 'mono', readonly: true });
      const go = () => { out.value = encodeURIComponent(inp.value); }; inp.addEventListener('input', go);
      p.append(field('Texte', inp), el('div', { class: 'btn-row' }, copyBtn(() => out.value)), field('Encodé', out));
    },
  },
  'url-decode': {
    name: 'URL Decoder', icon: '🔗', desc: 'Décodez une chaîne URL.', cat: 'seo',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono' }); const out = el('textarea', { class: 'mono', readonly: true });
      const go = () => { try { out.value = decodeURIComponent(inp.value); } catch { out.value = 'Séquence invalide'; } }; inp.addEventListener('input', go);
      p.append(field('Encodé', inp), el('div', { class: 'btn-row' }, copyBtn(() => out.value)), field('Décodé', out));
    },
  },
};
