-- Create databases for development and testing
-- This script runs when the PostgreSQL container starts up

-- Create development database (if not exists - should already be created by POSTGRES_DB)
CREATE DATABASE demo_db;

-- Create test database for integration tests
CREATE DATABASE demo_test_db;