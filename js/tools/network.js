import { el, panel, field, button, status, toolArticle } from '../ui.js';

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
      root.append(toolArticle({
        intro: [
          'Chaque appareil connecté à Internet possède une adresse IP, qui permet notamment d\'estimer sa localisation géographique approximative et d\'identifier le fournisseur d\'accès ou l\'organisation à laquelle elle appartient. Cet outil interroge une base de données de géolocalisation IP pour afficher ces informations, pour votre propre adresse IP ou pour n\'importe quelle adresse saisie.',
        ],
        steps: [
          'Laissez le champ vide pour afficher les informations de votre propre adresse IP, ou saisissez une adresse IP spécifique.',
          'Cliquez sur "Rechercher" pour afficher le pays, la région, la ville estimée, le fournisseur d\'accès et le fuseau horaire associés.',
        ],
        tips: [
          'La géolocalisation par IP est une estimation, pas une position exacte : elle correspond généralement à la zone couverte par le fournisseur d\'accès, pas à l\'adresse précise de l\'utilisateur.',
          'Un VPN ou un proxy modifie l\'adresse IP visible, et donc la localisation détectée par cet outil.',
        ],
        faq: [
          { q: 'Pourquoi la ville affichée n\'est-elle pas la mienne ?', a: 'La géolocalisation par IP se base sur les blocs d\'adresses attribués aux fournisseurs d\'accès, qui ne correspondent pas toujours précisément à la ville réelle de l\'utilisateur, en particulier avec les connexions mobiles.' },
          { q: 'Cet outil peut-il localiser une personne précisément ?', a: 'Non, une adresse IP donne au mieux une zone géographique approximative (souvent à l\'échelle d\'une ville ou d\'une région), jamais une adresse exacte.' },
        ],
      }));
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
      root.append(toolArticle({
        intro: [
          'Le DNS (Domain Name System) est l\'annuaire d\'Internet : il traduit un nom de domaine (comme example.com) en adresse IP, et stocke aussi d\'autres informations essentielles comme les serveurs de messagerie (MX) ou les vérifications de propriété (TXT). Cet outil interroge directement les serveurs DNS publics de Google pour afficher les enregistrements d\'un domaine.',
        ],
        steps: [
          'Saisissez le nom de domaine à interroger.',
          'Choisissez le type d\'enregistrement (A pour l\'adresse IPv4, MX pour les serveurs mail, TXT pour les vérifications, etc.).',
          'Cliquez sur "Interroger" pour afficher les résultats.',
        ],
        tips: [
          'Le type "A" affiche l\'adresse IPv4 du serveur associé au domaine ; le type "MX" liste les serveurs qui gèrent les e-mails de ce domaine.',
          'Après une modification DNS (changement d\'hébergeur, ajout d\'un enregistrement), la propagation peut prendre de quelques minutes à 48 heures selon le fournisseur.',
        ],
        faq: [
          { q: 'Pourquoi aucun enregistrement n\'apparaît pour mon domaine ?', a: 'Cela peut signifier que ce type d\'enregistrement n\'est pas configuré pour ce domaine, ou que la modification récente n\'a pas encore été propagée sur les serveurs DNS interrogés.' },
          { q: 'Que signifie le TTL affiché dans les résultats ?', a: 'Le TTL (Time To Live) indique, en secondes, la durée pendant laquelle un enregistrement DNS peut être mis en cache avant d\'être revérifié auprès du serveur faisant autorité.' },
        ],
      }));
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
      root.append(toolArticle({
        intro: [
          'Avant de créer un nouveau site ou une nouvelle marque, il est essentiel de vérifier si le nom de domaine souhaité est encore disponible à l\'enregistrement. Cet outil interroge le protocole RDAP (le successeur moderne du WHOIS) pour indiquer si un domaine est déjà enregistré ou disponible.',
        ],
        steps: [
          'Saisissez le nom de domaine à vérifier (par exemple exemple.com).',
          'Cliquez sur "Vérifier".',
          'Le résultat indique si le domaine semble disponible ou déjà enregistré.',
        ],
        tips: [
          'Un domaine "disponible" selon cet outil doit tout de même être réservé rapidement auprès d\'un bureau d\'enregistrement (registrar), car sa disponibilité peut changer à tout moment.',
          'Pensez à vérifier plusieurs extensions (.com, .fr, .net…) si votre projet doit être protégé sur différents marchés.',
        ],
        faq: [
          { q: 'Cet outil réserve-t-il le domaine pour moi ?', a: 'Non, il vérifie uniquement la disponibilité. Pour réserver un domaine, il faut passer par un bureau d\'enregistrement (registrar) comme OVH, Gandi ou Namecheap.' },
          { q: 'Pourquoi le résultat indique-t-il parfois une erreur pour certaines extensions ?', a: 'Toutes les extensions de domaine ne sont pas encore prises en charge par le protocole RDAP ; dans ce cas, il est préférable de vérifier directement auprès d\'un bureau d\'enregistrement.' },
        ],
      }));
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
      root.append(toolArticle({
        intro: [
          'Les informations Whois d\'un domaine révèlent sa date de création, sa date d\'expiration, ses serveurs de noms (DNS) et le bureau d\'enregistrement (registrar) auprès duquel il est géré. Cet outil interroge le protocole RDAP, la version moderne et standardisée du Whois traditionnel, pour afficher ces informations.',
        ],
        steps: [
          'Saisissez le nom de domaine à consulter.',
          'Cliquez sur "Rechercher".',
          'Les informations d\'enregistrement s\'affichent : dates, statut, serveurs de noms et registrar.',
        ],
        tips: [
          'La date d\'expiration est particulièrement utile à surveiller pour éviter de perdre involontairement un domaine par oubli de renouvellement.',
          'Les informations personnelles du propriétaire (nom, e-mail, adresse) sont aujourd\'hui souvent masquées par des services de confidentialité proposés par les registrars, conformément au RGPD.',
        ],
        faq: [
          { q: 'Pourquoi je ne vois pas le nom du propriétaire du domaine ?', a: 'Depuis l\'entrée en vigueur du RGPD, la plupart des registrars masquent par défaut les informations personnelles des titulaires de domaines dans les résultats Whois/RDAP publics.' },
          { q: 'Quelle est la différence entre Whois et RDAP ?', a: 'RDAP est le protocole qui a progressivement remplacé le Whois traditionnel : il structure les données en JSON, standardise les réponses entre registrars et facilite leur traitement automatisé.' },
        ],
      }));
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
      root.append(toolArticle({
        intro: [
          'La latence mesure le temps que met une requête pour atteindre un serveur et en revenir. Une latence élevée se traduit par un site qui met du temps à répondre. Cet outil effectue plusieurs requêtes HTTP vers une URL donnée et calcule le temps de réponse minimum, moyen et maximum.',
          'Il ne s\'agit pas d\'un vrai ping ICMP (le protocole utilisé par la commande "ping" traditionnelle) : les navigateurs web ne permettent pas ce type de requête pour des raisons de sécurité. Cette mesure HTTP donne néanmoins une bonne indication du temps de réponse réel d\'un site.',
        ],
        steps: [
          'Saisissez l\'URL du site à tester.',
          'Cliquez sur "Tester" : quatre requêtes sont envoyées successivement.',
          'Les temps de réponse minimum, moyen et maximum s\'affichent en millisecondes.',
        ],
        tips: [
          'Une latence sous 100 ms est généralement considérée comme excellente, entre 100 et 300 ms comme correcte, et au-delà de 300 ms comme potentiellement pénalisante pour l\'expérience utilisateur.',
          'La latence mesurée dépend aussi de votre propre connexion internet, pas uniquement du serveur testé : comparez plusieurs sites pour une évaluation plus juste.',
        ],
        faq: [
          { q: 'Pourquoi le résultat diffère-t-il d\'un vrai test de ping ?', a: 'Cet outil mesure une requête HTTP complète (connexion, envoi, réponse du serveur) plutôt qu\'un simple paquet ICMP, ce qui donne généralement des valeurs légèrement plus élevées qu\'un ping traditionnel, mais reflète mieux le temps de chargement réel perçu par un visiteur.' },
          { q: 'Le test échoue pour certains sites, pourquoi ?', a: 'Certains serveurs bloquent les requêtes provenant directement d\'un navigateur pour des raisons de sécurité (CORS) ; le mode utilisé par cet outil limite cet impact, mais certains sites restent inaccessibles à la mesure.' },
        ],
      }));
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
      root.append(toolArticle({
        intro: [
          'Les en-têtes HTTP sont des informations techniques échangées entre votre navigateur et un serveur web à chaque requête : type de contenu, mise en cache, sécurité (comme les en-têtes CSP ou HSTS), serveur utilisé, etc. Cet outil affiche les en-têtes de réponse renvoyés par une URL, utile pour un développeur souhaitant diagnostiquer un problème de cache, de sécurité ou de configuration serveur.',
        ],
        steps: [
          'Saisissez l\'URL à analyser.',
          'Cliquez sur "Analyser".',
          'Le code de statut HTTP et la liste des en-têtes de réponse s\'affichent.',
        ],
        tips: [
          'Un code de statut 200 signifie que la page a répondu correctement ; un code 301 ou 302 indique une redirection, un code 404 une page introuvable.',
          'Vérifiez la présence d\'en-têtes de sécurité comme "Strict-Transport-Security" ou "Content-Security-Policy" pour évaluer rapidement le niveau de sécurité basique d\'un site.',
        ],
        faq: [
          { q: 'Pourquoi certains en-têtes ne s\'affichent-ils pas ?', a: 'La politique de sécurité CORS des navigateurs limite parfois l\'accès à certains en-têtes de réponse depuis une page web tierce ; certains sites masquent également volontairement une partie de leurs en-têtes.' },
          { q: 'À quoi sert de vérifier les en-têtes HTTP d\'un site ?', a: 'Cela permet de diagnostiquer des problèmes de mise en cache, de vérifier la configuration de sécurité, ou de comprendre pourquoi une ressource se comporte différemment que prévu dans le navigateur.' },
        ],
      }));
    },
  },
};
