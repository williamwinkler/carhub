# Database Migrations

This directory contains TypeORM migrations for the CarHub database schema.

## Available Commands

### Generate a new migration
Automatically generates a migration by comparing your entities with the current database schema:
```bash
pnpm --filter api migrations:generate migrations/MigrationName
```

### Create a blank migration
Creates an empty migration file for manual SQL:
```bash
pnpm --filter api migrations:create migrations/MigrationName
```

### Run pending migrations
Executes all pending migrations:
```bash
pnpm --filter api migrations:run
```

### Revert last migration
Reverts the most recently executed migration:
```bash
pnpm --filter api migrations:revert
```

### Show migration status
Shows which migrations have been executed:
```bash
pnpm --filter api migrations:show
```

## Migration Files

- **1760640865984-InitialSchema.ts** - Initial database schema with all tables:
  - `users` - User accounts with roles and authentication
  - `car_manufacturers` - Car manufacturer data
  - `car_models` - Car models linked to manufacturers
  - `cars` - Individual car listings
  - `user_favorite_cars` - Junction table for user favorites

## Development Workflow

1. **Make changes to entities** in `src/modules/**/entities/`
2. **Generate migration**: `pnpm --filter api migrations:generate migrations/DescriptiveName`
3. **Review generated SQL** in the new migration file
4. **Run migration**: `pnpm --filter api migrations:run`
5. **Test changes** with `pnpm --filter api dev`

## Important Notes

- Migrations run in order based on their timestamp prefix
- Always review generated migrations before running them
- Use descriptive names for migrations (e.g., `AddUserEmailField`, `CreateProductsTable`)
- The database must be running before generating or running migrations
- Start the database with: `docker-compose up -d db`

## Fresh Database Setup

To set up a fresh database with all migrations:

```bash
# Start database
docker-compose up -d db

# Run all migrations
pnpm --filter api migrations:run

# Seed with sample data
pnpm --filter api seed
```

## Troubleshooting

### "Cannot find module '@api/...'"
This error occurs when TypeORM CLI can't resolve path aliases. The `data-source.ts` file is configured to handle this automatically using `tsconfig-paths`.

### "password authentication failed"
Ensure your `.env.local` file has the correct database credentials matching `docker-compose.yml`.

### "relation already exists"
The migration is trying to create tables that already exist. Either:
- Drop the existing schema: `pnpm --filter api schema:drop`
- Or manually remove conflicting tables from the database
