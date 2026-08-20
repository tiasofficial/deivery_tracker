import app from './app';
import { env } from './config/env';

const startServer = () => {
  app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port} in ${env.nodeEnv} mode`);
  });
};

startServer();
