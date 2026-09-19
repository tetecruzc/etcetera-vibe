import { ArrowLeftRight, Edit3, Filter, Layers, MapPin, Package, Search, X } from 'lucide-react';
import { useState } from 'react';

export default function InventoryView({
  products = [],
  warehouses = [],
  inventory = [],
  onUpdateStock,
  onTransferStock,
  onOpenNewProduct,
  onOpenNewSale
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modal states for Quick Stock Adjust & Transfer
  const [editingProduct, setEditingProduct] = useState(null);
  const [transferringProduct, setTransferringProduct] = useState(null);

  // Helper stock
  const getProductStock = (prodId, whId) => {
    if (whId) {
      const row = inventory.find(i => i.product_id === prodId && i.warehouse_id === whId);
      return row ? row.stock : 0;
    }
    // Sum across all warehouses
    return inventory
      .filter(i => i.product_id === prodId)
      .reduce((sum, item) => sum + item.stock, 0);
  };

  // Metrics
  const tonyWh = warehouses.find(w => w.name.toLowerCase().includes('tony'));
  const sergioWh = warehouses.find(w => w.name.toLowerCase().includes('sergio'));

  const totalStockAll = inventory.reduce((sum, item) => sum + (item.stock || 0), 0);
  const totalStockTony = tonyWh ? inventory.filter(i => i.warehouse_id === tonyWh.id).reduce((s, i) => s + i.stock, 0) : 0;
  const totalStockSergio = sergioWh ? inventory.filter(i => i.warehouse_id === sergioWh.id).reduce((s, i) => s + i.stock, 0) : 0;

  const totalInventoryValue = products.reduce((sum, prod) => {
    const stock = getProductStock(prod.id);
    return sum + (stock * (prod.default_price || 0));
  }, 0);

  // Filtered Products
  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.sku && prod.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCat = selectedCategory === 'ALL' || prod.category === selectedCategory;

    let matchesWh = true;
    if (selectedWarehouseFilter !== 'ALL') {
      matchesWh = getProductStock(prod.id, selectedWarehouseFilter) > 0;
    }

    return matchesSearch && matchesCat && matchesWh;
  });

  return (
    <div>
      {/* Top Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card accent-dark">
          <div className="stat-header">
            <span className="stat-label">Stock Total</span>
            <div className="stat-icon-badge">
              <Package size={15} />
            </div>
          </div>
          <div className="stat-value">{totalStockAll} <span style={{ fontSize: '0.9rem', fontWeight: '400', color: 'var(--text-muted)' }}>unid.</span></div>
        </div>

        <div className="stat-card accent-green">
          <div className="stat-header">
            <span className="stat-label">Casa Tony</span>
            <div className="stat-icon-badge" style={{ color: 'var(--court-green)' }}>
              <MapPin size={15} />
            </div>
          </div>
          <div className="stat-value">{totalStockTony} <span style={{ fontSize: '0.9rem', fontWeight: '400', color: 'var(--text-muted)' }}>unid.</span></div>
        </div>

        <div className="stat-card accent-gold">
          <div className="stat-header">
            <span className="stat-label">Casa Sergio</span>
            <div className="stat-icon-badge" style={{ color: 'var(--accent-gold-hover)' }}>
              <MapPin size={15} />
            </div>
          </div>
          <div className="stat-value">{totalStockSergio} <span style={{ fontSize: '0.9rem', fontWeight: '400', color: 'var(--text-muted)' }}>unid.</span></div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">
              <span className="hide-on-mobile">Valor Catálogo</span>
              <span className="show-on-mobile">$ Catálogo</span>
            </span>
            <div className="stat-icon-badge">
              <Layers size={15} />
            </div>
          </div>
          <div className="stat-value">${totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '400px', display: 'flex', gap: '8px' }}>
          <button 
            className="btn-secondary flex-on-mobile"
            onClick={() => setIsMobileFilterOpen(true)}
            style={{ padding: '0 12px', borderRadius: 'var(--radius-full)' }}
          >
            <Filter size={18} />
          </button>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por bolso o SKU..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', borderRadius: 'var(--radius-full)', width: '100%' }}
            />
          </div>
        </div>

        {/* Warehouse Filter Dropdown */}
        <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            className="form-select"
            value={selectedWarehouseFilter}
            onChange={e => setSelectedWarehouseFilter(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.85rem' }}
          >
            <option value="ALL">📍 Todos los Almacenes</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                📍 Solo {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="hide-on-mobile" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
        <button
          className={`badge ${selectedCategory === 'ALL' ? 'badge-dark' : 'badge-gold'}`}
          onClick={() => setSelectedCategory('ALL')}
          style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '0.8rem', border: 'none' }}
        >
          Todos ({products.length})
        </button>
        <button
          className={`badge ${selectedCategory === 'Bolsos de Tenis' ? 'badge-dark' : 'badge-gold'}`}
          onClick={() => setSelectedCategory('Bolsos de Tenis')}
          style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '0.8rem', border: 'none' }}
        >
          Bolsos de Tenis
        </button>
        <button
          className={`badge ${selectedCategory === 'Bolsos de Pickleball' ? 'badge-dark' : 'badge-gold'}`}
          onClick={() => setSelectedCategory('Bolsos de Pickleball')}
          style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '0.8rem', border: 'none' }}
        >
          Bolsos de Pickleball
        </button>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-medium)' }}>
          <Package size={40} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No se encontraron bolsos</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Intenta ajustar tus filtros de búsqueda o almacén.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => {
            const totalStock = getProductStock(product.id);
            const stockTony = getProductStock(product.id, tonyWh?.id);
            const stockSergio = getProductStock(product.id, sergioWh?.id);

            let stockStatusClass = 'stock-in';
            if (totalStock === 0) stockStatusClass = 'stock-out';
            else if (totalStock <= 2) stockStatusClass = 'stock-low';

            return (
              <div key={product.id} className="product-card">
                {/* Product Image */}
                <div className="product-img-box">
                  <img
                    src={product.image_url || '/assets/classic-blue.png'}
                    alt={product.name}
                    className="product-img"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/classic-blue.png';
                    }}
                  />
                  <span className={`product-stock-tag ${stockStatusClass}`}>
                    {totalStock === 0 ? 'Agotado' : `${totalStock} en stock`}
                  </span>
                </div>

                {/* Product Details */}
                <div className="product-info">
                  <h3 className="product-title">{product.name}</h3>
                  <span className="product-sku">{product.sku}</span>

                  {/* Stock Breakdown per Warehouse */}
                  <div className="stock-breakdown" style={{ padding: '6px 8px', gap: '2px', marginTop: '4px' }}>
                    <div className="warehouse-stock-line">
                      <span className="warehouse-name-label">
                        <span className="warehouse-dot dot-tony"></span>
                        Casa Tony
                      </span>
                      <strong style={{ color: stockTony > 0 ? 'var(--text-primary)' : 'var(--alert-red)' }}>
                        {stockTony} <span className="hide-on-mobile">unid.</span>
                      </strong>
                    </div>
                    <div className="warehouse-stock-line">
                      <span className="warehouse-name-label">
                        <span className="warehouse-dot dot-sergio"></span>
                        Casa Sergio
                      </span>
                      <strong style={{ color: stockSergio > 0 ? 'var(--text-primary)' : 'var(--alert-red)' }}>
                        {stockSergio} <span className="hide-on-mobile">unid.</span>
                      </strong>
                    </div>
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="product-price-row" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: '8px', paddingTop: '8px' }}>
                    <div>
                      <span className="hide-on-mobile" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>PVP Sugerido</span>
                      <span className="product-price">${Number(product.default_price).toFixed(2)}</span>
                    </div>

                    <div className="hide-on-mobile" style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="modal-close-btn"
                        style={{ width: '32px', height: '32px' }}
                        title="Transferir entre almacenes"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTransferringProduct(product);
                        }}
                      >
                        <ArrowLeftRight size={14} />
                      </button>
                      <button
                        className="modal-close-btn"
                        style={{ width: '32px', height: '32px' }}
                        title="Ajustar stock de este bolso"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct(product);
                        }}
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons Mobile */}
                  <div className="flex-on-mobile" style={{ gap: '1px', marginTop: '8px', overflow: 'hidden', borderRadius: 'var(--radius-sm)' }}>
                    <button
                      style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', padding: '6px', fontSize: '0.75rem', justifyContent: 'center', minHeight: '32px', border: 'none', background: 'var(--bg-card-subtle)', color: 'var(--text-secondary)', borderRadius: '0' }}
                      title="Transferir entre almacenes"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTransferringProduct(product);
                      }}
                    >
                      <ArrowLeftRight size={13} />
                      <span>Mover</span>
                    </button>
                    <button
                      style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', padding: '6px', fontSize: '0.75rem', justifyContent: 'center', minHeight: '32px', border: 'none', background: 'var(--bg-card-subtle)', color: 'var(--text-secondary)', borderRadius: '0' }}
                      title="Ajustar stock de este bolso"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProduct(product);
                      }}
                    >
                      <Edit3 size={13} />
                      <span>Ajustar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Ajustar Stock */}
      {editingProduct && (
        <StockAdjustModal
          product={editingProduct}
          warehouses={warehouses}
          inventory={inventory}
          onClose={() => setEditingProduct(null)}
          onSave={async (whId, newStock) => {
            await onUpdateStock(editingProduct.id, whId, newStock);
            setEditingProduct(null);
          }}
        />
      )}

      {/* MODAL: Transferir Stock entre Almacenes */}
      {transferringProduct && (
        <StockTransferModal
          product={transferringProduct}
          warehouses={warehouses}
          inventory={inventory}
          onClose={() => setTransferringProduct(null)}
          onTransfer={async (fromId, toId, qty) => {
            const res = await onTransferStock({
              productId: transferringProduct.id,
              fromWarehouseId: fromId,
              toWarehouseId: toId,
              quantity: qty
            });
            if (res.success) {
              setTransferringProduct(null);
            } else {
              alert(res.error || 'Error al transferir');
            }
          }}
        />
      )}
      {/* Mobile Filters Modal */}
      {isMobileFilterOpen && (
        <div className="modal-overlay" onClick={() => setIsMobileFilterOpen(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <div className="modal-header">
              <h3 className="modal-title">Filtros</h3>
              <button className="modal-close-btn" onClick={() => setIsMobileFilterOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Almacén</label>
                <select
                  className="form-select"
                  value={selectedWarehouseFilter}
                  onChange={e => {
                    setSelectedWarehouseFilter(e.target.value);
                    setIsMobileFilterOpen(false);
                  }}
                  style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                >
                  <option value="ALL">📍 Todos los Almacenes</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      📍 Solo {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <button
                    className={`badge ${selectedCategory === 'ALL' ? 'badge-dark' : 'badge-gold'}`}
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setIsMobileFilterOpen(false);
                    }}
                    style={{ cursor: 'pointer', padding: '10px 16px', fontSize: '0.9rem', border: 'none', flex: '1 1 40%' }}
                  >
                    Todos ({products.length})
                  </button>
                  <button
                    className={`badge ${selectedCategory === 'Bolsos de Tenis' ? 'badge-dark' : 'badge-gold'}`}
                    onClick={() => {
                      setSelectedCategory('Bolsos de Tenis');
                      setIsMobileFilterOpen(false);
                    }}
                    style={{ cursor: 'pointer', padding: '10px 16px', fontSize: '0.9rem', border: 'none', flex: '1 1 40%' }}
                  >
                    Bolsos de Tenis
                  </button>
                  <button
                    className={`badge ${selectedCategory === 'Bolsos de Pickleball' ? 'badge-dark' : 'badge-gold'}`}
                    onClick={() => {
                      setSelectedCategory('Bolsos de Pickleball');
                      setIsMobileFilterOpen(false);
                    }}
                    style={{ cursor: 'pointer', padding: '10px 16px', fontSize: '0.9rem', border: 'none', flex: '1 1 40%' }}
                  >
                    Bolsos de Pickleball
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente: Modal Ajuste de Stock
function StockAdjustModal({ product, warehouses, inventory, onClose, onSave }) {
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouses[0]?.id || '');
  const currentWhStock = inventory.find(i => i.product_id === product.id && i.warehouse_id === selectedWarehouse)?.stock || 0;
  const [newStock, setNewStock] = useState(currentWhStock);

  const handleWarehouseChange = (whId) => {
    setSelectedWarehouse(whId);
    const s = inventory.find(i => i.product_id === product.id && i.warehouse_id === whId)?.stock || 0;
    setNewStock(s);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="sheet-handle"></div>
        <div className="modal-header">
          <h2 className="modal-title">Ajustar Stock de Inventario</h2>
          <button className="modal-close-btn" onClick={onClose}><XIcon /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-card-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <img src={product.image_url ? import.meta.env.BASE_URL + product.image_url.replace(/^\/+/, '') : ''} alt="" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            <div>
              <strong style={{ fontSize: '0.95rem' }}>{product.name}</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.sku}</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Seleccionar Almacén a Ajustar</label>
            <select
              className="form-select"
              value={selectedWarehouse}
              onChange={e => handleWarehouseChange(e.target.value)}
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nueva Cantidad de Unidades</label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={newStock}
              onChange={e => setNewStock(e.target.value)}
              autoFocus
            />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Stock actual en este almacén: {currentWhStock} unidades
            </span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSave(selectedWarehouse, newStock)}>
            Guardar Stock
          </button>
        </div>
      </div>
    </div>
  );
}

// Subcomponente: Modal Transferencia de Stock
function StockTransferModal({ product, warehouses, inventory, onClose, onTransfer }) {
  const [fromWh, setFromWh] = useState(warehouses[0]?.id || '');
  const [toWh, setToWh] = useState(warehouses[1]?.id || '');
  const [quantity, setQuantity] = useState(1);

  const fromStock = inventory.find(i => i.product_id === product.id && i.warehouse_id === fromWh)?.stock || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (fromWh === toWh) {
      alert('Debes seleccionar almacenes diferentes para la transferencia');
      return;
    }
    if (quantity > fromStock) {
      alert(`No puedes transferir más de ${fromStock} unidades que hay en el almacén de origen`);
      return;
    }
    onTransfer(fromWh, toWh, quantity);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="sheet-handle"></div>
        <div className="modal-header">
          <h2 className="modal-title">Transferir entre almacenes</h2>
          <button className="modal-close-btn" onClick={onClose}><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-card-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <img src={product.image_url ? import.meta.env.BASE_URL + product.image_url.replace(/^\/+/, '') : ''} alt="" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
              <div>
                <strong style={{ fontSize: '0.95rem' }}>{product.name}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mover stock entre Tony y Sergio</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Desde almacén (Origen)</label>
              <select className="form-select" value={fromWh} onChange={e => setFromWh(e.target.value)}>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Disponible en origen: {fromStock} unid.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Hacia almacén (Destino)</label>
              <select className="form-select" value={toWh} onChange={e => setToWh(e.target.value)}>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cantidad a mover</label>
              <input
                type="number"
                min="1"
                max={fromStock || 1}
                className="form-input"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-gold">Confirmar transferencia</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
