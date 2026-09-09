import React, { useState } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, DollarSign, CreditCard, Sparkles, Building } from 'lucide-react';

export default function AccountsView({ accounts = [], orders = [], onSaveAccount }) {
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');

  // Total de dinero consolidado
  const totalBalance = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);

  // Total ventas históricas
  const totalSalesRevenue = orders.reduce((sum, ord) => sum + (Number(ord.total_amount) || 0), 0);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    await onSaveAccount({
      name: newAccountName.trim(),
      currency: 'USD',
      balance: parseFloat(newAccountBalance) || 0
    });
    setNewAccountName('');
    setNewAccountBalance('');
    setIsAddingAccount(false);
  };

  return (
    <div>
      {/* Top Banner: Saldo Global Consolidado */}
      <div style={{
        background: 'linear-gradient(135deg, #1E1B18 0%, #302A23 100%)',
        color: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 24px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <span style={{
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--accent-gold)',
            fontWeight: '700'
          }}>
            Balance Total Consolidado
          </span>
          <div style={{
            fontSize: '2.4rem',
            fontWeight: '800',
            fontFamily: 'var(--font-sans)',
            margin: '8px 0 4px',
            letterSpacing: '-0.02em'
          }}>
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.84rem', color: '#D5CDC4', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>💼 {accounts.length} Cuentas Activas</span>
            <span>🏷️ {orders.length} Ventas registradas (${totalSalesRevenue.toFixed(2)})</span>
          </div>
        </div>

        {/* Decorative ambient icon */}
        <Wallet 
          size={120} 
          style={{
            position: 'absolute',
            right: '-15px',
            bottom: '-25px',
            opacity: 0.08,
            color: '#FFFFFF'
          }}
        />
      </div>

      {/* Header & Add Account button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Cuentas de Cobro</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Monitorea el dinero que ingresa por cada método de pago
          </p>
        </div>
        <button className="btn-secondary" onClick={() => setIsAddingAccount(true)}>
          <Plus size={15} />
          <span>Nueva Cuenta</span>
        </button>
      </div>

      {/* Accounts Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {accounts.map(acc => {
          const bal = Number(acc.balance) || 0;
          const pct = totalBalance > 0 ? ((bal / totalBalance) * 100).toFixed(0) : 0;
          const relatedOrders = orders.filter(o => o.account_id === acc.id);

          return (
            <div key={acc.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-dark)'
                  }}>
                    <CreditCard size={17} />
                  </div>
                  <strong style={{ fontSize: '0.96rem' }}>{acc.name}</strong>
                </div>
                <span className="badge badge-gold">{acc.currency || 'USD'}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Saldo Actual
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  ${bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Progress bar of share */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Participación</span>
                  <span>{pct}%</span>
                </div>
                <div style={{ height: '5px', background: 'var(--bg-card-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-gold)' }}></div>
                </div>
              </div>

              <div style={{
                fontSize: '0.76rem',
                color: 'var(--text-secondary)',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '8px',
                marginTop: 'auto',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Ingresos asociados:</span>
                <strong>{relatedOrders.length} ventas</strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Crear Nueva Cuenta */}
      {isAddingAccount && (
        <div className="modal-overlay" onClick={() => setIsAddingAccount(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="sheet-handle"></div>
            <div className="modal-header">
              <h2 className="modal-title">Añadir Cuenta Financiera</h2>
              <button className="modal-close-btn" onClick={() => setIsAddingAccount(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAccount} style={{ display: 'contents' }}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre de la Cuenta *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Banesco USD, Zelle Personal, Caja Fuerte..."
                    value={newAccountName}
                    onChange={e => setNewAccountName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Saldo Inicial ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={newAccountBalance}
                    onChange={e => setNewAccountBalance(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddingAccount(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
