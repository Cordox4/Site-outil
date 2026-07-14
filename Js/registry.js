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
  { id: 'pdf', name: 'PDF', emoji: '📄' },
  { id: 'image', name: 'Images', emoji: '🖼️' },
  { id: 'text', name: 'Texte', emoji: '✍️' },
  { id: 'dev', name: 'Développeur', emoji: '💻' },
  { id: 'calc', name: 'Calculs', emoji: '🧮' },
  { id: 'convert', name: 'Convertisseurs', emoji: '🔁' },
  { id: 'color', name: 'Couleurs & CSS', emoji: '🎨' },
  { id: 'seo', name: 'SEO & Web', emoji: '🔍' },
  { id: 'media', name: 'Média & Audio', emoji: '🎧' },
  { id: 'network', name: 'Réseau', emoji: '🌐' },
  { id: 'ai', name: 'IA & Langue', emoji: '🤖' },
  { id: 'misc', name: 'Divers', emoji: '🧩' },
];

// Merge every module's tools into a single map { id -> tool }
export const tools = Object.assign({}, pdf, image, text, dev, calc, convert, color, seo, media, network, ai, misc, pages);

export const toolList = Object.entries(tools).map(([id, t]) => ({ id, ...t }));

export function toolsByCategory(catId) {
  return toolList.filter(t => t.cat === catId);
}
