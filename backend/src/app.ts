import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api', routes);

// Health check — keeps Render server alive via cron job ping
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'DeliveryTracker API is running' });
});

app.use(errorHandler);

export default app;
