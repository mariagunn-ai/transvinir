const fs = require('fs');
const path = require('path');

const SUPPORTED = ['is', 'en'];
const DEFAULT_LANG = 'is';
const COOKIE_NAME = 'lang';
const COOKIE_MAX_AGE_DAYS = 365;

const locales = {};
for (const lang of SUPPORTED) {
  locales[lang] = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales', `${lang}.json`), 'utf8'));
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = decodeURIComponent(part.slice(idx + 1).trim());
    out[k] = v;
  }
  return out;
}

function pickLang(req) {
  const q = (req.query && req.query.lang || '').toLowerCase();
  if (SUPPORTED.includes(q)) return { lang: q, fromQuery: true };
  const cookies = parseCookies(req.headers.cookie);
  const c = (cookies[COOKIE_NAME] || '').toLowerCase();
  if (SUPPORTED.includes(c)) return { lang: c, fromQuery: false };
  return { lang: DEFAULT_LANG, fromQuery: false };
}

function middleware(req, res, next) {
  const { lang, fromQuery } = pickLang(req);
  req.lang = lang;
  res.locals.lang = lang;
  res.locals.otherLang = lang === 'is' ? 'en' : 'is';
  res.locals.t = (key) => (locales[lang] && locales[lang][key]) || (locales[DEFAULT_LANG][key]) || key;
  res.locals.localized = (obj, base) => {
    if (!obj) return '';
    if (lang === 'is') return obj[base] || '';
    return obj[`${base}_en`] || obj[base] || '';
  };
  res.locals.hasTranslation = (obj, base) => {
    if (!obj) return false;
    if (lang === 'is') return true;
    return Boolean(obj[`${base}_en`] && String(obj[`${base}_en`]).trim());
  };

  if (fromQuery) {
    const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=${lang}; Path=/; Max-Age=${maxAge}; SameSite=Lax; HttpOnly`);
  }
  next();
}

module.exports = { middleware, SUPPORTED, DEFAULT_LANG };
