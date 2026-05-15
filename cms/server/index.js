import 'dotenv/config';
import express from 'express';
import { fileRoutes } from './routes/files.js';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', fileRoutes());
  return app;
}

const port = process.env.API_PORT || 3001;
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp();
  app.listen(port, () => {
    console.log(`Garden CMS API listening on port ${port}`);
  });
}
