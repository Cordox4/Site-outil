// ===== Intégration EzoicAds (adapté à une SPA à hash-routing) =====
//
// ⚠️ IMPORTANT : les IDs ci-dessous (101 à 104) sont des exemples.
// Va dans ton dashboard Ezoic → "EzoicAds" → onglet "Placeholders" → "New Placeholder",
// crée 4 emplacements (un par ligne ci-dessous), puis remplace les nombres
// par les vrais IDs qu'Ezoic t'attribue. C'est indispensable : sans placeholders
// réels créés côté Ezoic, les emplacements resteront vides.
export const EZOIC_IDS = {
  leaderboard: 101,  // bannière du haut, toujours affichée
  sidebarRail: 102,  // colonne latérale, toujours affichée
  homeInline: 103,   // pub au milieu de la page d'accueil (recréée à chaque visite de "#/")
  interstitial: 104, // pub avant le lancement d'un outil (dans la popup existante)
};

function ez(fn) {
  window.ezstandalone = window.ezstandalone || {};
  window.ezstandalone.cmd = window.ezstandalone.cmd || [];
  window.ezstandalone.cmd.push(fn);
}

// À appeler une seule fois au démarrage : indique à Ezoic la liste complète
// des emplacements existants sur le site (y compris ceux créés en JS plus tard).
export function ezoicDefineAll() {
  const ids = Object.values(EZOIC_IDS);
  ez(() => window.ezstandalone.define(...ids));
}

// Demande l'affichage d'un ou plusieurs emplacements.
// Le(s) div(s) correspondant(s) — id="ezoic-pub-ad-placeholder-<id>" — doivent
// déjà être dans le DOM au moment de l'appel.
export function ezoicShow(...ids) {
  ez(() => window.ezstandalone.showAds(...ids));
}

// Détruit un ou plusieurs emplacements avant de retirer leur div du DOM.
// Indispensable en SPA : sans ça, Ezoic garde une pub "fantôme" en mémoire
// et le prochain showAds() sur le même ID peut ne rien afficher ou dupliquer.
export function ezoicDestroy(...ids) {
  ez(() => window.ezstandalone.destroyPlaceholders(...ids));
}

// Crée le <div> d'accroche que Ezoic va remplir. À insérer dans le DOM avant
// d'appeler ezoicShow() sur le même id.
export function ezoicPlaceholderDiv(id) {
  const div = document.createElement('div');
  div.id = 'ezoic-pub-ad-placeholder-' + id;
  return div;
}
