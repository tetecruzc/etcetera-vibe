-- ==============================================================================
-- ETCETERA TENNIS - SEED INICIAL DE DATOS
-- ==============================================================================

-- 1. Insertar Almacenes Iniciales
INSERT INTO warehouses (id, name, address, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Casa Tony', 'Sede Principal - Tony', TRUE),
    ('22222222-2222-2222-2222-222222222222', 'Casa Sergio', 'Almacén Auxiliar - Sergio', TRUE)
ON CONFLICT (name) DO UPDATE SET is_active = TRUE;

-- 2. Insertar Cuentas Financieras Iniciales
INSERT INTO accounts (id, name, currency, balance, is_active)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Zelle', 'USD', 0.00, TRUE),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Efectivo USD', 'USD', 0.00, TRUE),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Banesco Panamá', 'USD', 0.00, TRUE),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Pago Móvil / Bs', 'USD', 0.00, TRUE)
ON CONFLICT (name) DO NOTHING;

-- 3. Insertar Productos de Bolsos Existentes en /assets
INSERT INTO products (name, sku, category, default_price, image_url, description)
VALUES
    ('Bolso Tenis Classic Blue', 'ETC-CLASSIC-BL', 'Bolsos de Tenis', 45.00, '/assets/classic-blue.png', 'Bolso de tenis clásico con compartimiento acolchado para raquetas.'),
    ('Bolso Tenis Commando', 'ETC-COMMANDO-T', 'Bolsos de Tenis', 45.00, '/assets/commando-tennis.png', 'Bolso de tenis estilo militar elegante con acabados impermeables.'),
    ('Bolso Pickleball Disco', 'ETC-DISCO-PICK', 'Bolsos de Pickleball', 35.00, '/assets/disco-pickleball.JPG', 'Bolso compacto para paletas de pickleball diseño Disco moderno.'),
    ('Bolso Tenis Disco', 'ETC-DISCO-TENN', 'Bolsos de Tenis', 45.00, '/assets/disco-tennis.png', 'Bolso de tenis con detalles brillantes y diseño vanguardista.'),
    ('Bolso Tenis Flamenco', 'ETC-FLAMENCO-T', 'Bolsos de Tenis', 45.00, '/assets/flamenco-tennis.png', 'Bolso de tenis tono coral flamenco con máxima capacidad organizadora.'),
    ('Bolso Tenis Lavanda', 'ETC-LAVANDA-TE', 'Bolsos de Tenis', 45.00, '/assets/lavanda-tennis.png', 'Bolso de tenis tono lavanda suave, elegante y resistente.'),
    ('Bolso Tenis Lilac Army', 'ETC-LILAC-ARMY', 'Bolsos de Tenis', 45.00, '/assets/lilac-army-tennis.png', 'Edición especial Lilac Army con cierres reforzados y soporte térmico.'),
    ('Bolso Tenis Mocca', 'ETC-MOCCA-TENN', 'Bolsos de Tenis', 45.00, '/assets/mocca-tennis.png', 'Bolso de tenis color mocca café minimalista de lujo.'),
    ('Bolso Tenis Orange', 'ETC-ORANGE-TEN', 'Bolsos de Tenis', 45.00, '/assets/orange-tennis.png', 'Bolso de tenis con toques naranja vivos, ideal para entrenamientos.'),
    ('Bolso Tenis Panda', 'ETC-PANDA-TENN', 'Bolsos de Tenis', 45.00, '/assets/panda-tennis.jpg', 'Diseño exclusivo blanco y negro Panda con doble compartimiento.')
ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    default_price = EXCLUDED.default_price,
    image_url = EXCLUDED.image_url;

-- 4. Inicializar Inventario en Casa Tony y Casa Sergio (5 unidades en Tony, 4 en Sergio por defecto)
INSERT INTO inventory (product_id, warehouse_id, stock)
SELECT p.id, '11111111-1111-1111-1111-111111111111'::UUID, 5 FROM products p
ON CONFLICT (product_id, warehouse_id) DO UPDATE SET stock = EXCLUDED.stock;

INSERT INTO inventory (product_id, warehouse_id, stock)
SELECT p.id, '22222222-2222-2222-2222-222222222222'::UUID, 4 FROM products p
ON CONFLICT (product_id, warehouse_id) DO UPDATE SET stock = EXCLUDED.stock;
