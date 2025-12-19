import { DataSource } from 'typeorm';
import { dataSourceOptions } from './src/database/data-source';

async function addMoreProducts() {
  const ds = new DataSource(dataSourceOptions);
  await ds.initialize();
  
  // Get a farmer id
  const farmers = await ds.query("SELECT id FROM users WHERE role = 'farmer' LIMIT 1");
  if (farmers.length === 0) {
    console.log('No farmer found');
    await ds.destroy();
    return;
  }
  const farmerId = farmers[0].id;
  console.log('Farmer ID:', farmerId);
  
  const newProducts = [
    { title: 'Fresh Bananas', description: 'Ripe yellow bananas', price: 1500, unit: 'bunch', stock: 50, category: 'fruits' },
    { title: 'Organic Carrots', description: 'Fresh organic carrots', price: 800, unit: 'kg', stock: 30, category: 'vegetables' },
    { title: 'Farm Chicken', description: 'Free-range chicken', price: 4500, unit: 'whole', stock: 20, category: 'poultry' },
    { title: 'Fresh Milk', description: 'Farm fresh cow milk', price: 1200, unit: 'liter', stock: 40, category: 'dairy' },
    { title: 'Brown Eggs', description: 'Organic brown eggs', price: 2500, unit: 'crate', stock: 25, category: 'poultry' },
    { title: 'Red Onions', description: 'Fresh red onions', price: 600, unit: 'kg', stock: 100, category: 'vegetables' },
    { title: 'Sweet Potatoes', description: 'Nigerian sweet potatoes', price: 900, unit: 'kg', stock: 80, category: 'vegetables' },
    { title: 'Fresh Catfish', description: 'Live catfish', price: 3500, unit: 'kg', stock: 15, category: 'meat' },
    { title: 'Watermelon', description: 'Sweet juicy watermelon', price: 2000, unit: 'piece', stock: 25, category: 'fruits' },
    { title: 'Fresh Spinach', description: 'Organic green spinach', price: 500, unit: 'bunch', stock: 60, category: 'vegetables' },
  ];
  
  for (const p of newProducts) {
    try {
      await ds.query(`
        INSERT INTO products ("farmerId", title, description, price, unit, stock, category, "isAvailable", rating, "reviewCount", images, "pickupLat", "pickupLng", "pickupAddress", "pickupState")
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, 4.5, 10, ARRAY['https://via.placeholder.com/300'], 6.5244, 3.3792, 'Lagos, Nigeria', 'Lagos')
      `, [farmerId, p.title, p.description, p.price, p.unit, p.stock, p.category]);
      console.log('Added:', p.title);
    } catch (err: any) {
      console.log('Skipped:', p.title, err.message);
    }
  }
  
  const count = await ds.query('SELECT COUNT(*) as count FROM products');
  console.log('Total products now:', count[0].count);
  
  await ds.destroy();
}

addMoreProducts().catch(console.error);
