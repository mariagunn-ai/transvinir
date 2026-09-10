const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const db = require('../db');

const SHOP_COVER_PATH = '/images/skjol-hja-mer.png';
function getShopCoverImage() {
  const abs = path.join(__dirname, '..', 'public', SHOP_COVER_PATH);
  return fs.existsSync(abs) ? SHOP_COVER_PATH : null;
}

const router = express.Router();

function getSettings(lang) {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const all = {};
  for (const r of rows) all[r.key] = r.value;
  const pick = (base) => {
    if (lang === 'en' && all[`${base}_en`]) return all[`${base}_en`];
    return all[base] || '';
  };
  return {
    contact_email: all.contact_email || 'transvinir@gmail.com',
    redbubble_url: all.redbubble_url || '',
    campaign_text: pick('campaign_text'),
    hero_text: pick('hero_text')
  };
}

function localizeItem(item, fields, lang) {
  if (!item) return item;
  const out = { ...item };
  for (const f of fields) {
    const en = item[`${f}_en`];
    const hasEn = Boolean(en && String(en).trim());
    out[`${f}_is`] = item[f];
    out[f] = (lang === 'en' && hasEn) ? en : item[f];
    out[`${f}_has_en`] = hasEn;
  }
  return out;
}

function render(req, res, template, data, title) {
  res.render('layout', {
    title,
    bodyTemplate: template,
    bodyData: { ...data, settings: getSettings(req.lang) }
  });
}

router.get('/', (req, res) => {
  const newsRows = db.prepare(`
    SELECT slug, title, summary, title_en, summary_en, cover_image, published_at
    FROM news
    WHERE published = 1
    ORDER BY sort_order ASC, published_at DESC
    LIMIT 4
  `).all();
  const lang = req.lang;
  const news = newsRows.map(n => ({
    slug: n.slug,
    cover_image: n.cover_image,
    published_at: n.published_at,
    title: (lang === 'en' && n.title_en) ? n.title_en : n.title,
    summary: (lang === 'en' && n.summary_en) ? n.summary_en : n.summary
  }));
  const polaroids = db.prepare('SELECT image_url, alt_text FROM polaroids ORDER BY sort_order, id').all();
  render(req, res, 'home', { news, polaroids, shopCoverImage: getShopCoverImage() }, res.locals.t('site.title'));
});

router.get('/nylegt', (req, res) => {
  const newsRows = db.prepare(`
    SELECT slug, title, summary, title_en, summary_en, cover_image, published_at
    FROM news
    WHERE published = 1
    ORDER BY sort_order ASC, published_at DESC
  `).all();
  const lang = req.lang;
  const news = newsRows.map(n => ({
    slug: n.slug,
    cover_image: n.cover_image,
    published_at: n.published_at,
    title: (lang === 'en' && n.title_en) ? n.title_en : n.title,
    summary: (lang === 'en' && n.summary_en) ? n.summary_en : n.summary
  }));
  render(req, res, 'news-list', { news }, res.locals.t('news.title'));
});

router.get('/nylegt/:slug', (req, res, next) => {
  const raw = db.prepare(`SELECT * FROM news WHERE slug = ? AND published = 1`).get(req.params.slug);
  if (!raw) return next();
  const item = localizeItem(raw, ['title', 'summary', 'body_md'], req.lang);
  item.body_html = marked.parse(item.body_md || '');
  item.translation_missing = req.lang === 'en' && !item.body_md_has_en;
  render(req, res, 'news-single', { item }, item.title);
});

const PAGE_SLUGS = ['markmid', 'fyrstu-skref', 'samthykktir', 'rannsoknir', 'baekur', 'spurt-svarad', 'linkar', 'vefverslun', 'hafa-samband'];

for (const slug of PAGE_SLUGS) {
  router.get('/' + slug, (req, res, next) => {
    const raw = db.prepare('SELECT * FROM pages WHERE slug = ?').get(slug);
    if (!raw) return next();
    const page = localizeItem(raw, ['title', 'body_md'], req.lang);
    page.body_html = marked.parse(page.body_md || '');
    page.translation_missing = req.lang === 'en' && !page.body_md_has_en;
    render(req, res, 'page', { page }, page.title);
  });
}

module.exports = router;
