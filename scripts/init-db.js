require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('../db');

const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD;

if (!password || password === 'change-me-on-first-run') {
  console.error('VILLA: settu ADMIN_PASSWORD í .env áður en þú keyrir init-db.');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);

const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
if (existing) {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, existing.id);
  console.log(`Uppfærði lykilorð fyrir notanda "${username}".`);
} else {
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
  console.log(`Bjó til notanda "${username}".`);
}

const seedPages = [
  {
    slug: 'markmid',
    title: 'Markmið Trans vina',
    body_md: `Trans vinir eru hópur aðstandenda og vina trans fólks á Íslandi.

## Helstu markmið

- Að standa með trans fólki og fjölskyldum þeirra.
- Að fræða samfélagið um málefni trans fólks.
- Að styðja við réttindabaráttu og bæta þjónustu við trans fólk.

*(Þú getur breytt þessum texta í admin svæði.)*`,
    title_en: 'Our goals',
    body_md_en: `Trans vinir is a group of family members and friends of trans people in Iceland.

## Our main goals

- To stand alongside trans people and their families.
- To educate the community about trans issues.
- To support the fight for rights and improve services for trans people.

*(You can edit this text in the admin area.)*`
  },
  {
    slug: 'fyrstu-skref',
    title: 'Fyrstu skref þegar barn eða ungmenni kemur út',
    body_md: `Þú ert ekki ein/n. Hér er pláss fyrir aðstandendur og vini trans fólks.

## Fyrstu viðbrögð

- Hlustaðu af athygli og taktu á móti barninu eins og það er.
- Notaðu það nafn og fornafn sem barnið kýs.
- Sýndu skilning — það er í lagi að spyrja, en mundu að barnið ræður ferðinni.

## Næstu skref

- Leitið saman að upplýsingum og stuðningi.
- Talaðu við aðra aðstandendur sem hafa svipaða reynslu.
- Skoðaðu auðlindir á [Slóðir](/linkar) síðunni eða farðu á [Hafa samband](/hafa-samband) til að ná í okkur.

*(Þú getur breytt þessum texta í admin svæði.)*`,
    title_en: 'First steps when a child or young person comes out',
    body_md_en: `You are not alone. A space for family and friends of trans people.

## First reactions

- Listen attentively and accept the child as they are.
- Use the name and pronouns the child chooses.
- Show understanding — it's okay to ask, but remember that the child leads the way.

## Next steps

- Look for information and support together.
- Talk to other family members who have had similar experiences.
- Check the [Links](/linkar) page or visit [Contact](/hafa-samband) to reach us.

*(You can edit this text in the admin area.)*`
  },
  {
    slug: 'samthykktir',
    title: 'Samþykktir',
    body_md: `Hér birtast samþykktir Trans vina.

*(Bættu inn texta í admin svæði.)*`,
    title_en: 'Bylaws',
    body_md_en: `The bylaws of Trans vinir will appear here.

*(Add the text in the admin area.)*`
  },
  {
    slug: 'rannsoknir',
    title: 'Rannsóknir',
    body_md: `Tenglar og samantekt á rannsóknum sem snerta málefni trans fólks.

*(Bættu inn efni í admin svæði.)*`,
    title_en: 'Research',
    body_md_en: `Links and summaries of research relating to trans issues.

*(Add content in the admin area.)*`
  },
  {
    slug: 'baekur',
    title: 'Bækur',
    body_md: `Listi af bókum um málefni trans fólks, bæði fyrir börn og fullorðna.

- **Trans barnið** – aðgengileg bók fyrir börn og foreldra.

*(Bættu fleiri bókum við í admin svæði.)*`,
    title_en: 'Books',
    body_md_en: `A list of books about trans issues, for both children and adults.

- **Trans barnið** – an accessible book for children and parents (in Icelandic).

*(Add more books in the admin area.)*`
  },
  {
    slug: 'spurt-svarad',
    title: 'Spurt & Svarað',
    body_md: `### Hvað er Trans vinir?

Trans vinir er hópur aðstandenda og vina trans fólks á Íslandi.

### Hvernig get ég stutt trans barnið mitt?

Hlustaðu, trúðu og styddu. *(Texti uppfærður í admin svæði.)*

### Hvert get ég leitað eftir aðstoð?

Sjá [Hafa samband](/hafa-samband) síðuna.`,
    title_en: 'FAQ',
    body_md_en: `### What is Trans vinir?

Trans vinir is a group of family members and friends of trans people in Iceland.

### How can I support my trans child?

Listen, believe and support. *(Text updated in the admin area.)*

### Where can I find help?

See the [Contact](/hafa-samband) page.`
  },
  {
    slug: 'linkar',
    title: 'Slóðir',
    body_md: `## Gagnlegir tenglar

- [Trans Ísland](https://trans.is)
- [Samtökin '78](https://samtokin78.is)

*(Bættu inn fleiri linkum í admin svæði.)*`,
    title_en: 'Links',
    body_md_en: `## Useful links

- [Trans Ísland](https://trans.is)
- [Samtökin '78](https://samtokin78.is)

*(Add more links in the admin area.)*`
  },
  {
    slug: 'vefverslun',
    title: 'Vefverslun',
    body_md: `<img src="/images/skjol-hja-mer.png" alt="Þú átt skjól hjá mér næla" style="max-width: 320px; width: 100%; margin: 0 auto; display: block;" />

## Næla — Þú átt skjól hjá mér

Verð: **1.500 kr.**

Hægt að panta beint hjá Trans vinum með því að senda tölvupóst á [transvinir@gmail.com](mailto:transvinir@gmail.com) með nafni og fjölda nælna.

---

## Bolir, töskur og fleira

Stuðningsvörur á Redbubble-vefnum með TRANS VINIR-hönnun.

[Skoða á Redbubble →](https://www.redbubble.com/shop?query=trans%20vinir)`,
    title_en: 'Shop',
    body_md_en: `<img src="/images/skjol-hja-mer.png" alt="You have shelter with me pin" style="max-width: 320px; width: 100%; margin: 0 auto; display: block;" />

## Pin — You have shelter with me

Price: **1,500 ISK**

You can order directly from Trans vinir by sending an email to [transvinir@gmail.com](mailto:transvinir@gmail.com) with your name and the number of pins.

---

## T-shirts, bags and more

Support items on Redbubble with TRANS VINIR designs.

[View on Redbubble →](https://www.redbubble.com/shop?query=trans%20vinir)`
  },
  {
    slug: 'hafa-samband',
    title: 'Hafa samband',
    body_md: `Þú getur sent okkur tölvupóst á **transvinir@gmail.com**.

Ekki hika við að hafa samband. Við svörum eftir bestu getu, við erum hér til að styðja þig.`,
    title_en: 'Contact',
    body_md_en: `You can email us at **transvinir@gmail.com**.

Don't hesitate to reach out. We answer as best we can — we are here to support you.`
  }
];

const insertPage = db.prepare(`
  INSERT INTO pages (slug, title, body_md, title_en, body_md_en) VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(slug) DO NOTHING
`);
const fillEnPage = db.prepare(`
  UPDATE pages SET title_en = ?, body_md_en = ?
  WHERE slug = ? AND (title_en IS NULL OR title_en = '') AND (body_md_en IS NULL OR body_md_en = '')
`);
for (const p of seedPages) {
  insertPage.run(p.slug, p.title, p.body_md, p.title_en, p.body_md_en);
  fillEnPage.run(p.title_en, p.body_md_en, p.slug);
}
console.log(`Seedaði ${seedPages.length} síður (sleppti þeim sem eru þegar til, fyllti tóma EN reiti).`);

const seedNews = [
  {
    slug: 'velkomin-a-nyja-vefinn',
    title: 'Velkomin á nýja vefinn',
    summary: 'Nýr vefur Trans vina er kominn í loftið.',
    body_md: `Við erum mjög glöð að kynna nýja vefinn okkar.

Hér munum við birta fréttir, fræðsluefni og upplýsingar um starf Trans vina.

*(Þetta er sýnishorn af frétt — eyddu henni eða breyttu í admin svæði.)*`,
    title_en: 'Welcome to the new website',
    summary_en: 'The new Trans vinir website is now live.',
    body_md_en: `We are very happy to introduce our new website.

Here we will share news, educational content and information about the work of Trans vinir.

*(This is a sample news item — delete it or edit it in the admin area.)*`,
    cover_image: '/images/adstandendur.jpg'
  }
];
const insertNews = db.prepare(`
  INSERT INTO news (slug, title, summary, body_md, title_en, summary_en, body_md_en, cover_image, published)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  ON CONFLICT(slug) DO NOTHING
`);
const fillEnNews = db.prepare(`
  UPDATE news SET title_en = ?, summary_en = ?, body_md_en = ?
  WHERE slug = ? AND (title_en IS NULL OR title_en = '') AND (body_md_en IS NULL OR body_md_en = '')
`);
for (const n of seedNews) {
  insertNews.run(n.slug, n.title, n.summary, n.body_md, n.title_en, n.summary_en, n.body_md_en, n.cover_image);
  fillEnNews.run(n.title_en, n.summary_en, n.body_md_en, n.slug);
}
console.log(`Seedaði ${seedNews.length} fréttir (fyllti tóma EN reiti).`);

const setSetting = db.prepare(`
  INSERT INTO settings (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO NOTHING
`);
setSetting.run('contact_email', 'transvinir@gmail.com');
setSetting.run('redbubble_url', 'https://www.redbubble.com/shop?query=trans%20vinir');
setSetting.run('campaign_text', 'Þú átt skjól hjá mér');
setSetting.run('campaign_text_en', 'You have shelter with me');
setSetting.run('hero_text', 'Trans vinir – aðstandendur og vinir trans fólks á Íslandi.');
setSetting.run('hero_text_en', 'Trans vinir – family and friends of trans people in Iceland.');

console.log('Búið. Þú getur núna keyrt "npm start".');
