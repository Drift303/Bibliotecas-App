require('dotenv').config();
const dns = require('dns');
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
const tenantRoutes = require('./src/routes/tenantRoutes');
const departmentRoutes = require('./src/routes/departmentRoutes');
const billingRoutes = require('./src/routes/billingRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

const app = express();

// Railway no tiene salida IPv6 funcional. Sin esto, Node puede preferir
// resultados IPv6 al resolver dominios externos (Gmail SMTP, Mercado Pago,
// etc.) y fallar con ENETUNREACH o colgarse hasta el timeout. Esto es un
// respaldo global además del `family: 4` explícito en emailService.js.
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

// ⬇️ AGREGAR ESTA LÍNEA (ANTES de los middlewares)
app.set('trust proxy', 1);

app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());


const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) 
  : ['http://localhost:3000', 'http://localhost:5173'];


console.log("Orígenes permitidos cargados:", allowedOrigins);


app.use(cors({ 
  origin: function (origin, callback) {
 
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`🚨 CORS BLOQUEADO: El origen '${origin}' intentó acceder.`);
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true 
}));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 150 });
app.use(limiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportRoutes);

// global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 3001;
// Temporary Fix para libros masivos
prisma.book.updateMany({
  where: { available: false, loans: { none: { status: 'ACTIVE' } } },
  data: { available: true }
}).then(res => console.log('Libros reparados (available=true):', res)).catch(err => console.error(err));

app.listen(port, () => console.log(`Backend listening on port ${port}`));
