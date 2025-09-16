# TypeORM Migrations Guide

This guide covers the TypeORM migration setup and best practices for the API.

## Setup Overview

TypeORM migrations are fully configured with the following components:

- **Data Source Configuration**: `data-source.ts` - Top-level CLI configuration for migrations
- **Migration Directory**: `migrations/` - Top-level directory where migration files are stored
- **Migration Scripts**: Available in `package.json` for common operations

## Available Commands

### Core Migration Commands

```bash
# Generate a new migration based on entity changes (RECOMMENDED)
pnpm migrations:generate migrations/MigrationName

# Create an empty migration file (for manual migrations)
pnpm migrations:create migrations/MigrationName

# Run pending migrations
pnpm migrations:run

# Revert the last executed migration
pnpm migrations:revert

# Show migration status
pnpm migrations:show
```

### Schema Utilities

```bash
# Synchronize schema (use only in development)
pnpm schema:sync

# Drop entire schema (destructive!)
pnpm schema:drop
```

## Migration Workflow

### 1. Development Workflow

#### Automatic Migration Generation (Recommended)

TypeORM can automatically generate migrations by comparing your entities with the current database:

1. **Modify Entity**: Update your TypeORM entity files
2. **Generate Migration**: Run `pnpm migrations:generate migrations/DescriptiveName`
3. **Review Migration**: Check the generated SQL in the migration file
4. **Test Migration**: Run `pnpm migrations:run` in development
5. **Test Rollback**: Verify `pnpm migrations:revert` works correctly

#### How Auto-Generation Works

TypeORM compares your current entity definitions with the existing database schema and generates:
- **Table Changes**: New/dropped tables
- **Column Changes**: Added/removed/modified columns
- **Index Changes**: New/dropped indexes
- **Constraint Changes**: Foreign keys, unique constraints, check constraints
- **Enum Changes**: New enum values or types

**Example:** Adding a new column to the Car entity:

```typescript
// In car.entity.ts
@Column({ nullable: true })
description?: string;
```

Running `pnpm migrations:generate migrations/AddCarDescription` produces:

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cars" ADD "description" character varying`);
}

public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "description"`);
}
```

#### Auto-Generation Benefits & Limitations

**✅ What Auto-Generation Handles Well:**
- Adding/removing columns
- Changing column types and constraints
- Adding/removing tables
- Foreign key relationships
- Index creation/removal
- Enum changes

**⚠️ When to Use Manual Migrations:**
- Data transformations during column changes
- Complex data migrations
- Custom SQL procedures or functions
- Performance-critical migrations requiring specific ordering
- Renaming columns (TypeORM sees this as drop + add)

**Best Practice:** Use auto-generation for schema changes, manual migrations for data operations.

#### Manual Migration Creation

For complex changes that can't be auto-detected, use `pnpm migrations:create migrations/CustomMigrationName`

### 2. Production Deployment

#### Initial Production Setup

For **first-time production deployment**, TypeORM will NOT automatically create tables because `synchronize: false` is configured for safety. You must run migrations manually:

```bash
# 1. Set production environment variables
export NODE_ENV=production
export POSTGRES_HOST=your-prod-host
export POSTGRES_PORT=5432
export POSTGRES_DATABASE=your-prod-database
export POSTGRES_USERNAME=your-prod-user
export POSTGRES_PASSWORD=your-prod-password

# 2. Run the initial migration to create all tables
pnpm migrations:run
```

The `InitialMigration` includes:
- All entity tables (`users`, `cars`, `car_manufacturers`, `car_models`)
- Foreign key relationships and constraints
- Indexes for performance optimization
- UUID extension setup
- Enum types (user roles)

#### Ongoing Production Deployments

1. **Test Locally**: Ensure migrations run successfully locally
2. **Backup Database**: Always backup production data before migrations
3. **Run Migrations**: Execute `pnpm migrations:run` in production
4. **Verify Schema**: Check that the schema matches expectations

## Best Practices

### Migration File Structure

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserProfileTable1234567890 implements MigrationInterface {
    name = 'AddUserProfileTable1234567890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Forward migration - add/modify schema
        await queryRunner.query(`
            CREATE TABLE "user_profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "bio" character varying,
                "avatar_url" character varying,
                "user_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_profiles" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "user_profiles"
            ADD CONSTRAINT "FK_user_profiles_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverse migration - undo changes
        await queryRunner.query(`DROP TABLE "user_profiles"`);
    }
}
```

### Naming Conventions

- **Descriptive Names**: Use clear, descriptive migration names
  - ✅ `AddUserProfileTable`
  - ✅ `UpdateCarEntityAddColor`
  - ❌ `Migration1` or `Update`

- **Action-Oriented**: Start with the action being performed
  - `Add...`, `Update...`, `Remove...`, `Create...`, `Drop...`

### Safe Migration Practices

1. **Reversible Migrations**: Always implement both `up()` and `down()` methods
2. **Data Preservation**: Consider data migration when changing column types
3. **Index Management**:
   - With `synchronize: false`, TypeORM does NOT create any indexes automatically
   - Migrations must include all indexes that TypeORM would create with `synchronize: true`
   - Include indexes for foreign keys, unique constraints, and junction tables
   - Create indexes after data insertion for better performance
4. **Constraint Handling**: Add constraints after data validation

### Common Patterns

#### Adding a New Column
```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "users"
        ADD "phone_number" character varying
    `);
}

public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "users"
        DROP COLUMN "phone_number"
    `);
}
```

#### Data Migration
```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new column
    await queryRunner.query(`
        ALTER TABLE "users"
        ADD "full_name" character varying
    `);

    // Migrate existing data
    await queryRunner.query(`
        UPDATE "users"
        SET "full_name" = CONCAT("first_name", ' ', "last_name")
        WHERE "first_name" IS NOT NULL AND "last_name" IS NOT NULL
    `);
}
```

## Configuration Details

### Environment Variables

Migrations use the same database configuration as the application:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=trpc_demo
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=postgres
```

### Data Source Configuration

The `data-source.ts` file configures:

- **Entity Discovery**: Automatically finds entities using glob patterns
- **Migration Path**: Points to `migrations/*.ts`
- **Environment Handling**: Different settings for development/production
- **SSL Configuration**: Enabled for production environments

## Troubleshooting

### Common Issues

1. **"No changes found"**: Database is already synchronized with entities
   - Use `pnpm migration:create` for manual migrations
   - Check if `synchronize: true` is enabled (should be `false` in production)

2. **Module resolution errors**: Import paths using `@api/` alias
   - Ensure entity files use relative imports for CLI compatibility
   - Check that all entities are properly exported

3. **Migration fails to run**: SQL syntax or constraint errors
   - Review generated SQL for correctness
   - Test migration in development environment first
   - Check database permissions

### Debug Mode

Enable detailed logging by setting `logging: true` in data source configuration or:

```bash
NODE_ENV=development pnpm migration:run
```

## Integration with NestJS

The migration system works alongside the NestJS TypeORM configuration:

- **Development**: Use `synchronize: true` for rapid prototyping
- **Production**: Always use `synchronize: false` and rely on migrations
- **Testing**: Consider separate migration strategy for test databases

## Initial Migration Details

The project includes a comprehensive `InitialMigration` that creates the complete database schema:

### Tables Created
- **users**: User accounts with role-based access control
- **car_manufacturers**: Vehicle manufacturer data
- **car_models**: Vehicle model data linked to manufacturers
- **cars**: Individual vehicle listings
- **user_favorite_cars**: Many-to-many relationship for user favorites

### Key Features
- **UUID Primary Keys**: All tables use UUID for better distributed system support
- **Audit Columns**: `createdAt`, `updatedAt`, `deletedAt` for all entities
- **Soft Deletes**: Users and cars support soft deletion
- **Foreign Key Constraints**: Proper referential integrity with cascade options
- **Essential Indexes**: Includes all indexes TypeORM would create with `synchronize: true`
- **Enum Types**: Type-safe role enumeration for users

### Schema Validation

After running the initial migration, verify your schema:

```bash
# Check migration status
pnpm migrations:show

# Connect to your database and verify tables exist
psql -h $POSTGRES_HOST -U $POSTGRES_USERNAME -d $POSTGRES_DATABASE -c "\dt"
```

Remember: Migrations provide version control for your database schema and should be treated as carefully as your code!