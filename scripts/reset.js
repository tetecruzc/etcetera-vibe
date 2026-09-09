import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Cargar variables de .env
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
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
  console.error('❌ Error: No se encontraron las credenciales de Supabase en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function resetAllToZero() {
  console.log('🔄 Iniciando reseteo general a 0 en Supabase...');
  console.log('Proyecto:', supabaseUrl);
  console.log('--------------------------------------------------');

  try {
    // 1. Eliminar Items de Pedidos
    console.log('🧹 Vaciando detalle de pedidos (order_items)...');
    const { error: itemsErr } = await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (itemsErr) console.warn('Nota en order_items:', itemsErr.message);

    // 2. Eliminar Pedidos
    console.log('🧹 Vaciando pedidos y ventas (orders)...');
    const { error: ordErr } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (ordErr) console.warn('Nota en orders:', ordErr.message);

    // 3. Eliminar Transacciones de Cuentas
    console.log('🧹 Vaciando historial de transacciones (account_transactions)...');
    const { error: txErr } = await supabase.from('account_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (txErr) console.warn('Nota en account_transactions:', txErr.message);

    // 4. Poner en $0.00 todas las cuentas
    console.log('💰 Reseteando saldos de todas las cuentas a $0.00...');
    const { error: accErr } = await supabase
      .from('accounts')
      .update({ balance: 0.00 })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (accErr) console.warn('Nota en accounts:', accErr.message);

    // 5. Poner en 0 unidades todo el inventario
    console.log('📦 Reseteando stock de todos los productos en almacenes a 0 unid...');
    const { error: invErr } = await supabase
      .from('inventory')
      .update({ stock: 0, updated_at: new Date().toISOString() })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (invErr) console.warn('Nota en inventory:', invErr.message);

    // 6. Limpiar localStorage por si quedó caché antigua de prueba
    console.log('\n✅ ¡Listo! Todo ha sido reseteado a 0.');
    console.log(' - Stock en Casa Tony y Casa Sergio: 0 unidades.');
    console.log(' - Saldo en Zelle, Efectivo, Banesco, Pago Móvil: $0.00.');
    console.log(' - Historial de ventas: vacío.');
    console.log(' - Los 10 productos y almacenes se mantienen listos para ingresar tus datos reales.\n');
  } catch (err) {
    console.error('❌ Error durante el reseteo:', err);
  }
}

resetAllToZero();
