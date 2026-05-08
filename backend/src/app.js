import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { requireAuth } from './middleware/auth.middleware.js';
import locationRoutes from './routes/location.routes.js';
import taskLocationRoutes from './routes/task-location.routes.js';
import taskRoutes from './routes/task.routes.js';
import zipcodeRoutes from './routes/zipcode.routes.js';

const app = express();
const allowedOrigins = new Set([
  process.env.CLIENT_ORIGIN || 'http://localhost:4200',
  'http://localhost:4200',
  'http://127.0.0.1:4200'
]);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    }
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', requireAuth, categoryRoutes);
app.use('/api/tasks', requireAuth, taskRoutes);
app.use('/api', requireAuth, locationRoutes);
app.use('/api', requireAuth, zipcodeRoutes);
app.use('/api', requireAuth, taskLocationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
