import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { dataSourceOptions } from '../data-source';

const seedData = async () => {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  console.log('Seeding database...');

  const queryRunner = dataSource.createQueryRunner();

  try {
    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await queryRunner.query(`
      INSERT INTO users (email, phone, password, name, role, "isPhoneVerified", "isActive")
      VALUES ('admin@handwork.ng', '+2348000000000', $1, 'Admin User', 'admin', true, true)
      ON CONFLICT (email) DO NOTHING;
    `, [adminPasswordHash]);
    console.log('✓ Admin user created');

    // Create sample farmer
    const farmerPasswordHash = await bcrypt.hash('farmer123', 10);
    const farmerResult = await queryRunner.query(`
      INSERT INTO users (email, phone, password, name, role, "isPhoneVerified", "isActive")
      VALUES ('farmer@handwork.ng', '+2348000000001', $1, 'John Farm', 'farmer', true, true)
      ON CONFLICT (email) DO UPDATE SET name = 'John Farm'
      RETURNING id;
    `, [farmerPasswordHash]);
    const farmerId = farmerResult[0]?.id;
    console.log('✓ Sample farmer created');

    // Create sample rider
    const riderPasswordHash = await bcrypt.hash('rider123', 10);
    const riderUserResult = await queryRunner.query(`
      INSERT INTO users (email, phone, password, name, role, "isPhoneVerified", "isActive")
      VALUES ('rider@handwork.ng', '+2348000000002', $1, 'Mike Rider', 'rider', true, true)
      ON CONFLICT (email) DO UPDATE SET name = 'Mike Rider'
      RETURNING id;
    `, [riderPasswordHash]);
    const riderUserId = riderUserResult[0]?.id;

    if (riderUserId) {
      await queryRunner.query(`
        INSERT INTO riders ("userId", "vehicleType", "vehiclePlate", status, "isVerified", state)
        VALUES ($1, 'motorcycle', 'LAG-123-ABC', 'available', true, 'Lagos')
        ON CONFLICT ("userId") DO NOTHING;
      `, [riderUserId]);
    }
    console.log('✓ Sample rider created');

    // Create sample buyer
    const buyerPasswordHash = await bcrypt.hash('buyer123', 10);
    await queryRunner.query(`
      INSERT INTO users (email, phone, password, name, role, "isPhoneVerified", "isActive", "walletBalance")
      VALUES ('buyer@handwork.ng', '+2348000000003', $1, 'Jane Buyer', 'buyer', true, true, 50000)
      ON CONFLICT (email) DO NOTHING;
    `, [buyerPasswordHash]);
    console.log('✓ Sample buyer created');

    // Create sample products
    if (farmerId) {
      const products = [
        {
          name: 'Fresh Tomatoes',
          description: 'Farm fresh tomatoes from organic farm',
          price: 2500,
          unit: 'basket',
          quantity: 100,
          category: 'vegetables',
          state: 'Lagos',
          address: 'Mile 12 Market, Lagos',
          lat: 6.5833,
          lng: 3.3833,
          images: ['https://images.unsplash.com/photo-1546470427-227c7369e37b?w=400'],
        },
        {
          name: 'Yam Tubers',
          description: 'Premium Nigerian yams',
          price: 5000,
          unit: 'tuber',
          quantity: 50,
          category: 'tubers',
          state: 'Lagos',
          address: 'Agege Market, Lagos',
          lat: 6.6194,
          lng: 3.3217,
          images: ['https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400'],
        },
        {
          name: 'Fresh Pepper',
          description: 'Hot chili peppers freshly harvested',
          price: 1500,
          unit: 'bag',
          quantity: 80,
          category: 'vegetables',
          state: 'Lagos',
          address: 'Oke Odo Market, Lagos',
          lat: 6.6386,
          lng: 3.2983,
          images: ['https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400'],
        },
        {
          name: 'Organic Eggs',
          description: 'Free-range chicken eggs',
          price: 3000,
          unit: 'crate',
          quantity: 30,
          category: 'poultry',
          state: 'Ogun',
          address: 'Sagamu Farm, Ogun State',
          lat: 6.8333,
          lng: 3.6500,
          images: ['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400'],
        },
        {
          name: 'Palm Oil',
          description: 'Pure unrefined palm oil',
          price: 8000,
          unit: '25L',
          quantity: 20,
          category: 'oils',
          state: 'Ondo',
          address: 'Akure Farm Market, Ondo',
          lat: 7.2500,
          lng: 5.1950,
          images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'],
        },
      ];

      for (const product of products) {
        await queryRunner.query(`
          INSERT INTO products (
            "farmerId", title, description, price, unit, stock, 
            category, "pickupState", "pickupAddress", "pickupLat", "pickupLng",
            images, "isAvailable", "isFeatured"
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
            $12, true, ${products.indexOf(product) < 2}
          )
          ON CONFLICT DO NOTHING;
        `, [
          farmerId,
          product.name,
          product.description,
          product.price,
          product.unit,
          product.quantity,
          product.category,
          product.state,
          product.address,
          product.lat,
          product.lng,
          product.images.join(','), // simple-array format
        ]);
      }
      console.log('✓ Sample products created');
    }

    console.log('✅ Database seeded successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
};

seedData();
