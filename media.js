import { el, panel, field, button, status, copyBtn, backendNotice, toolArticle, icon } from '../ui.js';

export const tools = {
  'text-to-speech': {
    name: 'Text to Speech', icon: 'volume', desc: 'Lisez un texte à voix haute (synthèse vocale).', cat: 'media',
    render(root) {
      const p = panel(); root.append(p);
      if (!('speechSynthesis' in window)) { p.append(status('La synthèse vocale n\'est pas supportée par ce navigateur.', 'err')); return; }
      const ta = el('textarea', { placeholder: 'Écrivez le texte à lire…' });
      const voice = el('select');
      const rate = el('input', { type: 'range', min: '0.5', max: '2', step: '0.1', value: '1' });
      const fill = () => { const vs = speechSynthesis.getVoices(); voice.innerHTML = ''; vs.forEach((v, i) => voice.append(el('option', { value: i }, `${v.name} (${v.lang})`))); const fr = vs.findIndex(v => v.lang.startsWith('fr')); if (fr >= 0) voice.value = fr; };
      speechSynthesis.onvoiceschanged = fill; fill();
      const speak = () => { const u = new SpeechSynthesisUtterance(ta.value); const vs = speechSynthesis.getVoices(); if (vs[+voice.value]) u.voice = vs[+voice.value]; u.rate = +rate.value; speechSynthesis.cancel(); speechSynthesis.speak(u); };
      p.append(field('Texte', ta), el('div', { class: 'row' }, field('Voix', voice), field('Vitesse', rate)), el('div', { class: 'btn-row' }, button([icon('play'), ' Lire'], speak), button([icon('stop'), ' Stop'], () => speechSynthesis.cancel(), { primary: false })));
      ta.value = 'Bonjour, ceci est un test de synthèse vocale.';
      root.append(toolArticle({
        intro: [
          'La synthèse vocale (text-to-speech) transforme un texte écrit en voix parlée. Cet outil s\'appuie sur l\'API Web Speech, intégrée nativement à votre navigateur, pour lire à voix haute n\'importe quel texte, avec un choix de voix et de vitesse de lecture.',
          'Les voix disponibles dépendent de votre système d\'exploitation et de votre navigateur : certains appareils proposent plusieurs voix françaises, d\'autres une seule.',
        ],
        steps: [
          'Écrivez ou collez le texte à lire dans la zone prévue.',
          'Choisissez une voix et ajustez la vitesse de lecture si besoin.',
          'Cliquez sur "Lire" pour démarrer la lecture, ou "Stop" pour l\'arrêter.',
        ],
        tips: [
          'Cet outil est utile pour relire un texte à voix haute avant publication : les erreurs de formulation sont souvent plus faciles à repérer à l\'oreille qu\'à l\'écrit.',
          'Une vitesse réduite (0,8x) facilite la compréhension pour l\'apprentissage d\'une langue ou une relecture attentive.',
        ],
        faq: [
          { q: 'Pourquoi je n\'ai qu\'une seule voix disponible ?', a: 'Le nombre de voix proposées dépend de votre système d\'exploitation et de votre navigateur ; certains systèmes n\'installent qu\'une voix par langue par défaut.' },
          { q: 'Le texte lu est-il envoyé sur un serveur ?', a: 'Non, la synthèse vocale est traitée directement par votre navigateur et votre système d\'exploitation, sans transmission de votre texte vers un serveur externe.' },
        ],
      }));
    },
  },
  'speech-to-text': {
    name: 'Speech to Text', icon: 'mic', desc: 'Transcrivez votre voix en texte (reconnaissance vocale).', cat: 'media',
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
        rec.start(); running = true; st.innerHTML = ''; st.append(el('div', { class: 'status info' }, icon('mic'), ' Écoute en cours…'));
      };
      const stop = () => { if (rec) rec.stop(); running = false; st.innerHTML = ''; };
      p.append(el('div', { class: 'btn-row' }, button([icon('mic'), ' Démarrer'], start), button([icon('stop'), ' Arrêter'], stop, { primary: false }), copyBtn(() => out.value)), st, field('Transcription', out));
      root.append(toolArticle({
        intro: [
          'La reconnaissance vocale (speech-to-text) convertit votre voix en texte écrit en temps réel, directement depuis le microphone de votre appareil. Elle est pratique pour dicter une note, un e-mail ou un brouillon de texte sans avoir à taper au clavier.',
          'Cet outil s\'appuie sur l\'API Web Speech, disponible nativement dans les navigateurs basés sur Chromium (Chrome, Edge…) ; certains navigateurs comme Firefox ou Safari ne la prennent pas en charge nativement.',
        ],
        steps: [
          'Cliquez sur "Démarrer" et autorisez l\'accès au microphone si votre navigateur le demande.',
          'Parlez normalement : le texte transcrit apparaît en direct dans la zone de résultat.',
          'Cliquez sur "Arrêter" pour terminer, puis copiez le texte obtenu.',
        ],
        tips: [
          'Un environnement calme et une élocution claire améliorent nettement la précision de la transcription.',
          'La reconnaissance est configurée en français ; les mots ou expressions en anglais peuvent être moins bien reconnus.',
        ],
        faq: [
          { q: 'Ma voix est-elle enregistrée ou stockée quelque part ?', a: 'Le traitement audio passe par le service de reconnaissance vocale de votre navigateur (par exemple les serveurs de Google pour Chrome), mais aucun enregistrement n\'est conservé par OutilsBox lui-même.' },
          { q: 'Pourquoi le bouton "Démarrer" ne fonctionne-t-il pas ?', a: 'Vérifiez que vous utilisez un navigateur compatible (Chrome ou Edge de préférence) et que vous avez autorisé l\'accès au microphone dans les paramètres du navigateur.' },
        ],
      }));
    },
  },
  'video-converter': {
    name: 'Convertisseur vidéo', icon: 'film', desc: 'Convertissez entre formats vidéo (MP4, WebM…).', cat: 'media', badge: 'API',
    render(root) { root.append(panel(backendNotice('La conversion vidéo'))); },
  },
  'audio-converter': {
    name: 'Convertisseur audio', icon: 'music', desc: 'Convertissez entre formats audio (MP3, WAV…).', cat: 'media', badge: 'API',
    render(root) { root.append(panel(backendNotice('La conversion audio'))); },
  },
  'audio-extractor': {
    name: 'Extracteur audio', icon: 'headphones', desc: 'Extrayez la piste audio d\'une vidéo.', cat: 'media', badge: 'API',
    render(root) { root.append(panel(backendNotice('L\'extraction audio depuis une vidéo'))); },
  },
};
