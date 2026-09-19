import { Building2, Calendar, CreditCard, Edit2, MessageSquare, Receipt, Search, Trash, User } from 'lucide-react';
import { useState } from 'react';
import NewSaleModal from './NewSaleModal';

export default function SalesHistoryView({ 
  orders = [], 
  orderItems = [], 
  products = [], 
  warehouses = [], 
  accounts = [],
  inventory = [],
  onDeleteOrder,
  onUpdateOrder
}) {
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  const handleEditClick = (order) => {
    setEditingOrder(order);
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta venta? Esta acción devolverá el stock al inventario y restará el saldo a la cuenta.')) return;
    
    setDeletingId(orderId);
    try {
      if (onDeleteOrder) await onDeleteOrder(orderId);
    } catch (err) {
      alert(err.message || 'Error al eliminar venta');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase();
    const customer = (o.customer_name || '').toLowerCase();
    const orderNum = (o.order_number || '').toLowerCase();
    const notes = (o.notes || '').toLowerCase();
    return customer.includes(q) || orderNum.includes(q) || notes.includes(q);
  });

  const getAccountName = (accId) => {
    return accounts.find(a => a.id === accId)?.name || 'Cuenta no especificada';
  };

  const getWarehouseName = (whId) => {
    return warehouses.find(w => w.id === whId)?.name || 'Almacén';
  };

  const getProductName = (prodId) => {
    return products.find(p => p.id === prodId)?.name || 'Bolso';
  };

  const getProductImage = (prodId) => {
    return products.find(p => p.id === prodId)?.image_url || '/assets/classic-blue.png';
  };

  return (
    <div>
      {/* Header & Search */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Historial de ventas</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Registro detallado de salidas por almacén, cliente y cuenta receptora
          </p>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por cliente, pedido o nota..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', borderRadius: 'var(--radius-full)' }}
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-medium)'
        }}>
          <Receipt size={40} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>No hay ventas registradas aún</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            Registra tu primera venta usando el botón superior o el botón "+" inferior.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredOrders.map(order => {
            const items = orderItems.filter(oi => oi.order_id === order.id);
            const dateStr = new Date(order.created_at).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={order.id} className="card" style={{ padding: '18px' }}>
                {/* Top Info: Order ID, Date, Amount */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-dark">#{order.order_number}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      {dateStr}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-dark)' }}>
                      ${Number(order.total_amount).toFixed(2)}
                    </span>
                    <button 
                      onClick={() => handleEditClick(order)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px'
                      }}
                      title="Editar venta"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(order.id)}
                      disabled={deletingId === order.id}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: deletingId === order.id ? 'var(--text-muted)' : 'var(--danger, #ef4444)',
                        cursor: deletingId === order.id ? 'not-allowed' : 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px'
                      }}
                      title="Eliminar Venta"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>

                {/* Customer & Account Details */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  background: 'var(--bg-card-subtle)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={15} style={{ color: 'var(--accent-gold)' }} />
                    <span style={{ color: 'var(--text-muted)' }}>Cliente:</span>
                    <strong>{order.customer_name}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={15} style={{ color: 'var(--court-green)' }} />
                    <span style={{ color: 'var(--text-muted)' }}>Ingresó a:</span>
                    <strong>{getAccountName(order.account_id)}</strong>
                  </div>
                </div>

                {/* Purchased Items & Warehouses */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: '700' }}>
                    Artículos Descontados ({items.length})
                  </span>
                  
                  {items.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: '#FFFFFF',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.84rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img 
                          src={getProductImage(item.product_id)} 
                          alt="" 
                          style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
                        />
                        <div>
                          <strong>{item.quantity}x {getProductName(item.product_id)}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Building2 size={12} />
                            Descontado de: <strong style={{ color: 'var(--accent-dark)' }}>{getWarehouseName(item.warehouse_id)}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '600' }}>${Number(item.subtotal || item.unit_price * item.quantity).toFixed(2)}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(${Number(item.unit_price).toFixed(2)} c/u)</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes / Comments */}
                {order.notes && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'var(--bg-app)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <MessageSquare size={14} style={{ marginTop: '3px', flexShrink: 0, color: 'var(--text-muted)' }} />
                    <div>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Comentario: </span>
                      {order.notes}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Edición de Venta */}
      <NewSaleModal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        products={products}
        warehouses={warehouses}
        inventory={inventory}
        accounts={accounts}
        initialOrder={editingOrder}
        initialItems={editingOrder ? orderItems.filter(oi => oi.order_id === editingOrder.id) : []}
        onSubmitSale={async (orderId, data) => {
          if (onUpdateOrder) {
            await onUpdateOrder(orderId, data);
            return { success: true, order: { ...data, order_number: editingOrder.order_number } };
          }
        }}
      />
    </div>
  );
}
