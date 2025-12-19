import { DataSource } from 'typeorm';
import { dataSourceOptions } from './src/database/data-source';

async function seedAllCategories() {
  const ds = new DataSource(dataSourceOptions);
  await ds.initialize();
  
  // Get a farmer id
  const farmers = await ds.query("SELECT id FROM users WHERE role = 'farmer' LIMIT 1");
  if (farmers.length === 0) {
    console.log('No farmer found. Please create a farmer first.');
    await ds.destroy();
    return;
  }
  const farmerId = farmers[0].id;
  console.log('Farmer ID:', farmerId);
  
  const allProducts = [
    // Vegetables
    { title: 'Fresh Tomatoes', description: 'Juicy ripe tomatoes', price: 800, unit: 'kg', stock: 100, category: 'vegetables', images: ['https://images.unsplash.com/photo-1546470427-227c7b7e5426?w=400'] },
    { title: 'Green Bell Peppers', description: 'Crisp green peppers', price: 1200, unit: 'kg', stock: 50, category: 'vegetables', images: ['https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400'] },
    { title: 'Fresh Spinach', description: 'Organic leafy spinach', price: 500, unit: 'bunch', stock: 80, category: 'vegetables', images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'] },
    { title: 'Carrots', description: 'Sweet orange carrots', price: 600, unit: 'kg', stock: 70, category: 'vegetables', images: ['https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400'] },
    { title: 'Cabbage', description: 'Fresh green cabbage', price: 400, unit: 'piece', stock: 60, category: 'vegetables', images: ['https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400'] },
    { title: 'Ugwu Leaves', description: 'Fresh pumpkin leaves', price: 300, unit: 'bunch', stock: 90, category: 'vegetables', images: ['https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400'] },

    // Fruits
    { title: 'Sweet Mangoes', description: 'Ripe Nigerian mangoes', price: 1500, unit: 'kg', stock: 40, category: 'fruits', images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=400'] },
    { title: 'Fresh Oranges', description: 'Juicy sweet oranges', price: 1200, unit: 'dozen', stock: 60, category: 'fruits', images: ['https://images.unsplash.com/photo-1547514701-42782101795e?w=400'] },
    { title: 'Ripe Bananas', description: 'Yellow ripe bananas', price: 800, unit: 'bunch', stock: 80, category: 'fruits', images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'] },
    { title: 'Pineapples', description: 'Sweet tropical pineapples', price: 1000, unit: 'piece', stock: 35, category: 'fruits', images: ['https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400'] },
    { title: 'Watermelon', description: 'Large juicy watermelon', price: 2500, unit: 'piece', stock: 25, category: 'fruits', images: ['https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400'] },
    { title: 'Pawpaw', description: 'Ripe pawpaw/papaya', price: 900, unit: 'piece', stock: 45, category: 'fruits', images: ['https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=400'] },

    // Grains
    { title: 'Nigerian Rice', description: 'Premium Ofada rice', price: 4500, unit: '5kg', stock: 100, category: 'grains', images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'] },
    { title: 'Wheat Flour', description: 'Premium wheat flour', price: 3500, unit: '5kg', stock: 80, category: 'grains', images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'] },
    { title: 'Maize/Corn', description: 'Dried yellow corn', price: 2500, unit: '5kg', stock: 90, category: 'grains', images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400'] },
    { title: 'Millet', description: 'Nutritious millet grains', price: 2800, unit: '5kg', stock: 60, category: 'grains', images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'] },
    { title: 'Sorghum', description: 'Red sorghum grains', price: 2200, unit: '5kg', stock: 70, category: 'grains', images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'] },
    { title: 'Guinea Corn', description: 'Fresh guinea corn', price: 2000, unit: '5kg', stock: 55, category: 'grains', images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400'] },

    // Dairy
    { title: 'Fresh Cow Milk', description: 'Farm fresh milk', price: 1500, unit: 'liter', stock: 30, category: 'dairy', images: ['https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400'] },
    { title: 'Fura de Nunu', description: 'Traditional milk drink', price: 800, unit: 'bottle', stock: 40, category: 'dairy', images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400'] },
    { title: 'Wara (Local Cheese)', description: 'Nigerian cottage cheese', price: 1200, unit: 'pack', stock: 35, category: 'dairy', images: ['https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400'] },
    { title: 'Fresh Yogurt', description: 'Creamy natural yogurt', price: 1000, unit: 'liter', stock: 25, category: 'dairy', images: ['https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=400'] },
    { title: 'Butter', description: 'Fresh farm butter', price: 2500, unit: '500g', stock: 20, category: 'dairy', images: ['https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400'] },
    { title: 'Cream', description: 'Fresh dairy cream', price: 1800, unit: '500ml', stock: 15, category: 'dairy', images: ['https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=400'] },

    // Eggs
    { title: 'Chicken Eggs', description: 'Fresh farm eggs', price: 2500, unit: 'crate', stock: 50, category: 'eggs', images: ['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400'] },
    { title: 'Organic Brown Eggs', description: 'Free-range brown eggs', price: 3500, unit: 'crate', stock: 30, category: 'eggs', images: ['https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=400'] },
    { title: 'Quail Eggs', description: 'Nutritious quail eggs', price: 2000, unit: 'dozen', stock: 25, category: 'eggs', images: ['https://images.unsplash.com/photo-1569127959161-2b1297b2d9d6?w=400'] },
    { title: 'Duck Eggs', description: 'Large duck eggs', price: 3000, unit: 'dozen', stock: 20, category: 'eggs', images: ['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400'] },
    { title: 'Turkey Eggs', description: 'Premium turkey eggs', price: 4000, unit: 'dozen', stock: 15, category: 'eggs', images: ['https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=400'] },
    { title: 'Guinea Fowl Eggs', description: 'Specialty eggs', price: 3500, unit: 'dozen', stock: 18, category: 'eggs', images: ['https://images.unsplash.com/photo-1569127959161-2b1297b2d9d6?w=400'] },

    // Meat
    { title: 'Fresh Beef', description: 'Premium beef cuts', price: 4500, unit: 'kg', stock: 40, category: 'meat', images: ['https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400'] },
    { title: 'Goat Meat', description: 'Fresh goat meat', price: 5000, unit: 'kg', stock: 35, category: 'meat', images: ['https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400'] },
    { title: 'Lamb Chops', description: 'Tender lamb chops', price: 6000, unit: 'kg', stock: 20, category: 'meat', images: ['https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400'] },
    { title: 'Suya Meat', description: 'Spiced grilled meat', price: 3500, unit: 'stick', stock: 60, category: 'meat', images: ['https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400'] },
    { title: 'Beef Liver', description: 'Fresh beef liver', price: 2500, unit: 'kg', stock: 25, category: 'meat', images: ['https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400'] },
    { title: 'Oxtail', description: 'Premium oxtail', price: 5500, unit: 'kg', stock: 15, category: 'meat', images: ['https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400'] },

    // Poultry
    { title: 'Whole Chicken', description: 'Free-range chicken', price: 4500, unit: 'piece', stock: 30, category: 'poultry', images: ['https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400'] },
    { title: 'Chicken Wings', description: 'Fresh chicken wings', price: 3000, unit: 'kg', stock: 40, category: 'poultry', images: ['https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400'] },
    { title: 'Turkey', description: 'Fresh whole turkey', price: 25000, unit: 'piece', stock: 10, category: 'poultry', images: ['https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=400'] },
    { title: 'Duck', description: 'Fresh whole duck', price: 8000, unit: 'piece', stock: 15, category: 'poultry', images: ['https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400'] },
    { title: 'Guinea Fowl', description: 'Fresh guinea fowl', price: 5500, unit: 'piece', stock: 20, category: 'poultry', images: ['https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400'] },
    { title: 'Chicken Thighs', description: 'Fresh chicken thighs', price: 3500, unit: 'kg', stock: 35, category: 'poultry', images: ['https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=400'] },

    // Seafood
    { title: 'Fresh Catfish', description: 'Live catfish', price: 3500, unit: 'kg', stock: 25, category: 'seafood', images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'] },
    { title: 'Tilapia', description: 'Fresh tilapia fish', price: 2800, unit: 'kg', stock: 30, category: 'seafood', images: ['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400'] },
    { title: 'Mackerel', description: 'Fresh mackerel', price: 2500, unit: 'kg', stock: 35, category: 'seafood', images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'] },
    { title: 'Fresh Prawns', description: 'Large fresh prawns', price: 8000, unit: 'kg', stock: 15, category: 'seafood', images: ['https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400'] },
    { title: 'Crayfish', description: 'Dried crayfish', price: 4500, unit: 'kg', stock: 40, category: 'seafood', images: ['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400'] },
    { title: 'Stockfish', description: 'Premium stockfish', price: 12000, unit: 'kg', stock: 20, category: 'seafood', images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'] },

    // Herbs & Spices
    { title: 'Fresh Ginger', description: 'Organic fresh ginger', price: 1500, unit: 'kg', stock: 50, category: 'herbs_spices', images: ['https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400'] },
    { title: 'Turmeric', description: 'Fresh turmeric root', price: 2000, unit: 'kg', stock: 40, category: 'herbs_spices', images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400'] },
    { title: 'Fresh Basil', description: 'Aromatic basil leaves', price: 500, unit: 'bunch', stock: 60, category: 'herbs_spices', images: ['https://images.unsplash.com/photo-1618164435735-413d3b066c9a?w=400'] },
    { title: 'Scotch Bonnet Peppers', description: 'Hot scotch bonnet', price: 800, unit: 'kg', stock: 70, category: 'herbs_spices', images: ['https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400'] },
    { title: 'Curry Leaves', description: 'Fresh curry leaves', price: 400, unit: 'bunch', stock: 45, category: 'herbs_spices', images: ['https://images.unsplash.com/photo-1618164435735-413d3b066c9a?w=400'] },
    { title: 'Locust Beans', description: 'Dawadawa/Iru', price: 1200, unit: 'pack', stock: 55, category: 'herbs_spices', images: ['https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400'] },

    // Honey
    { title: 'Pure Honey', description: 'Raw natural honey', price: 5500, unit: 'liter', stock: 25, category: 'honey', images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400'] },
    { title: 'Forest Honey', description: 'Wild forest honey', price: 7000, unit: 'liter', stock: 15, category: 'honey', images: ['https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400'] },
    { title: 'Honeycomb', description: 'Fresh honeycomb', price: 4500, unit: 'piece', stock: 20, category: 'honey', images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400'] },
    { title: 'Organic Honey', description: 'Certified organic honey', price: 8000, unit: 'liter', stock: 12, category: 'honey', images: ['https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400'] },
    { title: 'Stingless Bee Honey', description: 'Rare stingless bee honey', price: 12000, unit: '500ml', stock: 8, category: 'honey', images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400'] },
    { title: 'Honey Gift Set', description: 'Assorted honey collection', price: 15000, unit: 'set', stock: 10, category: 'honey', images: ['https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400'] },

    // Nuts
    { title: 'Groundnuts', description: 'Roasted groundnuts', price: 1500, unit: 'kg', stock: 60, category: 'nuts', images: ['https://images.unsplash.com/photo-1567892320421-1c657571ea4a?w=400'] },
    { title: 'Cashew Nuts', description: 'Raw cashew nuts', price: 6000, unit: 'kg', stock: 30, category: 'nuts', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400'] },
    { title: 'Tiger Nuts', description: 'Fresh tiger nuts', price: 2500, unit: 'kg', stock: 45, category: 'nuts', images: ['https://images.unsplash.com/photo-1567892320421-1c657571ea4a?w=400'] },
    { title: 'Kolanut', description: 'Fresh kolanut', price: 3000, unit: 'kg', stock: 35, category: 'nuts', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400'] },
    { title: 'Bitter Kola', description: 'Fresh bitter kola', price: 4000, unit: 'kg', stock: 25, category: 'nuts', images: ['https://images.unsplash.com/photo-1567892320421-1c657571ea4a?w=400'] },
    { title: 'Walnuts', description: 'Nigerian walnuts', price: 5500, unit: 'kg', stock: 20, category: 'nuts', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400'] },

    // Tubers
    { title: 'Yam', description: 'Fresh white yam', price: 2500, unit: 'tuber', stock: 40, category: 'tubers', images: ['https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400'] },
    { title: 'Sweet Potatoes', description: 'Nigerian sweet potatoes', price: 1200, unit: 'kg', stock: 60, category: 'tubers', images: ['https://images.unsplash.com/photo-1596097635121-14b63a7a0c19?w=400'] },
    { title: 'Cassava', description: 'Fresh cassava tubers', price: 800, unit: 'kg', stock: 80, category: 'tubers', images: ['https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400'] },
    { title: 'Cocoyam', description: 'Fresh cocoyam', price: 1500, unit: 'kg', stock: 50, category: 'tubers', images: ['https://images.unsplash.com/photo-1596097635121-14b63a7a0c19?w=400'] },
    { title: 'Irish Potatoes', description: 'Fresh irish potatoes', price: 1800, unit: 'kg', stock: 70, category: 'tubers', images: ['https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400'] },
    { title: 'Water Yam', description: 'Fresh water yam', price: 2200, unit: 'tuber', stock: 35, category: 'tubers', images: ['https://images.unsplash.com/photo-1596097635121-14b63a7a0c19?w=400'] },

    // Oils
    { title: 'Palm Oil', description: 'Pure red palm oil', price: 3500, unit: 'liter', stock: 50, category: 'oils', images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'] },
    { title: 'Groundnut Oil', description: 'Pure groundnut oil', price: 4000, unit: 'liter', stock: 40, category: 'oils', images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'] },
    { title: 'Coconut Oil', description: 'Virgin coconut oil', price: 5500, unit: 'liter', stock: 30, category: 'oils', images: ['https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400'] },
    { title: 'Shea Butter', description: 'Raw shea butter', price: 3000, unit: 'kg', stock: 35, category: 'oils', images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'] },
    { title: 'Palm Kernel Oil', description: 'Pure PKO', price: 4500, unit: 'liter', stock: 25, category: 'oils', images: ['https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400'] },
    { title: 'Olive Oil', description: 'Extra virgin olive oil', price: 8000, unit: 'liter', stock: 15, category: 'oils', images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'] },

    // Legumes
    { title: 'Black-eyed Beans', description: 'Fresh black-eyed peas', price: 2000, unit: 'kg', stock: 60, category: 'legumes', images: ['https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400'] },
    { title: 'Honey Beans', description: 'Premium honey beans', price: 2500, unit: 'kg', stock: 50, category: 'legumes', images: ['https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400'] },
    { title: 'Brown Beans', description: 'Nigerian brown beans', price: 1800, unit: 'kg', stock: 70, category: 'legumes', images: ['https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400'] },
    { title: 'Lentils', description: 'Red lentils', price: 2200, unit: 'kg', stock: 45, category: 'legumes', images: ['https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400'] },
    { title: 'Soybeans', description: 'Organic soybeans', price: 1500, unit: 'kg', stock: 55, category: 'legumes', images: ['https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400'] },
    { title: 'Pigeon Peas', description: 'Fresh pigeon peas', price: 1600, unit: 'kg', stock: 40, category: 'legumes', images: ['https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400'] },

    // Processed
    { title: 'Garri', description: 'White garri', price: 1500, unit: '5kg', stock: 80, category: 'processed', images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'] },
    { title: 'Pounded Yam Flour', description: 'Poundo yam', price: 3500, unit: '5kg', stock: 50, category: 'processed', images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'] },
    { title: 'Elubo', description: 'Yam flour for amala', price: 2500, unit: '5kg', stock: 60, category: 'processed', images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'] },
    { title: 'Ogbono', description: 'Ground ogbono seeds', price: 4000, unit: 'kg', stock: 35, category: 'processed', images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'] },
    { title: 'Egusi', description: 'Ground melon seeds', price: 5000, unit: 'kg', stock: 40, category: 'processed', images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'] },
    { title: 'Dried Fish', description: 'Smoked dried fish', price: 6000, unit: 'kg', stock: 30, category: 'processed', images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'] },

    // Livestock
    { title: 'Live Goat', description: 'Healthy live goat', price: 45000, unit: 'piece', stock: 10, category: 'livestock', images: ['https://images.unsplash.com/photo-1524024973431-2ad916746881?w=400'] },
    { title: 'Live Chicken', description: 'Free-range live chicken', price: 5000, unit: 'piece', stock: 30, category: 'livestock', images: ['https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400'] },
    { title: 'Live Turkey', description: 'Healthy live turkey', price: 30000, unit: 'piece', stock: 8, category: 'livestock', images: ['https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=400'] },
    { title: 'Ram', description: 'Healthy ram', price: 80000, unit: 'piece', stock: 5, category: 'livestock', images: ['https://images.unsplash.com/photo-1524024973431-2ad916746881?w=400'] },
    { title: 'Live Duck', description: 'Healthy live duck', price: 8000, unit: 'piece', stock: 15, category: 'livestock', images: ['https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400'] },
    { title: 'Cow', description: 'Healthy cow for sale', price: 350000, unit: 'piece', stock: 3, category: 'livestock', images: ['https://images.unsplash.com/photo-1524024973431-2ad916746881?w=400'] },

    // Seeds
    { title: 'Tomato Seeds', description: 'Hybrid tomato seeds', price: 2500, unit: 'pack', stock: 40, category: 'seeds', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'] },
    { title: 'Pepper Seeds', description: 'Hot pepper seeds', price: 1500, unit: 'pack', stock: 50, category: 'seeds', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'] },
    { title: 'Maize Seeds', description: 'Hybrid maize seeds', price: 3000, unit: 'kg', stock: 60, category: 'seeds', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'] },
    { title: 'Vegetable Seeds Pack', description: 'Assorted veggie seeds', price: 5000, unit: 'pack', stock: 30, category: 'seeds', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'] },
    { title: 'Watermelon Seeds', description: 'Hybrid watermelon', price: 4000, unit: 'pack', stock: 25, category: 'seeds', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'] },
    { title: 'Okra Seeds', description: 'Okra planting seeds', price: 1200, unit: 'pack', stock: 45, category: 'seeds', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'] },

    // Beverages
    { title: 'Palm Wine', description: 'Fresh palm wine', price: 1500, unit: 'liter', stock: 30, category: 'beverages', images: ['https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400'] },
    { title: 'Zobo Drink', description: 'Hibiscus zobo', price: 800, unit: 'liter', stock: 50, category: 'beverages', images: ['https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400'] },
    { title: 'Kunu', description: 'Traditional kunu drink', price: 600, unit: 'liter', stock: 40, category: 'beverages', images: ['https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400'] },
    { title: 'Fresh Orange Juice', description: 'Pure orange juice', price: 1200, unit: 'liter', stock: 35, category: 'beverages', images: ['https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400'] },
    { title: 'Tiger Nut Milk', description: 'Fresh kunun aya', price: 1500, unit: 'liter', stock: 25, category: 'beverages', images: ['https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400'] },
    { title: 'Soya Milk', description: 'Fresh soya milk', price: 800, unit: 'liter', stock: 45, category: 'beverages', images: ['https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400'] },

    // Others
    { title: 'Plantain', description: 'Ripe plantain', price: 1500, unit: 'bunch', stock: 50, category: 'others', images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'] },
    { title: 'Snails', description: 'Fresh giant snails', price: 5000, unit: 'dozen', stock: 20, category: 'others', images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'] },
    { title: 'Mushrooms', description: 'Fresh local mushrooms', price: 2500, unit: 'kg', stock: 25, category: 'others', images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'] },
    { title: 'Dried Pepper', description: 'Dried chili peppers', price: 3000, unit: 'kg', stock: 40, category: 'others', images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'] },
    { title: 'Okro', description: 'Fresh okro', price: 600, unit: 'kg', stock: 60, category: 'others', images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'] },
    { title: 'Garden Eggs', description: 'Fresh garden eggs', price: 800, unit: 'kg', stock: 45, category: 'others', images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'] },
  ];
  
  let added = 0;
  let skipped = 0;
  
  for (const p of allProducts) {
    try {
      await ds.query(`
        INSERT INTO products ("farmerId", title, description, price, unit, stock, category, "isAvailable", rating, "reviewCount", images, "pickupLat", "pickupLng", "pickupAddress", "pickupState")
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, 4.5, 10, $8, 6.5244, 3.3792, 'Lagos, Nigeria', 'Lagos')
      `, [farmerId, p.title, p.description, p.price, p.unit, p.stock, p.category, p.images]);
      added++;
      console.log('✓ Added:', p.title, `(${p.category})`);
    } catch (err: any) {
      skipped++;
      console.log('✗ Skipped:', p.title, '-', err.message?.substring(0, 50));
    }
  }
  
  console.log('\n-------------------');
  console.log(`Added: ${added} products`);
  console.log(`Skipped: ${skipped} products`);
  
  const count = await ds.query('SELECT COUNT(*) as count FROM products');
  console.log(`Total products: ${count[0].count}`);
  
  // Show count per category
  const categories = await ds.query(`
    SELECT category, COUNT(*) as count 
    FROM products 
    GROUP BY category 
    ORDER BY category
  `);
  console.log('\nProducts per category:');
  categories.forEach((c: any) => console.log(`  ${c.category}: ${c.count}`));
  
  await ds.destroy();
}

seedAllCategories().catch(console.error);
