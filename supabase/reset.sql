-- ==============================================================================
-- ETCETERA TENNIS - SCRIPT PARA RESETEAR TODO A 0 Y EMPEZAR EN LIMPIO
-- ==============================================================================
-- Este script:
-- 1. Elimina todas las ventas y pedidos de prueba (orders y order_items).
-- 2. Elimina todos los movimientos de cuentas (account_transactions).
-- 3. Resetea los saldos de todas las cuentas a $0.00.
-- 4. Resetea el stock de todos los productos en todos los almacenes a 0 unidades.
-- 5. Mantiene intacto el catálogo de bolsos y los almacenes (Casa Tony y Casa Sergio).

-- 1. Vaciar historial de ventas y movimientos de cuentas
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE account_transactions CASCADE;

-- 2. Resetear a $0.00 el saldo de todas las cuentas
UPDATE accounts
SET balance = 0.00;

-- 3. Resetear a 0 unidades el stock en todos los almacenes
UPDATE inventory
SET stock = 0, updated_at = NOW();

-- Confirmación visual
SELECT 'Sistema reseteado a 0 con éxito' AS status;
