import { el, panel, field, button, status } from '../ui.js';

function kvTable(obj) {
  return el('table', { class: 'data' }, el('tbody', {}, ...Object.entries(obj).map(([k, v]) =>
    el('tr', {}, el('th', {}, k), el('td', {}, typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—'))))));
}

export const tools = {
  'ip-lookup': {
    name: 'IP Lookup', icon: '🌍', desc: 'Géolocalisez une adresse IP (ou la vôtre).', cat: 'network',
    render(root) {
      const p = panel(); root.append(p);
      const ip = el('input', { type: 'text', placeholder: 'Laissez vide pour votre IP' });
      const out = el('div'); const st = el('div');
      const go = async () => {
        st.innerHTML = ''; st.append(status('Recherche…', 'info')); out.innerHTML = '';
        try {
          const r = await fetch('https://ipwho.is/' + encodeURIComponent(ip.value.trim()));
          const d = await r.json();
          if (!d.success) throw new Error(d.message || 'IP invalide');
          st.innerHTML = '';
          out.append(kvTable({ IP: d.ip, Pays: `${d.country} ${d.flag?.emoji || ''}`, Région: d.region, Ville: d.city, Latitude: d.latitude, Longitude: d.longitude, Fournisseur: d.connection?.isp, Organisation: d.connection?.org, Fuseau: d.timezone?.id }));
        } catch (e) { st.innerHTML = ''; st.append(status('Erreur : ' + e.message, 'err')); }
      };
      p.append(field('Adresse IP', ip), el('div', { class: 'btn-row' }, button('Rechercher', go)), st, out); go();
    },
  },
  'dns-lookup': {
    name: 'DNS Lookup', icon: '🔎', desc: 'Interrogez les enregistrements DNS d\'un domaine.', cat: 'network',
    render(root) {
      const p = panel(); root.append(p);
      const dom = el('input', { type: 'text', value: 'example.com' });
      const type = el('select', {}, ...['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA'].map(t => el('option', {}, t)));
      const out = el('div'); const st = el('div');
      const go = async () => {
        st.innerHTML = ''; st.append(status('Requête DNS…', 'info')); out.innerHTML = '';
        try {
          const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(dom.value.trim())}&type=${type.value}`);
          const d = await r.json();
          st.innerHTML = '';
          if (!d.Answer) { out.append(status('Aucun enregistrement ' + type.value, 'info')); return; }
          out.append(el('table', { class: 'data' }, el('thead', {}, el('tr', {}, el('th', {}, 'Nom'), el('th', {}, 'TTL'), el('th', {}, 'Valeur'))),
            el('tbody', {}, ...d.Answer.map(a => el('tr', {}, el('td', {}, a.name), el('td', {}, a.TTL), el('td', { class: 'mono' }, a.data))))));
        } catch (e) { st.innerHTML = ''; st.append(status('Erreur : ' + e.message, 'err')); }
      };
      dom.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); type.addEventListener('change', go);
      p.append(el('div', { class: 'row' }, field('Domaine', dom), field('Type', type)), el('div', { class: 'btn-row' }, button('Interroger', go)), st, out); go();
    },
  },
  'domain-checker': {
    name: 'Nom de domaine checker', icon: '🌐', desc: 'Vérifiez si un domaine est enregistré (RDAP).', cat: 'network',
    render(root) {
      const p = panel(); root.append(p);
      const dom = el('input', { type: 'text', placeholder: 'exemple.com' });
      const out = el('div'); const st = el('div');
      const go = async () => {
        const d = dom.value.trim(); if (!d) return;
        st.innerHTML = ''; st.append(status('Vérification…', 'info')); out.innerHTML = '';
        try {
          const r = await fetch('https://rdap.org/domain/' + encodeURIComponent(d));
          st.innerHTML = '';
          if (r.status === 404) { out.append(status(`✔ ${d} semble DISPONIBLE (non enregistré)`, 'ok')); return; }
          out.append(status(`● ${d} est ENREGISTRÉ`, 'info'));
        } catch (e) { st.innerHTML = ''; st.append(status('Erreur : ' + e.message, 'err')); }
      };
      dom.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      p.append(field('Domaine', dom), el('div', { class: 'btn-row' }, button('Vérifier', go)), st, out);
    },
  },
  'whois': {
    name: 'Whois Lookup', icon: '📋', desc: 'Informations d\'enregistrement d\'un domaine (RDAP).', cat: 'network',
    render(root) {
      const p = panel(); root.append(p);
      const dom = el('input', { type: 'text', value: 'example.com' });
      const out = el('div'); const st = el('div');
      const go = async () => {
        const d = dom.value.trim(); if (!d) return;
        st.innerHTML = ''; st.append(status('Requête RDAP…', 'info')); out.innerHTML = '';
        try {
          const r = await fetch('https://rdap.org/domain/' + encodeURIComponent(d));
          if (!r.ok) throw new Error('Domaine introuvable (' + r.status + ')');
          const j = await r.json();
          const ev = Object.fromEntries((j.events || []).map(e => [e.eventAction, e.eventDate]));
          const registrar = (j.entities || []).find(e => (e.roles || []).includes('registrar'));
          st.innerHTML = '';
          out.append(kvTable({
            Domaine: j.ldhName, Statut: (j.status || []).join(', '),
            Créé: ev.registration, Expire: ev.expiration, 'Mis à jour': ev['last changed'],
            'Serveurs de noms': (j.nameservers || []).map(n => n.ldhName).join(', '),
            Registrar: registrar?.vcardArray?.[1]?.find(x => x[0] === 'fn')?.[3] || '—',
          }));
        } catch (e) { st.innerHTML = ''; st.append(status('Erreur : ' + e.message, 'err')); }
      };
      dom.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      p.append(field('Domaine', dom), el('div', { class: 'btn-row' }, button('Rechercher', go)), st, out); go();
    },
  },
  'ping-tester': {
    name: 'Ping Tester', icon: '📡', desc: 'Mesurez la latence HTTP vers un site.', cat: 'network',
    render(root) {
      const p = panel(); root.append(p);
      const url = el('input', { type: 'url', value: 'https://www.google.com' });
      const out = el('div'); const st = el('div');
      const go = async () => {
        st.innerHTML = ''; st.append(status('Mesure (4 requêtes)…', 'info')); out.innerHTML = '';
        const times = [];
        for (let i = 0; i < 4; i++) {
          const t0 = performance.now();
          try { await fetch(url.value, { mode: 'no-cors', cache: 'no-store' }); } catch {}
          times.push(performance.now() - t0);
        }
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        st.innerHTML = '';
        out.append(el('div', { class: 'kpi' },
          el('div', { class: 'k' }, el('b', {}, Math.round(Math.min(...times)) + ' ms'), el('span', {}, 'Min')),
          el('div', { class: 'k' }, el('b', {}, Math.round(avg) + ' ms'), el('span', {}, 'Moyenne')),
          el('div', { class: 'k' }, el('b', {}, Math.round(Math.max(...times)) + ' ms'), el('span', {}, 'Max'))));
        out.append(el('p', { class: 'result-note' }, 'Latence HTTP approximative (le navigateur ne permet pas le vrai ICMP ping).'));
      };
      p.append(field('URL', url), el('div', { class: 'btn-row' }, button('Tester', go)), st, out);
    },
  },
  'http-headers': {
    name: 'HTTP Headers Checker', icon: '📨', desc: 'Inspectez les en-têtes HTTP d\'une URL.', cat: 'network',
    render(root) {
      const p = panel(); root.append(p);
      const url = el('input', { type: 'url', value: 'https://example.com' });
      const out = el('div'); const st = el('div');
      const go = async () => {
        st.innerHTML = ''; st.append(status('Requête…', 'info')); out.innerHTML = '';
        try {
          const r = await fetch(url.value, { cache: 'no-store' });
          const h = {}; r.headers.forEach((v, k) => h[k] = v);
          st.innerHTML = ''; st.append(status(`Statut ${r.status} ${r.statusText}`, r.ok ? 'ok' : 'err'));
          out.append(Object.keys(h).length ? kvTable(h) : status('En-têtes masqués par la politique CORS du site. Pour un accès complet, branchez un proxy serveur.', 'info'));
        } catch (e) { st.innerHTML = ''; st.append(status('Bloqué par CORS ou réseau : ' + e.message + '. Un proxy serveur est nécessaire pour les sites tiers.', 'err')); }
      };
      p.append(field('URL', url), el('div', { class: 'btn-row' }, button('Analyser', go)), st, out);
    },
  },
};
