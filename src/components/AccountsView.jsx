import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CheckCircle,
  CreditCard,
  Plus,
  RefreshCw,
  Trash2,
  Wallet
} from 'lucide-react';
import { useState } from 'react';

// ─── Subcomponente: Modal de confirmación de eliminación ────────────────────────
function DeleteConfirmModal({ account, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="sheet-handle" />
        <div className="modal-header">
          <h2 className="modal-title" style={{ color: 'var(--danger, #e53e3e)' }}>
            Eliminar Cuenta
          </h2>
          <button className="modal-close-btn" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 0',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#fff0f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <AlertTriangle size={28} color="#e53e3e" />
            </div>
            <div>
              <p style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '6px' }}>
                ¿Eliminar "{account.name}"?
              </p>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Se borrará la cuenta y todo su historial de movimientos.
                El saldo de{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  ${Number(account.balance).toFixed(2)}
                </strong>
                {' '}se perderá. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={onConfirm}
            disabled={loading}
            style={{ background: '#e53e3e' }}
          >
            {loading ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponente: Modal ajuste de saldo ────────────────────────────────────────
function AdjustBalanceModal({ account, onConfirm, onCancel, loading }) {
  const [moveType, setMoveType] = useState('deposit'); // 'deposit' | 'withdrawal'
  const [amount, setAmount]     = useState('');
  const [notes, setNotes]       = useState('');
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const val = parseFloat(amount);
    if (!val || val <= 0) { setError('Ingresa un monto válido mayor a $0.'); return; }
    const res = await onConfirm(account.id, val, moveType, notes);
    if (res && !res.success) setError(res.error);
  };

  const previewBalance = () => {
    const val = parseFloat(amount) || 0;
    const cur = Number(account.balance) || 0;
    return moveType === 'deposit' ? cur + val : Math.max(0, cur - val);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="sheet-handle" />
        <div className="modal-header">
          <h2 className="modal-title">Ajustar saldo</h2>
          <button className="modal-close-btn" onClick={onCancel}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Cuenta */}
            <div style={{
              background: 'var(--bg-card-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{account.name}</span>
              <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-dark)' }}>
                ${Number(account.balance).toFixed(2)}
              </span>
            </div>

            {/* Tipo de movimiento */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tipo de movimiento</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { val: 'deposit',    label: 'Ingreso',  icon: ArrowUpRight,   color: '#22c55e' },
                  { val: 'withdrawal', label: 'Egreso',   icon: ArrowDownLeft,  color: '#e53e3e' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setMoveType(opt.val)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      border: `2px solid ${moveType === opt.val ? opt.color : 'var(--border-subtle)'}`,
                      background: moveType === opt.val ? `${opt.color}15` : 'transparent',
                      color: moveType === opt.val ? opt.color : 'var(--text-muted)',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <opt.icon size={15} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Monto */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Monto ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Nota */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nota (opcional)</label>
              <input
                type="text"
                className="form-input"
                placeholder={moveType === 'deposit' ? 'Ej. Cobro pendiente recibido' : 'Ej. Pago proveedor'}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {/* Preview saldo resultante */}
            {amount && parseFloat(amount) > 0 && (
              <div style={{
                background: moveType === 'deposit' ? '#f0fff4' : '#fff5f5',
                border: `1px solid ${moveType === 'deposit' ? '#c6f6d5' : '#fed7d7'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.85rem'
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>Saldo resultante:</span>
                <strong style={{ color: moveType === 'deposit' ? '#22c55e' : '#e53e3e', fontSize: '1rem' }}>
                  ${previewBalance().toFixed(2)}
                </strong>
              </div>
            )}

            {error && (
              <p style={{ color: '#e53e3e', fontSize: '0.84rem', margin: 0 }}>{error}</p>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Registrar movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Subcomponente: Modal transferencia entre cuentas ────────────────────────────
function TransferModal({ accounts, onConfirm, onCancel, loading }) {
  const [fromId, setFromId] = useState(accounts[0]?.id || '');
  const [toId,   setToId]   = useState(accounts[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [notes,  setNotes]  = useState('');
  const [error,  setError]  = useState('');

  const fromAcc = accounts.find(a => a.id === fromId);
  const toAcc   = accounts.find(a => a.id === toId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (fromId === toId) { setError('Las cuentas deben ser diferentes.'); return; }
    const val = parseFloat(amount);
    if (!val || val <= 0) { setError('Ingresa un monto válido mayor a $0.'); return; }
    if (fromAcc && val > Number(fromAcc.balance)) {
      setError(`Saldo insuficiente en "${fromAcc.name}".`);
      return;
    }
    const res = await onConfirm({ fromAccountId: fromId, toAccountId: toId, amount: val, notes });
    if (res && !res.success) setError(res.error);
  };

  const selectStyle = {
    width: '100%',
    padding: '10px 12px',
    background: 'var(--bg-input, var(--bg-card-subtle))',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="sheet-handle" />
        <div className="modal-header">
          <h2 className="modal-title">Transferir entre Cuentas</h2>
          <button className="modal-close-btn" onClick={onCancel}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Cuenta origen */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Desde (origen)</label>
              <select value={fromId} onChange={e => setFromId(e.target.value)} style={selectStyle}>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} — ${Number(a.balance).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Flecha visual */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              <ArrowDownLeft size={18} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            </div>

            {/* Cuenta destino */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Hacia (destino)</label>
              <select value={toId} onChange={e => setToId(e.target.value)} style={selectStyle}>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} — ${Number(a.balance).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Monto */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Monto a transferir ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Nota */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nota (opcional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. Pase de caja a Zelle"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {/* Preview */}
            {amount && parseFloat(amount) > 0 && fromAcc && toAcc && fromId !== toId && (
              <div style={{
                background: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: '0.82rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{fromAcc.name} quedará en:</span>
                  <strong style={{ color: '#e53e3e' }}>
                    ${Math.max(0, Number(fromAcc.balance) - parseFloat(amount)).toFixed(2)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{toAcc.name} quedará en:</span>
                  <strong style={{ color: '#22c55e' }}>
                    ${(Number(toAcc.balance) + parseFloat(amount)).toFixed(2)}
                  </strong>
                </div>
              </div>
            )}

            {error && (
              <p style={{ color: '#e53e3e', fontSize: '0.84rem', margin: 0 }}>{error}</p>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Transfiriendo...' : 'Confirmar transferencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────────
export default function AccountsView({
  accounts = [],
  orders = [],
  transactions = [],
  onSaveAccount,
  onDeleteAccount,
  onAdjustBalance,
  onTransferBetweenAccounts,
  onDeleteTransaction,
  onDeleteOrder
}) {
  // Modals
  const [isAddingAccount,   setIsAddingAccount]   = useState(false);
  const [deleteTarget,      setDeleteTarget]       = useState(null); // account obj
  const [adjustTarget,      setAdjustTarget]       = useState(null); // account obj
  const [isTransferOpen,    setIsTransferOpen]     = useState(false);

  // Filtros del historial
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterType,    setFilterType]    = useState('all');

  // Confirmación inline de borrar movimiento
  const [confirmDeleteTxId, setConfirmDeleteTxId] = useState(null);
  const [deletingTxId,      setDeletingTxId]      = useState(null);

  // Form: nueva cuenta
  const [newAccountName,    setNewAccountName]    = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');

  // Loading state for async actions
  const [loadingAction, setLoadingAction] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Total de dinero consolidado
  const totalBalance = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);

  // Helper: identifica órdenes especiales que corresponden a incidentes (robo, regalo, faltante, ajuste de caja)
  const isIncidentOrder = (o) => {
    const num = (o.order_number || '').toUpperCase();
    return num.startsWith('ETC-AJU') || num.startsWith('ETC-FAL') || num.startsWith('ETC-ROB') || num.startsWith('ETC-REG');
  };

  // IDs de órdenes que ya tienen transacción en account_transactions
  const linkedOrderIds = new Set(transactions.filter(t => t.order_id).map(t => t.order_id));

  // Ventas: todas las transacciones de tipo 'sale' (con o sin orden) + órdenes de venta huérfanas (sin transacción directa)
  const salesTransactions = transactions.filter(t => t.type === 'sale');
  const orphanSaleOrders   = orders.filter(o => !linkedOrderIds.has(o.id) && !isIncidentOrder(o));
  const totalSalesCount    = salesTransactions.length + orphanSaleOrders.length;

  // Mapas auxiliares para nombres y órdenes
  const accMap = {};
  accounts.forEach(a => { accMap[a.id] = a.name; });
  const orderMap = {};
  orders.forEach(o => { orderMap[o.id] = o; });

  // Construcción unificada de movimientos: account_transactions + órdenes huérfanas sintetizadas
  const orphanMovements = orders
    .filter(o => !linkedOrderIds.has(o.id))
    .map(o => {
      const isIncident = isIncidentOrder(o);
      let type = 'sale';
      let amount = Number(o.total_amount) || 0;
      if (isIncident) {
        const num = (o.order_number || '').toUpperCase();
        if (num.startsWith('ETC-AJU')) {
          type = 'adjustment';
          amount = -Math.abs(amount);
        } else if (num.startsWith('ETC-ROB')) {
          type = 'withdrawal';
          amount = -Math.abs(amount);
        } else {
          type = 'withdrawal';
          amount = 0;
        }
      }
      return {
        id:         `order-${o.id}`,
        _synthetic: true,
        account_id: o.account_id || null,
        type,
        amount,
        order_id:   o.id,
        notes:      o.notes || `Venta: ${o.customer_name}${o.order_number ? ` (${o.order_number})` : ''}`,
        created_at: o.created_at,
      };
    });

  const allMovements = [...transactions, ...orphanMovements]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filteredMovements = allMovements.filter(tx => {
    const matchAcc =
      filterAccount === 'all'
        ? true
        : filterAccount === 'unassigned'
          ? !tx.account_id
          : tx.account_id === filterAccount;

    const matchType = filterType === 'all' || tx.type === filterType;
    return matchAcc && matchType;
  });


  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    setLoadingAction(true);
    try {
      await onSaveAccount({
        name: newAccountName.trim(),
        currency: 'USD',
        balance: parseFloat(newAccountBalance) || 0
      });
      showToast(`Cuenta "${newAccountName.trim()}" creada correctamente.`);
      setNewAccountName('');
      setNewAccountBalance('');
      setIsAddingAccount(false);
    } catch (err) {
      showToast(err.message || 'Error al crear cuenta', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setLoadingAction(true);
    try {
      await onDeleteAccount(deleteTarget.id);
      showToast(`Cuenta "${deleteTarget.name}" eliminada.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.message || 'Error al eliminar', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConfirmAdjust = async (accountId, amount, type, notes) => {
    setLoadingAction(true);
    try {
      const res = await onAdjustBalance(accountId, amount, type, notes);
      if (res?.success !== false) {
        showToast(`Movimiento registrado correctamente.`);
        setAdjustTarget(null);
      }
      return res;
    } catch (err) {
      showToast(err.message || 'Error al ajustar saldo', 'error');
      return { success: false, error: err.message };
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConfirmTransfer = async (data) => {
    setLoadingAction(true);
    try {
      const res = await onTransferBetweenAccounts(data);
      if (res?.success !== false) {
        showToast('Transferencia realizada correctamente.');
        setIsTransferOpen(false);
      }
      return res;
    } catch (err) {
      showToast(err.message || 'Error en transferencia', 'error');
      return { success: false, error: err.message };
    } finally {
      setLoadingAction(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: toast.type === 'error' ? '#e53e3e' : '#22c55e',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '999px',
          fontWeight: '600',
          fontSize: '0.85rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease'
        }}>
          {toast.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* ── Banner Total ── */}
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
            <span>💼 {accounts.length} cuentas activas</span>
            <span>🏷️ {totalSalesCount} ventas</span>
          </div>
        </div>
        <Wallet size={120} style={{
          position: 'absolute', right: '-15px', bottom: '-25px',
          opacity: 0.08, color: '#FFFFFF'
        }} />
      </div>

      {/* ── Header + Botones de acción ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Cuentas de cobro</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Monitorea el dinero que ingresa por cada método de pago
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {accounts.length >= 2 && (
            <button
              className="btn-secondary"
              onClick={() => setIsTransferOpen(true)}
              id="btn-transfer-accounts"
            >
              <ArrowLeftRight size={15} />
              <span>Transferir</span>
            </button>
          )}
          <button
            className="btn-secondary"
            onClick={() => setIsAddingAccount(true)}
            id="btn-new-account"
          >
            <Plus size={15} />
            <span>Nueva cuenta</span>
          </button>
        </div>
      </div>

      {/* ── Cards de Cuentas ── */}
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
              {/* Header tarjeta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '34px', height: '34px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent-dark)'
                  }}>
                    <CreditCard size={17} />
                  </div>
                  <strong style={{ fontSize: '0.96rem' }}>{acc.name}</strong>
                </div>
                <span className="badge badge-gold">{acc.currency || 'USD'}</span>
              </div>

              {/* Saldo */}
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Saldo actual
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  ${bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Barra participación */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Participación</span>
                  <span>{pct}%</span>
                </div>
                <div style={{ height: '5px', background: 'var(--bg-card-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-gold)' }} />
                </div>
              </div>

              {/* Footer */}
              <div style={{
                fontSize: '0.76rem', color: 'var(--text-secondary)',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '8px', marginTop: 'auto',
                display: 'flex', justifyContent: 'space-between'
              }}>
                <span>Ingresos asociados:</span>
                <strong>{relatedOrders.length} ventas</strong>
              </div>

              {/* Botones de acción de la tarjeta */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                <button
                  id={`btn-adjust-${acc.id}`}
                  onClick={() => setAdjustTarget(acc)}
                  title="Ajustar saldo"
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-gold)'; e.currentTarget.style.color = 'var(--accent-gold)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <RefreshCw size={13} />
                  Ajustar
                </button>
                <button
                  id={`btn-delete-${acc.id}`}
                  onClick={() => setDeleteTarget(acc)}
                  title="Eliminar cuenta"
                  style={{
                    padding: '7px 10px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#e53e3e'; e.currentTarget.style.color = '#e53e3e'; e.currentTarget.style.background = '#fff0f0'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MODAL: Crear Nueva cuenta ── */}
      {isAddingAccount && (
        <div className="modal-overlay" onClick={() => setIsAddingAccount(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="sheet-handle" />
            <div className="modal-header">
              <h2 className="modal-title">Añadir Cuenta Financiera</h2>
              <button className="modal-close-btn" onClick={() => setIsAddingAccount(false)}>✕</button>
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
                <button type="submit" className="btn-primary" disabled={loadingAction}>
                  {loadingAction ? 'Creando...' : 'Crear Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Eliminar cuenta ── */}
      {deleteTarget && (
        <DeleteConfirmModal
          account={deleteTarget}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={loadingAction}
        />
      )}

      {/* ── MODAL: Ajustar saldo ── */}
      {adjustTarget && (
        <AdjustBalanceModal
          account={adjustTarget}
          onConfirm={handleConfirmAdjust}
          onCancel={() => setAdjustTarget(null)}
          loading={loadingAction}
        />
      )}

      {/* ── MODAL: Transferencia entre cuentas ── */}
      {isTransferOpen && (
        <TransferModal
          accounts={accounts}
          onConfirm={handleConfirmTransfer}
          onCancel={() => setIsTransferOpen(false)}
          loading={loadingAction}
        />
      )}

      {/* ══ HISTORIAL DE MOVIMIENTOS ══════════════════════════════════════════ */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Historial de movimientos</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {allMovements.length} movimientos registrados
              {filteredMovements.length !== allMovements.length && ` (mostrando ${filteredMovements.length})`}
            </p>
          </div>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={filterAccount}
              onChange={e => setFilterAccount(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">Todas las cuentas</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
              <option value="unassigned">
                Sin cuenta asignada ({allMovements.filter(m => !m.account_id).length})
              </option>
            </select>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">Todos los tipos</option>
              <option value="sale">Ventas</option>
              <option value="deposit">Ingresos</option>
              <option value="withdrawal">Egresos</option>
              <option value="transfer">Transferencias</option>
              <option value="adjustment">Ajustes</option>
            </select>
          </div>
        </div>

        {/* Lista */}
        {(() => {
          const TYPE_CONFIG = {
            sale:       { label: 'Venta',        color: '#22c55e', bg: '#f0fff4', icon: '💰', sign: '+' },
            deposit:    { label: 'Ingreso',       color: '#3b82f6', bg: '#eff6ff', icon: '⬆️', sign: '+' },
            withdrawal: { label: 'Egreso',        color: '#e53e3e', bg: '#fff5f5', icon: '⬇️', sign: '-' },
            transfer:   { label: 'Transferencia', color: '#f59e0b', bg: '#fffbeb', icon: '↔️', sign: '' },
            adjustment: { label: 'Ajuste',        color: '#8b5cf6', bg: '#f5f3ff', icon: '📊', sign: '' },
          };

          if (!filteredMovements.length) {
            return (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</p>
                <p>No hay movimientos para los filtros seleccionados.</p>
              </div>
            );
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredMovements.map(tx => {
                const cfg         = TYPE_CONFIG[tx.type] || TYPE_CONFIG.adjustment;
                const amount      = Number(tx.amount);
                const absAmt      = Math.abs(amount);
                const isNeg       = amount < 0;
                const amtColor    = isNeg ? '#e53e3e' : (amount > 0 ? '#22c55e' : 'var(--text-secondary)');
                const amtSign     = isNeg ? '-' : (amount > 0 ? '+' : '');
                const dateStr     = tx.created_at
                  ? new Date(tx.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—';
                const linkedOrder = tx.order_id ? orderMap[tx.order_id] : null;
                const accName     = accMap[tx.account_id];
                const displayDesc = tx.notes || (linkedOrder ? `Venta: ${linkedOrder.customer_name}` : cfg.label);

                return (
                  <div
                    key={tx.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* Icono tipo */}
                    <div style={{
                      width: '36px', height: '36px', flexShrink: 0,
                      borderRadius: '50%',
                      background: cfg.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem'
                    }}>
                      {cfg.icon}
                    </div>

                    {/* Info central */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {displayDesc}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            background: cfg.bg,
                            color: cfg.color,
                            padding: '1px 7px',
                            borderRadius: '999px',
                            fontWeight: '600',
                            fontSize: '0.7rem'
                          }}
                        >
                          {cfg.label}
                        </span>
                        {linkedOrder?.order_number && (
                          <span style={{
                            background: 'var(--bg-card-subtle)',
                            border: '1px solid var(--border-subtle)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontFamily: 'monospace'
                          }}>
                            #{linkedOrder.order_number}
                          </span>
                        )}
                        <span style={{
                          color: accName ? 'var(--text-secondary)' : 'var(--text-muted)',
                          fontStyle: accName ? 'normal' : 'italic'
                        }}>
                          {accName || 'Sin cuenta asignada'}
                        </span>
                        <span>•</span>
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    {/* Monto */}
                    <div style={{
                      fontWeight: '800',
                      fontSize: '1rem',
                      color: amtColor,
                      flexShrink: 0,
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {amtSign}${absAmt.toFixed(2)}
                    </div>

                    {/* Botón eliminar inline */}
                    {confirmDeleteTxId === tx.id ? (
                      // Confirmación expandida
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.75rem', color: '#e53e3e', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          ¿Eliminar?
                        </span>
                        <button
                          onClick={async () => {
                            setDeletingTxId(tx.id);
                            try {
                              if (tx.order_id && onDeleteOrder) {
                                await onDeleteOrder(tx.order_id);
                                showToast('Venta y movimiento eliminados.');
                              } else {
                                await onDeleteTransaction(tx.id);
                                showToast('Movimiento eliminado.');
                              }
                            } catch (err) {
                              showToast(err.message || 'Error al eliminar', 'error');
                            } finally {
                              setDeletingTxId(null);
                              setConfirmDeleteTxId(null);
                            }
                          }}
                          disabled={deletingTxId === tx.id}
                          style={{
                            padding: '3px 8px',
                            background: '#e53e3e',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {deletingTxId === tx.id ? '...' : 'Sí'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteTxId(null)}
                          style={{
                            padding: '3px 8px',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      // Icono de papelera
                      <button
                        onClick={() => setConfirmDeleteTxId(tx.id)}
                        title="Eliminar movimiento"
                        style={{
                          padding: '5px',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          flexShrink: 0,
                          opacity: 0.5,
                          transition: 'opacity 0.15s, color 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#e53e3e'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
