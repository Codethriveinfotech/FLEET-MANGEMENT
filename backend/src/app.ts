import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorMiddleware } from './middlewares/error';
import { logger } from './utils/logger';
import notificationRoutes from './routes/notificationRoutes';
import authRoutes from './routes/authRoutes';

// Load environmental variables
dotenv.config();

const app = express();

// Rate limiter for safety
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});

// Configure Middlewares
app.set('trust proxy', 1); // Trust Render load balancer to get real IPs
app.use(cors());
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug Request Logger
app.use((req, res, next) => {
  console.log(`[INCOMING] ${req.method} ${req.url}`);
  next();
});

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

import apiRoutes from './routes/api';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api', apiRoutes);

// Global Error Handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`FleetTrack Backend server is running on port ${PORT}`);
  });
}

export default app;
