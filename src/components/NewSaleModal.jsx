import confetti from 'canvas-confetti';
import { ArrowRight, CheckCircle2, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useState } from 'react';

export default function NewSaleModal({ 
  isOpen, 
  onClose, 
  products = [], 
  warehouses = [], 
  inventory = [], 
  accounts = [], 
  onSubmitSale,
  initialOrder = null,
  initialItems = []
}) {
  if (!isOpen) return null;

  const isEditMode = !!initialOrder;

  // Form State
  const [customerName, setCustomerName] = useState(initialOrder ? initialOrder.customer_name : '');
  const [selectedAccountId, setSelectedAccountId] = useState(initialOrder ? initialOrder.account_id : (accounts[0]?.id || ''));
  const [notes, setNotes] = useState(initialOrder ? (initialOrder.notes || '') : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  // Line items state
  const [items, setItems] = useState(() => {
    if (isEditMode && initialItems.length > 0) {
      return initialItems.map(item => ({
        productId: item.product_id,
        warehouseId: item.warehouse_id,
        quantity: item.quantity,
        unitPrice: item.unit_price
      }));
    }
    return [{
      productId: products[0]?.id || '',
      warehouseId: warehouses[0]?.id || '',
      quantity: 1,
      unitPrice: products[0]?.default_price || 120
    }];
  });

  // Helper para obtener el stock disponible de un producto en un almacén
  const getAvailableStock = (prodId, whId) => {
    const inv = inventory.find(i => i.product_id === prodId && i.warehouse_id === whId);
    return inv ? inv.stock : 0;
  };

  // Añadir otra línea de producto al pedido
  const handleAddItem = () => {
    const firstProd = products[0];
    const firstWh = warehouses[0];
    setItems(prev => [
      ...prev,
      {
        productId: firstProd?.id || '',
        warehouseId: firstWh?.id || '',
        quantity: 1,
        unitPrice: firstProd?.default_price || 120
      }
    ]);
  };

  // Eliminar línea de producto
  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Modificar línea de producto
  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'productId') {
        item.productId = value;
        const prod = products.find(p => p.id === value);
        if (prod) {
          item.unitPrice = prod.default_price;
        }
      } else if (field === 'warehouseId') {
        item.warehouseId = value;
      } else if (field === 'quantity') {
        item.quantity = Math.max(1, parseInt(value) || 1);
      } else if (field === 'unitPrice') {
        item.unitPrice = Math.max(0, parseFloat(value) || 0);
      }

      updated[index] = item;
      return updated;
    });
  };

  // Calcular totales
  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Por favor introduce el nombre del cliente');
      return;
    }

    if (!selectedAccountId) {
      alert('Por favor selecciona la cuenta donde entró el dinero');
      return;
    }

    // Validar stock disponible (ignorar stock del pedido actual en modo edición para no bloquearlo erróneamente, aunque idealmente deberíamos descontar la cantidad original)
    for (const item of items) {
      // In edit mode, item.quantity could be higher than available stock, but the item itself might be returning some stock.
      // We will do a simple check. If they increase quantity beyond available + original, it will trigger the warning.
      // To keep it simple, we just use the warning.
      let avail = getAvailableStock(item.productId, item.warehouseId);
      if (isEditMode) {
        const originalItem = initialItems.find(i => i.product_id === item.productId && i.warehouse_id === item.warehouseId);
        if (originalItem) {
          avail += originalItem.quantity;
        }
      }
      
      const prod = products.find(p => p.id === item.productId);
      const wh = warehouses.find(w => w.id === item.warehouseId);
      if (item.quantity > avail) {
        const confirmOver = window.confirm(
          `Atención: Solo hay ${avail} unidad(es) de "${prod?.name || 'producto'}" en ${wh?.name || 'este almacén'}. ¿Deseas registrar la venta de ${item.quantity} de todos modos?`
        );
        if (!confirmOver) return;
      }
    }

    setIsSubmitting(true);
    try {
      const lineItems = items.map(item => ({
        productId: item.productId,
        warehouseId: item.warehouseId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice
      }));

      let result;
      if (isEditMode) {
        result = await onSubmitSale(initialOrder.id, {
          customerName: customerName.trim(),
          accountId: selectedAccountId,
          items: lineItems,
          notes: notes.trim(),
          totalAmount
        });
      } else {
        result = await onSubmitSale({
          customerName: customerName.trim(),
          accountId: selectedAccountId,
          items: lineItems,
          notes: notes.trim(),
          totalAmount
        });
      }

      if (result?.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setSuccessOrder(result.order);
      }
    } catch (err) {
      alert('Error registrando la venta: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccessOrder(null);
    setCustomerName('');
    setNotes('');
    setItems([{
      productId: products[0]?.id || '',
      warehouseId: warehouses[0]?.id || '',
      quantity: 1,
      unitPrice: products[0]?.default_price || 120
    }]);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"></div>

        {/* Encabezado */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--bg-card-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-gold)'
            }}>
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 className="modal-title">{isEditMode ? 'Editar venta' : 'Registrar nueva venta'}</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isEditMode ? 'Modifica los detalles del pedido' : 'Descuento en tiempo real y abono a cuenta'}
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {/* Si la venta fue exitosa */}
        {successOrder ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '36px 24px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--court-green-light)',
              color: 'var(--court-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{isEditMode ? '¡Venta Actualizada con Éxito!' : '¡Venta Registrada con Éxito!'}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Pedido <strong>#{successOrder.order_number}</strong> para <strong>{successOrder.customer_name}</strong> por un total de <strong>${Number(successOrder.total_amount).toFixed(2)}</strong>.
            </p>
            <div style={{
              background: 'var(--bg-card-subtle)',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '24px',
              fontSize: '0.85rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cuenta Acreditada:</span>
                <strong>{accounts.find(a => a.id === successOrder.account_id)?.name || 'Cuenta'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Productos Descontados:</span>
                <strong>{items.length} artículo(s)</strong>
              </div>
              {successOrder.notes && (
                <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '6px', marginTop: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Comentario: </span>
                  <em>"{successOrder.notes}"</em>
                </div>
              )}
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleClose}>
              Aceptar y Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <div className="modal-body">
              {/* 1. Cliente */}
              <div className="form-group">
                <label className="form-label">Nombre del cliente *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Valeria Mendoza / Club Altamira"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* 2. Lista de Productos del Pedido */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label">Artículos del pedido ({items.length}) *</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-gold-hover)',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={14} /> Añadir otro artículo
                  </button>
                </div>

                <div className="order-items-list">
                  {items.map((item, index) => {
                    const currentProd = products.find(p => p.id === item.productId);
                    const stockTony = getAvailableStock(item.productId, warehouses[0]?.id);
                    const stockSergio = getAvailableStock(item.productId, warehouses[1]?.id);
                    const selectedWhStock = getAvailableStock(item.productId, item.warehouseId);

                    return (
                      <div key={index} className="order-item-row">
                        <div className="order-item-top">
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                            Artículo #{index + 1}
                          </span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--alert-red)',
                                cursor: 'pointer',
                                padding: '2px'
                              }}
                              title="Eliminar artículo"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                        {/* Selector de Producto */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {currentProd?.image_url && (
                            <img 
                              src={currentProd.image_url} 
                              alt="" 
                              style={{ width: '40px', height: '40px', objectFit: 'contain', background: '#FFFFFF', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-subtle)' }} 
                            />
                          )}
                          <select
                            className="form-select"
                            value={item.productId}
                            onChange={e => handleItemChange(index, 'productId', e.target.value)}
                            style={{ flex: 1 }}
                          >
                            {products.map(prod => (
                              <option key={prod.id} value={prod.id}>
                                {prod.name} (${prod.default_price})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Almacén de Descuento + Cantidad + Precio Unitario */}
                        <div className="order-item-controls">
                          {/* Almacén */}
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                              Almacén (Stock: {selectedWhStock})
                            </span>
                            <select
                              className="form-select"
                              value={item.warehouseId}
                              onChange={e => handleItemChange(index, 'warehouseId', e.target.value)}
                              style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                            >
                              {warehouses.map(wh => (
                                <option key={wh.id} value={wh.id}>
                                  {wh.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Cantidad */}
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                              Cantidad
                            </span>
                            <input
                              type="number"
                              min="1"
                              className="form-input"
                              value={item.quantity}
                              onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                              style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                            />
                          </div>

                          {/* Precio Venta Unitario */}
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                              Precio ($)
                            </span>
                            <input
                              type="number"
                              step="0.5"
                              className="form-input"
                              value={item.unitPrice}
                              onChange={e => handleItemChange(index, 'unitPrice', e.target.value)}
                              style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                            />
                          </div>

                          {/* Subtotal Línea */}
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                              Subtotal
                            </span>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                              ${(item.quantity * item.unitPrice).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Cuenta Receptora del Dinero */}
              <div className="form-group">
                <label className="form-label">¿A qué cuenta entró el dinero? *</label>
                <select
                  className="form-select"
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  required
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Saldo actual: ${Number(acc.balance || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Comentarios / Notas de la Compra */}
              <div className="form-group">
                <label className="form-label">Comentarios o notas de la compra</label>
                <textarea
                  className="form-textarea"
                  placeholder="Ej. Pagó en efectivo contra entrega / Se coordinó envío a Caracas / Descuento cortesía cliente frecuente..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Footer con Resumen Total y Botón de Cobro */}
            <div className="modal-footer">
              <div style={{ marginRight: 'auto' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', display: 'block' }}>
                  Total a Cobrar
                </span>
                <span style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  ${totalAmount.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn-gold"
                disabled={isSubmitting}
                style={{ minWidth: '160px' }}
              >
                {isSubmitting ? 'Procesando...' : (
                  <>
                    <span>{isEditMode ? 'Guardar cambios' : 'Confirmar venta'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
