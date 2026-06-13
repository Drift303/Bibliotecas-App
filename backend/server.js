require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const prisma = require('./src/config/prismaClient');

const authRoutes = require('./src/routes/authRoutes');
const syncRoutes = require('./src/routes/syncRoutes');
const bookRoutes = require('./src/routes/bookRoutes');
const loanRoutes = require('./src/routes/loanRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 150 });
app.use(limiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/users', userRoutes);

app.get('/api/test-db', async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: 'asc' } });
    res.json({ success: true, tenants });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

// global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Backend listening on port ${port}`));
