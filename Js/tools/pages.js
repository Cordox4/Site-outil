import { el, panel } from '../ui.js';

export const tools = {
  about: {
    name: 'À propos', icon: 'ℹ️', desc: 'Ce que fait OutilsBox.', cat: null,
    render(root) {
      root.append(panel(
        el('p', {}, 'OutilsBox regroupe des dizaines d\'outils pratiques du quotidien : PDF, images, texte, développement, calculs, couleurs, SEO et plus.'),
        el('p', {}, 'La grande majorité des outils fonctionnent entièrement dans votre navigateur : vos fichiers ne quittent jamais votre appareil.'),
        el('p', {}, 'Le site est financé par la publicité — merci de soutenir le projet en gardant les publicités activées.'),
      ));
    },
  },
  privacy: {
    name: 'Confidentialité', icon: '🔒', desc: 'Traitement de vos données.', cat: null,
    render(root) {
      root.append(panel(
        el('h3', {}, 'Traitement local'),
        el('p', {}, 'Les outils PDF, image, texte, code et calcul s\'exécutent localement dans votre navigateur. Aucun fichier n\'est envoyé à un serveur.'),
        el('h3', {}, 'Outils en ligne'),
        el('p', {}, 'Certains outils (réseau, conversion multimédia, IA) peuvent nécessiter un service externe. Ils sont clairement indiqués.'),
        el('h3', {}, 'Publicité'),
        el('p', {}, 'Des emplacements publicitaires sont présents. Les régies publicitaires peuvent utiliser des cookies conformément à leur politique.'),
      ));
    },
  },
};
