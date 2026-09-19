import { useCallback, useEffect, useState } from 'react';
import AccountsView from './components/AccountsView';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import InventoryView from './components/InventoryView';
import NewProductModal from './components/NewProductModal';
import NewSaleModal from './components/NewSaleModal';
import SalesHistoryView from './components/SalesHistoryView';
import WarehousesView from './components/WarehousesView';

import {
    adjustAccountBalance,
    createSaleTransaction,
    deleteAccount,
    deleteSaleTransaction,
    deleteTransaction,
    fetchAppData,
    saveAccount,
    saveProduct,
    saveWarehouse,
    transferBetweenAccounts,
    transferStock,
    updateProductStock,
    updateSaleTransaction
} from './lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [isLoading, setIsLoading] = useState(true);

  // App Data
  const [data, setData] = useState({
    warehouses: [],
    products: [],
    inventory: [],
    accounts: [],
    orders: [],
    orderItems: [],
    transactions: []
  });

  // Modals
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);

  // Load Data directly from Supabase
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchAppData();
      setData(result);
    } catch (err) {
      console.error('Error cargando datos de Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler: Crear Venta
  const handleSaleSubmit = async (saleData) => {
    const res = await createSaleTransaction(saleData);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  // Handler: Ajustar Stock
  const handleUpdateStock = async (productId, warehouseId, newStock) => {
    await updateProductStock(productId, warehouseId, newStock);
    await loadData();
  };

  // Handler: Transferir Stock
  const handleTransferStock = async (transferData) => {
    const res = await transferStock(transferData);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  // Handler: Guardar Almacén
  const handleSaveWarehouse = async (whData) => {
    await saveWarehouse(whData);
    await loadData();
  };

  // Handler: Guardar Cuenta
  const handleSaveAccount = async (accData) => {
    await saveAccount(accData);
    await loadData();
  };

  // Handler: Eliminar Cuenta
  const handleDeleteAccount = async (accountId) => {
    await deleteAccount(accountId);
    await loadData();
  };

  // Handler: Ajustar saldo de Cuenta
  const handleAdjustBalance = async (accountId, amount, type, notes) => {
    const res = await adjustAccountBalance(accountId, amount, type, notes);
    if (res.success) await loadData();
    return res;
  };

  // Handler: Transferir entre Cuentas
  const handleTransferBetweenAccounts = async (transferData) => {
    const res = await transferBetweenAccounts(transferData);
    if (res.success) await loadData();
    return res;
  };

  // Handler: Eliminar Movimiento
  const handleDeleteTransaction = async (txId) => {
    await deleteTransaction(txId);
    await loadData();
  };

  // Handler: Eliminar Venta (Pedido)
  const handleDeleteOrder = async (orderId) => {
    await deleteSaleTransaction(orderId);
    await loadData();
  };

  // Handler: Editar venta (Pedido)
  const handleUpdateOrder = async (orderId, orderData) => {
    await updateSaleTransaction(orderId, orderData);
    await loadData();
  };

  // Handler: Guardar Producto
  const handleSaveProduct = async (prodData) => {
    await saveProduct(prodData);
    await loadData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Header */}
      <Header
        onOpenNewSale={() => setIsNewSaleOpen(true)}
        onRefresh={loadData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="app-container" style={{ flex: 1, paddingTop: '20px' }}>
        {isLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px',
            color: 'var(--text-muted)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--border-subtle)',
              borderTopColor: 'var(--accent-gold)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: '16px'
            }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Cargando inventario de Supabase...</span>
          </div>
        ) : (
          <>
            {activeTab === 'inventory' && (
              <InventoryView
                products={data.products}
                warehouses={data.warehouses}
                inventory={data.inventory}
                onUpdateStock={handleUpdateStock}
                onTransferStock={handleTransferStock}
                onOpenNewProduct={() => setIsNewProductOpen(true)}
                onOpenNewSale={() => setIsNewSaleOpen(true)}
              />
            )}
            {activeTab === 'accounts' && (
              <AccountsView
                accounts={data.accounts}
                orders={data.orders}
                transactions={data.transactions}
                onSaveAccount={handleSaveAccount}
                onDeleteAccount={handleDeleteAccount}
                onAdjustBalance={handleAdjustBalance}
                onTransferBetweenAccounts={handleTransferBetweenAccounts}
                onDeleteTransaction={handleDeleteTransaction}
                onDeleteOrder={handleDeleteOrder}
              />
            )}

            {activeTab === 'sales' && (
              <SalesHistoryView
                orders={data.orders}
                orderItems={data.orderItems}
                products={data.products}
                warehouses={data.warehouses}
                accounts={data.accounts}
                inventory={data.inventory}
                onDeleteOrder={handleDeleteOrder}
                onUpdateOrder={handleUpdateOrder}
              />
            )}

            {activeTab === 'warehouses' && (
              <WarehousesView
                warehouses={data.warehouses}
                inventory={data.inventory}
                products={data.products}
                onSaveWarehouse={handleSaveWarehouse}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewSale={() => setIsNewSaleOpen(true)}
      />

      {/* MODAL: Nueva venta */}
      <NewSaleModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        products={data.products}
        warehouses={data.warehouses}
        inventory={data.inventory}
        accounts={data.accounts}
        onSubmitSale={handleSaleSubmit}
      />

      {/* MODAL: Nuevo Producto */}
      <NewProductModal
        isOpen={isNewProductOpen}
        onClose={() => setIsNewProductOpen(false)}
        onSaveProduct={handleSaveProduct}
      />
    </div>
  );
}
