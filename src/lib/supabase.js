import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Faltan variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==============================================================================
// OPERACIONES CON SUPABASE (DIRECTO DESDE .ENV)
// ==============================================================================

export async function fetchAppData() {
  const [whRes, prodRes, invRes, accRes, ordRes, ordItemsRes] = await Promise.all([
    supabase.from('warehouses').select('*').order('name'),
    supabase.from('products').select('*').order('name'),
    supabase.from('inventory').select('*'),
    supabase.from('accounts').select('*').order('name'),
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('order_items').select('*')
  ]);

  if (whRes.error) throw new Error(`Error en almacenes: ${whRes.error.message}`);
  if (prodRes.error) throw new Error(`Error en productos: ${prodRes.error.message}`);
  if (accRes.error) throw new Error(`Error en cuentas: ${accRes.error.message}`);

  return {
    warehouses: whRes.data || [],
    products: prodRes.data || [],
    inventory: invRes.data || [],
    accounts: accRes.data || [],
    orders: ordRes.data || [],
    orderItems: ordItemsRes.data || []
  };
}

// Registrar una nueva venta en Supabase
export async function createSaleTransaction({ customerName, accountId, items, notes, totalAmount }) {
  const orderNumber = `ETC-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();

  // 1. Crear Orden
  const { data: newOrder, error: orderErr } = await supabase
    .from('orders')
    .insert([{
      order_number: orderNumber,
      customer_name: customerName,
      account_id: accountId,
      total_amount: totalAmount,
      notes: notes || '',
      created_at: now
    }])
    .select()
    .single();

  if (orderErr) throw new Error(`Error al crear pedido: ${orderErr.message}`);

  // 2. Insertar items de orden
  const itemsToInsert = items.map(item => ({
    order_id: newOrder.id,
    product_id: item.productId,
    warehouse_id: item.warehouseId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    subtotal: item.subtotal
  }));

  const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
  if (itemsErr) throw new Error(`Error guardando artículos del pedido: ${itemsErr.message}`);

  // 3. Descontar inventario de cada almacén
  for (const item of items) {
    const { data: invRow } = await supabase
      .from('inventory')
      .select('stock')
      .eq('product_id', item.productId)
      .eq('warehouse_id', item.warehouseId)
      .maybeSingle();

    const currentStock = invRow?.stock || 0;
    const newStock = Math.max(0, currentStock - item.quantity);

    const { error: stockErr } = await supabase
      .from('inventory')
      .upsert({
        product_id: item.productId,
        warehouse_id: item.warehouseId,
        stock: newStock,
        updated_at: now
      }, { onConflict: 'product_id,warehouse_id' });

    if (stockErr) throw new Error(`Error actualizando stock: ${stockErr.message}`);
  }

  // 4. Sumar dinero a la cuenta seleccionada y registrar transacción
  if (accountId) {
    const { data: accRow } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    const newBalance = Number(accRow?.balance || 0) + Number(totalAmount);
    
    await supabase.from('accounts').update({ balance: newBalance }).eq('id', accountId);

    await supabase.from('account_transactions').insert([{
      account_id: accountId,
      type: 'sale',
      amount: totalAmount,
      order_id: newOrder.id,
      notes: `Venta #${orderNumber} a ${customerName}`
    }]);
  }

  return { success: true, order: newOrder };
}

// Ajustar stock directamente
export async function updateProductStock(productId, warehouseId, newStock) {
  const qty = Math.max(0, parseInt(newStock) || 0);
  const { error } = await supabase
    .from('inventory')
    .upsert({
      product_id: productId,
      warehouse_id: warehouseId,
      stock: qty,
      updated_at: new Date().toISOString()
    }, { onConflict: 'product_id,warehouse_id' });

  if (error) throw new Error(`Error al actualizar stock: ${error.message}`);
  return { success: true };
}

// Transferir stock entre almacenes
export async function transferStock({ productId, fromWarehouseId, toWarehouseId, quantity }) {
  const qty = parseInt(quantity) || 0;
  if (qty <= 0) return { success: false, error: 'Cantidad inválida' };

  // 1. Verificar y restar en Origen
  const { data: fromRow } = await supabase
    .from('inventory')
    .select('stock')
    .eq('product_id', productId)
    .eq('warehouse_id', fromWarehouseId)
    .single();
  
  const currentFrom = fromRow?.stock || 0;
  if (currentFrom < qty) {
    return { success: false, error: 'Stock insuficiente en el almacén de origen' };
  }

  const { error: fromErr } = await supabase
    .from('inventory')
    .update({ stock: currentFrom - qty, updated_at: new Date().toISOString() })
    .eq('product_id', productId)
    .eq('warehouse_id', fromWarehouseId);

  if (fromErr) throw fromErr;

  // 2. Sumar en Destino
  const { data: toRow } = await supabase
    .from('inventory')
    .select('stock')
    .eq('product_id', productId)
    .eq('warehouse_id', toWarehouseId)
    .maybeSingle();

  const currentTo = toRow?.stock || 0;
  const { error: toErr } = await supabase
    .from('inventory')
    .upsert({
      product_id: productId,
      warehouse_id: toWarehouseId,
      stock: currentTo + qty,
      updated_at: new Date().toISOString()
    }, { onConflict: 'product_id,warehouse_id' });

  if (toErr) throw toErr;

  return { success: true };
}

// Guardar/Crear Almacén
export async function saveWarehouse(whData) {
  const { data, error } = await supabase.from('warehouses').upsert(whData).select().single();
  if (error) throw error;
  return { success: true, data };
}

// Guardar/Crear Cuenta Financiera
export async function saveAccount(accData) {
  const { data, error } = await supabase.from('accounts').upsert(accData).select().single();
  if (error) throw error;
  return { success: true, data };
}

// Crear/Editar Producto
export async function saveProduct(prodData) {
  const { data, error } = await supabase.from('products').upsert(prodData).select().single();
  if (error) throw error;
  return { success: true, data };
}
