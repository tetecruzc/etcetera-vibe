/**
 * import-history.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Borra el historial de órdenes/transacciones anterior e importa TODAS las
 * ventas + incidentes reales desde ventas.js, incluyendo:
 *   - 55 ventas (ingresos)
 *   - 1 regalo Bolso Tenis Panda (egreso sin ingreso)
 *   - Estafa: 2 Bolso Tenis Flamenco + $90 en efectivo robado
 *   - 2 Bolso Tenis Disco faltantes sin explicación
 *   - Pérdida por diferencia de caja ($359.83)
 *
 * Uso: node --experimental-websocket scripts/import-history.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ── Cargar .env ───────────────────────────────────────────────────────────────
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=');
      if (key && vals.length) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Faltan credenciales de Supabase en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Helpers ───────────────────────────────────────────────────────────────────
function findProduct(products, term, notTerm = null) {
  return products.find(p => {
    const match = p.name.toLowerCase().includes(term.toLowerCase());
    if (notTerm) return match && !p.name.toLowerCase().includes(notTerm.toLowerCase());
    return match;
  });
}

// ── Datos de todas las transacciones ─────────────────────────────────────────
const rawVentas = [
  // ══ VENTAS ══════════════════════════════════════════════════════════════════
  {
    num: 'ETC-001',
    customer: 'Academia de Tenis Grand Slam',
    accountName: 'Efectivo Stephanie',
    date: '2025-10-01T10:12:00Z',
    amount: 150.00,
    tipo: 'venta',
    items: [
      { prodTerm: 'Panda',        notTerm: null, qty: 1, price: 50.00 },
      { prodTerm: 'Classic Blue', notTerm: null, qty: 1, price: 50.00 },
      { prodTerm: 'Orange',       notTerm: null, qty: 1, price: 50.00 },
    ],
    notes: 'Consignacion: 3 unidades vendidas a $50 c/u'
  },
  {
    num: 'ETC-002',
    customer: 'Karina Hernandez Profe tenis',
    accountName: 'Efectivo Stephanie',
    date: '2025-10-01T10:14:00Z',
    amount: 160.00,
    tipo: 'venta',
    items: [
      { prodTerm: 'Lilac Army', notTerm: null, qty: 1, price: 55.00 },
      { prodTerm: 'Panda',      notTerm: null, qty: 2, price: 55.00 },
    ],
    notes: '3 bolsos a $55 c/u (1 Lilac Army + 2 Panda), debe $5. Consignacion original: 10 unidades'
  },
  {
    num: 'ETC-003',
    customer: 'Yuraima Cruz',
    accountName: 'Efectivo Stephanie',
    date: '2025-10-01T10:18:00Z',
    amount: 50.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Lavanda', notTerm: null, qty: 1, price: 50.00 }],
    notes: null
  },
  {
    num: 'ETC-004',
    customer: 'Carlos Marinelli',
    accountName: 'Efectivo Stephanie',
    date: '2025-10-01T10:19:00Z',
    amount: 50.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Classic Blue', notTerm: null, qty: 1, price: 50.00 }],
    notes: null
  },
  {
    num: 'ETC-005',
    customer: 'Nena sucre (@nenasucre)',
    accountName: null,
    date: '2025-11-03T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Classic Blue', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-006',
    customer: 'Fabiola Parejo (@fabiolarrain)',
    accountName: null,
    date: '2025-11-05T12:00:00Z',
    amount: 50.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Lavanda', notTerm: null, qty: 1, price: 50.00 }],
    notes: null
  },
  {
    num: 'ETC-007',
    customer: 'Andrea (@adii_15)',
    accountName: null,
    date: '2025-11-10T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Panda', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-008',
    customer: 'Osiris (INSTA)',
    accountName: null,
    date: '2025-11-12T12:00:00Z',
    amount: 50.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Panda', notTerm: null, qty: 1, price: 50.00 }],
    notes: null
  },
  {
    num: 'ETC-009',
    customer: 'Fabiana Maldera (@fabimaldera)',
    accountName: null,
    date: '2025-11-15T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Mocca', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-010',
    customer: 'Dave Quintanilla (@davesqm)',
    accountName: null,
    date: '2025-11-16T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Disco', notTerm: 'Pickleball', qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-011',
    customer: 'Jesus Herrera (@jesuseduardoherrera)',
    accountName: null,
    date: '2025-11-17T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Classic Blue', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-012',
    customer: 'Anyi (@anyi_seguros)',
    accountName: null,
    date: '2025-11-22T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Lavanda', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-013',
    customer: 'Valeria Suarez (@valeriaaaasc)',
    accountName: null,
    date: '2025-11-23T12:00:00Z',
    amount: 50.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Panda', notTerm: null, qty: 1, price: 50.00 }],
    notes: null
  },
  {
    num: 'ETC-014',
    customer: 'Keilyn (@keilynchaconl)',
    accountName: null,
    date: '2025-11-24T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Panda', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-015',
    customer: 'Eugenia Risquez (@eugeniarisquez)',
    accountName: null,
    date: '2025-11-24T14:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Panda', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-016',
    customer: 'Marilin Tutunji (@marilintutunji)',
    accountName: null,
    date: '2025-11-25T12:00:00Z',
    amount: 45.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Commando', notTerm: null, qty: 1, price: 45.00 }],
    notes: null
  },
  {
    num: 'ETC-017',
    customer: 'Marilin Tutunji (@marilintutunji)',
    accountName: null,
    date: '2025-11-26T12:00:00Z',
    amount: 40.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Orange', notTerm: null, qty: 1, price: 40.00 }],
    notes: null
  },
  {
    num: 'ETC-018',
    customer: 'Miriam Passariello (@miriampasss)',
    accountName: null,
    date: '2025-11-27T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Panda', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-019',
    customer: 'Josepmit (@josepmit)',
    accountName: null,
    date: '2025-11-27T14:00:00Z',
    amount: 50.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Flamenco', notTerm: null, qty: 1, price: 50.00 }],
    notes: null
  },
  {
    num: 'ETC-020',
    customer: 'Omar Ojeda (@omarojeda21)',
    accountName: null,
    date: '2025-11-28T12:00:00Z',
    amount: 40.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Disco', notTerm: 'Pickleball', qty: 1, price: 40.00 }],
    notes: null
  },
  {
    num: 'ETC-021',
    customer: 'Omar Colmenares (@omarcolmenares)',
    accountName: null,
    date: '2025-11-28T14:00:00Z',
    amount: 46.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Commando', notTerm: null, qty: 1, price: 46.00 }],
    notes: null
  },
  {
    num: 'ETC-022',
    customer: 'Alejandra Ortiz (@aleortiz29)',
    accountName: null,
    date: '2025-12-03T12:00:00Z',
    amount: 110.00,
    tipo: 'venta',
    items: [
      { prodTerm: 'Commando',    notTerm: null, qty: 1, price: 55.00 },
      { prodTerm: 'Classic Blue', notTerm: null, qty: 1, price: 55.00 },
    ],
    notes: null
  },
  {
    num: 'ETC-023',
    customer: 'Ana Karina Hernandez (@karerinna)',
    accountName: null,
    date: '2025-12-05T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Lavanda', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-024',
    customer: 'Luis Romero (@luisromeroof)',
    accountName: null,
    date: '2025-12-10T12:00:00Z',
    amount: 60.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Mocca', notTerm: null, qty: 1, price: 60.00 }],
    notes: null
  },
  {
    num: 'ETC-025',
    customer: 'Caco Cendon (@carolinacendon)',
    accountName: null,
    date: '2025-12-15T12:00:00Z',
    amount: 50.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Disco', notTerm: 'Pickleball', qty: 1, price: 50.00 }],
    notes: null
  },
  {
    num: 'ETC-026',
    customer: 'Ma. Sabina Quintero (@sabinaquinter)',
    accountName: null,
    date: '2025-12-16T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Orange', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-027',
    customer: 'Mari Palacios (@mari_pruiz)',
    accountName: null,
    date: '2025-12-17T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Classic Blue', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-028',
    customer: 'Kristhian Gutierrez (@kristhian.ga)',
    accountName: null,
    date: '2025-12-17T14:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Flamenco', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-029',
    customer: 'Valeria Humpierres (@valeriahumpier)',
    accountName: null,
    date: '2025-12-18T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Classic Blue', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-030',
    customer: 'R Rodriguez (@rrodriguez_87)',
    accountName: null,
    date: '2025-12-18T14:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Lavanda', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-031',
    customer: 'tu/eso (@n3grol0v3r)',
    accountName: null,
    date: '2025-12-20T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Classic Blue', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-032',
    customer: 'Claudia Castro (@clauccr_)',
    accountName: null,
    date: '2025-12-20T13:00:00Z',
    amount: 60.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Disco', notTerm: 'Pickleball', qty: 1, price: 60.00 }],
    notes: null
  },
  {
    num: 'ETC-033',
    customer: 'Faride Katherine (@kathyszd)',
    accountName: null,
    date: '2025-12-20T14:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Lilac Army', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-034',
    customer: 'Marnie Valdez (@mvaldez03)',
    accountName: null,
    date: '2025-12-20T15:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Mocca', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-035',
    customer: 'Daniel Da Silva (@danields1993)',
    accountName: null,
    date: '2025-12-20T16:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Lavanda', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-036',
    customer: 'Liger Vargas (@liger.vargas)',
    accountName: null,
    date: '2025-12-21T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Mocca', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-037',
    customer: 'Pamela Monaco (@bellastrega78)',
    accountName: null,
    date: '2025-12-22T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Classic Blue', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-038',
    customer: 'Camila Pittaluga',
    accountName: null,
    date: '2025-12-22T14:00:00Z',
    amount: 50.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Commando', notTerm: null, qty: 1, price: 50.00 }],
    notes: null
  },
  {
    num: 'ETC-039',
    customer: 'Andrea Cifuentes (@acifue)',
    accountName: null,
    date: '2025-12-23T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Flamenco', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-040',
    customer: 'Rudy Idler (@rudyidler)',
    accountName: null,
    date: '2025-12-23T14:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Disco', notTerm: 'Pickleball', qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-041',
    customer: 'Lidia Reyes (@trilliziando)',
    accountName: null,
    date: '2025-12-23T16:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Lavanda', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-042',
    customer: 'M Fernanda Hernandez',
    accountName: null,
    date: '2026-03-05T12:00:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Lilac Army', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-043',
    customer: 'Teresa Gomez',
    accountName: 'Efectivo Stephanie',
    date: '2026-03-06T10:51:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Disco', notTerm: 'Pickleball', qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-044',
    customer: 'Joana Burgos',
    accountName: 'Efectivo Stephanie',
    date: '2026-03-09T14:52:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Lavanda', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-045',
    customer: 'Samuel Agreda',
    accountName: 'Efectivo Stephanie',
    date: '2026-03-09T14:54:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Mocca', notTerm: null, qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-046',
    customer: 'Adelia',
    accountName: 'Zelle',
    date: '2026-03-10T15:46:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Disco', notTerm: 'Pickleball', qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-047',
    customer: 'Marco Antonio Diaz',
    accountName: 'Efectivo Sergio',
    date: '2026-03-23T20:27:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Disco', notTerm: 'Pickleball', qty: 1, price: 55.00 }],
    notes: null
  },
  {
    num: 'ETC-048',
    customer: 'Jorkelys Garmes',
    accountName: 'Efectivo Sergio',
    date: '2026-03-24T20:48:00Z',
    amount: 50.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Mocca', notTerm: null, qty: 1, price: 50.00 }],
    notes: 'Precio especial $50'
  },
  {
    num: 'ETC-049',
    customer: 'Amanda',
    accountName: 'Efectivo Stephanie',
    date: '2026-01-21T19:38:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Mocca', notTerm: null, qty: 1, price: 55.00 }],
    notes: 'Bolso numero 6 / despacho Tony'
  },
  {
    num: 'ETC-050',
    customer: 'Giovanna',
    accountName: 'Zelle',
    date: '2026-04-03T10:44:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Disco', notTerm: 'Pickleball', qty: 1, price: 55.00 }],
    notes: 'Bolso numero 5'
  },
  {
    num: 'ETC-051',
    customer: 'Raquel Abadi',
    accountName: 'Efectivo Stephanie',
    date: '2026-04-13T13:48:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Mocca', notTerm: null, qty: 1, price: 55.00 }],
    notes: 'Bolso numero 6'
  },
  {
    num: 'ETC-052',
    customer: 'Monica',
    accountName: 'Efectivo Sergio',
    date: '2026-04-16T09:29:00Z',
    amount: 110.00,
    tipo: 'venta',
    items: [
      { prodTerm: 'Lavanda',  notTerm: null, qty: 1, price: 55.00 },
      { prodTerm: 'Flamenco', notTerm: null, qty: 1, price: 55.00 },
    ],
    notes: 'Bolso 1 y bolso 4'
  },
  {
    num: 'ETC-053',
    customer: 'Yenny Mota',
    accountName: 'Efectivo Sergio',
    date: '2026-05-25T11:56:00Z',
    amount: 55.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Orange', notTerm: null, qty: 1, price: 55.00 }],
    notes: 'Bolso 9'
  },
  {
    num: 'ETC-054',
    customer: 'Carmen Vazquez',
    accountName: 'Zelle',
    date: '2026-09-06T09:00:00Z',
    amount: 45.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Lavanda', notTerm: null, qty: 1, price: 45.00 }],
    notes: null
  },
  {
    num: 'ETC-055',
    customer: 'Carolina club',
    accountName: 'Efectivo Sergio',
    date: '2026-09-06T14:25:00Z',
    amount: 45.00,
    tipo: 'venta',
    items: [{ prodTerm: 'Disco', notTerm: 'Pickleball', qty: 1, price: 45.00 }],
    notes: null
  },

  // ══ EGRESOS / INCIDENTES ═════════════════════════════════════════════════════

  // [1] REGALO: 1 Bolso Tenis Panda — sin ingreso de dinero
  //     Pandas: 9 ventas (ids 1x2, 7, 8, 13, 14, 15, 18 = 9 unidades) + 1 regalo = 10 total -> stock 0
  {
    num: 'ETC-REG-001',
    customer: 'Regalo / cortesia',
    accountName: 'Efectivo Stephanie',
    date: '2025-12-01T12:00:00Z',
    amount: 0.00,
    tipo: 'regalo',
    items: [{ prodTerm: 'Panda', notTerm: null, qty: 1, price: 0.00 }],
    notes: '1 Bolso Tenis Panda regalado. Sin ingreso de dinero. Stock Panda queda en 0.'
  },

  // [2] ESTAFA: 2 Bolso Tenis Flamenco se los llevaron + $90 de efectivo robados de caja
  {
    num: 'ETC-ROB-001',
    customer: 'Incidente: Estafa',
    accountName: 'Efectivo Stephanie',
    date: '2025-12-28T12:00:00Z',
    amount: -90.00,
    tipo: 'robo',
    items: [
      { prodTerm: 'Flamenco', notTerm: null, qty: 2, price: 0.00 },
    ],
    notes: 'ESTAFA: se llevaron 2 Bolso Tenis Flamenco + $90.00 en efectivo de la caja. Perdida registrada.'
  },

  // [3] FALTANTE: 2 Bolso Tenis Disco desaparecidos, sin explicacion, sin dinero
  {
    num: 'ETC-FAL-001',
    customer: 'Faltante de inventario',
    accountName: 'Efectivo Stephanie',
    date: '2026-09-09T12:00:00Z',
    amount: 0.00,
    tipo: 'faltante',
    items: [{ prodTerm: 'Disco', notTerm: 'Pickleball', qty: 2, price: 0.00 }],
    notes: '2 Bolso Tenis Disco faltantes detectados en auditoria. Sin causa conocida. Ajuste de inventario.'
  },

  // [4] AJUSTE: Diferencia de caja $2,971.00 - $2,611.17 = $359.83
  {
    num: 'ETC-AJU-001',
    customer: 'Ajuste de caja - Perdida no explicada',
    accountName: 'Efectivo Stephanie',
    date: '2026-09-09T18:00:00Z',
    amount: -359.83,
    tipo: 'ajuste',
    items: [],
    notes: 'Diferencia entre ventas registradas ($2,971.00) y efectivo real en caja ($2,611.17). Perdida contable: $359.83.'
  },
];

// ── Script principal ──────────────────────────────────────────────────────────
async function run() {
  console.log('Etcetera - Importando historial completo de transacciones...\n');

  // 1. Obtener datos de referencia
  const { data: products, error: pErr } = await supabase.from('products').select('*');
  if (pErr || !products?.length) {
    console.error('ERROR: No se encontraron productos:', pErr?.message);
    process.exit(1);
  }

  const { data: warehouses } = await supabase.from('warehouses').select('*');
  const tonyWh    = warehouses?.find(w => w.name.includes('Tony'));
  const defaultWh = tonyWh || warehouses?.[0];

  if (!defaultWh) {
    console.error('ERROR: No se encontraron almacenes.');
    process.exit(1);
  }

  const { data: allAccounts } = await supabase.from('accounts').select('*');
  const accMap = {};
  allAccounts?.forEach(a => { accMap[a.name] = a; });

  console.log(`OK: ${products.length} productos | ${warehouses?.length} almacenes | ${allAccounts?.length} cuentas\n`);

  // 2. Borrar historial anterior
  console.log('Borrando historial anterior (order_items, orders, account_transactions)...');
  await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('account_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Historial anterior borrado.\n');

  // 3. Insertar cada transacción
  console.log('Insertando transacciones...\n');

  let totalIngreso = 0;
  let totalEgreso  = 0;
  let ok = 0;
  let errCount = 0;

  for (const tx of rawVentas) {
    const accountObj = tx.accountName ? accMap[tx.accountName] : null;
    const accountId  = accountObj?.id || allAccounts?.[0]?.id;

    // Tipo de transacción para account_transactions
    let txType = 'sale';
    if (tx.tipo === 'regalo')   txType = 'withdrawal';
    if (tx.tipo === 'robo')     txType = 'withdrawal';
    if (tx.tipo === 'faltante') txType = 'withdrawal';
    if (tx.tipo === 'ajuste')   txType = 'adjustment';

    // Insertar orden
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .insert([{
        order_number:  tx.num,
        customer_name: tx.customer,
        account_id:    accountId,
        total_amount:  Math.abs(tx.amount),
        notes:         tx.notes,
        created_at:    tx.date,
      }])
      .select()
      .single();

    if (oErr) {
      console.error(`  ERROR en ${tx.num}: ${oErr.message}`);
      errCount++;
      continue;
    }

    // Insertar items de la orden
    for (const item of tx.items) {
      const prod = findProduct(products, item.prodTerm, item.notTerm);
      if (!prod) {
        console.warn(`  AVISO: Producto no encontrado: "${item.prodTerm}" (${tx.num})`);
        continue;
      }
      await supabase.from('order_items').insert([{
        order_id:     order.id,
        product_id:   prod.id,
        warehouse_id: defaultWh.id,
        quantity:     item.qty,
        unit_price:   item.price,
        subtotal:     item.qty * item.price,
        created_at:   tx.date,
      }]);
    }

    // Insertar transacción financiera (solo si hay movimiento de dinero o es un egreso documentado)
    const shouldRecord = tx.amount !== 0 || ['regalo', 'faltante'].includes(tx.tipo);
    if (shouldRecord) {
      const txAmount = tx.tipo === 'venta' ? Math.abs(tx.amount) : tx.amount;
      await supabase.from('account_transactions').insert([{
        account_id: accountId,
        type:       txType,
        amount:     txAmount,
        order_id:   order.id,
        notes:      tx.notes || `${tx.tipo.toUpperCase()} - ${tx.customer}`,
        created_at: tx.date,
      }]);
      if (txAmount > 0) totalIngreso += txAmount;
      else              totalEgreso  += Math.abs(txAmount);
    }

    const label = { venta: 'VENTA', regalo: 'REGALO', robo: 'ROBO/ESTAFA', faltante: 'FALTANTE', ajuste: 'AJUSTE' }[tx.tipo] || tx.tipo;
    console.log(`  [${tx.num}] ${label} | ${tx.customer} | $${tx.amount}`);
    ok++;
  }

  // 4. Actualizar inventario basado en transacciones registradas
  console.log('\n================================================');
  console.log('4. Actualizando stock de inventario...');
  console.log('================================================');

  // Stock inicial por producto (según reglas de negocio)
  const INITIAL_STOCK = {
    'Disco':      { notTerm: 'Pickleball', qty: 16 }, // Bolso Tenis Disco: 16 unidades
    'Pickleball': { notTerm: null,          qty: 4  }, // Bolso Pickleball Disco: 4 unidades
    // Todos los demás: 10 unidades
    'Lavanda':     { qty: 10 },
    'Commando':    { qty: 10 },
    'Lilac Army':  { qty: 10 },
    'Flamenco':    { qty: 10 },
    'Mocca':       { qty: 10 },
    'Panda':       { qty: 10 },
    'Classic Blue':{ qty: 10 },
    'Orange':      { qty: 10 },
  };

  // Calcular unidades movidas por producto a partir de rawVentas
  const unitsOut = {}; // product_id -> total units out
  for (const tx of rawVentas) {
    for (const item of tx.items) {
      const prod = findProduct(products, item.prodTerm, item.notTerm);
      if (!prod) continue;
      unitsOut[prod.id] = (unitsOut[prod.id] || 0) + item.qty;
    }
  }

  // Obtener almacenes Tony y Sergio
  const tonyWarehouse   = warehouses?.find(w => w.name.includes('Tony'));
  const sergioWarehouse = warehouses?.find(w => w.name.includes('Sergio'));

  if (!tonyWarehouse || !sergioWarehouse) {
    console.warn('  AVISO: No se encontraron ambos almacenes (Tony/Sergio). Se usara el almacen por defecto.');
  }

  const inventoryUpserts = [];

  for (const [term, cfg] of Object.entries(INITIAL_STOCK)) {
    const prod = findProduct(products, term, cfg.notTerm ?? null);
    if (!prod) {
      console.warn(`  AVISO: Producto no encontrado para calcular stock: "${term}"`);
      continue;
    }

    const initialQty  = cfg.qty;
    const consumed    = unitsOut[prod.id] || 0;
    const remaining   = Math.max(0, initialQty - consumed);

    // Distribuir el stock restante entre Tony y Sergio (Tony recibe la mayoría, Sergio el resto si hay)
    // Regla simple: Sergio recibe min(remaining, 1) si hay más de 1, el resto va a Tony
    const sergioStock = remaining > 1 ? 1 : 0;
    const tonyStock   = remaining - sergioStock;

    console.log(`  ${prod.name}: inicial=${initialQty} | consumido=${consumed} | restante=${remaining} (Tony=${tonyStock}, Sergio=${sergioStock})`);

    if (tonyWarehouse) {
      inventoryUpserts.push({
        product_id:   prod.id,
        warehouse_id: tonyWarehouse.id,
        stock:        tonyStock,
        updated_at:   new Date().toISOString(),
      });
    }
    if (sergioWarehouse) {
      inventoryUpserts.push({
        product_id:   prod.id,
        warehouse_id: sergioWarehouse.id,
        stock:        sergioStock,
        updated_at:   new Date().toISOString(),
      });
    }
  }

  const { error: invErr } = await supabase
    .from('inventory')
    .upsert(inventoryUpserts, { onConflict: 'product_id,warehouse_id' });

  if (invErr) {
    console.error('  ERROR al actualizar inventario:', invErr.message);
  } else {
    console.log(`\n  OK: ${inventoryUpserts.length} registros de inventario actualizados.`);
  }

  // 5. Resumen final
  console.log('\n================================================');
  console.log('RESUMEN DE IMPORTACION');
  console.log('================================================');
  console.log(`  Transacciones registradas : ${ok}`);
  console.log(`  Errores                   : ${errCount}`);
  console.log(`  Total ingresos (ventas)   : $${totalIngreso.toFixed(2)}`);
  console.log(`  Total egresos/perdidas     : $${totalEgreso.toFixed(2)}`);
  console.log(`  Neto                       : $${(totalIngreso - totalEgreso).toFixed(2)}`);
  console.log('================================================');
  console.log('\nImportacion completada!');
}

run().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
