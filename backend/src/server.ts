import { env } from './config/env';
import app from './app';

const startServer = () => {
  app.listen(env.PORT, () => {
    console.log(`🚀 Server is running on port ${env.PORT}`);
  });
};

startServer();
