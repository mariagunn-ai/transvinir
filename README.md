# Trans vinir – vefur

Lítill Node.js vefur með innbyggðu admin svæði þar sem hægt er að bæta við og breyta fréttum, og breyta texta á helstu undirsíðum.

## Tækni

- Node.js + Express
- SQLite (better-sqlite3) – gögn í `data/transvinir.sqlite`
- EJS templates
- bcrypt + express-session fyrir admin login
- multer fyrir myndupload

## Uppsetning (fyrst sinn)

1. Búðu til `.env` skrá byggða á `.env.example`:

   ```
   SESSION_SECRET=<langur random strengur>
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=<eitthvað sterkt>
   PORT=3000
   ```

2. Settu upp dependencies og initaðu gagnagrunninn:

   ```
   npm install
   npm run init-db
   ```

   (Þetta býr til admin notandann og fyllir inn sjálfgefnar síður.)

3. Ræstu vefinn:

   ```
   npm start
   ```

   Opnaðu http://localhost:3000

## Innskráning

Farðu á http://localhost:3000/admin/login og skráðu þig inn með notandanafni og lykilorði úr `.env`.

Þú getur breytt lykilorðinu inni í admin svæðinu (Stjórnborð → "Breyta lykilorði").

## Tungumál (IS / EN)

Vefurinn styður íslensku og ensku með toggle-takka efst í haus (IS ↔ EN).
- Sjálfgefið tungumál: íslenska
- Valið er vistað í cookie (`lang`) í 1 ár
- Hægt að forcea með `?lang=is` eða `?lang=en` í URL
- UI-strengir koma úr [locales/is.json](transvinir-vefur/locales/is.json) og [locales/en.json](transvinir-vefur/locales/en.json)
- Efnisstrengir (fréttir, síður, hero-texti, herferð-texti) eru með `_en` dálki í gagnagrunninum
- Ef EN-útgáfu vantar fyrir efni er **fallback á íslensku** + birt notice ("This article has not been translated").

## Hvað admin getur gert

- Bæta við, breyta og eyða **fréttum** á íslensku **og ensku** (tab-skipti í forminu).
- Hlaða upp myndum (vistast undir `public/uploads/`).
- Breyta texta á þessum **föstu síðum**, bæði IS og EN:
  - Markmið / Our goals
  - Samþykktir / Bylaws
  - Rannsóknir / Research
  - Bækur / Books
  - Spurt & Svarað / FAQ
  - Linkar / Links
  - Hafa samband / Contact
- EN reitir eru valfrjálsir — skildu þá auða til að nota IS sem fallback.
- Breyta eigin lykilorði.

## Hvað admin getur EKKI gert (viljandi til að halda einfalt)

- Breyta útliti, litum eða layouti.
- Bæta við nýjum síðum í valmyndina (þarf kóðabreytingu).
- Bæta við nýjum tungumálum (þarf að bæta locale-skrá og dálki).
- Breyta UI-strengjum eins og "Nýlegt", "Markmið", "Hafa samband" — þeir koma úr locales JSON.
- Breyta lógó-i, footer eða hamborgaramatseðli.
- Stofna fleiri admin notendur.

Þetta er allt hægt að bæta við seinna – láttu mig vita ef þú þarft.

## Skipulag

```
transvinir-vefur/
  server.js              – Express stillingar og rúting
  db.js                  – SQLite tenging + schema
  routes/
    public.js            – Almennar síður og fréttir
    admin.js             – Admin login og CRUD
  views/
    layout.ejs           – Sameiginlegur ramm (header, footer, nav)
    home.ejs             – Forsíða (3×2 grid)
    page.ejs             – Almennar síður
    news-list.ejs        – Yfirlit yfir fréttir
    news-single.ejs      – Ein frétt
    404.ejs / 500.ejs
    admin/
      login.ejs
      dashboard.ejs
      news-edit.ejs
      page-edit.ejs
      password.ejs
  public/
    css/style.css        – Allt CSS
    js/main.js           – Lítil JS fyrir matseðil
    images/              – Stökk- og brand-myndir
    uploads/             – Hér enda myndir sem admin hleður upp
  scripts/
    init-db.js           – Býr til admin notanda + seedar sjálfgefnar síður
  data/
    transvinir.sqlite    – Sjálft gagnasafnið (búið til sjálfkrafa)
    sessions.sqlite      – Sessions
```

## Bætt við seinna (ekki í v1)

- Tölvupóstform á "Hafa samband" síðunni
- RSS / OpenGraph / SEO meta
- Fleiri admin notendur og hlutverk
- Tungumálastilling (enska)
- Image processing / resizing
