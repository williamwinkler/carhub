import { config } from 'dotenv';
import { join } from 'path';

// Load test environment variables
config({
  path: join(__dirname, '.env.test'),
  override: true, // Override any existing env vars with test values
  quiet: true,
});
