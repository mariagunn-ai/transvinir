const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    const safe = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${safe}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp|svg\+xml)$/.test(file.mimetype)
      || file.mimetype === 'application/pdf';
    if (ok) cb(null, true);
    else cb(new Error('Aðeins myndaskrár (jpeg, png, gif, webp, svg) eða PDF.'));
  }
});

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/[ý]/g, 'y')
    .replace(/[þ]/g, 'th').replace(/[æ]/g, 'ae').replace(/[ð]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function render(res, template, data, title) {
  res.render('layout', {
    title,
    bodyTemplate: template,
    bodyData: data,
    isAdminLayout: true
  });
}

function requireAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/admin/login');
}

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin');
  render(res, 'admin/login', { error: null }, 'Innskráning');
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username || '');
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return render(res, 'admin/login', { error: 'Rangt notandanafn eða lykilorð.' }, 'Innskráning');
  }
  req.session.user = { id: user.id, username: user.username };
  res.redirect('/admin');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.use(requireAuth);

router.get('/', (req, res) => {
  const newsCount = db.prepare('SELECT COUNT(*) AS c FROM news').get().c;
  const pagesCount = db.prepare('SELECT COUNT(*) AS c FROM pages').get().c;
  const recentNews = db.prepare(`
    SELECT id, slug, title, published, published_at FROM news ORDER BY sort_order ASC, published_at DESC LIMIT 10
  `).all();
  const pages = db.prepare('SELECT slug, title, updated_at FROM pages ORDER BY title').all();
  render(res, 'admin/dashboard', { newsCount, pagesCount, recentNews, pages }, 'Stjórnborð');
});

router.get('/news/new', (req, res) => {
  render(res, 'admin/news-edit', { item: null, error: null }, 'Ný frétt');
});

router.post('/news', upload.single('cover_image_file'), (req, res) => {
  const { title, summary, body_md, title_en, summary_en, body_md_en, published, cover_image_url } = req.body;
  if (!title || !body_md) {
    return render(res, 'admin/news-edit', { item: req.body, error: 'Titill og texti á íslensku eru nauðsynleg.' }, 'Ný frétt');
  }
  let slug = slugify(title);
  let i = 2;
  while (db.prepare('SELECT id FROM news WHERE slug = ?').get(slug)) {
    slug = `${slugify(title)}-${i++}`;
  }
  const cover = req.file ? `/uploads/${req.file.filename}` : (cover_image_url || null);
  const minOrder = db.prepare('SELECT COALESCE(MIN(sort_order), 1) AS m FROM news').get().m;
  db.prepare(`
    INSERT INTO news (slug, title, summary, body_md, title_en, summary_en, body_md_en, cover_image, published, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    slug, title, summary || null, body_md,
    title_en || null, summary_en || null, body_md_en || null,
    cover, published ? 1 : 0, minOrder - 1
  );
  res.redirect('/admin');
});

router.get('/news/:id/edit', (req, res, next) => {
  const item = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  if (!item) return next();
  render(res, 'admin/news-edit', { item, error: null }, `Breyta: ${item.title}`);
});

router.post('/news/:id', upload.single('cover_image_file'), (req, res, next) => {
  const item = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  if (!item) return next();
  const { title, summary, body_md, title_en, summary_en, body_md_en, published, cover_image_url, remove_cover } = req.body;
  let cover = item.cover_image;
  if (remove_cover === '1') cover = null;
  if (cover_image_url !== undefined && cover_image_url !== '') cover = cover_image_url;
  if (req.file) cover = `/uploads/${req.file.filename}`;
  db.prepare(`
    UPDATE news
    SET title = ?, summary = ?, body_md = ?,
        title_en = ?, summary_en = ?, body_md_en = ?,
        cover_image = ?, published = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title, summary || null, body_md,
    title_en || null, summary_en || null, body_md_en || null,
    cover, published ? 1 : 0, item.id
  );
  res.redirect('/admin');
});

router.post('/news/:id/delete', (req, res) => {
  db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
  res.redirect('/admin');
});

router.post('/news/:id/move', (req, res) => {
  const dir = req.body.direction === 'up' ? -1 : 1;
  const row = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  if (!row) return res.redirect('/admin');
  const neighbour = db.prepare(`
    SELECT * FROM news
    WHERE sort_order ${dir < 0 ? '<' : '>'} ?
    ORDER BY sort_order ${dir < 0 ? 'DESC' : 'ASC'}
    LIMIT 1
  `).get(row.sort_order);
  if (neighbour) {
    db.prepare('UPDATE news SET sort_order = ? WHERE id = ?').run(neighbour.sort_order, row.id);
    db.prepare('UPDATE news SET sort_order = ? WHERE id = ?').run(row.sort_order, neighbour.id);
  }
  res.redirect('/admin');
});

router.get('/pages/:slug/edit', (req, res, next) => {
  const page = db.prepare('SELECT * FROM pages WHERE slug = ?').get(req.params.slug);
  if (!page) return next();
  render(res, 'admin/page-edit', { page, error: null }, `Breyta: ${page.title}`);
});

router.post('/pages/:slug', (req, res, next) => {
  const page = db.prepare('SELECT * FROM pages WHERE slug = ?').get(req.params.slug);
  if (!page) return next();
  const { title, body_md, title_en, body_md_en } = req.body;
  if (!title || !body_md) {
    return render(res, 'admin/page-edit', { page: { ...page, title, body_md, title_en, body_md_en }, error: 'Titill og texti á íslensku eru nauðsynleg.' }, `Breyta: ${page.title}`);
  }
  db.prepare(`
    UPDATE pages
    SET title = ?, body_md = ?, title_en = ?, body_md_en = ?, updated_at = datetime('now')
    WHERE slug = ?
  `).run(title, body_md, title_en || null, body_md_en || null, page.slug);
  res.redirect('/admin');
});

router.get('/polaroids', (req, res) => {
  const polaroids = db.prepare('SELECT * FROM polaroids ORDER BY sort_order, id').all();
  render(res, 'admin/polaroids', { polaroids, error: null }, 'Fléttimyndir');
});

router.post('/polaroids', upload.single('image_file'), (req, res) => {
  const { image_url, alt_text } = req.body;
  const url = req.file ? `/uploads/${req.file.filename}` : (image_url || '').trim();
  if (!url) {
    const polaroids = db.prepare('SELECT * FROM polaroids ORDER BY sort_order, id').all();
    return render(res, 'admin/polaroids', { polaroids, error: 'Veldu mynd eða sláðu inn slóð.' }, 'Fléttimyndir');
  }
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM polaroids').get().m;
  db.prepare('INSERT INTO polaroids (image_url, alt_text, sort_order) VALUES (?, ?, ?)')
    .run(url, (alt_text || '').trim() || null, maxOrder + 1);
  res.redirect('/admin/polaroids');
});

router.post('/polaroids/:id/delete', (req, res) => {
  const row = db.prepare('SELECT image_url FROM polaroids WHERE id = ?').get(req.params.id);
  db.prepare('DELETE FROM polaroids WHERE id = ?').run(req.params.id);
  if (row && row.image_url && row.image_url.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, '..', 'public', row.image_url);
    fs.unlink(filePath, () => {});
  }
  res.redirect('/admin/polaroids');
});

router.post('/polaroids/:id/move', (req, res) => {
  const dir = req.body.direction === 'up' ? -1 : 1;
  const row = db.prepare('SELECT * FROM polaroids WHERE id = ?').get(req.params.id);
  if (!row) return res.redirect('/admin/polaroids');
  const neighbour = db.prepare(`
    SELECT * FROM polaroids
    WHERE sort_order ${dir < 0 ? '<' : '>'} ?
    ORDER BY sort_order ${dir < 0 ? 'DESC' : 'ASC'}
    LIMIT 1
  `).get(row.sort_order);
  if (neighbour) {
    db.prepare('UPDATE polaroids SET sort_order = ? WHERE id = ?').run(neighbour.sort_order, row.id);
    db.prepare('UPDATE polaroids SET sort_order = ? WHERE id = ?').run(row.sort_order, neighbour.id);
  }
  res.redirect('/admin/polaroids');
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Engin skrá.' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

router.get('/password', (req, res) => {
  render(res, 'admin/password', { error: null, success: null }, 'Breyta lykilorði');
});

router.post('/password', (req, res) => {
  const { current, next: newPass, confirm } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  if (!user || !bcrypt.compareSync(current || '', user.password_hash)) {
    return render(res, 'admin/password', { error: 'Núverandi lykilorð er rangt.', success: null }, 'Breyta lykilorði');
  }
  if (!newPass || newPass.length < 8) {
    return render(res, 'admin/password', { error: 'Nýja lykilorðið verður að vera að minnsta kosti 8 stafir.', success: null }, 'Breyta lykilorði');
  }
  if (newPass !== confirm) {
    return render(res, 'admin/password', { error: 'Lykilorðin passa ekki saman.', success: null }, 'Breyta lykilorði');
  }
  const hash = bcrypt.hashSync(newPass, 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
  render(res, 'admin/password', { error: null, success: 'Lykilorði breytt.' }, 'Breyta lykilorði');
});

module.exports = router;
