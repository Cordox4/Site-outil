import { el, panel, field, button, status, toolArticle } from '../ui.js';

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
      root.append(toolArticle({
        intro: [
          'Ce convertisseur d\'unités regroupe six catégories parmi les plus utilisées au quotidien : longueur, poids, volume, surface, vitesse et données numériques (octets, kilo-octets, méga-octets…). Il permet de passer d\'une unité à une autre instantanément, sans avoir à mémoriser les formules de conversion.',
          'Que vous ayez besoin de convertir des kilomètres en miles pour un voyage, des livres en kilogrammes pour une recette, ou des gigaoctets en mégaoctets pour du stockage informatique, l\'outil s\'adapte à chaque cas grâce à ses six catégories.',
        ],
        steps: [
          'Choisissez la catégorie d\'unités à convertir (longueur, poids, volume…).',
          'Sélectionnez l\'unité de départ et l\'unité d\'arrivée.',
          'Saisissez la valeur à convertir : le résultat se met à jour automatiquement.',
        ],
        tips: [
          'Pour les unités de données, l\'outil utilise la convention binaire (1 Ko = 1024 o), qui correspond à ce qu\'affichent la plupart des systèmes d\'exploitation.',
          'Vous pouvez inverser rapidement une conversion en intervertissant les unités "De" et "Vers".',
        ],
        faq: [
          { q: 'Combien y a-t-il de kilomètres dans un mile ?', a: 'Un mile équivaut à environ 1,60934 kilomètre. L\'outil applique ce facteur de conversion automatiquement dans la catégorie Longueur.' },
          { q: 'Pourquoi mes gigaoctets ne correspondent pas exactement à ce qu\'affiche mon disque dur ?', a: 'Les fabricants de disques durs utilisent parfois la convention décimale (1 Go = 1 000 000 000 o) alors que les systèmes d\'exploitation utilisent la convention binaire (1 Go = 1024³ o), ce qui explique un léger écart d\'affichage.' },
        ],
      }));
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
      root.append(toolArticle({
        intro: [
          'Cet outil convertit une température entre les trois échelles les plus courantes : Celsius (utilisée en France et dans la majorité du monde), Fahrenheit (utilisée notamment aux États-Unis) et Kelvin (l\'unité de référence en physique et en sciences). Modifiez n\'importe lequel des trois champs, les deux autres se recalculent aussitôt.',
        ],
        steps: [
          'Saisissez une valeur dans n\'importe lequel des trois champs (Celsius, Fahrenheit ou Kelvin).',
          'Les deux autres échelles se mettent à jour automatiquement.',
        ],
        tips: [
          'Formule Celsius → Fahrenheit : °F = °C × 9/5 + 32. Formule Celsius → Kelvin : K = °C + 273,15.',
          '0 °C correspond à 32 °F et à 273,15 K ; 100 °C (ébullition de l\'eau) correspond à 212 °F et à 373,15 K.',
        ],
        faq: [
          { q: 'Pourquoi le Kelvin n\'a-t-il pas de valeurs négatives usuelles ?', a: 'Le Kelvin est une échelle absolue dont le zéro (0 K, soit -273,15 °C) correspond au zéro absolu, la température la plus basse théoriquement atteignable. Il n\'existe donc pas de température négative en Kelvin dans l\'usage courant.' },
          { q: 'Comment convertir rapidement une température Fahrenheit en Celsius de tête ?', a: 'Une approximation rapide consiste à soustraire 32 puis diviser par 2 (au lieu de diviser par 1,8) : le résultat est proche mais moins précis que le calcul exact utilisé par cet outil.' },
        ],
      }));
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
      root.append(toolArticle({
        intro: [
          'Ce convertisseur de devises affiche des taux de change réels, mis à jour quotidiennement, en s\'appuyant sur les taux de référence publiés par la Banque centrale européenne via l\'API publique Frankfurter. Il couvre une sélection des devises les plus utilisées : euro, dollar, livre sterling, yen, franc suisse, et plusieurs devises africaines et asiatiques.',
          'Contrairement aux outils précédents, cette conversion nécessite une connexion internet, car le taux du jour est récupéré en temps réel plutôt que calculé localement.',
        ],
        steps: [
          'Saisissez le montant à convertir.',
          'Choisissez la devise de départ et la devise d\'arrivée.',
          'Cliquez sur "Convertir" pour obtenir le montant équivalent au taux du jour.',
        ],
        tips: [
          'Le taux affiché correspond au taux de change de référence, sans les frais que peuvent appliquer les banques ou bureaux de change lors d\'une opération réelle.',
          'Les taux de change varient en continu sur les marchés financiers ; ceux affichés ici sont mis à jour une fois par jour ouvré.',
        ],
        faq: [
          { q: 'D\'où viennent les taux de change affichés ?', a: 'Ils proviennent de l\'API Frankfurter, qui republie les taux de référence quotidiens de la Banque centrale européenne (BCE), une source largement utilisée pour ce type de conversion.' },
          { q: 'Puis-je utiliser ce taux pour effectuer un virement bancaire ?', a: 'Ce taux donne une indication fiable, mais votre banque ou service de transfert applique généralement une marge supplémentaire ; le montant final peut donc légèrement différer.' },
          { q: 'Que faire si la conversion affiche une erreur réseau ?', a: 'Vérifiez votre connexion internet et réessayez : le service dépend d\'une API externe qui peut être temporairement indisponible.' },
        ],
      }));
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
      root.append(toolArticle({
        intro: [
          'Cet outil affiche l\'heure actuelle dans une douzaine de grandes villes réparties sur les principaux fuseaux horaires du globe, mise à jour en direct chaque seconde. Il est pratique pour planifier une réunion internationale, un appel avec un client à l\'étranger, ou simplement savoir quelle heure il est ailleurs avant d\'appeler un proche.',
        ],
        steps: [
          'Ouvrez la page : le tableau des fuseaux horaires s\'affiche automatiquement.',
          'Repérez la ville ou la région qui vous intéresse dans la liste.',
          'L\'heure, le jour de la semaine et la date se mettent à jour en temps réel.',
        ],
        tips: [
          'Les fuseaux horaires tiennent compte automatiquement du changement d\'heure été/hiver là où il s\'applique, grâce aux données de fuseaux horaires du navigateur.',
          'Pour planifier une réunion, notez l\'écart d\'heures entre votre fuseau et celui de votre interlocuteur : il peut varier au fil de l\'année selon les changements d\'heure de chaque pays.',
        ],
        faq: [
          { q: 'Pourquoi certaines villes affichent-elles un décalage inhabituel ?', a: 'Certains pays utilisent des décalages horaires non entiers (par exemple +5h30 pour l\'Inde) ou ne pratiquent pas le changement d\'heure été/hiver, ce qui peut donner des écarts différents de ceux auxquels on s\'attend.' },
          { q: 'L\'heure affichée est-elle celle de mon appareil ou celle du serveur ?', a: 'Elle est calculée à partir de l\'horloge de votre appareil, convertie pour chaque fuseau horaire affiché : aucune donnée n\'est envoyée à un serveur.' },
        ],
      }));
    },
  },
};
