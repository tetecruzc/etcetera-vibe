import React, { useState } from 'react';
import { Plus, Package, Image as ImageIcon, DollarSign, X } from 'lucide-react';

const CATEGORIES = [
  'Bolsos de Tenis',
  'Bolsos de Pickleball',
  'Raquetas & Paletas',
  'Pelotas & Tubos',
  'Grips & Antivibradores',
  'Indumentaria & Viseras',
  'Accesorios de Tenis'
];

// Imágenes disponibles de assets para selección rápida
const ASSET_PRESETS = [
  { label: 'Classic Blue', url: '/assets/classic-blue.png' },
  { label: 'Commando Tennis', url: '/assets/commando-tennis.png' },
  { label: 'Disco Tennis', url: '/assets/disco-tennis.png' },
  { label: 'Disco Pickleball', url: '/assets/disco-pickleball.JPG' },
  { label: 'Flamenco Tennis', url: '/assets/flamenco-tennis.png' },
  { label: 'Lavanda Tennis', url: '/assets/lavanda-tennis.png' },
  { label: 'Lilac Army', url: '/assets/lilac-army-tennis.png' },
  { label: 'Mocca Tennis', url: '/assets/mocca-tennis.png' },
  { label: 'Orange Tennis', url: '/assets/orange-tennis.png' },
  { label: 'Panda Tennis', url: '/assets/panda-tennis.jpg' },
];

export default function NewProductModal({ isOpen, onClose, onSaveProduct }) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Bolsos de Tenis');
  const [defaultPrice, setDefaultPrice] = useState('125.00');
  const [costPrice, setCostPrice] = useState('65.00');
  const [imageUrl, setImageUrl] = useState('/assets/classic-blue.png');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSaveProduct({
      name: name.trim(),
      sku: sku.trim() || `ETC-${Date.now().toString().slice(-4)}`,
      category,
      default_price: parseFloat(defaultPrice) || 0,
      cost_price: parseFloat(costPrice) || 0,
      image_url: imageUrl,
      description: description.trim()
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="sheet-handle"></div>
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
              <Package size={18} />
            </div>
            <div>
              <h2 className="modal-title">Nuevo Artículo / Bolso</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Amplía el catálogo de tenis y accesorios
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nombre del Producto *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. Bolso Tenis White Gold Edition / Grip Pro Feel"
                value={name}
                onChange={e => setName(e.target.value)}
                required/>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Código / SKU</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ETC-001"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Precio de Venta ($) *</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  placeholder="125.00"
                  value={defaultPrice}
                  onChange={e => setDefaultPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Costo de Fabricación ($)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  placeholder="65.00"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Selector de Foto */}
            <div className="form-group">
              <label className="form-label">Seleccionar Foto desde /assets o URL</label>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '6px 2px' }}>
                {ASSET_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    style={{
                      border: imageUrl === preset.url ? '2px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '4px',
                      background: '#FFFFFF',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title={preset.label}
                  >
                    <img src={preset.url ? import.meta.env.BASE_URL + preset.url.replace(/^\/+/, '') : ''} alt="" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="form-input"
                placeholder="Ruta relativa o URL de imagen"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                style={{ marginTop: '6px', fontSize: '0.82rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción o Características</label>
              <textarea
                className="form-textarea"
                placeholder="Detalles sobre materiales, capacidad de raquetas o bolsillos..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-gold">
              Guardar en Catálogo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
