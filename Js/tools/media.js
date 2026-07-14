import { el, panel, field, button, status, copyBtn, backendNotice } from '../ui.js';

export const tools = {
  'text-to-speech': {
    name: 'Text to Speech', icon: '🔊', desc: 'Lisez un texte à voix haute (synthèse vocale).', cat: 'media',
    render(root) {
      const p = panel(); root.append(p);
      if (!('speechSynthesis' in window)) { p.append(status('La synthèse vocale n\'est pas supportée par ce navigateur.', 'err')); return; }
      const ta = el('textarea', { placeholder: 'Écrivez le texte à lire…' });
      const voice = el('select');
      const rate = el('input', { type: 'range', min: '0.5', max: '2', step: '0.1', value: '1' });
      const fill = () => { const vs = speechSynthesis.getVoices(); voice.innerHTML = ''; vs.forEach((v, i) => voice.append(el('option', { value: i }, `${v.name} (${v.lang})`))); const fr = vs.findIndex(v => v.lang.startsWith('fr')); if (fr >= 0) voice.value = fr; };
      speechSynthesis.onvoiceschanged = fill; fill();
      const speak = () => { const u = new SpeechSynthesisUtterance(ta.value); const vs = speechSynthesis.getVoices(); if (vs[+voice.value]) u.voice = vs[+voice.value]; u.rate = +rate.value; speechSynthesis.cancel(); speechSynthesis.speak(u); };
      p.append(field('Texte', ta), el('div', { class: 'row' }, field('Voix', voice), field('Vitesse', rate)), el('div', { class: 'btn-row' }, button('▶ Lire', speak), button('⏹ Stop', () => speechSynthesis.cancel(), { primary: false })));
      ta.value = 'Bonjour, ceci est un test de synthèse vocale.';
    },
  },
  'speech-to-text': {
    name: 'Speech to Text', icon: '🎙️', desc: 'Transcrivez votre voix en texte (reconnaissance vocale).', cat: 'media',
    render(root) {
      const p = panel(); root.append(p);
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { p.append(backendNotice('La reconnaissance vocale'), el('p', { class: 'result-note' }, 'Votre navigateur ne supporte pas l\'API Web Speech (essayez Chrome).')); return; }
      const out = el('textarea', { placeholder: 'La transcription apparaîtra ici…' });
      const st = el('div'); let rec, running = false;
      const start = () => {
        rec = new SR(); rec.lang = 'fr-FR'; rec.continuous = true; rec.interimResults = true;
        rec.onresult = e => { let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; out.value = t; };
        rec.onerror = e => { st.innerHTML = ''; st.append(status('Erreur : ' + e.error, 'err')); };
        rec.start(); running = true; st.innerHTML = ''; st.append(status('🎙️ Écoute en cours…', 'info'));
      };
      const stop = () => { if (rec) rec.stop(); running = false; st.innerHTML = ''; };
      p.append(el('div', { class: 'btn-row' }, button('🎙️ Démarrer', start), button('⏹ Arrêter', stop, { primary: false }), copyBtn(() => out.value)), st, field('Transcription', out));
    },
  },
  'video-converter': {
    name: 'Convertisseur vidéo', icon: '🎬', desc: 'Convertissez entre formats vidéo (MP4, WebM…).', cat: 'media', badge: 'API',
    render(root) { root.append(panel(backendNotice('La conversion vidéo'))); },
  },
  'audio-converter': {
    name: 'Convertisseur audio', icon: '🎵', desc: 'Convertissez entre formats audio (MP3, WAV…).', cat: 'media', badge: 'API',
    render(root) { root.append(panel(backendNotice('La conversion audio'))); },
  },
  'audio-extractor': {
    name: 'Extracteur audio', icon: '🎧', desc: 'Extrayez la piste audio d\'une vidéo.', cat: 'media', badge: 'API',
    render(root) { root.append(panel(backendNotice('L\'extraction audio depuis une vidéo'))); },
  },
};
