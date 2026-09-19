import { Building2, MapPin, Plus } from 'lucide-react';
import { useState } from 'react';

export default function WarehousesView({ 
  warehouses = [], 
  inventory = [], 
  products = [], 
  onSaveWarehouse 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSaveWarehouse({
      name: name.trim(),
      address: address.trim()
    });
    setName('');
    setAddress('');
    setIsAdding(false);
  };

  return (
    <div>
      {/* Header & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: '1 1 200px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Gestión de almacenes</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Administra tus sedes de inventario (Casa Tony, Casa Sergio y nuevos almacenes)
          </p>
        </div>
        <button className="btn-secondary" onClick={() => setIsAdding(true)}>
          <Plus size={15} />
          <span>Añadir almacén</span>
        </button>
      </div>

      {/* Warehouses Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {warehouses.map(wh => {
          const whInventory = inventory.filter(i => i.warehouse_id === wh.id);
          const totalUnits = whInventory.reduce((s, i) => s + (i.stock || 0), 0);
          const activeProductsCount = whInventory.filter(i => i.stock > 0).length;

          const isTony = wh.name.toLowerCase().includes('tony');
          const isSergio = wh.name.toLowerCase().includes('sergio');

          return (
            <div key={wh.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-sm)',
                    background: isTony ? 'var(--court-green-light)' : (isSergio ? 'var(--accent-gold-light)' : 'var(--bg-card-subtle)'),
                    color: isTony ? 'var(--court-green)' : (isSergio ? 'var(--accent-gold-hover)' : 'var(--accent-dark)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>{wh.name}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={12} />
                      {wh.address || 'Sin dirección asignada'}
                    </div>
                  </div>
                </div>

                <span className="badge badge-green">Activo</span>
              </div>

              {/* Warehouse Metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                background: 'var(--bg-card-subtle)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bolsos en Stock</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {totalUnits} <span style={{ fontSize: '0.8rem', fontWeight: '400', color: 'var(--text-muted)' }}>unid.</span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Modelos con Stock</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {activeProductsCount} <span style={{ fontSize: '0.8rem', fontWeight: '400', color: 'var(--text-muted)' }}>/ {products.length}</span>
                  </div>
                </div>
              </div>

              {/* Top models in this warehouse */}
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                  Modelos almacenados aquí
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                  {whInventory.filter(i => i.stock > 0).map(invItem => {
                    const prod = products.find(p => p.id === invItem.product_id);
                    if (!prod) return null;
                    return (
                      <div key={invItem.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '3px 0' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{prod.name}</span>
                        <strong>{invItem.stock} unid.</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Crear Almacén */}
      {isAdding && (
        <div className="modal-overlay" onClick={() => setIsAdding(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="sheet-handle"></div>
            <div className="modal-header">
              <h2 className="modal-title">Añadir Nuevo Almacén</h2>
              <button className="modal-close-btn" onClick={() => setIsAdding(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateWarehouse} style={{ display: 'contents' }}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre del Almacén *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Casa Tony, Casa Sergio, Showroom..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required/>
                </div>
                <div className="form-group">
                  <label className="form-label">Ubicación / Notas</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Caracas Este, Habitación 2..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Almacén</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
