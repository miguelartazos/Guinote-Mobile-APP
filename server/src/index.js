import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { setupSocketHandlers } from './config/socket.js';
import authRoutes from './routes/auth.js';
import playerRoutes from './routes/player.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sanitizeInput } from './middleware/sanitizer.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { enforceHTTPS, trustProxy } from './middleware/httpsRedirect.js';
import helmet from 'helmet';

dotenv.config();

const app = express();

// Trust proxy for HTTPS detection
trustProxy(app);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:8081',
    credentials: true,
  },
});

// HTTPS enforcement (must be before other middleware)
app.use(enforceHTTPS);

// Security middleware - helmet first
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow Socket.IO
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// CORS middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:8081',
    credentials: true,
  }),
);

app.use(express.json({ limit: '10mb' }));

// Additional security middleware
app.use(apiLimiter);
app.use(sanitizeInput());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Try to connect to MongoDB but don't fail if it's not available
    try {
      await connectDatabase();
      console.log('✅ MongoDB connected');
    } catch (dbError) {
      console.warn('⚠️ MongoDB not available, continuing without database');
      console.warn('   Some features like authentication may not work');
    }

    await connectRedis();

    // Socket.io setup - after Redis is connected
    setupSocketHandlers(io);

    httpServer.listen(PORT, () => {
      console.log(`🎮 Guiñote server running on port ${PORT}`);
      console.log(`🌐 WebSocket server ready`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
