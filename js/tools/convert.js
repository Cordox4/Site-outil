import { el, panel, field, button, status } from '../ui.js';

const UNITS = {
  Longueur: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, yd: 0.9144, ft: 0.3048, in: 0.0254 },
  Poids: { kg: 1, g: 0.001, mg: 1e-6, t: 1000, lb: 0.453592, oz: 0.0283495 },
  Volume: { L: 1, mL: 0.001, 'm³': 1000, gal: 3.78541, pt: 0.473176 },
  Surface: { 'm²': 1, 'km²': 1e6, ha: 1e4, 'cm²': 1e-4, acre: 4046.86, 'ft²': 0.092903 },
  Vitesse: { 'm/s': 1, 'km/h': 0.277778, mph: 0.44704, nœud: 0.514444 },
  Données: { o: 1, Ko: 1024, Mo: 1024 ** 2, Go: 1024 ** 3, To: 1024 ** 4 },
};

export const tools = {
  'unit-converter': {
    name: 'Convertisseur d\'unités', icon: '📏', desc: 'Longueur, poids, volume, surface, vitesse, données.', cat: 'convert',
    render(root) {
      const p = panel(); root.append(p);
      const cat = el('select', {}, ...Object.keys(UNITS).map(k => el('option', {}, k)));
      const from = el('select'), to = el('select');
      const val = el('input', { type: 'number', value: '1' });
      const out = el('input', { type: 'text', readonly: true });
      const fillUnits = () => {
        const keys = Object.keys(UNITS[cat.value]);
        [from, to].forEach(s => { s.innerHTML = ''; keys.forEach(k => s.append(el('option', {}, k))); });
        to.selectedIndex = Math.min(1, keys.length - 1);
      };
      const upd = () => { const u = UNITS[cat.value]; out.value = (+val.value * u[from.value] / u[to.value]).toLocaleString('fr-FR', { maximumFractionDigits: 6 }); };
      cat.addEventListener('change', () => { fillUnits(); upd(); });
      [from, to, val].forEach(e => e.addEventListener('input', upd));
      p.append(field('Catégorie', cat), el('div', { class: 'row' }, field('De', from), field('Vers', to)), el('div', { class: 'row' }, field('Valeur', val), field('Résultat', out)));
      fillUnits(); upd();
    },
  },
  'temperature': {
    name: 'Convertisseur de température', icon: '🌡️', desc: 'Celsius, Fahrenheit et Kelvin.', cat: 'convert',
    render(root) {
      const p = panel(); root.append(p);
      const c = el('input', { type: 'number', value: '20' }), f = el('input', { type: 'number' }), k = el('input', { type: 'number' });
      const setFromC = t => { f.value = (t * 9 / 5 + 32).toFixed(2); k.value = (t + 273.15).toFixed(2); };
      c.addEventListener('input', () => setFromC(+c.value));
      f.addEventListener('input', () => { const t = (+f.value - 32) * 5 / 9; c.value = t.toFixed(2); k.value = (t + 273.15).toFixed(2); });
      k.addEventListener('input', () => { const t = +k.value - 273.15; c.value = t.toFixed(2); f.value = (t * 9 / 5 + 32).toFixed(2); });
      p.append(el('div', { class: 'row' }, field('Celsius °C', c), field('Fahrenheit °F', f), field('Kelvin K', k)));
      setFromC(20);
    },
  },
  'currency': {
    name: 'Convertisseur de devises', icon: '💱', desc: 'Taux de change du jour (via Frankfurter).', cat: 'convert', badge: 'Live',
    render(root) {
      const p = panel(); root.append(p);
      const codes = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR', 'BRL', 'RUB', 'MAD', 'DZD', 'TND', 'SEK', 'NOK', 'PLN', 'TRY'];
      const from = el('select', {}, ...codes.map(c => el('option', {}, c)));
      const to = el('select', {}, ...codes.map(c => el('option', {}, c))); to.value = 'USD';
      const amount = el('input', { type: 'number', value: '100' });
      const out = el('input', { type: 'text', readonly: true }); const st = el('div');
      const go = async () => {
        st.innerHTML = ''; st.append(status('Récupération du taux…', 'info'));
        try {
          if (from.value === to.value) { out.value = amount.value; st.innerHTML = ''; return; }
          const r = await fetch(`https://api.frankfurter.app/latest?amount=${+amount.value}&from=${from.value}&to=${to.value}`);
          const d = await r.json();
          out.value = d.rates[to.value].toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' ' + to.value;
          st.innerHTML = ''; st.append(status('Taux du ' + d.date, 'ok'));
        } catch (e) { st.innerHTML = ''; st.append(status('Erreur réseau : ' + e.message, 'err')); }
      };
      [from, to, amount].forEach(e => e.addEventListener('change', go));
      amount.addEventListener('input', () => {});
      p.append(el('div', { class: 'row' }, field('Montant', amount), field('De', from), field('Vers', to)), el('div', { class: 'btn-row' }, button('Convertir', go)), field('Résultat', out), st); go();
    },
  },
  'timezones': {
    name: 'Fuseaux horaires', icon: '🕐', desc: 'Heure actuelle dans plusieurs villes.', cat: 'convert',
    render(root) {
      const p = panel(); root.append(p);
      const zones = ['Europe/Paris', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'America/Sao_Paulo', 'Africa/Casablanca', 'Africa/Algiers', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney'];
      const out = el('div');
      const render = () => {
        out.innerHTML = '';
        const t = el('table', { class: 'data' }, el('tbody', {}, ...zones.map(z => {
          const time = new Intl.DateTimeFormat('fr-FR', { timeZone: z, hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());
          return el('tr', {}, el('th', {}, z.replace('_', ' ')), el('td', {}, time));
        })));
        out.append(t);
      };
      render(); const iv = setInterval(render, 1000);
      const obs = new MutationObserver(() => { if (!document.body.contains(out)) { clearInterval(iv); obs.disconnect(); } });
      obs.observe(document.body, { childList: true, subtree: true });
      p.append(out);
    },
  },
};
