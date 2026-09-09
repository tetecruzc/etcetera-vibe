import React from 'react';
import { Package, Wallet, Plus, Receipt, Building2 } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onOpenNewSale }) {
  return (
    <div className="bottom-nav">
      <button 
        className={`bottom-tab ${activeTab === 'inventory' ? 'active' : ''}`}
        onClick={() => setActiveTab('inventory')}
      >
        <Package size={20} />
        <span>Inventario</span>
      </button>

      <button 
        className={`bottom-tab ${activeTab === 'accounts' ? 'active' : ''}`}
        onClick={() => setActiveTab('accounts')}
      >
        <Wallet size={20} />
        <span>Cuentas</span>
      </button>

      {/* Floating Center Sale Button */}
      <button 
        className="bottom-tab sale-cta"
        onClick={onOpenNewSale}
        aria-label="Registrar Nueva Venta"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <button 
        className={`bottom-tab ${activeTab === 'sales' ? 'active' : ''}`}
        onClick={() => setActiveTab('sales')}
      >
        <Receipt size={20} />
        <span>Ventas</span>
      </button>

      <button 
        className={`bottom-tab ${activeTab === 'warehouses' ? 'active' : ''}`}
        onClick={() => setActiveTab('warehouses')}
      >
        <Building2 size={20} />
        <span>Almacenes</span>
      </button>
    </div>
  );
}
