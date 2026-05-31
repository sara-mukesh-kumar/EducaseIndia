require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB, initializeDB } = require('./config/database');
const profileRoutes = require('./routes/profileRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security & Middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ─── Routes ─────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🐙 GitHub Profile Analyzer API',
    version: '1.0.0',
    endpoints: {
      analyze: 'POST /api/profiles/analyze/:username',
      list: 'GET /api/profiles?page=1&limit=10&search=',
      single: 'GET /api/profiles/:username',
      delete: 'DELETE /api/profiles/:username',
      stats: 'GET /api/profiles/stats/summary',
      health: 'GET /health',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/profiles', profileRoutes);

// ─── 404 & Error Handling ────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Bootstrap ───────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  await initializeDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📖 API docs at http://localhost:${PORT}/\n`);
  });
};

start();
