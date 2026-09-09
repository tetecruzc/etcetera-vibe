import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Cargar .env
const envPath = path.join(rootDir, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
let supabaseUrl = '';
let supabaseAnonKey = '';
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k?.trim() === 'VITE_SUPABASE_URL') supabaseUrl = v.join('=').trim();
  if (k?.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = v.join('=').trim();
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSync() {
  console.log('🎾 Sincronizando datos reales de Etcetera...');

  // 1. OBTENER / ACTUALIZAR CUENTAS FINANCIERAS REALES
  console.log('\n1. Configurando Cuentas Financieras...');
  const accountsToSetup = [
    { name: 'Efectivo Sergio', currency: 'USD', balance: 1016.17, is_active: true },
    { name: 'Efectivo Stephanie', currency: 'USD', balance: 60.00, is_active: true },
    { name: 'Zelle', currency: 'USD', balance: 1535.00, is_active: true },
    { name: 'Banesco Panamá', currency: 'USD', balance: 0.00, is_active: true },
    { name: 'Pago Móvil / Bs', currency: 'USD', balance: 0.00, is_active: true }
  ];

  // Actualizar 'Efectivo USD' existente a 'Efectivo Sergio' si existe
  await supabase.from('accounts').update({ name: 'Efectivo Sergio' }).eq('name', 'Efectivo USD');

  for (const acc of accountsToSetup) {
    const { data: existing } = await supabase.from('accounts').select('id').eq('name', acc.name).maybeSingle();
    if (existing) {
      await supabase.from('accounts').update({ balance: acc.balance, is_active: true }).eq('id', existing.id);
    } else {
      await supabase.from('accounts').insert([acc]);
    }
  }

  const { data: allAccounts } = await supabase.from('accounts').select('*');
  const accMap = {};
  allAccounts.forEach(a => { accMap[a.name] = a.id; });
  console.log('✅ Cuentas configuradas:', Object.keys(accMap));

  // 2. ACTUALIZAR STOCK EN ALMACENES (Casa Tony y Casa Sergio)
  console.log('\n2. Actualizando Stock de Inventario Real...');
  const { data: warehouses } = await supabase.from('warehouses').select('*');
  const tonyWh = warehouses.find(w => w.name.includes('Tony'));
  const sergioWh = warehouses.find(w => w.name.includes('Sergio'));

  const { data: products } = await supabase.from('products').select('*');
  const getProd = (term) => products.find(p => p.name.toLowerCase().includes(term.toLowerCase()));

  const inventoryStockTarget = [
    { term: 'Orange', tony: 5, sergio: 1 },
    { term: 'Disco', notTerm: 'Pickleball', tony: 1, sergio: 3 }, // Disco Tennis
    { term: 'Pickleball', tony: 3, sergio: 1 },                   // Disco Pickleball
    { term: 'Mocca', tony: 2, sergio: 0 },
    { term: 'Lilac Army', tony: 5, sergio: 2 },
    { term: 'Commando', tony: 5, sergio: 1 },
    { term: 'Flamenco', tony: 4, sergio: 0 },
    { term: 'Classic Blue', tony: 1, sergio: 0 },
    { term: 'Lavanda', tony: 0, sergio: 0 },
    { term: 'Panda', tony: 0, sergio: 0 }
  ];

  const inventoryRows = [];
  for (const item of inventoryStockTarget) {
    let p = products.find(pr => {
      const match = pr.name.toLowerCase().includes(item.term.toLowerCase());
      if (item.notTerm) return match && !pr.name.toLowerCase().includes(item.notTerm.toLowerCase());
      return match;
    });

    if (p) {
      if (tonyWh) inventoryRows.push({ product_id: p.id, warehouse_id: tonyWh.id, stock: item.tony, updated_at: new Date().toISOString() });
      if (sergioWh) inventoryRows.push({ product_id: p.id, warehouse_id: sergioWh.id, stock: item.sergio, updated_at: new Date().toISOString() });
      console.log(` - ${p.name}: Tony = ${item.tony}, Sergio = ${item.sergio}`);
    }
  }

  await supabase.from('inventory').upsert(inventoryRows, { onConflict: 'product_id,warehouse_id' });
  console.log('✅ Stock de inventario guardado con éxito.');

  // 3. REGISTRAR HISTORIAL REAL DE VENTAS Y TRANSACCIONES
  console.log('\n3. Registrando Ventas e Incidentes Históricos...');
  // Limpiar antes de insertar el historial
  await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const salesData = [
    // 5 de Marzo
    {
      num: 'ETC-240305',
      customer: 'M fernanda Fernández',
      accountName: 'Efectivo Sergio',
      date: '2024-03-05T21:09:00Z',
      amount: 55.00,
      prodTerm: 'Classic Blue',
      whId: sergioWh.id,
      notes: 'Venta histórica - Pago en Efectivo Sergio'
    },
    // 8 de Marzo
    {
      num: 'ETC-240308',
      customer: 'Teresa Gomez',
      accountName: 'Efectivo Stephanie',
      date: '2024-03-08T10:51:00Z',
      amount: 55.00,
      prodTerm: 'Commando',
      whId: tonyWh.id,
      notes: 'Venta histórica - Pago en Efectivo Stephanie'
    },
    // 9 de Marzo
    {
      num: 'ETC-240309A',
      customer: 'Joana Burgos',
      accountName: 'Efectivo Stephanie',
      date: '2024-03-09T14:52:00Z',
      amount: 55.00,
      prodTerm: 'Lilac Army',
      whId: tonyWh.id,
      notes: 'Venta histórica - Pago en Efectivo Stephanie'
    },
    {
      num: 'ETC-240309B',
      customer: 'Samuel Agreda',
      accountName: 'Efectivo Stephanie',
      date: '2024-03-09T14:54:00Z',
      amount: 55.00,
      prodTerm: 'Mocca',
      whId: tonyWh.id,
      notes: 'Venta histórica - Pago en Efectivo Stephanie'
    },
    // 10 de Marzo
    {
      num: 'ETC-240310',
      customer: 'Adelia',
      accountName: 'Zelle',
      date: '2024-03-10T15:46:00Z',
      amount: 55.00,
      prodTerm: 'Panda',
      whId: tonyWh.id,
      notes: 'Venta histórica - Pago por Zelle'
    },
    // 23 de Marzo
    {
      num: 'ETC-240323',
      customer: 'Marco antonio Díaz',
      accountName: 'Efectivo Sergio',
      date: '2024-03-23T20:27:00Z',
      amount: 55.00,
      prodTerm: 'Orange',
      whId: sergioWh.id,
      notes: 'Venta histórica - Pago en Efectivo Sergio'
    },
    // 24 de Marzo
    {
      num: 'ETC-240324',
      customer: 'Jorkelys Garmes',
      accountName: 'Efectivo Sergio',
      date: '2024-03-24T20:48:00Z',
      amount: 50.00,
      prodTerm: 'Flamenco',
      whId: sergioWh.id,
      notes: 'Venta histórica (precio especial $50) - Pago en Efectivo Sergio'
    },
    // 3 de Abril
    {
      num: 'ETC-240403',
      customer: 'Giovanna',
      accountName: 'Zelle',
      date: '2024-04-03T10:44:00Z',
      amount: 55.00,
      prodTerm: 'Flamenco', // Bolso 5
      whId: tonyWh.id,
      notes: 'Bolso número 5 - Pago por Zelle'
    },
    // 13 de Abril
    {
      num: 'ETC-240413',
      customer: 'Raquel Abadi',
      accountName: 'Efectivo Stephanie',
      date: '2024-04-13T13:48:00Z',
      amount: 55.00,
      prodTerm: 'Lavanda', // Bolso 6
      whId: tonyWh.id,
      notes: 'Bolso número 6 - Pago en Efectivo Stephanie'
    },
    // 16 de Abril (2 bolsos: Bolso 1 Classic Blue + Bolso 4 Disco Tennis)
    {
      num: 'ETC-240416',
      customer: 'Mónica',
      accountName: 'Efectivo Sergio',
      date: '2024-04-16T09:29:00Z',
      amount: 110.00,
      isMulti: true,
      items: [
        { prodTerm: 'Classic Blue', qty: 1, price: 55.00, whId: sergioWh.id },
        { prodTerm: 'Disco', notTerm: 'Pickleball', qty: 1, price: 55.00, whId: sergioWh.id }
      ],
      notes: 'Bolso 1 y bolso 4 - Pago en Efectivo Sergio'
    },
    // 25 de Mayo
    {
      num: 'ETC-240525',
      customer: 'Yenny Mota',
      accountName: 'Efectivo Sergio',
      date: '2024-05-25T11:56:00Z',
      amount: 55.00,
      prodTerm: 'Orange', // Bolso 9
      whId: sergioWh.id,
      notes: 'Bolso 9 - Pago en Efectivo Sergio'
    },
    // 6 de Septiembre
    {
      num: 'ETC-240906A',
      customer: 'Carmen Vázquez',
      accountName: 'Zelle',
      date: '2024-09-06T09:00:00Z',
      amount: 45.00,
      prodTerm: 'Disco', notTerm: 'Pickleball',
      whId: tonyWh.id,
      notes: 'Venta 6 de Septiembre - Pago por Zelle'
    },
    {
      num: 'ETC-240906B',
      customer: 'Carolina club',
      accountName: 'Efectivo Sergio',
      date: '2024-09-06T14:25:00Z',
      amount: 45.00,
      prodTerm: 'Commando',
      whId: sergioWh.id,
      notes: 'Venta 6 de Septiembre - Pago en Efectivo Sergio'
    },
    // INCIDENTE ESTAFA: 3 bolsos
    {
      num: 'ETC-INC-01',
      customer: 'Incidente: Estafa / Pérdida',
      accountName: 'Efectivo Sergio',
      date: '2024-05-19T20:15:00Z',
      amount: 0.00,
      isMulti: true,
      items: [
        { prodTerm: 'Classic Blue', qty: 1, price: 0.00, whId: tonyWh.id },
        { prodTerm: 'Commando', qty: 1, price: 0.00, whId: tonyWh.id },
        { prodTerm: 'Lilac Army', qty: 1, price: 0.00, whId: tonyWh.id }
      ],
      notes: '3 bolsos que nos estafaron y se llevaron (-$90 pérdida reportada)'
    },
    // OBSEQUIO HERMANA: 1 bolso
    {
      num: 'ETC-REG-01',
      customer: 'Hermana Stephanie (Cortesía)',
      accountName: 'Efectivo Stephanie',
      date: '2024-05-01T12:00:00Z',
      amount: 0.00,
      prodTerm: 'Lavanda',
      whId: tonyWh.id,
      notes: '1 bolso de regalo a hermana de Stephanie ($0.00 cortesía)'
    }
  ];

  for (const s of salesData) {
    const accountId = accMap[s.accountName] || allAccounts[0].id;
    const { data: orderRec, error: oErr } = await supabase
      .from('orders')
      .insert([{
        order_number: s.num,
        customer_name: s.customer,
        account_id: accountId,
        total_amount: s.amount,
        notes: s.notes,
        created_at: s.date
      }])
      .select()
      .single();

    if (oErr) {
      console.error(`Error guardando orden ${s.num}:`, oErr.message);
      continue;
    }

    // Items
    if (s.isMulti) {
      for (const it of s.items) {
        const prod = products.find(pr => {
          const m = pr.name.toLowerCase().includes(it.prodTerm.toLowerCase());
          if (it.notTerm) return m && !pr.name.toLowerCase().includes(it.notTerm.toLowerCase());
          return m;
        });
        if (prod) {
          await supabase.from('order_items').insert([{
            order_id: orderRec.id,
            product_id: prod.id,
            warehouse_id: it.whId,
            quantity: it.qty,
            unit_price: it.price,
            subtotal: it.qty * it.price,
            created_at: s.date
          }]);
        }
      }
    } else {
      const prod = products.find(pr => {
        const m = pr.name.toLowerCase().includes(s.prodTerm.toLowerCase());
        if (s.notTerm) return m && !pr.name.toLowerCase().includes(s.notTerm.toLowerCase());
        return m;
      });
      if (prod) {
        await supabase.from('order_items').insert([{
          order_id: orderRec.id,
          product_id: prod.id,
          warehouse_id: s.whId,
          quantity: 1,
          unit_price: s.amount,
          subtotal: s.amount,
          created_at: s.date
        }]);
      }
    }
  }

  // 4. ASEGURAR BALANCES EXACTOS EN CAJA
  console.log('\n4. Verificando saldos en caja...');
  await supabase.from('accounts').update({ balance: 60.00 }).eq('name', 'Efectivo Stephanie');
  await supabase.from('accounts').update({ balance: 1016.17 }).eq('name', 'Efectivo Sergio');
  await supabase.from('accounts').update({ balance: 1535.00 }).eq('name', 'Zelle');

  console.log('✅ Saldos finales en caja garantizados:');
  console.log(' - Efectivo Stephanie: $60.00');
  console.log(' - Efectivo Sergio: $1,016.17');
  console.log(' - Zelle: $1,535.00');
  console.log(' - Total en Caja: $2,611.17');

  console.log('\n🎉 ¡Sincronización completada con éxito!');
}

runSync().catch(console.error);
