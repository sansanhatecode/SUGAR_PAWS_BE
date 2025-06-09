/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaClient, Prisma } from '@prisma/client';
import { promises as fs } from 'fs';

const prisma = new PrismaClient();

// Define interfaces based on your JSON structure for better type safety
interface ProductDetailJson {
  id: number; // Note: We won't use this ID for Prisma's auto-increment ID
  title: string;
  option1?: string | null; // Can be null or string
  option2?: string | null;
  option3?: string | null;
  sku: string;
  requires_shipping: boolean;
  taxable: boolean;
  featured_image?: {
    id: number; // Not used for Prisma ID
    product_id: number; // Not used
    position: number; // Not used
    alt: string | null; // Not used
    width: number; // Not used
    height: number; // Not used
    src: string; // The image URL
    variant_ids: number[]; // Not used
  } | null; // Can be null or object
  name: string; // Redundant with title, often variant full name
  public_title: string | null; // Redundant with title
  options: string[]; // e.g., ["Red"] or ["Default Title"]
  price: number; // Assuming this is price in cents
  weight: number; // Not used in Prisma schema currently
  inventory_quantity: number;
  featured_media?: {
    // Similar to featured_image, might be redundant or different format
    alt: string | null; // Not used
    id: number; // Not used
    position: number; // Not used
    preview_image: {
      aspect_ratio: number; // Not used
      height: number; // Not used
      width: number; // Not used
      src: string; // Image URL
    };
    aspect_ratio: number; // Not used
    height: number; // Not used
    media_type: string; // Not used
    src: string; // Image URL
    width: number; // Not used
  } | null; // Can be null or object
}

interface ProductJson {
  id: number; // Not used for Prisma ID
  title: string;
  handle: string; // Not used in Prisma schema currently
  description: string;
  vendor: string;
  type: string; // Single category name string
  tags: string[];
  price: number; // Appears to be base product price, but detail price is also present. Using detail price.
  productDetail: ProductDetailJson[];
  images: string[]; // Array of image URLs
  featured_image: string; // Primary image URL, redundant with displayImage
  options: string[]; // e.g., ["Color"] or ["Size"] or ["Title"]
  media: any[]; // Array of media objects - contains more image info
  selling_plan_groups: any[]; // Not used
  content: string; // Often same as description, sometimes more HTML
  sourceUrl: string; // Not used in Prisma schema currently
}

export async function seedProducts(fileAddress: string) {
  try {
    console.log('🌱 Starting product seeding...');
    // 'src/data/accessories_details.json';

    // 1. Read the JSON file
    const data = await fs.readFile(fileAddress, 'utf8');
    const products: ProductJson[] = JSON.parse(data);

    for (const item of products) {
      console.log(`Processing product: "${item.title}"`);

      // --- Handle Category ---
      // Find or create the category
      const categoryName = item.type.toLowerCase() || 'uncategorized'; // Default category if none specified
      const category = await prisma.category.upsert({
        where: { name: categoryName },
        create: { name: categoryName },
        update: { name: categoryName }, // Ensure name is correct even if found
      });

      // --- Create Product ---
      const createdProduct = await prisma.product.create({
        data: {
          name: item.title,
          description:
            item.description || item.content || 'No description provided.', // Use description or content
          vendor: item.vendor || 'Unknown Vendor',
          tags: item.tags || [],
          displayImage:
            item.images || (item.featured_image ? [item.featured_image] : []), // Use images array, fallback to featured_image
        },
      });

      // --- Link Product to Category (ProductCategory) ---
      await prisma.productCategory.create({
        data: {
          productId: createdProduct.id,
          categoryId: category.id,
        },
      });

      // --- Create ProductDetails ---
      if (item.productDetail && Array.isArray(item.productDetail)) {
        for (const detail of item.productDetail) {
          console.log(`    Processing product detail: "${detail.title}"`);

          let imageId: number | null = null;
          // Handle Product Image for the detail
          if (detail.featured_image?.src) {
            const imageUrl = detail.featured_image.src.startsWith('http')
              ? detail.featured_image.src
              : `https:${detail.featured_image.src}`; // Ensure full URL

            try {
              const productImage = await prisma.productImage.upsert({
                where: { url: imageUrl },
                create: { url: imageUrl },
                update: {}, // No update needed if image exists
              });
              imageId = productImage.id;
              console.log(
                `      Product Image (ID: ${imageId}) handled for URL: ${imageUrl}`,
              );
            } catch (imageError) {
              console.error(
                `      Error handling Product Image for URL ${imageUrl}:`,
                imageError,
              );
              // Continue without linking image if creation/find fails
              imageId = null;
            }
          } else if (detail.featured_media?.preview_image?.src) {
            // Fallback to featured_media if featured_image is null
            const imageUrl = detail.featured_media.preview_image.src.startsWith(
              'http',
            )
              ? detail.featured_media.preview_image.src
              : `https:${detail.featured_media.preview_image.src}`; // Ensure full URL

            try {
              const productImage = await prisma.productImage.upsert({
                where: { url: imageUrl },
                create: { url: imageUrl },
                update: {},
              });
              imageId = productImage.id;
            } catch (imageError) {
              console.error(
                `      Error handling Product Image for URL ${imageUrl} (from media):`,
                imageError,
              );
              imageId = null;
            }
          }

          // Determine size and color from options
          let size: string | null = null;
          let color: string | null = null;
          let type: string | null = null;

          color = detail.option1 || null;
          size = detail.option2 || null;
          type = detail.option3 || null;

          // Create the ProductDetail
          await prisma.productDetail.create({
            data: {
              productId: createdProduct.id,
              size: size,
              color: color,
              type: type,
              stock: detail.inventory_quantity || 0,
              price: (detail.price || 0) / 100, // Assume price is in cents, convert to dollars
              sale: Math.floor(Math.random() * 100), // Default to 0 as per schema
              discountPercentage: 0, // Default to 0 as per schema
              imageId: imageId, // Link to the handled image (can be null)
            },
          });
        }
      } else {
        console.warn(`  Product "${item.title}" has no productDetail array.`);
      }
    }

    console.log('✅ Seed products and details completed successfully.');
  } catch (error) {
    console.error('❌ Error while seeding products:', error);
    // Add more specific error logging for debugging
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma Error Code:', error.code);
      console.error('Prisma Error Meta:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Note: You'll typically call seedProducts() from your main seed file (e.g., seed.ts)
// Example:
// import { seedProducts } from './seedProducts'; // Adjust path as necessary
// async function main() {
//   await seedProducts();
// }
// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
