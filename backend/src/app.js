import cors from 'cors';
import express from 'express';
import categoryRoutes from './routes/category.routes.js';
import taskRoutes from './routes/task.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:4200'
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/categories', categoryRoutes);
app.use('/api/tasks', taskRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
