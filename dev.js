import { el, panel, field, button, status, copyBtn, loadScript, toolArticle } from '../ui.js';

function textTool({ inLabel = 'Entrée', outLabel = 'Résultat', run, actionLabel = 'Exécuter', mono = true, sample = '', article }) {
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
    if (article) root.append(toolArticle(article));
  };
}

async function sha(algo, str) {
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export const tools = {
  'json-formatter': {
    name: 'JSON Formatter', icon: 'braces', desc: 'Indentez et embellissez du JSON.', cat: 'dev',
    render: textTool({
      actionLabel: 'Formater', sample: '{"nom":"Devin","tags":["a","b"],"actif":true}', run: v => JSON.stringify(JSON.parse(v), null, 2),
      article: {
        intro: [
          'Le JSON (JavaScript Object Notation) est le format d\'échange de données le plus utilisé dans le développement web, notamment pour les réponses d\'API. Lorsqu\'il est reçu compressé sur une seule ligne, il devient très difficile à lire et à déboguer. Cet outil réindente et met en forme un JSON pour le rendre lisible, avec une indentation claire à deux espaces.',
        ],
        steps: [
          'Collez votre JSON, même compact ou sur une seule ligne.',
          'Cliquez sur "Formater" : le résultat s\'affiche indenté et structuré.',
          'Copiez le résultat mis en forme avec le bouton dédié.',
        ],
        tips: [
          'Si l\'outil signale une erreur, vérifiez les causes les plus fréquentes : une virgule en trop après le dernier élément, des guillemets simples au lieu de doubles, ou une clé non entourée de guillemets.',
          'Un JSON valide n\'accepte que des guillemets doubles pour les chaînes de caractères et les noms de clés, contrairement au JavaScript qui tolère aussi les guillemets simples.',
        ],
        faq: [
          { q: 'Pourquoi mon JSON affiche-t-il une erreur alors qu\'il semble correct ?', a: 'Les erreurs les plus fréquentes sont une virgule superflue en fin de liste ou d\'objet, des guillemets manquants autour d\'une clé, ou une accolade/crochet non refermé. Le message d\'erreur indique généralement la position du problème dans le texte.' },
          { q: 'Cet outil valide-t-il aussi la structure de mon JSON ?', a: 'Oui, si le JSON n\'est pas valide, l\'outil affiche un message d\'erreur au lieu du résultat formaté ; pour une simple vérification sans reformatage, utilisez l\'outil JSON Validator.' },
        ],
      },
    }),
  },
  'json-validator': {
    name: 'JSON Validator', icon: 'checkCircle', desc: 'Vérifiez la validité d\'un JSON.', cat: 'dev',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', { class: 'mono' });
      const st = el('div', { style: 'margin-top:10px' });
      const go = () => { try { JSON.parse(inp.value); st.innerHTML = ''; st.append(status('JSON valide ✔', 'ok')); } catch (e) { st.innerHTML = ''; st.append(status('Invalide : ' + e.message, 'err')); } };
      inp.addEventListener('input', go);
      p.append(field('JSON', inp), st); go();
      root.append(toolArticle({
        intro: [
          'Avant d\'intégrer un JSON dans une application, une configuration ou une API, il est utile de vérifier rapidement qu\'il est syntaxiquement valide. Cet outil analyse votre JSON en temps réel et indique clairement s\'il est valide ou non, avec le détail de l\'erreur rencontrée le cas échéant.',
        ],
        steps: [
          'Collez le JSON à vérifier.',
          'Le résultat (valide ou invalide, avec le détail de l\'erreur) s\'affiche instantanément à chaque modification.',
        ],
        tips: [
          'Contrairement à un objet JavaScript, un JSON valide n\'accepte pas de commentaires, de virgules finales superflues, ni de clés sans guillemets.',
          'Pour un JSON valide qui a aussi besoin d\'être mis en forme et lisible, utilisez l\'outil JSON Formatter.',
        ],
        faq: [
          { q: 'Quelle est la différence entre cet outil et le JSON Formatter ?', a: 'Le JSON Validator se contente d\'indiquer si le JSON est valide ou non, sans le reformater ; le JSON Formatter va plus loin en réindentant et en mettant en forme un JSON déjà valide.' },
          { q: 'Le message d\'erreur indique-t-il où se trouve le problème ?', a: 'Oui, le message d\'erreur du navigateur précise généralement la position (ligne, colonne ou index) où l\'analyse du JSON a échoué, ce qui facilite la correction.' },
        ],
      }));
    },
  },
  'xml-formatter': {
    name: 'XML Formatter', icon: 'code', desc: 'Indentez du XML.', cat: 'dev',
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
      article: {
        intro: [
          'Le XML est un format structuré encore largement utilisé pour les flux de données (RSS, SOAP), les fichiers de configuration ou les échanges entre certains systèmes d\'entreprise. Reçu sur une seule ligne ou mal indenté, un document XML devient difficile à relire. Cet outil vérifie que le XML est bien formé et le réindente proprement.',
        ],
        steps: [
          'Collez votre code XML.',
          'Cliquez sur "Formater" pour obtenir une version indentée et lisible.',
        ],
        tips: [
          'Un XML "bien formé" doit avoir chaque balise ouverte correctement refermée, dans le bon ordre d\'imbrication ; contrairement au HTML, le XML n\'accepte aucune balise non fermée.',
        ],
        faq: [
          { q: 'Que signifie l\'erreur "XML mal formé" ?', a: 'Elle indique que le document ne respecte pas les règles strictes du XML (balise non fermée, imbrication incorrecte, caractère spécial non échappé comme un "&" isolé) ; vérifiez la structure de vos balises.' },
          { q: 'Cet outil peut-il valider un XML par rapport à un schéma (XSD) ?', a: 'Non, il vérifie uniquement que le document est syntaxiquement bien formé, pas qu\'il respecte un schéma XSD ou DTD spécifique.' },
        ],
      },
    }),
  },
  'yaml-validator': {
    name: 'YAML Validator', icon: 'list', desc: 'Validez du YAML et convertissez-le en JSON.', cat: 'dev',
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
      root.append(toolArticle({
        intro: [
          'Le YAML est un format de données lisible par les humains, très utilisé pour les fichiers de configuration (Docker Compose, GitHub Actions, Kubernetes…), car il évite les accolades et guillemets répétitifs du JSON en s\'appuyant sur l\'indentation. Sa syntaxe basée sur les espaces le rend cependant sensible aux erreurs d\'indentation.',
          'Cet outil valide votre YAML et affiche sa conversion équivalente en JSON, ce qui aide à repérer une erreur de structure ou à vérifier comment le YAML sera réellement interprété.',
        ],
        steps: [
          'Collez votre code YAML.',
          'Le résultat de la validation et l\'équivalent JSON s\'affichent automatiquement.',
        ],
        tips: [
          'En YAML, l\'indentation doit être cohérente (généralement 2 espaces, jamais de tabulations) : une indentation incorrecte est la cause la plus fréquente d\'erreur.',
          'Voir l\'équivalent JSON est utile pour vérifier qu\'une valeur (comme "yes", "no" ou une date) est bien interprétée comme vous l\'attendez, car YAML applique des conversions automatiques parfois surprenantes.',
        ],
        faq: [
          { q: 'Pourquoi mon YAML génère-t-il une erreur alors qu\'il semble correct visuellement ?', a: 'Une tabulation invisible mélangée à des espaces, ou une indentation incohérente entre deux lignes de même niveau, sont les causes les plus fréquentes d\'erreur en YAML.' },
          { q: 'Pourquoi certaines valeurs comme "yes" ou "no" sont-elles converties en booléens ?', a: 'Le format YAML interprète automatiquement certains mots-clés (yes/no, true/false, on/off) comme des valeurs booléennes, ce qui explique leur conversion visible dans l\'équivalent JSON.' },
        ],
      }));
    },
  },
  'csv-viewer': {
    name: 'CSV Viewer', icon: 'table', desc: 'Visualisez un CSV sous forme de tableau.', cat: 'dev',
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
      root.append(toolArticle({
        intro: [
          'Le CSV (Comma-Separated Values) est un format de fichier tabulaire simple, largement utilisé pour exporter des données depuis un tableur ou une base de données. Lu tel quel dans un éditeur de texte, il reste difficile à interpréter visuellement. Cet outil affiche un CSV sous forme de tableau lisible, en gérant correctement les valeurs entre guillemets et les séparateurs personnalisés.',
        ],
        steps: [
          'Collez votre contenu CSV.',
          'Ajustez le séparateur si votre fichier n\'utilise pas la virgule par défaut (le point-virgule est courant en France).',
          'Le tableau s\'affiche automatiquement, avec la première ligne interprétée comme en-tête.',
        ],
        tips: [
          'Les fichiers CSV exportés depuis Excel en France utilisent souvent le point-virgule (;) comme séparateur plutôt que la virgule, en raison de l\'utilisation de la virgule comme séparateur décimal.',
          'Si une valeur contient elle-même une virgule, elle doit être entourée de guillemets doubles dans le fichier CSV pour être correctement interprétée ; cet outil gère ce cas automatiquement.',
        ],
        faq: [
          { q: 'Pourquoi mon tableau ne s\'affiche-t-il pas correctement ?', a: 'Vérifiez que le séparateur indiqué correspond bien à celui utilisé dans votre fichier (virgule ou point-virgule le plus souvent) ; un séparateur incorrect fait apparaître toutes les données dans une seule colonne.' },
          { q: 'Cet outil peut-il traiter un fichier CSV volumineux ?', a: 'Le traitement se fait dans votre navigateur : pour de très gros fichiers (plusieurs dizaines de milliers de lignes), l\'affichage peut ralentir selon la puissance de votre appareil.' },
        ],
      }));
    },
  },
  'base64-encode': {
    name: 'Encodeur Base64', icon: 'type', desc: 'Encodez du texte en Base64.', cat: 'dev',
    render: textTool({
      actionLabel: 'Encoder', sample: 'Bonjour le monde', run: v => btoa(unescape(encodeURIComponent(v))),
      article: {
        intro: [
          'Le Base64 est un encodage qui transforme n\'importe quel texte ou donnée binaire en une chaîne de caractères composée uniquement de lettres, chiffres et quelques symboles. Il est couramment utilisé pour transmettre des données binaires (images, fichiers) dans des formats texte comme le JSON, le HTML ou les en-têtes d\'e-mail, ou pour encoder des identifiants dans une URL.',
        ],
        steps: [
          'Saisissez le texte à encoder.',
          'Le résultat encodé en Base64 s\'affiche automatiquement, prêt à être copié.',
        ],
        tips: [
          'Le Base64 n\'est pas un chiffrement : il ne protège pas la confidentialité d\'une donnée, il ne fait que la représenter différemment. Toute personne peut le décoder facilement.',
          'Un texte encodé en Base64 est environ 33 % plus long que le texte d\'origine, car chaque groupe de 3 octets est représenté par 4 caractères.',
        ],
        faq: [
          { q: 'Le Base64 est-il un moyen de sécuriser des données sensibles ?', a: 'Non, le Base64 est un simple encodage réversible, pas un chiffrement : il ne doit jamais être utilisé seul pour protéger un mot de passe ou une donnée confidentielle.' },
          { q: 'Pourquoi voit-on souvent des "=" à la fin d\'une chaîne Base64 ?', a: 'Ce sont des caractères de remplissage (padding), ajoutés lorsque la longueur du texte d\'origine n\'est pas un multiple exact de 3 octets, afin de respecter la structure à 4 caractères par groupe.' },
        ],
      },
    }),
  },
  'base64-decode': {
    name: 'Décodeur Base64', icon: 'type', desc: 'Décodez du Base64 en texte.', cat: 'dev',
    render: textTool({
      actionLabel: 'Décoder', sample: 'Qm9uam91ciBsZSBtb25kZQ==', run: v => decodeURIComponent(escape(atob(v.trim()))),
      article: {
        intro: [
          'Cet outil effectue l\'opération inverse de l\'encodage Base64 : il reconvertit une chaîne encodée en son texte d\'origine lisible. C\'est utile pour inspecter le contenu d\'un token, d\'une donnée intégrée dans une page web, ou d\'un fichier de configuration utilisant cet encodage.',
        ],
        steps: [
          'Collez la chaîne encodée en Base64.',
          'Le texte décodé s\'affiche automatiquement.',
        ],
        tips: [
          'Si le décodage échoue, vérifiez que la chaîne collée est bien un Base64 valide (composé de lettres, chiffres, "+", "/" et éventuellement des "=" en fin de chaîne).',
        ],
        faq: [
          { q: 'Pourquoi le décodage échoue-t-il avec un message d\'erreur ?', a: 'Cela signifie généralement que le texte collé n\'est pas un Base64 valide, par exemple s\'il contient des espaces, des retours à la ligne non prévus, ou des caractères qui ne font pas partie de l\'alphabet Base64.' },
          { q: 'Puis-je décoder une image encodée en Base64 avec cet outil ?', a: 'Cet outil est prévu pour du texte lisible ; une image encodée en Base64 se décodera en une chaîne de caractères binaires illisible plutôt qu\'en image affichable.' },
        ],
      },
    }),
  },
  'jwt-decoder': {
    name: 'JWT Decoder', icon: 'ticket', desc: 'Décodez l\'en-tête et le payload d\'un JWT.', cat: 'dev',
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
      root.append(toolArticle({
        intro: [
          'Un JWT (JSON Web Token) est un format de jeton largement utilisé pour l\'authentification et l\'échange sécurisé d\'informations entre un client et un serveur. Il se compose de trois parties séparées par des points : l\'en-tête (algorithme utilisé), le payload (les données/claims transportées) et la signature. Cet outil décode et affiche l\'en-tête et le payload d\'un JWT en clair.',
          'Il ne vérifie pas la signature du token, il se contente de décoder les parties lisibles, qui ne sont jamais chiffrées dans un JWT standard, seulement encodées et signées.',
        ],
        steps: [
          'Collez le token JWT complet (les trois parties séparées par des points).',
          'L\'en-tête et le payload décodés s\'affichent au format JSON lisible.',
        ],
        tips: [
          'Le contenu d\'un JWT n\'est pas chiffré, seulement encodé : n\'importe qui possédant le token peut lire son contenu, il ne faut donc jamais y stocker d\'informations sensibles (mot de passe, données bancaires…).',
          'Le champ "exp" du payload, lorsqu\'il est présent, indique la date d\'expiration du token sous forme d\'horodatage Unix (nombre de secondes depuis le 1er janvier 1970).',
        ],
        faq: [
          { q: 'Cet outil vérifie-t-il si le JWT est valide ou falsifié ?', a: 'Non, il décode uniquement le contenu lisible du token sans vérifier sa signature cryptographique ; cette vérification nécessite de connaître la clé secrète ou publique utilisée par le serveur qui a émis le token.' },
          { q: 'Le token que je colle est-il envoyé sur un serveur ?', a: 'Non, le décodage se fait entièrement dans votre navigateur ; le token n\'est jamais transmis ailleurs, ce qui reste important puisqu\'un JWT peut donner accès à un compte s\'il est intercepté.' },
        ],
      }));
    },
  },
  'sha256': {
    name: 'Hash SHA-256', icon: 'hash', desc: 'Calculez l\'empreinte SHA-256 d\'un texte.', cat: 'dev',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', {}); const out = el('input', { type: 'text', class: 'mono', readonly: true });
      const go = async () => { out.value = await sha('SHA-256', inp.value); };
      inp.addEventListener('input', go);
      p.append(field('Texte', inp), el('div', { class: 'btn-row' }, copyBtn(() => out.value)), field('SHA-256', out)); go();
      root.append(toolArticle({
        intro: [
          'SHA-256 est une fonction de hachage cryptographique qui transforme n\'importe quel texte en une empreinte de 64 caractères hexadécimaux, unique et à sens unique : il est impossible de retrouver le texte d\'origine à partir du hash, et la moindre modification du texte change complètement le résultat. Il est largement utilisé pour vérifier l\'intégrité d\'un fichier, stocker un mot de passe de façon sécurisée (avec un salage approprié), ou signer des données.',
          'Ce calcul s\'appuie sur l\'API Web Crypto, native aux navigateurs modernes, garantissant une implémentation fiable et standard de l\'algorithme.',
        ],
        steps: [
          'Saisissez le texte à hacher.',
          'L\'empreinte SHA-256 s\'affiche automatiquement, prête à être copiée.',
        ],
        tips: [
          'Pour vérifier qu\'un fichier téléchargé n\'a pas été altéré, comparez le hash SHA-256 fourni par l\'éditeur avec celui calculé sur le fichier reçu (généralement via un outil en ligne de commande dédié, pas ce champ texte).',
          'Deux textes identiques produisent toujours exactement le même hash SHA-256 ; un texte légèrement différent (même un seul caractère) produit un hash complètement différent.',
        ],
        faq: [
          { q: 'Peut-on retrouver le texte d\'origine à partir du hash SHA-256 ?', a: 'Non, une fonction de hachage cryptographique est conçue pour être à sens unique : il n\'existe pas de méthode pratique pour "inverser" un hash SHA-256 et retrouver le texte de départ.' },
          { q: 'SHA-256 suffit-il seul pour stocker des mots de passe en sécurité ?', a: 'Non, pour stocker des mots de passe, il est recommandé d\'utiliser un algorithme spécialement conçu pour cela (comme bcrypt ou Argon2), qui ajoute un "sel" et ralentit volontairement le calcul pour compliquer les attaques par force brute, contrairement à SHA-256 qui est rapide et donc plus vulnérable dans ce contexte précis.' },
        ],
      }));
    },
  },
  'md5': {
    name: 'Hash MD5', icon: 'hash', desc: 'Calculez l\'empreinte MD5 d\'un texte.', cat: 'dev',
    render(root) {
      const p = panel(); root.append(p);
      const inp = el('textarea', {}); const out = el('input', { type: 'text', class: 'mono', readonly: true });
      const go = async () => { await loadScript('https://cdn.jsdelivr.net/npm/blueimp-md5@2.19.0/js/md5.min.js'); out.value = window.md5(inp.value); };
      inp.addEventListener('input', go);
      p.append(field('Texte', inp), el('div', { class: 'btn-row' }, copyBtn(() => out.value)), field('MD5', out));
      root.append(toolArticle({
        intro: [
          'MD5 est l\'une des plus anciennes fonctions de hachage largement utilisées, produisant une empreinte de 32 caractères hexadécimaux à partir de n\'importe quel texte. Bien qu\'encore employé pour des usages non critiques comme la vérification rapide de fichiers ou la génération d\'identifiants (par exemple pour un avatar Gravatar), il est aujourd\'hui considéré comme cryptographiquement obsolète pour des usages liés à la sécurité, en raison de collisions connues.',
        ],
        steps: [
          'Saisissez le texte à hacher.',
          'L\'empreinte MD5 s\'affiche automatiquement, prête à être copiée.',
        ],
        tips: [
          'Pour un usage lié à la sécurité (mots de passe, signatures, vérification d\'intégrité sensible), préférez SHA-256, plus robuste que MD5.',
          'MD5 reste adapté pour des usages non sensibles comme la génération rapide d\'un identifiant unique à partir d\'une valeur (par exemple un hash Gravatar basé sur une adresse e-mail).',
        ],
        faq: [
          { q: 'Pourquoi MD5 est-il considéré comme obsolète pour la sécurité ?', a: 'Des chercheurs ont démontré qu\'il est possible de générer deux textes différents produisant le même hash MD5 (une "collision"), ce qui le rend impropre à des usages nécessitant une garantie forte d\'unicité, comme les signatures numériques ou le stockage de mots de passe.' },
          { q: 'Puis-je encore utiliser MD5 pour vérifier qu\'un fichier n\'a pas été corrompu par erreur (pas par malveillance) ?', a: 'Oui, pour détecter une corruption accidentelle (erreur de transfert, fichier tronqué), MD5 reste tout à fait suffisant ; c\'est uniquement face à une falsification intentionnelle qu\'il n\'offre plus de garantie fiable.' },
        ],
      }));
    },
  },
  'uuid': {
    name: 'Générateur UUID', icon: 'id', desc: 'Générez des identifiants UUID v4.', cat: 'dev',
    render(root) {
      const p = panel(); root.append(p);
      const n = el('input', { type: 'number', value: '5', min: '1', max: '1000' });
      const out = el('textarea', { class: 'mono', readonly: true });
      const go = () => { out.value = Array.from({ length: +n.value }, () => crypto.randomUUID()).join('\n'); };
      p.append(field('Combien ?', n), el('div', { class: 'btn-row' }, button('Générer', go), copyBtn(() => out.value)), field('UUID', out)); go();
      root.append(toolArticle({
        intro: [
          'Un UUID (Universally Unique Identifier) est un identifiant de 128 bits, généralement représenté sous forme de 32 caractères hexadécimaux séparés par des tirets, conçu pour être unique de façon quasi certaine, même généré indépendamment sur des millions de systèmes différents. Il est très utilisé en développement pour identifier des enregistrements de base de données, des sessions ou des ressources, sans dépendre d\'un compteur central.',
          'Cet outil génère des identifiants au format UUID version 4, la version la plus courante, basée sur un tirage aléatoire cryptographiquement sûr.',
        ],
        steps: [
          'Indiquez le nombre d\'identifiants à générer.',
          'Cliquez sur "Générer" pour obtenir la liste, puis copiez-la si besoin.',
        ],
        tips: [
          'La probabilité que deux UUID v4 générés soient identiques est astronomiquement faible : elle est considérée comme négligeable même en générant des milliards d\'identifiants.',
          'Les UUID sont pratiques pour identifier des ressources dans des systèmes distribués, car ils peuvent être générés indépendamment sur plusieurs serveurs sans risque de collision, contrairement à un simple compteur incrémental.',
        ],
        faq: [
          { q: 'Un UUID peut-il être deviné ou prédit ?', a: 'Un UUID v4 est généré à partir de données aléatoires cryptographiquement sûres, ce qui le rend imprévisible ; il ne doit toutefois pas être utilisé comme unique mesure de sécurité pour protéger une ressource sensible.' },
          { q: 'Quelle est la différence entre un UUID et un identifiant auto-incrémenté classique ?', a: 'Un identifiant auto-incrémenté (1, 2, 3…) dépend d\'un compteur central et révèle l\'ordre de création ; un UUID est généré indépendamment, sans coordination centrale, et ne révèle aucune information sur l\'ordre ou le nombre d\'enregistrements existants.' },
        ],
      }));
    },
  },
  'regex-tester': {
    name: 'Regex Tester', icon: 'flask', desc: 'Testez une expression régulière.', cat: 'dev',
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
      root.append(toolArticle({
        intro: [
          'Les expressions régulières (regex) permettent de rechercher, valider ou extraire des motifs précis dans un texte : une adresse e-mail, un numéro de téléphone, un format de date, etc. Leur syntaxe compacte les rend puissantes mais parfois difficiles à écrire correctement du premier coup. Cet outil teste une expression régulière en direct sur un texte et surligne visuellement toutes les correspondances trouvées.',
        ],
        steps: [
          'Saisissez votre expression régulière (sans les barres obliques qui l\'entourent habituellement).',
          'Ajustez les options ("g" pour rechercher toutes les occurrences, "i" pour ignorer la casse, etc.).',
          'Collez le texte à tester : les correspondances sont surlignées et comptées automatiquement.',
        ],
        tips: [
          'L\'option "g" (global) est nécessaire pour trouver toutes les occurrences dans le texte, pas seulement la première.',
          'L\'option "i" rend la recherche insensible à la casse (majuscules/minuscules), utile pour des correspondances plus larges.',
        ],
        faq: [
          { q: 'Pourquoi mon expression régulière ne trouve-t-elle aucune correspondance ?', a: 'Vérifiez d\'abord que l\'option "g" est activée pour chercher dans tout le texte, puis testez votre motif étape par étape en le simplifiant, car une erreur de syntaxe dans une partie de l\'expression peut empêcher toute correspondance.' },
          { q: 'Où apprendre la syntaxe des expressions régulières ?', a: 'De nombreuses ressources en ligne (comme MDN Web Docs) documentent la syntaxe complète ; des sites dédiés proposent aussi des explications interactives motif par motif pour progresser pas à pas.' },
        ],
      }));
    },
  },
  'cron-parser': {
    name: 'Cron Parser', icon: 'clock', desc: 'Traduisez une expression cron en langage clair.', cat: 'dev',
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
      root.append(toolArticle({
        intro: [
          'Une expression cron définit la fréquence d\'exécution d\'une tâche automatisée (sauvegarde, envoi de rapport, nettoyage de fichiers…) sur un serveur ou dans un service planifié. Sa syntaxe compacte à cinq champs (minute, heure, jour du mois, mois, jour de la semaine) est puissante mais peu intuitive à lire d\'un coup d\'œil. Cet outil traduit une expression cron en une phrase en français claire et compréhensible.',
        ],
        steps: [
          'Saisissez votre expression cron dans le champ prévu (par exemple "*/15 9-17 * * 1-5").',
          'La traduction en langage clair s\'affiche automatiquement.',
        ],
        tips: [
          'Un astérisque (*) signifie "à chaque valeur possible" pour ce champ ; par exemple, un astérisque dans le champ "heure" signifie "toutes les heures".',
          'Un "*/15" dans le champ des minutes signifie "toutes les 15 minutes" ; une plage comme "9-17" signifie "de 9h à 17h inclus".',
        ],
        faq: [
          { q: 'Dans quel ordre sont les cinq champs d\'une expression cron ?', a: 'L\'ordre standard est : minute, heure, jour du mois, mois, jour de la semaine (0 pour dimanche à 6 pour samedi, ou 1 pour lundi à 7 pour dimanche selon les implémentations).' },
          { q: 'Cet outil peut-il aussi créer une expression cron à partir d\'une description ?', a: 'Non, il traduit uniquement une expression cron existante en langage clair ; pour créer une expression, il faut composer les cinq champs manuellement selon la syntaxe cron standard.' },
        ],
      }));
    },
  },
  'minify-js': {
    name: 'Minifier JS', icon: 'compress', desc: 'Réduisez la taille d\'un code JavaScript.', cat: 'dev',
    render: textTool({
      actionLabel: 'Minifier', sample: 'function add(a, b) {\n  // somme\n  return a + b;\n}',
      run: v => v.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1').replace(/\s*([{}();,:=<>+\-*/])\s*/g, '$1').replace(/\s+/g, ' ').trim(),
      article: {
        intro: [
          'Minifier un fichier JavaScript consiste à retirer les commentaires, espaces et sauts de ligne superflus pour réduire sa taille, sans changer son comportement. Un script plus léger se télécharge et s\'exécute plus rapidement, ce qui améliore la performance perçue d\'un site web.',
          'Cet outil applique une minification simple, basée sur la suppression des commentaires et des espaces inutiles. Pour un projet en production avec des besoins de performance avancés, un outil de build dédié (comme Terser ou esbuild) reste préférable, car il applique aussi des optimisations plus poussées (raccourcissement des noms de variables, suppression de code mort).',
        ],
        steps: [
          'Collez votre code JavaScript.',
          'Cliquez sur "Minifier" pour obtenir la version compactée.',
          'Copiez le résultat pour l\'utiliser dans votre projet.',
        ],
        tips: [
          'Conservez toujours le fichier source non minifié dans votre dépôt de code : la version minifiée ne doit être utilisée qu\'en production.',
          'Après minification, testez toujours le script pour vous assurer qu\'aucune fonctionnalité n\'a été altérée, en particulier si votre code contient des expressions complexes.',
        ],
        faq: [
          { q: 'La minification peut-elle casser mon code ?', a: 'Cette minification simple, basée sur la suppression d\'espaces et de commentaires, préserve la logique du code ; toutefois, du code très particulier (comme une chaîne de caractères contenant des séquences ressemblant à du code) mérite une vérification après minification.' },
          { q: 'Quelle est la différence avec un outil de build comme Webpack ou Vite ?', a: 'Ces outils appliquent une minification plus avancée (renommage de variables, suppression de code inutilisé, optimisations spécifiques), généralement intégrée à un processus de compilation complet, alors que cet outil effectue une minification basique et rapide, utile pour un script ponctuel.' },
        ],
      },
    }),
  },
  'beautify-html': {
    name: 'Beautifier HTML', icon: 'wand', desc: 'Ré-indentez et embellissez du HTML.', cat: 'dev',
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
      root.append(toolArticle({
        intro: [
          'Du code HTML récupéré compressé, généré automatiquement ou copié depuis un outil, se retrouve souvent sur une seule ligne ou mal indenté, ce qui le rend difficile à relire et à modifier. Cet outil réindente proprement un code HTML, en respectant la hiérarchie des balises, pour le rendre lisible et facile à éditer.',
        ],
        steps: [
          'Collez votre code HTML, même compressé ou mal formaté.',
          'Cliquez sur "Embellir" pour obtenir une version indentée et lisible.',
          'Copiez le résultat pour l\'intégrer à votre projet.',
        ],
        tips: [
          'Un code HTML bien indenté facilite grandement la relecture et la détection d\'une balise mal fermée ou mal imbriquée.',
          'Cet outil ne modifie pas le contenu ni la structure de votre HTML, il ajuste uniquement l\'indentation et la mise en forme visuelle du code source.',
        ],
        faq: [
          { q: 'Cet outil corrige-t-il les erreurs dans mon HTML ?', a: 'Non, il réindente le code tel quel sans corriger d\'éventuelles erreurs de structure (balise non fermée, imbrication incorrecte) ; il facilite en revanche leur repérage visuel grâce à une mise en forme claire.' },
          { q: 'Le résultat est-il identique visuellement dans le navigateur ?', a: 'Oui, le rendu visuel dans le navigateur reste rigoureusement identique : seule la présentation du code source (indentation, sauts de ligne) est modifiée, pas son fonctionnement.' },
        ],
      }));
    },
  },
};
