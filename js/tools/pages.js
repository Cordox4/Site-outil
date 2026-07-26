import { el, panel } from '../ui.js';

export const tools = {
  about: {
    name: 'À propos', icon: 'ℹ️', desc: 'Ce que fait OutilsBox et pourquoi il existe.', cat: null,
    render(root) {
      root.append(panel(
        el('h3', {}, 'Notre mission'),
        el('p', {}, 'OutilsBox est né d\'un constat simple : pour des tâches du quotidien comme fusionner un PDF, compresser une image ou convertir une couleur, on se retrouve trop souvent à installer un logiciel, créer un compte ou envoyer un fichier personnel sur un serveur inconnu. OutilsBox rassemble des dizaines d\'outils pratiques — PDF, images, texte, développement, calculs, couleurs, SEO, médias et plus — accessibles gratuitement depuis n\'importe quel navigateur, sans inscription et sans rien installer.'),
        el('h3', {}, 'Comment ça fonctionne'),
        el('p', {}, 'La grande majorité des outils s\'exécutent entièrement en local, directement dans votre navigateur grâce aux technologies web modernes (JavaScript, WebAssembly, Canvas). Concrètement, cela signifie que lorsque vous fusionnez deux PDF ou redimensionnez une image sur OutilsBox, le fichier ne quitte jamais votre ordinateur ou votre téléphone : tout le traitement se fait sur votre appareil. Quelques outils plus avancés (reconnaissance vocale, certaines conversions média) s\'appuient sur des services externes ; ils sont toujours signalés clairement sur leur page.'),
        el('h3', {}, 'À qui s\'adresse OutilsBox'),
        el('p', {}, 'Le site s\'adresse à toute personne qui a besoin d\'un outil ponctuel et fiable : étudiants, indépendants, développeurs, graphistes, community managers ou simples curieux. Pas besoin d\'être technicien : chaque outil est pensé pour être compris et utilisé en quelques secondes, avec des explications et des exemples directement sur la page.'),
        el('h3', {}, 'Un site en constante évolution'),
        el('p', {}, 'De nouveaux outils et de nouvelles améliorations sont ajoutés régulièrement, souvent à partir des retours des utilisateurs. Si un outil vous manque ou si vous repérez un bug, n\'hésitez pas à nous en parler via la page Contact.'),
        el('h3', {}, 'Comment le site est financé'),
        el('p', {}, 'OutilsBox est gratuit et le restera. Le développement et l\'hébergement sont financés par des publicités affichées sur le site ainsi que, ponctuellement, par le soutien direct de la communauté. Si les outils vous rendent service, garder les publicités activées ou soutenir le projet via le lien du footer est le meilleur moyen de nous aider à continuer.'),
      ));
    },
  },

  contact: {
    name: 'Contact', icon: '✉️', desc: 'Une question, un bug ou une suggestion ? Écrivez-nous.', cat: null,
    render(root) {
      root.append(panel(
        el('h3', {}, 'Nous écrire'),
        el('p', {}, 'Une question sur un outil, un bug à signaler, une idée de fonctionnalité ou une demande liée à la publicité et aux partenariats ? Le moyen le plus simple de nous joindre est par e-mail, à l\'adresse suivante :'),
        el('p', { style: 'font-size:1.05rem;font-weight:700' }, 'okinstreamssf@gmail.com'),
        el('h3', {}, 'Signaler un problème technique'),
        el('p', {}, 'Si un outil ne fonctionne pas comme prévu, merci de préciser le nom de l\'outil concerné, votre navigateur (Chrome, Firefox, Safari…) et, si possible, les étapes pour reproduire le problème. Ces informations nous permettent de corriger les bugs beaucoup plus rapidement.'),
        el('h3', {}, 'Proposer un nouvel outil'),
        el('p', {}, 'OutilsBox grandit grâce aux suggestions de ses utilisateurs. Si vous utilisez régulièrement un type de conversion, de calcul ou de traitement de fichier qui n\'existe pas encore sur le site, dites-le-nous : les demandes les plus fréquentes sont prioritaires dans notre feuille de route.'),
        el('h3', {}, 'Publicité et partenariats'),
        el('p', {}, 'Pour toute question relative à la publicité, à un partenariat ou à une demande de collaboration, merci d\'utiliser la même adresse e-mail en précisant l\'objet de votre demande dans le titre du message.'),
        el('h3', {}, 'Délai de réponse'),
        el('p', {}, 'Nous répondons généralement sous quelques jours ouvrés. Vous pouvez aussi nous suivre et nous contacter sur ',
          el('a', { href: 'https://x.com/cordox4', target: '_blank', rel: 'noopener noreferrer' }, 'X (@cordox4)'), '.'),
      ));
    },
  },

  privacy: {
    name: 'Confidentialité', icon: '🔒', desc: 'Comment vos données sont traitées sur OutilsBox.', cat: null,
    render(root) {
      root.append(panel(
        el('p', {}, 'Cette politique de confidentialité explique quelles données sont traitées lorsque vous utilisez OutilsBox, et comment. Nous mettons un point d\'honneur à en collecter le moins possible.'),
        el('h3', {}, 'Traitement local des fichiers'),
        el('p', {}, 'La majorité des outils (PDF, image, texte, code, calculs, couleurs) s\'exécutent entièrement dans votre navigateur, grâce à JavaScript. Vos fichiers, images et textes ne sont jamais envoyés vers nos serveurs : tout le traitement a lieu sur votre propre appareil, puis le résultat est généré et téléchargeable directement depuis votre navigateur.'),
        el('h3', {}, 'Outils s\'appuyant sur des services externes'),
        el('p', {}, 'Certains outils (reconnaissance vocale, certaines conversions média ou fonctionnalités assistées par IA) font appel à une API tierce ou à une fonctionnalité du navigateur (comme l\'API Web Speech) pour fonctionner. Ces outils sont clairement identifiés sur leur page. Dans ce cas, les données nécessaires transitent uniquement le temps du traitement et ne sont pas conservées par OutilsBox.'),
        el('h3', {}, 'Bibliothèques techniques utilisées'),
        el('p', {}, 'Pour faire fonctionner certains outils (PDF, par exemple), le site charge des bibliothèques JavaScript reconnues (comme pdf-lib ou pdf.js) depuis un réseau de diffusion de contenu (CDN) public. Le chargement de ces scripts peut entraîner une requête technique vers ce CDN, sans transmission de vos fichiers.'),
        el('h3', {}, 'Cookies et publicité'),
        el('p', {}, 'OutilsBox est un site gratuit financé par la publicité. Des espaces publicitaires sont réservés sur le site et pourront afficher des annonces fournies par des régies publicitaires tierces, notamment Google AdSense. Ces régies peuvent utiliser des cookies ou des identifiants similaires afin d\'afficher des publicités basées sur vos visites de ce site ou d\'autres sites. Google et ses partenaires peuvent utiliser ces cookies pour diffuser des annonces personnalisées.'),
        el('p', {}, 'Vous pouvez désactiver la publicité personnalisée en vous rendant dans les paramètres de publicité de Google, ou consulter la politique de confidentialité de Google pour en savoir plus sur l\'utilisation des cookies publicitaires.'),
        el('h3', {}, 'Statistiques de fréquentation'),
        el('p', {}, 'Nous pourrons utiliser un outil de mesure d\'audience (par exemple Google Analytics) afin de comprendre l\'usage global du site (pages visitées, provenance, appareil utilisé) et l\'améliorer. Ces données sont agrégées et ne permettent pas de vous identifier personnellement.'),
        el('h3', {}, 'Vos droits'),
        el('p', {}, 'Conformément au RGPD, vous disposez d\'un droit d\'accès, de rectification et de suppression concernant les données personnelles vous concernant que nous pourrions détenir (par exemple si vous nous contactez par e-mail). Pour exercer ce droit, écrivez-nous depuis la page Contact.'),
        el('h3', {}, 'Modifications de cette politique'),
        el('p', {}, 'Cette politique peut être mise à jour pour refléter des évolutions du site ou de la réglementation. La date de dernière mise à jour figure en bas de cette page.'),
        el('p', { class: 'hint' }, 'Dernière mise à jour : 26 juillet 2026.'),
      ));
    },
  },

  terms: {
    name: "Conditions d'utilisation", icon: '📜', desc: "Règles d'utilisation du site et des outils.", cat: null,
    render(root) {
      root.append(panel(
        el('p', {}, 'En utilisant OutilsBox, vous acceptez les conditions décrites ci-dessous. Merci de les lire attentivement.'),
        el('h3', {}, '1. Objet du service'),
        el('p', {}, 'OutilsBox propose gratuitement une collection d\'outils en ligne (traitement de PDF, d\'images, de texte, calculs, conversions, etc.) utilisables directement depuis un navigateur web, sans inscription obligatoire.'),
        el('h3', {}, '2. Utilisation autorisée'),
        el('p', {}, 'Les outils sont destinés à un usage personnel ou professionnel légal. Il est interdit d\'utiliser OutilsBox pour traiter des contenus illicites, pour porter atteinte aux droits d\'un tiers, ou pour tenter de perturber le fonctionnement du site (surcharge automatisée, extraction massive de contenu, etc.).'),
        el('h3', {}, '3. Fonctionnement des outils et absence de garantie'),
        el('p', {}, 'Les outils sont fournis "en l\'état", sans garantie de disponibilité, d\'exactitude ou d\'adéquation à un usage particulier. Bien que nous mettions tout en œuvre pour assurer leur bon fonctionnement, certains résultats (compression, conversion, calculs) peuvent varier selon votre navigateur, votre appareil ou le fichier fourni. Il est recommandé de toujours conserver une copie de sauvegarde de vos fichiers originaux avant traitement.'),
        el('h3', {}, '4. Responsabilité'),
        el('p', {}, 'OutilsBox ne peut être tenu responsable des pertes de données, dommages indirects ou préjudices résultant de l\'utilisation ou de l\'impossibilité d\'utiliser le site et ses outils. Les outils qui font appel à un service externe (voir la page Confidentialité) dépendent de la disponibilité de ce service tiers, en dehors de notre contrôle.'),
        el('h3', {}, '5. Propriété intellectuelle'),
        el('p', {}, 'Le contenu, le design et le code du site OutilsBox sont protégés par le droit d\'auteur. Vous conservez l\'intégralité des droits sur les fichiers que vous traitez avec nos outils : nous n\'y accédons pas et ne les stockons pas.'),
        el('h3', {}, '6. Publicité'),
        el('p', {}, 'Le site affiche des espaces publicitaires fournis par des régies tierces (voir la page Confidentialité), qui financent la gratuité du service. L\'utilisation d\'un bloqueur de publicité reste possible mais nous encourageons nos utilisateurs à les désactiver pour soutenir le projet.'),
        el('h3', {}, '7. Modification des conditions'),
        el('p', {}, 'Ces conditions peuvent être modifiées à tout moment pour refléter l\'évolution du site. La poursuite de l\'utilisation du site après modification vaut acceptation des nouvelles conditions.'),
        el('h3', {}, '8. Droit applicable'),
        el('p', {}, 'Les présentes conditions sont soumises au droit français. Pour toute question, contactez-nous via la page Contact.'),
        el('p', { class: 'hint' }, 'Dernière mise à jour : 26 juillet 2026.'),
      ));
    },
  },
};
