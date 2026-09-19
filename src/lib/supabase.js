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
  const [whRes, prodRes, invRes, accRes, ordRes, ordItemsRes, txRes] = await Promise.all([
    supabase.from('warehouses').select('*').order('name'),
    supabase.from('products').select('*').order('name'),
    supabase.from('inventory').select('*'),
    supabase.from('accounts').select('*').order('name'),
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('order_items').select('*'),
    supabase.from('account_transactions').select('*').order('created_at', { ascending: false })
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
    orderItems: ordItemsRes.data || [],
    transactions: txRes.data || []
  };
}


// Eliminar un movimiento individual de account_transactions
export async function deleteTransaction(transactionId) {
  const { error } = await supabase
    .from('account_transactions')
    .delete()
    .eq('id', transactionId);
  if (error) throw new Error(`Error al eliminar movimiento: ${error.message}`);
  return { success: true };
}


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

export async function updateSaleTransaction(orderId, { customerName, accountId, items, notes, totalAmount }) {
  // 1. Fetch old order and items
  const { data: oldOrder } = await supabase.from('orders').select('*').eq('id', orderId).single();
  const { data: oldItems } = await supabase.from('order_items').select('*').eq('order_id', orderId);

  // 2. Revert old inventory
  if (oldItems && oldItems.length > 0) {
    for (const item of oldItems) {
      const { data: invRow } = await supabase.from('inventory')
        .select('stock').eq('product_id', item.product_id).eq('warehouse_id', item.warehouse_id).maybeSingle();
      const currentStock = invRow?.stock || 0;
      await supabase.from('inventory').upsert({
        product_id: item.product_id,
        warehouse_id: item.warehouse_id,
        stock: currentStock + item.quantity,
        updated_at: new Date().toISOString()
      }, { onConflict: 'product_id,warehouse_id' });
    }
  }

  // 3. Revert old account balance
  if (oldOrder.account_id && oldOrder.total_amount) {
    const { data: accRow } = await supabase.from('accounts')
      .select('balance').eq('id', oldOrder.account_id).maybeSingle();
    if (accRow) {
      const revertedBalance = Math.max(0, Number(accRow.balance) - Number(oldOrder.total_amount));
      await supabase.from('accounts').update({ balance: revertedBalance }).eq('id', oldOrder.account_id);
    }
  }

  // 4. Delete old transactions and items
  await supabase.from('account_transactions').delete().eq('order_id', orderId);
  await supabase.from('order_items').delete().eq('order_id', orderId);

  // 5. Update Order
  const { data: updatedOrder, error: orderErr } = await supabase.from('orders').update({
    customer_name: customerName,
    account_id: accountId,
    total_amount: totalAmount,
    notes: notes || '',
  }).eq('id', orderId).select().single();

  if (orderErr) throw new Error(`Error al actualizar pedido: ${orderErr.message}`);

  // 6. Insert new items
  const itemsToInsert = items.map(item => ({
    order_id: orderId,
    product_id: item.productId,
    warehouse_id: item.warehouseId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    subtotal: item.subtotal
  }));
  await supabase.from('order_items').insert(itemsToInsert);

  // 7. Deduct new inventory
  for (const item of items) {
    const { data: invRow } = await supabase.from('inventory')
      .select('stock').eq('product_id', item.productId).eq('warehouse_id', item.warehouseId).maybeSingle();
    const currentStock = invRow?.stock || 0;
    const newStock = Math.max(0, currentStock - item.quantity);
    await supabase.from('inventory').upsert({
      product_id: item.productId,
      warehouse_id: item.warehouseId,
      stock: newStock,
      updated_at: new Date().toISOString()
    }, { onConflict: 'product_id,warehouse_id' });
  }

  // 8. Add to new account balance and insert new transaction
  if (accountId) {
    const { data: accRow } = await supabase.from('accounts')
      .select('balance').eq('id', accountId).single();
    const newBalance = Number(accRow?.balance || 0) + Number(totalAmount);
    await supabase.from('accounts').update({ balance: newBalance }).eq('id', accountId);

    await supabase.from('account_transactions').insert([{
      account_id: accountId,
      type: 'sale',
      amount: totalAmount,
      order_id: orderId,
      notes: `Venta #${updatedOrder.order_number} a ${customerName}`
    }]);
  }

  return { success: true, order: updatedOrder };
}

export async function deleteSaleTransaction(orderId) {
  // 1. Fetch order details
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!order) throw new Error('Pedido no encontrado');

  // 2. Fetch order items
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  // 3. Revert inventory
  if (items && items.length > 0) {
    for (const item of items) {
      const { data: invRow } = await supabase
        .from('inventory')
        .select('stock')
        .eq('product_id', item.product_id)
        .eq('warehouse_id', item.warehouse_id)
        .maybeSingle();

      const currentStock = invRow?.stock || 0;
      await supabase
        .from('inventory')
        .upsert({
          product_id: item.product_id,
          warehouse_id: item.warehouse_id,
          stock: currentStock + item.quantity,
          updated_at: new Date().toISOString()
        }, { onConflict: 'product_id,warehouse_id' });
    }
  }

  // 4. Revert account balance
  if (order.account_id && order.total_amount) {
    const { data: accRow } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', order.account_id)
      .maybeSingle();

    if (accRow) {
      const newBalance = Math.max(0, Number(accRow.balance) - Number(order.total_amount));
      await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', order.account_id);
    }
  }

  // 5. Delete transactions, items, and order
  await supabase.from('account_transactions').delete().eq('order_id', orderId);
  await supabase.from('order_items').delete().eq('order_id', orderId);
  await supabase.from('orders').delete().eq('id', orderId);

  return { success: true };
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

// Eliminar Cuenta Financiera
export async function deleteAccount(accountId) {
  // Primero eliminar transacciones asociadas
  await supabase.from('account_transactions').delete().eq('account_id', accountId);
  const { error } = await supabase.from('accounts').delete().eq('id', accountId);
  if (error) throw new Error(`Error al eliminar cuenta: ${error.message}`);
  return { success: true };
}

// Ajustar saldo de una cuenta (registrado como movimiento)
// type: 'deposit' (ingreso) | 'withdrawal' (egreso)
export async function adjustAccountBalance(accountId, amount, type, notes) {
  const absAmount = Math.abs(parseFloat(amount) || 0);
  if (absAmount === 0) return { success: false, error: 'El monto debe ser mayor a 0' };

  // Obtener saldo actual
  const { data: accRow, error: fetchErr } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', accountId)
    .single();
  if (fetchErr) throw fetchErr;

  const currentBalance = Number(accRow.balance) || 0;
  const newBalance = type === 'deposit'
    ? currentBalance + absAmount
    : Math.max(0, currentBalance - absAmount);

  // Actualizar balance
  const { error: updateErr } = await supabase
    .from('accounts')
    .update({ balance: newBalance })
    .eq('id', accountId);
  if (updateErr) throw updateErr;

  // Registrar movimiento
  const txAmount = type === 'deposit' ? absAmount : -absAmount;
  const { error: txErr } = await supabase.from('account_transactions').insert([{
    account_id: accountId,
    type: type === 'deposit' ? 'deposit' : 'withdrawal',
    amount: txAmount,
    notes: notes || (type === 'deposit' ? 'Ingreso manual' : 'Egreso manual'),
    created_at: new Date().toISOString()
  }]);
  if (txErr) throw txErr;

  return { success: true, newBalance };
}

// Transferir dinero entre cuentas
export async function transferBetweenAccounts({ fromAccountId, toAccountId, amount, notes }) {
  const absAmount = Math.abs(parseFloat(amount) || 0);
  if (absAmount === 0) return { success: false, error: 'El monto debe ser mayor a 0' };
  if (fromAccountId === toAccountId) return { success: false, error: 'Las cuentas deben ser diferentes' };

  // Obtener saldos actuales
  const { data: accounts, error: fetchErr } = await supabase
    .from('accounts')
    .select('id, name, balance')
    .in('id', [fromAccountId, toAccountId]);
  if (fetchErr) throw fetchErr;

  const fromAcc = accounts.find(a => a.id === fromAccountId);
  const toAcc   = accounts.find(a => a.id === toAccountId);

  if (!fromAcc || !toAcc) return { success: false, error: 'Cuenta no encontrada' };
  if (Number(fromAcc.balance) < absAmount) {
    return { success: false, error: `Saldo insuficiente en ${fromAcc.name} ($${fromAcc.balance})` };
  }

  const now = new Date().toISOString();
  const txNote = notes || `Transferencia de ${fromAcc.name} a ${toAcc.name}`;

  // Restar del origen
  await supabase
    .from('accounts')
    .update({ balance: Number(fromAcc.balance) - absAmount })
    .eq('id', fromAccountId);

  // Sumar al destino
  await supabase
    .from('accounts')
    .update({ balance: Number(toAcc.balance) + absAmount })
    .eq('id', toAccountId);

  // Registrar ambas transacciones
  await supabase.from('account_transactions').insert([
    {
      account_id: fromAccountId,
      type: 'transfer',
      amount: -absAmount,
      notes: `${txNote} (salida)`,
      created_at: now
    },
    {
      account_id: toAccountId,
      type: 'transfer',
      amount: absAmount,
      notes: `${txNote} (entrada)`,
      created_at: now
    }
  ]);

  return { success: true };
}

// Crear/Editar Producto
export async function saveProduct(prodData) {
  const { data, error } = await supabase.from('products').upsert(prodData).select().single();
  if (error) throw error;
  return { success: true, data };
}

