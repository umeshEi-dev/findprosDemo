import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/db.js';

const port = process.env.PORT || 5000;

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`API server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Unable to start API server:', error.message);
    process.exit(1);
  });
