import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';

// Load env
config();

console.log('Environment loaded');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

try {
  console.log('Importing server...');
  await import('./server/index.ts');
  console.log('Server imported successfully');
} catch (error) {
  console.error('Server startup error:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}
