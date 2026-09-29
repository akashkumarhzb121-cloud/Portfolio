import { setDefaultResultOrder } from 'node:dns';
import type { Server } from 'node:http';

setDefaultResultOrder('ipv4first');

const [{ app }, { connectDB, disconnectDB }, { env }] = await Promise.all([
  import('./app.js'),
  import('./config/db.js'),
  import('./config/env.js')
]);

let server: Server | null = null;

async function startServer(): Promise<void> {
  try {
    // 1. Establish database connection
    console.log('🔄 Initializing MongoDB connection...');
    await connectDB();

    // 2. Start HTTP server
    server = app.listen(env.PORT, () => {
      console.log(`\n=============================================`);
      console.log(`🚀 Portfolio Backend running on port ${env.PORT}`);
      console.log(`🌐 Environment: ${env.NODE_ENV}`);
      console.log(`🏥 Health check: http://localhost:${env.PORT}/health`);
      console.log(`📬 Contact API: http://localhost:${env.PORT}/api/contact`);
      console.log(`🛡️ Allowed Origins: ${env.FRONTEND_ORIGINS.join(', ')}`);
      console.log(`=============================================\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function handleShutdown(signal: string): Promise<void> {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('🔌 HTTP server closed.');
      try {
        await disconnectDB();
        console.log('🍃 MongoDB connection closed.');
        process.exit(0);
      } catch (err) {
        console.error('Error during database disconnect:', err);
        process.exit(1);
      }
    });

    // Force exit after 10 seconds if graceful close hangs
    setTimeout(() => {
      console.error('⏰ Forcing server shutdown after timeout.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

startServer();
