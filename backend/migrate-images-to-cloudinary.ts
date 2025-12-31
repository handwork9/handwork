/**
 * Migration Script: Re-upload existing product images to Cloudinary
 * 
 * This script:
 * 1. Connects to the database
 * 2. Fetches all products with images
 * 3. Downloads each image from the old URL
 * 4. Re-uploads to Cloudinary
 * 5. Updates the database with new Cloudinary URLs
 * 
 * Run with: npx ts-node migrate-images-to-cloudinary.ts
 */

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Client } from 'pg';
import * as https from 'https';
import * as http from 'http';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('❌ Missing Cloudinary credentials in .env file');
  console.error('Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL in .env file');
  process.exit(1);
}

// Initialize Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

console.log('✅ Cloudinary configured for cloud:', CLOUDINARY_CLOUD_NAME);

/**
 * Download image from URL and return as base64
 */
async function downloadImageAsBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, { timeout: 30000 }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          console.log(`  ↪ Redirecting to: ${redirectUrl}`);
          downloadImageAsBase64(redirectUrl).then(resolve);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        console.log(`  ❌ HTTP ${response.statusCode} for ${url}`);
        resolve(null);
        return;
      }

      const contentType = response.headers['content-type'] || 'image/jpeg';
      const chunks: Buffer[] = [];

      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length < 1000) {
          console.log(`  ❌ Image too small (${buffer.length} bytes), likely error page`);
          resolve(null);
          return;
        }
        const base64 = `data:${contentType};base64,${buffer.toString('base64')}`;
        resolve(base64);
      });
      response.on('error', (err) => {
        console.log(`  ❌ Download error: ${err.message}`);
        resolve(null);
      });
    });

    request.on('error', (err) => {
      console.log(`  ❌ Request error: ${err.message}`);
      resolve(null);
    });
    
    request.on('timeout', () => {
      console.log(`  ❌ Request timeout for ${url}`);
      request.destroy();
      resolve(null);
    });
  });
}

/**
 * Upload base64 image to Cloudinary
 */
async function uploadToCloudinary(base64: string, folder: string): Promise<string | null> {
  try {
    const result: UploadApiResponse = await cloudinary.uploader.upload(base64, {
      folder: `handwork/${folder}`,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });
    return result.secure_url;
  } catch (error: any) {
    console.log(`  ❌ Cloudinary upload error: ${error.message}`);
    return null;
  }
}

/**
 * Check if URL is already a Cloudinary URL
 */
function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

/**
 * Main migration function
 */
async function migrateImages() {
  console.log('\n🚀 Starting image migration to Cloudinary...\n');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Fetch all products with images
    const result = await client.query(`
      SELECT id, title, images 
      FROM products 
      WHERE images IS NOT NULL 
        AND array_length(images, 1) > 0
      ORDER BY "createdAt" DESC
    `);

    console.log(`📦 Found ${result.rows.length} products with images\n`);

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const product of result.rows) {
      console.log(`\n📦 Processing: ${product.title} (${product.id})`);
      console.log(`   Current images: ${product.images.length}`);

      const newImageUrls: string[] = [];
      let hasChanges = false;

      for (let i = 0; i < product.images.length; i++) {
        const imageUrl = product.images[i];
        console.log(`   [${i + 1}/${product.images.length}] ${imageUrl.substring(0, 60)}...`);

        // Skip if already Cloudinary URL
        if (isCloudinaryUrl(imageUrl)) {
          console.log(`   ✅ Already on Cloudinary, skipping`);
          newImageUrls.push(imageUrl);
          continue;
        }

        // Try to download the image
        const base64 = await downloadImageAsBase64(imageUrl);
        
        if (!base64) {
          console.log(`   ⚠️ Could not download, keeping original URL`);
          newImageUrls.push(imageUrl);
          failCount++;
          continue;
        }

        // Upload to Cloudinary
        console.log(`   ⬆️ Uploading to Cloudinary...`);
        const cloudinaryUrl = await uploadToCloudinary(base64, 'products');

        if (cloudinaryUrl) {
          console.log(`   ✅ Uploaded: ${cloudinaryUrl.substring(0, 60)}...`);
          newImageUrls.push(cloudinaryUrl);
          hasChanges = true;
          successCount++;
        } else {
          console.log(`   ❌ Upload failed, keeping original URL`);
          newImageUrls.push(imageUrl);
          failCount++;
        }
      }

      // Update product if images changed
      if (hasChanges) {
        await client.query(
          `UPDATE products SET images = $1, "updatedAt" = NOW() WHERE id = $2`,
          [newImageUrls, product.id]
        );
        console.log(`   💾 Database updated with new URLs`);
      } else {
        skippedCount++;
        console.log(`   ⏭️ No changes needed`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount} images`);
    console.log(`   ❌ Failed to migrate: ${failCount} images`);
    console.log(`   ⏭️ Products skipped (no changes): ${skippedCount}`);
    console.log('='.repeat(50) + '\n');

  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

// Also migrate avatars
async function migrateAvatars() {
  console.log('\n🚀 Starting avatar migration to Cloudinary...\n');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Fetch all users with avatars
    const result = await client.query(`
      SELECT id, "fullName", avatar 
      FROM users 
      WHERE avatar IS NOT NULL 
        AND avatar != ''
        AND avatar NOT LIKE '%cloudinary%'
    `);

    console.log(`👤 Found ${result.rows.length} users with non-Cloudinary avatars\n`);

    let successCount = 0;
    let failCount = 0;

    for (const user of result.rows) {
      console.log(`\n👤 Processing: ${user.fullName} (${user.id})`);
      console.log(`   Avatar: ${user.avatar?.substring(0, 60)}...`);

      // Try to download the avatar
      const base64 = await downloadImageAsBase64(user.avatar);
      
      if (!base64) {
        console.log(`   ⚠️ Could not download avatar`);
        failCount++;
        continue;
      }

      // Upload to Cloudinary
      console.log(`   ⬆️ Uploading to Cloudinary...`);
      const cloudinaryUrl = await uploadToCloudinary(base64, 'avatars');

      if (cloudinaryUrl) {
        console.log(`   ✅ Uploaded: ${cloudinaryUrl.substring(0, 60)}...`);
        await client.query(
          `UPDATE users SET avatar = $1, "updatedAt" = NOW() WHERE id = $2`,
          [cloudinaryUrl, user.id]
        );
        console.log(`   💾 Database updated`);
        successCount++;
      } else {
        console.log(`   ❌ Upload failed`);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Avatar Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount} avatars`);
    console.log(`   ❌ Failed to migrate: ${failCount} avatars`);
    console.log('='.repeat(50) + '\n');

  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

// Run the migrations
async function main() {
  console.log('🖼️  Image Migration to Cloudinary');
  console.log('='.repeat(50));
  
  await migrateImages();
  await migrateAvatars();
  
  console.log('\n✨ Migration complete!\n');
}

main().catch(console.error);
