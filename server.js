require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const i18n = require('./i18n');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

if (!process.env.SESSION_SECRET) {
  console.warn('VIÐVÖRUN: SESSION_SECRET vantar í .env. Notar tímabundið leyndarmál (sessions deyja við restart).');
}

app.use(session({
  store: new MemoryStore({ checkPeriod: 24 * 60 * 60 * 1000 }),
  secret: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 30
  }
}));

app.use(i18n.middleware);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('layout', {
    title: res.locals.t('error.404.title'),
    bodyTemplate: '404',
    bodyData: {}
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('layout', {
    title: res.locals.t('error.500.title'),
    bodyTemplate: '500',
    bodyData: { message: process.env.NODE_ENV === 'production' ? null : err.message }
  });
});

app.listen(PORT, () => {
  console.log(`Trans vinir vefur keyrir á http://localhost:${PORT}`);
});
