import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

async function main() {
  console.log('=== Admin User Creation Script ===\n');
  
  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL is required. Run with: railway run npx ts-node create-admin.ts');
    process.exit(1);
  }

  // Default admin credentials - change these if needed
  const email = process.argv[2] || 'admin@handwork.com';
  const password = process.argv[3] || 'Admin123!';
  const name = process.argv[4] || 'Super Admin';
  const phone = process.argv[5] || '+2348000000000'; // Default phone

  console.log('\nCreating admin user...');
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('railway') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      console.log(`\nUser already exists with email: ${email}`);
      console.log(`Current role: ${user.role}`);
      
      // Update the user to superadmin and reset password
      await client.query(
        `UPDATE users 
         SET role = 'superadmin', password = $1, "isActive" = true, "isEmailVerified" = true, "isPhoneVerified" = true
         WHERE email = $2`,
        [passwordHash, email]
      );
      
      console.log('\nUpdated existing user to superadmin with new password');
    } else {
      // Create new admin user
      const result = await client.query(
        `INSERT INTO users (id, email, password, name, phone, role, "isActive", "isEmailVerified", "isPhoneVerified", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'superadmin', true, true, true, NOW(), NOW())
         RETURNING id, email, name, role`,
        [email, passwordHash, name, phone]
      );
      
      console.log('\nCreated new admin user:');
      console.log(result.rows[0]);
    }
    
    // Verify the user
    const verifyResult = await client.query(
      `SELECT id, email, name, role, "isActive", "isEmailVerified" FROM users WHERE email = $1`,
      [email]
    );
    
    console.log('\nAdmin user details:');
    console.log(verifyResult.rows[0]);
    
    console.log(`\n✅ Admin user ready!`);
    console.log(`\nLogin credentials:`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
