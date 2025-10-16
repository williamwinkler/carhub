import * as bcrypt from "bcrypt";
import { config } from "dotenv";
import { slug } from "github-slugger";
import "reflect-metadata";
import { AppDataSource } from "../data-source";

// Load environment variables
config({ path: ".env.local", quiet: true });

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
      "DELETE FROM \"users\" WHERE \"username\" IN ('admin', 'jondoe')",
    );
    console.log("🧹 Cleared existing seed data");

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash("admin", 10);
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
      [hashedAdminPassword],
    );
    console.log("👤 Created admin user (username: admin, password: admin123)");

    // Create Jon Doe user
    const hashedJonPassword = await bcrypt.hash("jondoe", 10);
    await AppDataSource.query(
      `
      INSERT INTO "users" ("id", "role", "firstName", "lastName", "username", "password", "createdAt", "updatedAt")
      VALUES (
        '550e8400-e29b-41d4-a716-446655440999',
        'user',
        'Jon',
        'Doe',
        'jondoe',
        $1,
        NOW(),
        NOW()
      )
    `,
      [hashedJonPassword],
    );
    console.log(
      "👤 Created Jon Doe user (username: jondoe, password: password123)",
    );

    // Insert car manufacturers
    await AppDataSource.query(`
      INSERT INTO "car_manufacturers" ("id", "name", "slug", "created_at", "updated_at")
      VALUES
        ('550e8400-e29b-41d4-a716-446655440001', 'Toyota', '${slug("Toyota")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440002', 'Honda', '${slug("Honda")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440003', 'Ford', '${slug("Ford")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440004', 'BMW', '${slug("BMW")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440005', 'Mercedes-Benz', '${slug("Mercedes-Benz")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440006', 'Audi', '${slug("Audi")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440007', 'Volkswagen', '${slug("Volkswagen")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440008', 'Nissan', '${slug("Nissan")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440009', 'Hyundai', '${slug("Hyundai")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-44665544000a', 'Tesla', '${slug("Tesla")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-44665544000b', 'Chevrolet', '${slug("Chevrolet")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-44665544000c', 'Mazda', '${slug("Mazda")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-44665544000d', 'Kia', '${slug("Kia")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-44665544000e', 'Subaru', '${slug("Subaru")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-44665544000f', 'Jeep', '${slug("Jeep")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440010', 'Porsche', '${slug("Porsche")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440011', 'Lexus', '${slug("Lexus")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440012', 'Volvo', '${slug("Volvo")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440013', 'Land Rover', '${slug("Land Rover")}', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440014', 'Jaguar', '${slug("Jaguar")}', NOW(), NOW())
    `);
    console.log("🏭 Created 20 car manufacturers");

    // Insert car models for each manufacturer
    const modelInserts = [
      // Toyota models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440001', 'Camry', '${slug("Camry")}', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440002', 'Corolla', '${slug("Corolla")}', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440003', 'Prius', '${slug("Prius")}', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440004', 'RAV4', '${slug("RAV4")}', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440005', 'Highlander', '${slug("Highlander")}', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW())`,

      // Honda models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440006', 'Civic', '${slug("Civic")}', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440007', 'Accord', '${slug("Accord")}', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440008', 'CR-V', '${slug("CR-V")}', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440009', 'Pilot', '${slug("Pilot")}', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544000a', 'Fit', '${slug("Fit")}', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW())`,

      // Ford models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-44665544000b', 'F-150', '${slug("F-150")}', '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544000c', 'Mustang', '${slug("Mustang")}', '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544000d', 'Explorer', '${slug("Explorer")}', '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544000e', 'Focus', '${slug("Focus")}', '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544000f', 'Escape', '${slug("Escape")}', '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW())`,

      // BMW models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440010', '3 Series', '${slug("3 Series")}', '550e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440011', '5 Series', '${slug("5 Series")}', '550e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440012', 'X3', '${slug("X3")}', '550e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440013', 'X5', '${slug("X5")}', '550e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440014', 'X1', '${slug("X1")}', '550e8400-e29b-41d4-a716-446655440004', NOW(), NOW())`,

      // Mercedes-Benz models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440015', 'C-Class', '${slug("C-Class")}', '550e8400-e29b-41d4-a716-446655440005', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440016', 'E-Class', '${slug("E-Class")}', '550e8400-e29b-41d4-a716-446655440005', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440017', 'S-Class', '${slug("S-Class")}', '550e8400-e29b-41d4-a716-446655440005', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440018', 'GLC', '${slug("GLC")}', '550e8400-e29b-41d4-a716-446655440005', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440019', 'GLE', '${slug("GLE")}', '550e8400-e29b-41d4-a716-446655440005', NOW(), NOW())`,

      // Audi models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-44665544001a', 'A3', '${slug("A3")}', '550e8400-e29b-41d4-a716-446655440006', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544001b', 'A4', '${slug("A4")}', '550e8400-e29b-41d4-a716-446655440006', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544001c', 'A6', '${slug("A6")}', '550e8400-e29b-41d4-a716-446655440006', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544001d', 'Q3', '${slug("Q3")}', '550e8400-e29b-41d4-a716-446655440006', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544001e', 'Q5', '${slug("Q5")}', '550e8400-e29b-41d4-a716-446655440006', NOW(), NOW())`,

      // Volkswagen models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-44665544001f', 'Golf', '${slug("Golf")}', '550e8400-e29b-41d4-a716-446655440007', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440020', 'Jetta', '${slug("Jetta")}', '550e8400-e29b-41d4-a716-446655440007', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440021', 'Passat', '${slug("Passat")}', '550e8400-e29b-41d4-a716-446655440007', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440022', 'Tiguan', '${slug("Tiguan")}', '550e8400-e29b-41d4-a716-446655440007', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440023', 'Atlas', '${slug("Atlas")}', '550e8400-e29b-41d4-a716-446655440007', NOW(), NOW())`,

      // Nissan models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440024', 'Altima', '${slug("Altima")}', '550e8400-e29b-41d4-a716-446655440008', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440025', 'Sentra', '${slug("Sentra")}', '550e8400-e29b-41d4-a716-446655440008', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440026', 'Rogue', '${slug("Rogue")}', '550e8400-e29b-41d4-a716-446655440008', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440027', 'Pathfinder', '${slug("Pathfinder")}', '550e8400-e29b-41d4-a716-446655440008', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440028', '370Z', '${slug("370Z")}', '550e8400-e29b-41d4-a716-446655440008', NOW(), NOW())`,

      // Hyundai models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440029', 'Elantra', '${slug("Elantra")}', '550e8400-e29b-41d4-a716-446655440009', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544002a', 'Sonata', '${slug("Sonata")}', '550e8400-e29b-41d4-a716-446655440009', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544002b', 'Tucson', '${slug("Tucson")}', '550e8400-e29b-41d4-a716-446655440009', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544002c', 'Santa Fe', '${slug("Santa Fe")}', '550e8400-e29b-41d4-a716-446655440009', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544002d', 'Genesis', '${slug("Genesis")}', '550e8400-e29b-41d4-a716-446655440009', NOW(), NOW())`,

      // Tesla models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-44665544002e', 'Model 3', '${slug("Model 3")}', '550e8400-e29b-41d4-a716-44665544000a', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544002f', 'Model Y', '${slug("Model Y")}', '550e8400-e29b-41d4-a716-44665544000a', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440030', 'Model S', '${slug("Model S")}', '550e8400-e29b-41d4-a716-44665544000a', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440031', 'Model X', '${slug("Model X")}', '550e8400-e29b-41d4-a716-44665544000a', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440032', 'Cybertruck', '${slug("Cybertruck")}', '550e8400-e29b-41d4-a716-44665544000a', NOW(), NOW())`,

      // Chevrolet models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440033', 'Silverado', '${slug("Silverado")}', '550e8400-e29b-41d4-a716-44665544000b', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440034', 'Malibu', '${slug("Malibu")}', '550e8400-e29b-41d4-a716-44665544000b', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440035', 'Equinox', '${slug("Equinox")}', '550e8400-e29b-41d4-a716-44665544000b', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440036', 'Tahoe', '${slug("Tahoe")}', '550e8400-e29b-41d4-a716-44665544000b', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440037', 'Corvette', '${slug("Corvette")}', '550e8400-e29b-41d4-a716-44665544000b', NOW(), NOW())`,

      // Mazda models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440038', 'Mazda3', '${slug("Mazda3")}', '550e8400-e29b-41d4-a716-44665544000c', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440039', 'Mazda6', '${slug("Mazda6")}', '550e8400-e29b-41d4-a716-44665544000c', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544003a', 'CX-5', '${slug("CX-5")}', '550e8400-e29b-41d4-a716-44665544000c', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544003b', 'CX-9', '${slug("CX-9")}', '550e8400-e29b-41d4-a716-44665544000c', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544003c', 'MX-5 Miata', '${slug("MX-5 Miata")}', '550e8400-e29b-41d4-a716-44665544000c', NOW(), NOW())`,

      // Kia models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-44665544003d', 'Forte', '${slug("Forte")}', '550e8400-e29b-41d4-a716-44665544000d', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544003e', 'Optima', '${slug("Optima")}', '550e8400-e29b-41d4-a716-44665544000d', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544003f', 'Sportage', '${slug("Sportage")}', '550e8400-e29b-41d4-a716-44665544000d', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440040', 'Sorento', '${slug("Sorento")}', '550e8400-e29b-41d4-a716-44665544000d', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440041', 'Telluride', '${slug("Telluride")}', '550e8400-e29b-41d4-a716-44665544000d', NOW(), NOW())`,

      // Subaru models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440042', 'Impreza', '${slug("Impreza")}', '550e8400-e29b-41d4-a716-44665544000e', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440043', 'Outback', '${slug("Outback")}', '550e8400-e29b-41d4-a716-44665544000e', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440044', 'Forester', '${slug("Forester")}', '550e8400-e29b-41d4-a716-44665544000e', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440045', 'Crosstrek', '${slug("Crosstrek")}', '550e8400-e29b-41d4-a716-44665544000e', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440046', 'WRX', '${slug("WRX")}', '550e8400-e29b-41d4-a716-44665544000e', NOW(), NOW())`,

      // Jeep models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440047', 'Wrangler', '${slug("Wrangler")}', '550e8400-e29b-41d4-a716-44665544000f', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440048', 'Grand Cherokee', '${slug("Grand Cherokee")}', '550e8400-e29b-41d4-a716-44665544000f', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440049', 'Cherokee', '${slug("Cherokee")}', '550e8400-e29b-41d4-a716-44665544000f', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544004a', 'Compass', '${slug("Compass")}', '550e8400-e29b-41d4-a716-44665544000f', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544004b', 'Gladiator', '${slug("Gladiator")}', '550e8400-e29b-41d4-a716-44665544000f', NOW(), NOW())`,

      // Porsche models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-44665544004c', '911', '${slug("911")}', '550e8400-e29b-41d4-a716-446655440010', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544004d', 'Cayenne', '${slug("Cayenne")}', '550e8400-e29b-41d4-a716-446655440010', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544004e', 'Macan', '${slug("Macan")}', '550e8400-e29b-41d4-a716-446655440010', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544004f', 'Panamera', '${slug("Panamera")}', '550e8400-e29b-41d4-a716-446655440010', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440050', 'Taycan', '${slug("Taycan")}', '550e8400-e29b-41d4-a716-446655440010', NOW(), NOW())`,

      // Lexus models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440051', 'ES', '${slug("ES")}', '550e8400-e29b-41d4-a716-446655440011', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440052', 'RX', '${slug("RX")}', '550e8400-e29b-41d4-a716-446655440011', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440053', 'NX', '${slug("NX")}', '550e8400-e29b-41d4-a716-446655440011', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440054', 'IS', '${slug("IS")}', '550e8400-e29b-41d4-a716-446655440011', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440055', 'GX', '${slug("GX")}', '550e8400-e29b-41d4-a716-446655440011', NOW(), NOW())`,

      // Volvo models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440056', 'S60', '${slug("S60")}', '550e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440057', 'S90', '${slug("S90")}', '550e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440058', 'XC60', '${slug("XC60")}', '550e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440059', 'XC90', '${slug("XC90")}', '550e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544005a', 'XC40', '${slug("XC40")}', '550e8400-e29b-41d4-a716-446655440012', NOW(), NOW())`,

      // Land Rover models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-44665544005b', 'Range Rover', '${slug("Range Rover")}', '550e8400-e29b-41d4-a716-446655440013', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544005c', 'Range Rover Sport', '${slug("Range Rover Sport")}', '550e8400-e29b-41d4-a716-446655440013', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544005d', 'Discovery', '${slug("Discovery")}', '550e8400-e29b-41d4-a716-446655440013', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544005e', 'Defender', '${slug("Defender")}', '550e8400-e29b-41d4-a716-446655440013', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-44665544005f', 'Evoque', '${slug("Evoque")}', '550e8400-e29b-41d4-a716-446655440013', NOW(), NOW())`,

      // Jaguar models
      `INSERT INTO "car_models" ("id", "name", "slug", "manufacturerId", "created_at", "updated_at")
       VALUES
         ('650e8400-e29b-41d4-a716-446655440060', 'F-PACE', '${slug("F-PACE")}', '550e8400-e29b-41d4-a716-446655440014', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440061', 'E-PACE', '${slug("E-PACE")}', '550e8400-e29b-41d4-a716-446655440014', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440062', 'XF', '${slug("XF")}', '550e8400-e29b-41d4-a716-446655440014', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440063', 'XE', '${slug("XE")}', '550e8400-e29b-41d4-a716-446655440014', NOW(), NOW()),
         ('650e8400-e29b-41d4-a716-446655440064', 'F-TYPE', '${slug("F-TYPE")}', '550e8400-e29b-41d4-a716-446655440014', NOW(), NOW())`,
    ];

    // Execute all model inserts
    for (const insert of modelInserts) {
      await AppDataSource.query(insert);
    }

    console.log("🚗 Created 100 car models across all manufacturers");

    // Create cars (2 per model, alternating between users)
    const adminUserId = "550e8400-e29b-41d4-a716-446655440000";
    const regularUserId = "550e8400-e29b-41d4-a716-446655440999";
    const colors = [
      "Red",
      "Blue",
      "Black",
      "White",
      "Silver",
      "Gray",
      "Green",
      "Yellow",
    ];
    const currentYear = new Date().getFullYear();

    // Get all model IDs from the database
    const models = await AppDataSource.query(
      'SELECT id FROM "car_models" ORDER BY "created_at" ASC',
    );

    const carInserts: string[] = [];
    let carIdCounter = 1;

    // Generate 2 cars for each model
    for (const model of models) {
      for (let carIndex = 0; carIndex < 2; carIndex++) {
        const carId = `750e8400-e29b-41d4-a716-${carIdCounter.toString(16).padStart(12, "0")}`;
        const userId = carIndex === 0 ? adminUserId : regularUserId;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const year = currentYear - Math.floor(Math.random() * 10); // 0-9 years old
        const kmDriven = Math.floor(Math.random() * 150000); // 0-150k km
        const price = Math.floor(15000 + Math.random() * 85000); // $15k-$100k

        carInserts.push(`
          ('${carId}', '${model.id}', ${year}, '${color}', ${kmDriven}, ${price}, '${userId}', NOW(), NOW())
        `);

        carIdCounter++;
      }
    }

    // Insert cars in batches of 100
    const batchSize = 100;
    for (let i = 0; i < carInserts.length; i += batchSize) {
      const batch = carInserts.slice(i, i + batchSize);
      await AppDataSource.query(`
        INSERT INTO "cars" ("id", "modelId", "year", "color", "kmDriven", "price", "createdById", "createdAt", "updatedAt")
        VALUES ${batch.join(",")}
      `);
    }

    console.log("✅ Database seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log("  - 1 admin user (username: admin, password: admin123)");
    console.log("  - 1 regular user (username: jondoe, password: password123)");
    console.log("  - 20 car manufacturers (with slugs)");
    console.log("  - 100 car models (5 per manufacturer, with slugs)");
    console.log("  - 200 cars (2 per model, 100 per user)");
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
