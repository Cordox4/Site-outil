import { el, panel, field, status, toolArticle } from '../ui.js';

function num(v) { return parseFloat(String(v).replace(',', '.')); }
function money(n) { return isFinite(n) ? n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : '—'; }
function kpi(items) { return el('div', { class: 'kpi' }, ...items.map(([v, l]) => el('div', { class: 'k' }, el('b', {}, v), el('span', {}, l)))); }
function calc(root, fields, compute, article) {
  const p = panel(); root.append(p);
  const inputs = {};
  const grid = el('div', { class: 'row' });
  fields.forEach(f => {
    const inp = el('input', { type: 'number', value: f.value ?? '', step: f.step ?? 'any', placeholder: f.ph ?? '' });
    inputs[f.key] = inp; grid.append(field(f.label, inp, f.hint));
  });
  const out = el('div', { style: 'margin-top:8px' });
  const upd = () => { const vals = {}; for (const k in inputs) vals[k] = num(inputs[k].value); out.innerHTML = ''; out.append(compute(vals)); };
  grid.querySelectorAll('input').forEach(i => i.addEventListener('input', upd));
  p.append(grid, out); upd();
  if (article) root.append(toolArticle(article));
}

export const tools = {
  'vat': {
    name: 'Calcul TVA', icon: '🧾', desc: 'Calculez HT, TVA et TTC.', cat: 'calc',
    render: (r) => calc(r, [
      { key: 'ht', label: 'Montant HT', value: 100 },
      { key: 'rate', label: 'Taux TVA (%)', value: 20 },
    ], v => { const tva = v.ht * v.rate / 100; return kpi([[money(v.ht), 'HT'], [money(tva), 'TVA'], [money(v.ht + tva), 'TTC']]); }, {
      intro: [
        'Ce calculateur de TVA permet de passer instantanément d\'un montant Hors Taxes (HT) à un montant Toutes Taxes Comprises (TTC), ou inversement, en indiquant simplement le taux applicable. Il est pensé pour les indépendants, commerçants, comptables ou particuliers qui ont besoin de vérifier rapidement un montant sans ouvrir un tableur.',
        'En France, plusieurs taux de TVA coexistent : le taux normal de 20 % (la majorité des biens et services), le taux intermédiaire de 10 % (restauration, transport, travaux de rénovation), le taux réduit de 5,5 % (produits alimentaires, énergie, livres) et le taux particulier de 2,1 % (presse, médicaments remboursables). Le calculateur accepte n\'importe quel taux, ce qui le rend utilisable aussi pour d\'autres pays.',
      ],
      steps: [
        'Saisissez le montant Hors Taxes dans le premier champ.',
        'Indiquez le taux de TVA applicable à votre produit ou service (par défaut 20 %).',
        'Le montant de la TVA et le total TTC se recalculent automatiquement à chaque modification.',
      ],
      tips: [
        'Pour calculer le HT à partir d\'un montant TTC connu, divisez le TTC par (1 + taux/100) : par exemple 120 € TTC à 20 % = 100 € HT.',
        'Pensez à vérifier le taux exact applicable à votre secteur d\'activité, notamment pour la restauration ou les travaux, où plusieurs taux peuvent coexister sur une même facture.',
      ],
      faq: [
        { q: 'Comment calculer la TVA à partir d\'un prix TTC ?', a: 'Le montant de TVA se retrouve avec la formule : TVA = TTC − (TTC / (1 + taux/100)). Vous pouvez aussi saisir votre montant HT calculé manuellement dans l\'outil pour vérifier le résultat.' },
        { q: 'Quel taux de TVA choisir pour mon activité ?', a: 'Le taux dépend de la nature du bien ou du service vendu. En cas de doute, votre expert-comptable ou le site officiel des impôts (impots.gouv.fr) précise le taux applicable à votre secteur.' },
        { q: 'Cet outil convient-il pour d\'autres pays que la France ?', a: 'Oui : il suffit de renseigner le taux de TVA (ou de TPS/TVH) en vigueur dans votre pays, le calcul reste identique.' },
      ],
    }),
  },
  'percentage': {
    name: 'Calcul pourcentage', icon: '％', desc: 'Pourcentage, variation et proportion.', cat: 'calc',
    render: (r) => calc(r, [
      { key: 'x', label: 'Valeur A', value: 50 },
      { key: 'y', label: 'Valeur B', value: 200 },
    ], v => kpi([
      [(v.x / v.y * 100).toFixed(2) + '%', 'A est ce % de B'],
      [((v.y - v.x) / v.x * 100).toFixed(2) + '%', 'Variation A→B'],
      [(v.x * v.y / 100).toFixed(2), v.x + '% de B'],
    ]), {
      intro: [
        'Le pourcentage est l\'une des notions de calcul les plus utilisées au quotidien : remise en magasin, augmentation de salaire, variation d\'un prix, statistiques… Cet outil regroupe en un seul endroit les trois calculs de pourcentage les plus fréquents, pour éviter de refaire la formule à chaque fois.',
        'À partir de deux valeurs A et B, l\'outil calcule simultanément la proportion que représente A par rapport à B, la variation en pourcentage entre A et B, ainsi que le résultat de « X % de B ».',
      ],
      steps: [
        'Renseignez la valeur A (par exemple votre valeur de départ ou une part).',
        'Renseignez la valeur B (par exemple le total ou la valeur d\'arrivée).',
        'Lisez directement les trois résultats : proportion, variation et calcul de pourcentage.',
      ],
      tips: [
        'Pour calculer une remise, mettez le prix réduit en A et le prix initial en B : le résultat "A est ce % de B" indique le pourcentage restant après remise.',
        'Une variation négative signifie une baisse (par exemple entre un ancien et un nouveau prix), une variation positive signifie une hausse.',
      ],
      faq: [
        { q: 'Comment calculer une augmentation en pourcentage ?', a: 'Placez l\'ancienne valeur en A et la nouvelle valeur en B, puis regardez le résultat "Variation A→B" : un chiffre positif indique une augmentation, un chiffre négatif une diminution.' },
        { q: 'Comment calculer 20 % d\'un montant ?', a: 'Saisissez 20 dans le champ A et votre montant dans le champ B : le résultat "20% de B" donne directement la réponse.' },
        { q: 'Quelle est la différence entre pourcentage et point de pourcentage ?', a: 'Un pourcentage exprime un rapport relatif (ex : +10 %), tandis qu\'un point de pourcentage exprime une différence absolue entre deux pourcentages (ex : passer de 20 % à 30 % correspond à +10 points, mais +50 % en relatif).' },
      ],
    }),
  },
  'bmi': {
    name: 'Calcul IMC', icon: '⚖️', desc: 'Indice de masse corporelle.', cat: 'calc',
    render: (r) => calc(r, [
      { key: 'w', label: 'Poids (kg)', value: 70 },
      { key: 'h', label: 'Taille (cm)', value: 175 },
    ], v => {
      const imc = v.w / Math.pow(v.h / 100, 2);
      const cat = imc < 18.5 ? 'Maigreur' : imc < 25 ? 'Normal' : imc < 30 ? 'Surpoids' : 'Obésité';
      return kpi([[isFinite(imc) ? imc.toFixed(1) : '—', 'IMC'], [cat, 'Catégorie']]);
    }, {
      intro: [
        'L\'Indice de Masse Corporelle (IMC) est un indicateur simple, utilisé depuis longtemps par les professionnels de santé, qui met en relation le poids et la taille d\'une personne pour situer approximativement sa corpulence. Il se calcule en divisant le poids (en kg) par le carré de la taille (en mètres).',
        'Cet outil calcule votre IMC instantanément à partir de votre poids et de votre taille, et indique la catégorie correspondante selon les seuils de référence de l\'Organisation mondiale de la santé.',
      ],
      steps: [
        'Indiquez votre poids en kilogrammes.',
        'Indiquez votre taille en centimètres.',
        'L\'IMC et la catégorie correspondante s\'affichent automatiquement.',
      ],
      tips: [
        'Les seuils usuels sont : moins de 18,5 (maigreur), 18,5 à 25 (corpulence normale), 25 à 30 (surpoids), au-delà de 30 (obésité).',
        'L\'IMC est un indicateur général qui ne distingue pas la masse musculaire de la masse grasse : un sportif très musclé peut avoir un IMC élevé sans excès de graisse corporelle.',
      ],
      faq: [
        { q: 'L\'IMC est-il fiable pour tout le monde ?', a: 'C\'est un indicateur de population générale, moins précis chez les sportifs très musclés, les personnes âgées, les enfants ou les femmes enceintes. Il ne remplace pas l\'avis d\'un professionnel de santé.' },
        { q: 'Quel est l\'IMC considéré comme normal ?', a: 'Selon l\'OMS, la corpulence est considérée comme normale pour un IMC compris entre 18,5 et 25.' },
        { q: 'L\'outil enregistre-t-il mes données ?', a: 'Non, le calcul se fait entièrement dans votre navigateur : aucune donnée de poids ou de taille n\'est transmise ou conservée.' },
      ],
    }),
  },
  'age': {
    name: 'Calcul âge', icon: '🎂', desc: 'Âge exact à partir d\'une date de naissance.', cat: 'calc',
    render(root) {
      const p = panel(); root.append(p);
      const d = el('input', { type: 'date' });
      const out = el('div', { style: 'margin-top:8px' });
      const upd = () => {
        out.innerHTML = ''; if (!d.value) return;
        const b = new Date(d.value), now = new Date();
        let y = now.getFullYear() - b.getFullYear(), m = now.getMonth() - b.getMonth(), day = now.getDate() - b.getDate();
        if (day < 0) { m--; day += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
        if (m < 0) { y--; m += 12; }
        const days = Math.floor((now - b) / 864e5);
        out.append(kpi([[`${y} ans`, 'Âge'], [`${m} mois ${day} j`, 'Complément'], [days.toLocaleString('fr-FR'), 'Jours vécus']]));
      };
      d.addEventListener('input', upd);
      p.append(field('Date de naissance', d), out);
      root.append(toolArticle({
        intro: [
          'Ce calculateur d\'âge détermine, à partir d\'une date de naissance, l\'âge exact en années, mois et jours, ainsi que le nombre total de jours vécus depuis cette date. Il est utile pour remplir un formulaire administratif, vérifier une condition d\'âge, ou simplement satisfaire sa curiosité.',
          'Le calcul prend en compte automatiquement la longueur variable des mois et les années bissextiles, pour un résultat précis au jour près.',
        ],
        steps: [
          'Sélectionnez la date de naissance dans le champ prévu.',
          'L\'âge exact (années, mois, jours) et le nombre total de jours vécus s\'affichent instantanément.',
        ],
        tips: [
          'Le nombre "jours vécus" peut être utile pour calculer une durée exacte entre deux dates, par exemple pour un anniversaire de mariage ou un jalon professionnel.',
        ],
        faq: [
          { q: 'Comment est calculé le nombre de mois et de jours restants ?', a: 'L\'outil calcule d\'abord la différence en années entre les deux dates, puis ajuste le nombre de mois et de jours en tenant compte du calendrier réel (longueur des mois, années bissextiles).' },
          { q: 'Puis-je calculer l\'âge à une date future ou passée précise ?', a: 'Cet outil calcule l\'âge par rapport à la date du jour. Pour un âge à une date précise différente, il faudra effectuer le calcul manuellement en utilisant la date de naissance et la date cible.' },
        ],
      }));
    },
  },
  'compound-interest': {
    name: 'Intérêts composés', icon: '📈', desc: 'Projection d\'épargne avec intérêts composés.', cat: 'calc',
    render: (r) => calc(r, [
      { key: 'p', label: 'Capital initial (€)', value: 1000 },
      { key: 'add', label: 'Versement mensuel (€)', value: 100 },
      { key: 'rate', label: 'Taux annuel (%)', value: 5 },
      { key: 'years', label: 'Durée (années)', value: 10 },
    ], v => {
      const n = v.years * 12, r = v.rate / 100 / 12; let bal = v.p;
      for (let i = 0; i < n; i++) bal = bal * (1 + r) + v.add;
      const invested = v.p + v.add * n;
      return kpi([[money(bal), 'Capital final'], [money(invested), 'Total investi'], [money(bal - invested), 'Intérêts gagnés']]);
    }, {
      intro: [
        'Les intérêts composés désignent le mécanisme par lequel les intérêts générés par une épargne sont eux-mêmes réinvestis, générant à leur tour des intérêts. C\'est ce principe, appliqué sur plusieurs années, qui permet à une épargne régulière de croître de façon nettement plus rapide qu\'avec des intérêts simples.',
        'Ce simulateur projette l\'évolution d\'un capital placé avec un versement mensuel régulier, sur la durée et au taux annuel de votre choix, en recalculant les intérêts chaque mois.',
      ],
      steps: [
        'Indiquez votre capital de départ.',
        'Indiquez le montant que vous prévoyez de verser chaque mois (0 si aucun versement régulier).',
        'Renseignez le taux de rendement annuel espéré et la durée du placement en années.',
        'Le capital final, le total investi et les intérêts gagnés se mettent à jour automatiquement.',
      ],
      tips: [
        'Le taux annuel utilisé doit être net de frais pour donner une estimation réaliste (les frais de gestion réduisent le rendement effectif).',
        'Ce simulateur suppose un taux constant sur toute la durée : dans la réalité, les rendements d\'un placement (actions, fonds euros, etc.) varient d\'une année sur l\'autre.',
      ],
      faq: [
        { q: 'Quelle est la différence entre intérêts simples et intérêts composés ?', a: 'Avec des intérêts simples, seuls les intérêts sur le capital initial sont calculés chaque période. Avec des intérêts composés, les intérêts déjà accumulés génèrent eux aussi des intérêts, ce qui accélère la croissance du capital sur le long terme.' },
        { q: 'Ce résultat est-il garanti ?', a: 'Non, il s\'agit d\'une simulation basée sur un taux constant que vous renseignez. Les placements réels (bourse, épargne) comportent des variations et, pour certains, un risque de perte en capital.' },
        { q: 'Le calcul tient-il compte de l\'inflation ou de la fiscalité ?', a: 'Non, cette simulation donne un résultat brut, avant impôts et prélèvements sociaux, et sans ajustement de l\'inflation.' },
      ],
    }),
  },
  'mortgage': {
    name: 'Prêt immobilier', icon: '🏠', desc: 'Mensualité et coût total d\'un crédit.', cat: 'calc',
    render: (r) => calc(r, [
      { key: 'amount', label: 'Montant emprunté (€)', value: 200000 },
      { key: 'rate', label: 'Taux annuel (%)', value: 3.5 },
      { key: 'years', label: 'Durée (années)', value: 20 },
    ], v => {
      const n = v.years * 12, r = v.rate / 100 / 12;
      const m = r === 0 ? v.amount / n : v.amount * r / (1 - Math.pow(1 + r, -n));
      return kpi([[money(m), 'Mensualité'], [money(m * n), 'Coût total'], [money(m * n - v.amount), 'Intérêts']]);
    }, {
      intro: [
        'Avant de signer une offre de prêt immobilier, il est essentiel de savoir précisément à quoi correspond la mensualité et combien le crédit coûtera au total. Ce simulateur calcule la mensualité d\'un prêt à taux fixe ainsi que le coût total des intérêts sur toute la durée du remboursement.',
        'Le calcul utilise la formule standard d\'amortissement d\'un prêt à annuités constantes, la même que celle utilisée par la plupart des banques et courtiers pour établir un tableau d\'amortissement.',
      ],
      steps: [
        'Indiquez le montant emprunté (hors assurance et frais annexes).',
        'Renseignez le taux d\'intérêt annuel du crédit (hors assurance).',
        'Indiquez la durée du prêt en années.',
        'La mensualité, le coût total et le montant des intérêts s\'affichent immédiatement.',
      ],
      tips: [
        'Ce résultat ne comprend pas l\'assurance emprunteur, les frais de dossier ni les frais de garantie, qui s\'ajoutent au coût réel du crédit — pensez à les intégrer séparément.',
        'Le Taux Annuel Effectif Global (TAEG), communiqué obligatoirement par les banques, inclut ces frais et permet une comparaison plus juste entre plusieurs offres de prêt.',
      ],
      faq: [
        { q: 'Comment est calculée la mensualité d\'un prêt ?', a: 'Elle se calcule avec la formule des annuités constantes, qui répartit le remboursement du capital et des intérêts pour obtenir une mensualité identique chaque mois sur toute la durée du prêt.' },
        { q: 'Pourquoi le coût total est-il plus élevé que le montant emprunté ?', a: 'La différence correspond aux intérêts payés à la banque en contrepartie du prêt : plus le taux ou la durée sont élevés, plus cette différence augmente.' },
        { q: 'Ce simulateur remplace-t-il un accord de prêt bancaire ?', a: 'Non, il donne une estimation indicative. Seule votre banque ou un courtier peut établir une offre de prêt définitive, incluant l\'assurance et les frais réels.' },
      ],
    }),
  },
  'calories': {
    name: 'Calcul calories', icon: '🍎', desc: 'Besoins caloriques journaliers (BMR/TDEE).', cat: 'calc',
    render(root) {
      const p = panel(); root.append(p);
      const sex = el('select', {}, el('option', { value: 'h' }, 'Homme'), el('option', { value: 'f' }, 'Femme'));
      const age = el('input', { type: 'number', value: '30' }), w = el('input', { type: 'number', value: '70' }), h = el('input', { type: 'number', value: '175' });
      const act = el('select', {}, ...[['1.2', 'Sédentaire'], ['1.375', 'Léger'], ['1.55', 'Modéré'], ['1.725', 'Intense'], ['1.9', 'Très intense']].map(([v, l]) => el('option', { value: v }, l)));
      const out = el('div', { style: 'margin-top:8px' });
      const upd = () => {
        const bmr = 10 * +w.value + 6.25 * +h.value - 5 * +age.value + (sex.value === 'h' ? 5 : -161);
        const tdee = bmr * +act.value;
        out.innerHTML = ''; out.append(kpi([[Math.round(bmr), 'BMR (repos)'], [Math.round(tdee), 'Maintien (kcal/j)'], [Math.round(tdee - 500), 'Perte (-0,5 kg/sem)']]));
      };
      [sex, age, w, h, act].forEach(e => e.addEventListener('input', upd));
      p.append(el('div', { class: 'row' }, field('Sexe', sex), field('Âge', age)), el('div', { class: 'row' }, field('Poids (kg)', w), field('Taille (cm)', h)), field('Activité', act), out); upd();
      root.append(toolArticle({
        intro: [
          'Ce calculateur estime vos besoins caloriques journaliers en deux étapes : le métabolisme de base (BMR), c\'est-à-dire l\'énergie dépensée au repos complet, puis la dépense énergétique totale (TDEE), qui ajoute l\'effet de votre niveau d\'activité physique. Le calcul utilise la formule de Mifflin-St Jeor, l\'une des plus fiables et des plus utilisées par les professionnels de la nutrition.',
          'Ces valeurs donnent un ordre de grandeur utile pour ajuster ses apports alimentaires à ses objectifs (maintien, prise ou perte de poids), sans se substituer à un accompagnement personnalisé.',
        ],
        steps: [
          'Sélectionnez votre sexe, votre âge, votre poids et votre taille.',
          'Choisissez le niveau d\'activité physique qui correspond le mieux à votre quotidien.',
          'Le métabolisme de base et la dépense calorique totale estimée s\'affichent automatiquement.',
        ],
        tips: [
          'Le niveau d\'activité doit refléter votre semaine type, et pas seulement les jours de sport : quelqu\'un avec un métier physique mais sans sport peut déjà se situer sur "Modéré".',
          'Ces chiffres sont des estimations statistiques : le métabolisme réel varie d\'une personne à l\'autre selon la génétique, la masse musculaire ou certaines conditions médicales.',
        ],
        faq: [
          { q: 'Quelle est la différence entre BMR et TDEE ?', a: 'Le BMR est l\'énergie minimale dépensée au repos pour maintenir les fonctions vitales. Le TDEE ajoute à ce chiffre l\'énergie dépensée par l\'activité physique quotidienne : c\'est le TDEE qui correspond à vos besoins caloriques réels sur une journée.' },
          { q: 'Ce résultat est-il valable pour perdre du poids en toute sécurité ?', a: 'L\'outil propose une estimation basée sur un déficit modéré, mais toute démarche de perte de poids gagne à être encadrée par un professionnel de santé ou un(e) diététicien(ne), en particulier en cas de doute sur ses besoins réels.' },
          { q: 'La formule est-elle adaptée aux sportifs ou aux personnes très musclées ?', a: 'La formule de Mifflin-St Jeor reste une estimation générale ; les personnes très musclées ou très sédentaires peuvent avoir un métabolisme réel différent de l\'estimation.' },
        ],
      }));
    },
  },
};
import { el, panel, field, status, toolArticle } from '../ui.js';

function num(v) { return parseFloat(String(v).replace(',', '.')); }
function money(n) { return isFinite(n) ? n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : '—'; }
function kpi(items) { return el('div', { class: 'kpi' }, ...items.map(([v, l]) => el('div', { class: 'k' }, el('b', {}, v), el('span', {}, l)))); }
function calc(root, fields, compute, article) {
  const p = panel(); root.append(p);
  const inputs = {};
  const grid = el('div', { class: 'row' });
  fields.forEach(f => {
    const inp = el('input', { type: 'number', value: f.value ?? '', step: f.step ?? 'any', placeholder: f.ph ?? '' });
    inputs[f.key] = inp; grid.append(field(f.label, inp, f.hint));
  });
  const out = el('div', { style: 'margin-top:8px' });
  const upd = () => { const vals = {}; for (const k in inputs) vals[k] = num(inputs[k].value); out.innerHTML = ''; out.append(compute(vals)); };
  grid.querySelectorAll('input').forEach(i => i.addEventListener('input', upd));
  p.append(grid, out); upd();
  if (article) root.append(toolArticle(article));
}

export const tools = {
  'vat': {
    name: 'Calcul TVA', icon: '🧾', desc: 'Calculez HT, TVA et TTC.', cat: 'calc',
    render: (r) => calc(r, [
      { key: 'ht', label: 'Montant HT', value: 100 },
      { key: 'rate', label: 'Taux TVA (%)', value: 20 },
    ], v => { const tva = v.ht * v.rate / 100; return kpi([[money(v.ht), 'HT'], [money(tva), 'TVA'], [money(v.ht + tva), 'TTC']]); }, {
      intro: [
        'Ce calculateur de TVA permet de passer instantanément d\'un montant Hors Taxes (HT) à un montant Toutes Taxes Comprises (TTC), ou inversement, en indiquant simplement le taux applicable. Il est pensé pour les indépendants, commerçants, comptables ou particuliers qui ont besoin de vérifier rapidement un montant sans ouvrir un tableur.',
        'En France, plusieurs taux de TVA coexistent : le taux normal de 20 % (la majorité des biens et services), le taux intermédiaire de 10 % (restauration, transport, travaux de rénovation), le taux réduit de 5,5 % (produits alimentaires, énergie, livres) et le taux particulier de 2,1 % (presse, médicaments remboursables). Le calculateur accepte n\'importe quel taux, ce qui le rend utilisable aussi pour d\'autres pays.',
      ],
      steps: [
        'Saisissez le montant Hors Taxes dans le premier champ.',
        'Indiquez le taux de TVA applicable à votre produit ou service (par défaut 20 %).',
        'Le montant de la TVA et le total TTC se recalculent automatiquement à chaque modification.',
      ],
      tips: [
        'Pour calculer le HT à partir d\'un montant TTC connu, divisez le TTC par (1 + taux/100) : par exemple 120 € TTC à 20 % = 100 € HT.',
        'Pensez à vérifier le taux exact applicable à votre secteur d\'activité, notamment pour la restauration ou les travaux, où plusieurs taux peuvent coexister sur une même facture.',
      ],
      faq: [
        { q: 'Comment calculer la TVA à partir d\'un prix TTC ?', a: 'Le montant de TVA se retrouve avec la formule : TVA = TTC − (TTC / (1 + taux/100)). Vous pouvez aussi saisir votre montant HT calculé manuellement dans l\'outil pour vérifier le résultat.' },
        { q: 'Quel taux de TVA choisir pour mon activité ?', a: 'Le taux dépend de la nature du bien ou du service vendu. En cas de doute, votre expert-comptable ou le site officiel des impôts (impots.gouv.fr) précise le taux applicable à votre secteur.' },
        { q: 'Cet outil convient-il pour d\'autres pays que la France ?', a: 'Oui : il suffit de renseigner le taux de TVA (ou de TPS/TVH) en vigueur dans votre pays, le calcul reste identique.' },
      ],
    }),
  },
  'percentage': {
    name: 'Calcul pourcentage', icon: '％', desc: 'Pourcentage, variation et proportion.', cat: 'calc',
    render: (r) => calc(r, [
      { key: 'x', label: 'Valeur A', value: 50 },
      { key: 'y', label: 'Valeur B', value: 200 },
    ], v => kpi([
      [(v.x / v.y * 100).toFixed(2) + '%', 'A est ce % de B'],
      [((v.y - v.x) / v.x * 100).toFixed(2) + '%', 'Variation A→B'],
      [(v.x * v.y / 100).toFixed(2), v.x + '% de B'],
    ]), {
      intro: [
        'Le pourcentage est l\'une des notions de calcul les plus utilisées au quotidien : remise en magasin, augmentation de salaire, variation d\'un prix, statistiques… Cet outil regroupe en un seul endroit les trois calculs de pourcentage les plus fréquents, pour éviter de refaire la formule à chaque fois.',
        'À partir de deux valeurs A et B, l\'outil calcule simultanément la proportion que représente A par rapport à B, la variation en pourcentage entre A et B, ainsi que le résultat de « X % de B ».',
      ],
      steps: [
        'Renseignez la valeur A (par exemple votre valeur de départ ou une part).',
        'Renseignez la valeur B (par exemple le total ou la valeur d\'arrivée).',
        'Lisez directement les trois résultats : proportion, variation et calcul de pourcentage.',
      ],
      tips: [
        'Pour calculer une remise, mettez le prix réduit en A et le prix initial en B : le résultat "A est ce % de B" indique le pourcentage restant après remise.',
        'Une variation négative signifie une baisse (par exemple entre un ancien et un nouveau prix), une variation positive signifie une hausse.',
      ],
      faq: [
        { q: 'Comment calculer une augmentation en pourcentage ?', a: 'Placez l\'ancienne valeur en A et la nouvelle valeur en B, puis regardez le résultat "Variation A→B" : un chiffre positif indique une augmentation, un chiffre négatif une diminution.' },
        { q: 'Comment calculer 20 % d\'un montant ?', a: 'Saisissez 20 dans le champ A et votre montant dans le champ B : le résultat "20% de B" donne directement la réponse.' },
        { q: 'Quelle est la différence entre pourcentage et point de pourcentage ?', a: 'Un pourcentage exprime un rapport relatif (ex : +10 %), tandis qu\'un point de pourcentage exprime une différence absolue entre deux pourcentages (ex : passer de 20 % à 30 % correspond à +10 points, mais +50 % en relatif).' },
      ],
    }),
  },
  'bmi': {
    name: 'Calcul IMC', icon: '⚖️', desc: 'Indice de masse corporelle.', cat: 'calc',
    render: (r) => calc(r, [
      { key: 'w', label: 'Poids (kg)', value: 70 },
      { key: 'h', label: 'Taille (cm)', value: 175 },
    ], v => {
      const imc = v.w / Math.pow(v.h / 100, 2);
      const cat = imc < 18.5 ? 'Maigreur' : imc < 25 ? 'Normal' : imc < 30 ? 'Surpoids' : 'Obésité';
      return kpi([[isFinite(imc) ? imc.toFixed(1) : '—', 'IMC'], [cat, 'Catégorie']]);
    }, {
      intro: [
        'L\'Indice de Masse Corporelle (IMC) est un indicateur simple, utilisé depuis longtemps par les professionnels de santé, qui met en relation le poids et la taille d\'une personne pour situer approximativement sa corpulence. Il se calcule en divisant le poids (en kg) par le carré de la taille (en mètres).',
        'Cet outil calcule votre IMC instantanément à partir de votre poids et de votre taille, et indique la catégorie correspondante selon les seuils de référence de l\'Organisation mondiale de la santé.',
      ],
      steps: [
        'Indiquez votre poids en kilogrammes.',
        'Indiquez votre taille en centimètres.',
        'L\'IMC et la catégorie correspondante s\'affichent automatiquement.',
      ],
      tips: [
        'Les seuils usuels sont : moins de 18,5 (maigreur), 18,5 à 25 (corpulence normale), 25 à 30 (surpoids), au-delà de 30 (obésité).',
        'L\'IMC est un indicateur général qui ne distingue pas la masse musculaire de la masse grasse : un sportif très musclé peut avoir un IMC élevé sans excès de graisse corporelle.',
      ],
      faq: [
        { q: 'L\'IMC est-il fiable pour tout le monde ?', a: 'C\'est un indicateur de population générale, moins précis chez les sportifs très musclés, les personnes âgées, les enfants ou les femmes enceintes. Il ne remplace pas l\'avis d\'un professionnel de santé.' },
        { q: 'Quel est l\'IMC considéré comme normal ?', a: 'Selon l\'OMS, la corpulence est considérée comme normale pour un IMC compris entre 18,5 et 25.' },
        { q: 'L\'outil enregistre-t-il mes données ?', a: 'Non, le calcul se fait entièrement dans votre navigateur : aucune donnée de poids ou de taille n\'est transmise ou conservée.' },
      ],
    }),
  },
  'age': {
    name: 'Calcul âge', icon: '🎂', desc: 'Âge exact à partir d\'une date de naissance.', cat: 'calc',
    render(root) {
      const p = panel(); root.append(p);
      const d = el('input', { type: 'date' });
      const out = el('div', { style: 'margin-top:8px' });
      const upd = () => {
        out.innerHTML = ''; if (!d.value) return;
        const b = new Date(d.value), now = new Date();
        let y = now.getFullYear() - b.getFullYear(), m = now.getMonth() - b.getMonth(), day = now.getDate() - b.getDate();
        if (day < 0) { m--; day += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
        if (m < 0) { y--; m += 12; }
        const days = Math.floor((now - b) / 864e5);
        out.append(kpi([[`${y} ans`, 'Âge'], [`${m} mois ${day} j`, 'Complément'], [days.toLocaleString('fr-FR'), 'Jours vécus']]));
      };
      d.addEventListener('input', upd);
      p.append(field('Date de naissance', d), out);
      root.append(toolArticle({
        intro: [
          'Ce calculateur d\'âge détermine, à partir d\'une date de naissance, l\'âge exact en années, mois et jours, ainsi que le nombre total de jours vécus depuis cette date. Il est utile pour remplir un formulaire administratif, vérifier une condition d\'âge, ou simplement satisfaire sa curiosité.',
          'Le calcul prend en compte automatiquement la longueur variable des mois et les années bissextiles, pour un résultat précis au jour près.',
        ],
        steps: [
          'Sélectionnez la date de naissance dans le champ prévu.',
          'L\'âge exact (années, mois, jours) et le nombre total de jours vécus s\'affichent instantanément.',
        ],
        tips: [
          'Le nombre "jours vécus" peut être utile pour calculer une durée exacte entre deux dates, par exemple pour un anniversaire de mariage ou un jalon professionnel.',
        ],
        faq: [
          { q: 'Comment est calculé le nombre de mois et de jours restants ?', a: 'L\'outil calcule d\'abord la différence en années entre les deux dates, puis ajuste le nombre de mois et de jours en tenant compte du calendrier réel (longueur des mois, années bissextiles).' },
          { q: 'Puis-je calculer l\'âge à une date future ou passée précise ?', a: 'Cet outil calcule l\'âge par rapport à la date du jour. Pour un âge à une date précise différente, il faudra effectuer le calcul manuellement en utilisant la date de naissance et la date cible.' },
        ],
      }));
    },
  },
  'compound-interest': {
    name: 'Intérêts composés', icon: '📈', desc: 'Projection d\'épargne avec intérêts composés.', cat: 'calc',
    render: (r) => calc(r, [
      { key: 'p', label: 'Capital initial (€)', value: 1000 },
      { key: 'add', label: 'Versement mensuel (€)', value: 100 },
      { key: 'rate', label: 'Taux annuel (%)', value: 5 },
      { key: 'years', label: 'Durée (années)', value: 10 },
    ], v => {
      const n = v.years * 12, r = v.rate / 100 / 12; let bal = v.p;
      for (let i = 0; i < n; i++) bal = bal * (1 + r) + v.add;
      const invested = v.p + v.add * n;
      return kpi([[money(bal), 'Capital final'], [money(invested), 'Total investi'], [money(bal - invested), 'Intérêts gagnés']]);
    }, {
      intro: [
        'Les intérêts composés désignent le mécanisme par lequel les intérêts générés par une épargne sont eux-mêmes réinvestis, générant à leur tour des intérêts. C\'est ce principe, appliqué sur plusieurs années, qui permet à une épargne régulière de croître de façon nettement plus rapide qu\'avec des intérêts simples.',
        'Ce simulateur projette l\'évolution d\'un capital placé avec un versement mensuel régulier, sur la durée et au taux annuel de votre choix, en recalculant les intérêts chaque mois.',
      ],
      steps: [
        'Indiquez votre capital de départ.',
        'Indiquez le montant que vous prévoyez de verser chaque mois (0 si aucun versement régulier).',
        'Renseignez le taux de rendement annuel espéré et la durée du placement en années.',
        'Le capital final, le total investi et les intérêts gagnés se mettent à jour automatiquement.',
      ],
      tips: [
        'Le taux annuel utilisé doit être net de frais pour donner une estimation réaliste (les frais de gestion réduisent le rendement effectif).',
        'Ce simulateur suppose un taux constant sur toute la durée : dans la réalité, les rendements d\'un placement (actions, fonds euros, etc.) varient d\'une année sur l\'autre.',
      ],
      faq: [
        { q: 'Quelle est la différence entre intérêts simples et intérêts composés ?', a: 'Avec des intérêts simples, seuls les intérêts sur le capital initial sont calculés chaque période. Avec des intérêts composés, les intérêts déjà accumulés génèrent eux aussi des intérêts, ce qui accélère la croissance du capital sur le long terme.' },
        { q: 'Ce résultat est-il garanti ?', a: 'Non, il s\'agit d\'une simulation basée sur un taux constant que vous renseignez. Les placements réels (bourse, épargne) comportent des variations et, pour certains, un risque de perte en capital.' },
        { q: 'Le calcul tient-il compte de l\'inflation ou de la fiscalité ?', a: 'Non, cette simulation donne un résultat brut, avant impôts et prélèvements sociaux, et sans ajustement de l\'inflation.' },
      ],
    }),
  },
  'mortgage': {
    name: 'Prêt immobilier', icon: '🏠', desc: 'Mensualité et coût total d\'un crédit.', cat: 'calc',
    render: (r) => calc(r, [
      { key: 'amount', label: 'Montant emprunté (€)', value: 200000 },
      { key: 'rate', label: 'Taux annuel (%)', value: 3.5 },
      { key: 'years', label: 'Durée (années)', value: 20 },
    ], v => {
      const n = v.years * 12, r = v.rate / 100 / 12;
      const m = r === 0 ? v.amount / n : v.amount * r / (1 - Math.pow(1 + r, -n));
      return kpi([[money(m), 'Mensualité'], [money(m * n), 'Coût total'], [money(m * n - v.amount), 'Intérêts']]);
    }, {
      intro: [
        'Avant de signer une offre de prêt immobilier, il est essentiel de savoir précisément à quoi correspond la mensualité et combien le crédit coûtera au total. Ce simulateur calcule la mensualité d\'un prêt à taux fixe ainsi que le coût total des intérêts sur toute la durée du remboursement.',
        'Le calcul utilise la formule standard d\'amortissement d\'un prêt à annuités constantes, la même que celle utilisée par la plupart des banques et courtiers pour établir un tableau d\'amortissement.',
      ],
      steps: [
        'Indiquez le montant emprunté (hors assurance et frais annexes).',
        'Renseignez le taux d\'intérêt annuel du crédit (hors assurance).',
        'Indiquez la durée du prêt en années.',
        'La mensualité, le coût total et le montant des intérêts s\'affichent immédiatement.',
      ],
      tips: [
        'Ce résultat ne comprend pas l\'assurance emprunteur, les frais de dossier ni les frais de garantie, qui s\'ajoutent au coût réel du crédit — pensez à les intégrer séparément.',
        'Le Taux Annuel Effectif Global (TAEG), communiqué obligatoirement par les banques, inclut ces frais et permet une comparaison plus juste entre plusieurs offres de prêt.',
      ],
      faq: [
        { q: 'Comment est calculée la mensualité d\'un prêt ?', a: 'Elle se calcule avec la formule des annuités constantes, qui répartit le remboursement du capital et des intérêts pour obtenir une mensualité identique chaque mois sur toute la durée du prêt.' },
        { q: 'Pourquoi le coût total est-il plus élevé que le montant emprunté ?', a: 'La différence correspond aux intérêts payés à la banque en contrepartie du prêt : plus le taux ou la durée sont élevés, plus cette différence augmente.' },
        { q: 'Ce simulateur remplace-t-il un accord de prêt bancaire ?', a: 'Non, il donne une estimation indicative. Seule votre banque ou un courtier peut établir une offre de prêt définitive, incluant l\'assurance et les frais réels.' },
      ],
    }),
  },
  'calories': {
    name: 'Calcul calories', icon: '🍎', desc: 'Besoins caloriques journaliers (BMR/TDEE).', cat: 'calc',
    render(root) {
      const p = panel(); root.append(p);
      const sex = el('select', {}, el('option', { value: 'h' }, 'Homme'), el('option', { value: 'f' }, 'Femme'));
      const age = el('input', { type: 'number', value: '30' }), w = el('input', { type: 'number', value: '70' }), h = el('input', { type: 'number', value: '175' });
      const act = el('select', {}, ...[['1.2', 'Sédentaire'], ['1.375', 'Léger'], ['1.55', 'Modéré'], ['1.725', 'Intense'], ['1.9', 'Très intense']].map(([v, l]) => el('option', { value: v }, l)));
      const out = el('div', { style: 'margin-top:8px' });
      const upd = () => {
        const bmr = 10 * +w.value + 6.25 * +h.value - 5 * +age.value + (sex.value === 'h' ? 5 : -161);
        const tdee = bmr * +act.value;
        out.innerHTML = ''; out.append(kpi([[Math.round(bmr), 'BMR (repos)'], [Math.round(tdee), 'Maintien (kcal/j)'], [Math.round(tdee - 500), 'Perte (-0,5 kg/sem)']]));
      };
      [sex, age, w, h, act].forEach(e => e.addEventListener('input', upd));
      p.append(el('div', { class: 'row' }, field('Sexe', sex), field('Âge', age)), el('div', { class: 'row' }, field('Poids (kg)', w), field('Taille (cm)', h)), field('Activité', act), out); upd();
      root.append(toolArticle({
        intro: [
          'Ce calculateur estime vos besoins caloriques journaliers en deux étapes : le métabolisme de base (BMR), c\'est-à-dire l\'énergie dépensée au repos complet, puis la dépense énergétique totale (TDEE), qui ajoute l\'effet de votre niveau d\'activité physique. Le calcul utilise la formule de Mifflin-St Jeor, l\'une des plus fiables et des plus utilisées par les professionnels de la nutrition.',
          'Ces valeurs donnent un ordre de grandeur utile pour ajuster ses apports alimentaires à ses objectifs (maintien, prise ou perte de poids), sans se substituer à un accompagnement personnalisé.',
        ],
        steps: [
          'Sélectionnez votre sexe, votre âge, votre poids et votre taille.',
          'Choisissez le niveau d\'activité physique qui correspond le mieux à votre quotidien.',
          'Le métabolisme de base et la dépense calorique totale estimée s\'affichent automatiquement.',
        ],
        tips: [
          'Le niveau d\'activité doit refléter votre semaine type, et pas seulement les jours de sport : quelqu\'un avec un métier physique mais sans sport peut déjà se situer sur "Modéré".',
          'Ces chiffres sont des estimations statistiques : le métabolisme réel varie d\'une personne à l\'autre selon la génétique, la masse musculaire ou certaines conditions médicales.',
        ],
        faq: [
          { q: 'Quelle est la différence entre BMR et TDEE ?', a: 'Le BMR est l\'énergie minimale dépensée au repos pour maintenir les fonctions vitales. Le TDEE ajoute à ce chiffre l\'énergie dépensée par l\'activité physique quotidienne : c\'est le TDEE qui correspond à vos besoins caloriques réels sur une journée.' },
          { q: 'Ce résultat est-il valable pour perdre du poids en toute sécurité ?', a: 'L\'outil propose une estimation basée sur un déficit modéré, mais toute démarche de perte de poids gagne à être encadrée par un professionnel de santé ou un(e) diététicien(ne), en particulier en cas de doute sur ses besoins réels.' },
          { q: 'La formule est-elle adaptée aux sportifs ou aux personnes très musclées ?', a: 'La formule de Mifflin-St Jeor reste une estimation générale ; les personnes très musclées ou très sédentaires peuvent avoir un métabolisme réel différent de l\'estimation.' },
        ],
      }));
    },
  },
};
