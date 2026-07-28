// ===== Tool registry: categories + aggregation of all tool modules =====
import { tools as pdf } from './tools/pdf.js';
import { tools as image } from './tools/image.js';
import { tools as text } from './tools/text.js';
import { tools as dev } from './tools/dev.js';
import { tools as calc } from './tools/calc.js';
import { tools as convert } from './tools/convert.js';
import { tools as color } from './tools/color.js';
import { tools as seo } from './tools/seo.js';
import { tools as media } from './tools/media.js';
import { tools as network } from './tools/network.js';
import { tools as ai } from './tools/ai.js';
import { tools as misc } from './tools/misc.js';
import { tools as pages } from './tools/pages.js';

export const categories = [
  { id: 'pdf', name: 'PDF', icon: 'file' },
  { id: 'image', name: 'Images', icon: 'image' },
  { id: 'text', name: 'Texte', icon: 'pencil' },
  { id: 'dev', name: 'Développeur', icon: 'code' },
  { id: 'calc', name: 'Calculs', icon: 'calculator' },
  { id: 'convert', name: 'Convertisseurs', icon: 'refresh' },
  { id: 'color', name: 'Couleurs & CSS', icon: 'palette' },
  { id: 'seo', name: 'SEO & Web', icon: 'search' },
  { id: 'media', name: 'Média & Audio', icon: 'headphones' },
  { id: 'network', name: 'Réseau', icon: 'globe' },
  { id: 'ai', name: 'IA & Langue', icon: 'bot' },
  { id: 'misc', name: 'Divers', icon: 'puzzle' },
];

// Merge every module's tools into a single map { id -> tool }
export const tools = Object.assign({}, pdf, image, text, dev, calc, convert, color, seo, media, network, ai, misc, pages);

// On exclut les outils marqués badge:'API' (non implémentés / "à venir") des
// grilles et de la recherche : Google déconseille fortement les pages
// "en construction" pour l'acceptation AdSense. Le code de l'outil reste en
// place dans son module ; il suffit de retirer `badge: 'API'` une fois
// l'outil réellement fonctionnel pour qu'il réapparaisse automatiquement.
export const toolList = Object.entries(tools)
  .map(([id, t]) => ({ id, ...t }))
  .filter(t => t.badge !== 'API');

export function toolsByCategory(catId) {
  return toolList.filter(t => t.cat === catId);
}
