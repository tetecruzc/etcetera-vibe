import { Plus, RefreshCw } from 'lucide-react';

export default function Header({ onOpenNewSale, onRefresh, activeTab, setActiveTab }) {
  return (
    <header className="header">
      <div className="header-inner">
        {/* Brand Identity */}
        <div className="brand-logo-wrap" onClick={() => setActiveTab('inventory')}>
          <img 
            src="/assets/logo.png" 
            alt="Etcetera Logo" 
            className="brand-logo-img"
          />
          <div className="brand-title-group">
            <span className="brand-name">ETCETERA</span>
            <span className="brand-subtitle">Tennis & Pickleball Atelier</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          <button 
            className={`nav-link-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventario
          </button>
          <button 
            className={`nav-link-btn ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            Cuentas & Balances
          </button>
          <button 
            className={`nav-link-btn ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            Historial de Ventas
          </button>
          <button 
            className={`nav-link-btn ${activeTab === 'warehouses' ? 'active' : ''}`}
            onClick={() => setActiveTab('warehouses')}
          >
            Almacenes
          </button>
        </nav>

        {/* Right Side Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Supabase Status Pill */}
          {/* <div className="status-pill connected" title="Conectado a tu proyecto de Supabase via .env">
            <span className="status-dot"></span>
            <span>Supabase En Vivo</span>
          </div> */}

          {/* Quick Refresh */}
          <button
            onClick={onRefresh}
            className="modal-close-btn"
            title="Refrescar datos desde Supabase"
            style={{ width: '34px', height: '34px' }}
          >
            <RefreshCw size={15} />
          </button>

          {/* CTA New Sale Button */}
          <button 
            className="btn-primary" 
            onClick={onOpenNewSale}
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            <Plus size={16} />
            <span>Nueva Venta</span>
          </button>
        </div>
      </div>
    </header>
  );
}
