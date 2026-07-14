import { el, panel, field, status } from '../ui.js';

function num(v) { return parseFloat(String(v).replace(',', '.')); }
function money(n) { return isFinite(n) ? n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : '—'; }
function kpi(items) { return el('div', { class: 'kpi' }, ...items.map(([v, l]) => el('div', { class: 'k' }, el('b', {}, v), el('span', {}, l)))); }
function calc(root, fields, compute) {
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
}

export const tools = {
  'vat': {
    name: 'Calcul TVA', icon: '🧾', desc: 'Calculez HT, TVA et TTC.', cat: 'calc',
    render: (r) => calc(r, [
      { key: 'ht', label: 'Montant HT', value: 100 },
      { key: 'rate', label: 'Taux TVA (%)', value: 20 },
    ], v => { const tva = v.ht * v.rate / 100; return kpi([[money(v.ht), 'HT'], [money(tva), 'TVA'], [money(v.ht + tva), 'TTC']]); }),
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
    ])),
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
    },
  },
};
