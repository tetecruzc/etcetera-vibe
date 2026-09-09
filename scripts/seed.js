import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Cargar .env manualmente si existe
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=');
      if (key && vals.length) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🎾 Etcetera Tennis - Script de Inserción de Productos');
console.log('----------------------------------------------------');

const assetsDir = path.join(rootDir, 'assets');
const assetFiles = fs.readdirSync(assetsDir);

// Mapeo amigable de nombres a partir de los archivos en assets
function formatProductName(filename) {
  const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg|webp|gif|JPG)$/i, '');
  const parts = nameWithoutExt.split(/[-_]/).map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  
  if (parts.includes('Pickleball')) {
    const brand = parts.filter(p => p !== 'Pickleball').join(' ');
    return `Bolso Pickleball ${brand}`;
  }
  
  const brand = parts.filter(p => p !== 'Tennis').join(' ');
  return `Bolso Tenis ${brand}`;
}

function generateSku(filename) {
  const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg|webp|gif|JPG)$/i, '');
  const clean = nameWithoutExt.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 10);
  return `ETC-${clean}`;
}

const productImages = assetFiles.filter(f => !f.toLowerCase().includes('logo') && /\.(png|jpg|jpeg|webp|gif|JPG)$/i.test(f));

console.log(`Encontradas ${productImages.length} imágenes de bolsos en /assets:`);
const productsToInsert = productImages.map((file, idx) => {
  const isPickleball = file.toLowerCase().includes('pickleball');
  return {
    name: formatProductName(file),
    sku: generateSku(file),
    category: isPickleball ? 'Bolsos de Pickleball' : 'Bolsos de Tenis',
    default_price: isPickleball ? 110.00 : (120.00 + (idx % 3) * 5),
    cost_price: 65.00,
    image_url: `/assets/${file}`,
    description: `Bolso premium de alta durabilidad modelo ${formatProductName(file)} con compartimientos especializados y diseño exclusivo Etcetera.`,
    is_active: true
  };
});

productsToInsert.forEach(p => console.log(` - ${p.name} [${p.sku}] -> $${p.default_price} (${p.image_url})`));

// Guardar archivo JSON con los productos para uso local/seed
const outputJsonPath = path.join(rootDir, 'src', 'data', 'initial-products.json');
fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true });
fs.writeFileSync(outputJsonPath, JSON.stringify(productsToInsert, null, 2));
console.log(`\n💾 Archivo de respaldo generado en: ${outputJsonPath}`);

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
  console.log('\n⚠️  Nota: No se detectaron credenciales válidas de Supabase en .env');
  console.log('   Los datos se han guardado localmente para que la app funcione de inmediato.');
  console.log('   Para sincronizar directamente con Supabase, configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSeed() {
  console.log('\n🚀 Conectando a Supabase para insertar almacenes y productos...');
  
  // 1. Almacenes
  const warehouses = [
    { name: 'Casa Tony', address: 'Sede Tony', is_active: true },
    { name: 'Casa Sergio', address: 'Sede Sergio', is_active: true }
  ];
  
  const { data: whData, error: whErr } = await supabase
    .from('warehouses')
    .upsert(warehouses, { onConflict: 'name' })
    .select();
    
  if (whErr) {
    console.error('❌ Error insertando almacenes:', whErr.message);
  } else {
    console.log(`✅ Almacenes listos (${whData.length} almacenes)`);
  }

  // 2. Cuentas
  const accounts = [
    { name: 'Zelle', currency: 'USD', balance: 0.00, is_active: true },
    { name: 'Efectivo USD', currency: 'USD', balance: 0.00, is_active: true },
    { name: 'Banesco Panamá', currency: 'USD', balance: 0.00, is_active: true },
    { name: 'Pago Móvil / Bs', currency: 'USD', balance: 0.00, is_active: true }
  ];
  
  const { data: accData, error: accErr } = await supabase
    .from('accounts')
    .upsert(accounts, { onConflict: 'name' })
    .select();
    
  if (accErr) {
    console.error('❌ Error insertando cuentas:', accErr.message);
  } else {
    console.log(`✅ Cuentas listas (${accData?.length || 0} cuentas)`);
  }

  // 3. Productos
  const { data: prodData, error: prodErr } = await supabase
    .from('products')
    .upsert(productsToInsert, { onConflict: 'sku' })
    .select();
    
  if (prodErr) {
    console.error('❌ Error insertando productos:', prodErr.message);
    return;
  }
  console.log(`✅ ${prodData.length} productos insertados/actualizados correctamente en Supabase!`);

  // 4. Inventario inicial en ambos almacenes
  if (whData && whData.length >= 2) {
    const tonyId = whData.find(w => w.name.includes('Tony'))?.id;
    const sergioId = whData.find(w => w.name.includes('Sergio'))?.id;
    
    const inventoryItems = [];
    prodData.forEach(p => {
      if (tonyId) inventoryItems.push({ product_id: p.id, warehouse_id: tonyId, stock: 5 });
      if (sergioId) inventoryItems.push({ product_id: p.id, warehouse_id: sergioId, stock: 4 });
    });

    const { error: invErr } = await supabase
      .from('inventory')
      .upsert(inventoryItems, { onConflict: 'product_id,warehouse_id' });

    if (invErr) {
      console.error('❌ Error inicializando inventario:', invErr.message);
    } else {
      console.log('✅ Stock inicial asignado a Casa Tony y Casa Sergio.');
    }
  }

  console.log('\n🎉 ¡Proceso de inserción completado exitosamente!');
}

runSeed().catch(console.error);
