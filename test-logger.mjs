console.log('Starting logger test...');

try {
  const { logger } = await import('./server/lib/logger.js');
  console.log('Logger imported successfully');
  logger.info('Test log message');
  console.log('Logger works!');
} catch (error) {
  console.error('Logger error:', error);
  console.error('Stack:', error.stack);
}
