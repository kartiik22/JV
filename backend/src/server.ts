import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import visionRoutes from './routes/visionRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { isAiConfigured } from './services/visionService.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const clientOrigin = process.env.CLIENT_ORIGIN || '*';

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
  })
);

app.use(
  cors({
    origin: clientOrigin === '*' ? true : clientOrigin.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    maxAge: 86400,
  })
);

// Vision uploads can be a few MB; keep body parsers small (multipart uses multer)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use((req, _res, next) => {
  if (req.path.startsWith('/api/vision')) {
    console.log(`[sight-ai] ${req.method} ${req.path}`);
  }
  next();
});

app.get('/', (_req, res) => {
  res.json({
    name: 'Sight AI Backend',
    endpoints: ['GET /api/health', 'POST /api/vision/analyze', 'POST /api/vision/ask'],
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'sight-ai-backend',
    aiConfigured: isAiConfigured(),
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/vision', visionRoutes);

app.use(errorHandler);

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Sight AI backend listening on http://0.0.0.0:${port}`);
  console.log(`AI configured: ${isAiConfigured() ? 'yes' : 'NO — set AI_API_KEY in backend/.env'}`);
  console.log(`Model: ${process.env.AI_MODEL || 'gpt-4o-mini'}`);
});

// Vision calls to OpenRouter can take 30–90s — keep sockets alive
server.headersTimeout = 120_000;
server.requestTimeout = 120_000;
server.keepAliveTimeout = 120_000;
server.timeout = 120_000;
