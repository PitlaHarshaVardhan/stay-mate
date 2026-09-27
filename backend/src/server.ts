import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profile/profile.routes';
import preferencesRoutes from './modules/preferences/preferences.routes';
import matchingRoutes from './modules/matching/matching.routes';
import connectionsRoutes from './modules/connections/connections.routes';
import groupsRoutes from './modules/groups/groups.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import reportsRoutes from './modules/reports/reports.routes';
import blocksRoutes from './modules/blocks/blocks.routes';
import propertiesRoutes from './modules/properties/properties.routes';
import verificationRoutes from './modules/verification/verification.routes';
import chatRoutes from './modules/chat/chat.routes';
import reviewsRoutes from './modules/reviews/reviews.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'StayMate API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/blocks', blocksRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewsRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`StayMate backend running on http://localhost:${config.port}`);
});
