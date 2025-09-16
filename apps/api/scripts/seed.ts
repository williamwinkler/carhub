import * as bcrypt from "bcrypt";
import { config } from "dotenv";
import { AppDataSource } from "../data-source";

// Load environment variables
config({ quiet: true });

async function seed() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log("Connected to database");

    // Check if we're in production
    if (process.env.NODE_ENV === "production") {
      console.log("❌ Seeding is not allowed in production environment");
      process.exit(1);
    }

    console.log("🌱 Starting database seeding...");

    // Clear existing data (development only)
    await AppDataSource.query('DELETE FROM "car_models"');
    await AppDataSource.query('DELETE FROM "car_manufacturers"');
    await AppDataSource.query(
      'DELETE FROM "users" WHERE "username" = \'admin\'',
    );
    console.log("🧹 Cleared existing seed data");

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await AppDataSource.query(
      `
      INSERT INTO "users" ("id", "role", "firstName", "lastName", "username", "password", "createdAt", "updatedAt")
      VALUES (
        '550e8400-e29b-41d4-a716-446655440000',
        'admin',
        'Admin',
        'User',
        'admin',
        $1,
        NOW(),
        NOW()
      )
    `,
      [hashedPassword],
    );
    console.log("👤 Created admin user (username: admin, password: admin123)");

    // Insert car manufacturers
    await AppDataSource.query(`
      INSERT INTO "car_manufacturers" ("id", "name", "created_at", "updated_at")
      VALUES
        ('550e8400-e29b-41d4-a716-446655440001', 'Toyota', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440002', 'Honda', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440003', 'Ford', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440004', 'BMW', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440005', 'Mercedes-Benz', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440006', 'Audi', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440007', 'Volkswagen', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440008', 'Nissan', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440009', 'Hyundai', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-44665544000a', 'Tesla', NOW(), NOW())
    `);
    console.log("🏭 Created 10 car manufacturers");

    // Insert car models for each manufacturer
    const modelInserts = [
      // Toyota models
      `INSERT INTO "car_models" ("id", "name", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440001', 'Camry', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440002', 'Corolla', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440003', 'Prius', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440004', 'RAV4', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440005', 'Highlander', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW())`,

      // Honda models
      `INSERT INTO "car_models" ("id", "name", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440006', 'Civic', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440007', 'Accord', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440008', 'CR-V', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440009', 'Pilot', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544000a', 'Fit', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW())`,

      // Ford models
      `INSERT INTO "car_models" ("id", "name", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-44665544000b', 'F-150', '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544000c', 'Mustang', '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544000d', 'Explorer', '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544000e', 'Focus', '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544000f', 'Escape', '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW())`,

      // BMW models
      `INSERT INTO "car_models" ("id", "name", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440010', '3 Series', '550e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440011', '5 Series', '550e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440012', 'X3', '550e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440013', 'X5', '550e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440014', 'X1', '550e8400-e29b-41d4-a716-446655440004', NOW(), NOW())`,

      // Mercedes-Benz models
      `INSERT INTO "car_models" ("id", "name", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440015', 'C-Class', '550e8400-e29b-41d4-a716-446655440005', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440016', 'E-Class', '550e8400-e29b-41d4-a716-446655440005', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440017', 'S-Class', '550e8400-e29b-41d4-a716-446655440005', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440018', 'GLC', '550e8400-e29b-41d4-a716-446655440005', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440019', 'GLE', '550e8400-e29b-41d4-a716-446655440005', NOW(), NOW())`,

      // Audi models
      `INSERT INTO "car_models" ("id", "name", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-44665544001a', 'A3', '550e8400-e29b-41d4-a716-446655440006', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544001b', 'A4', '550e8400-e29b-41d4-a716-446655440006', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544001c', 'A6', '550e8400-e29b-41d4-a716-446655440006', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544001d', 'Q3', '550e8400-e29b-41d4-a716-446655440006', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544001e', 'Q5', '550e8400-e29b-41d4-a716-446655440006', NOW(), NOW())`,

      // Volkswagen models
      `INSERT INTO "car_models" ("id", "name", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-44665544001f', 'Golf', '550e8400-e29b-41d4-a716-446655440007', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440020', 'Jetta', '550e8400-e29b-41d4-a716-446655440007', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440021', 'Passat', '550e8400-e29b-41d4-a716-446655440007', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440022', 'Tiguan', '550e8400-e29b-41d4-a716-446655440007', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440023', 'Atlas', '550e8400-e29b-41d4-a716-446655440007', NOW(), NOW())`,

      // Nissan models
      `INSERT INTO "car_models" ("id", "name", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440024', 'Altima', '550e8400-e29b-41d4-a716-446655440008', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440025', 'Sentra', '550e8400-e29b-41d4-a716-446655440008', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440026', 'Rogue', '550e8400-e29b-41d4-a716-446655440008', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440027', 'Pathfinder', '550e8400-e29b-41d4-a716-446655440008', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440028', '370Z', '550e8400-e29b-41d4-a716-446655440008', NOW(), NOW())`,

      // Hyundai models
      `INSERT INTO "car_models" ("id", "name", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440029', 'Elantra', '550e8400-e29b-41d4-a716-446655440009', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544002a', 'Sonata', '550e8400-e29b-41d4-a716-446655440009', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544002b', 'Tucson', '550e8400-e29b-41d4-a716-446655440009', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544002c', 'Santa Fe', '550e8400-e29b-41d4-a716-446655440009', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544002d', 'Genesis', '550e8400-e29b-41d4-a716-446655440009', NOW(), NOW())`,

      // Tesla models
      `INSERT INTO "car_models" ("id", "name", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-44665544002e', 'Model 3', '550e8400-e29b-41d4-a716-44665544000a', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544002f', 'Model Y', '550e8400-e29b-41d4-a716-44665544000a', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440030', 'Model S', '550e8400-e29b-41d4-a716-44665544000a', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440031', 'Model X', '550e8400-e29b-41d4-a716-44665544000a', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440032', 'Cybertruck', '550e8400-e29b-41d4-a716-44665544000a', NOW(), NOW())`,
    ];

    // Execute all model inserts
    for (const insert of modelInserts) {
      await AppDataSource.query(insert);
    }

    console.log("🚗 Created 50 car models across all manufacturers");

    console.log("✅ Database seeding completed successfully!");
    console.log("📊 Summary:");
    console.log("  - 1 admin user (username: admin, password: admin123)");
    console.log("  - 10 car manufacturers");
    console.log("  - 50 car models (5 per manufacturer)");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  } finally {
    // Close the connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run the seed function
void seed();
