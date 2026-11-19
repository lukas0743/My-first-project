# AZULA – Shopify-Theme einrichten

Das Theme liegt fertig gepackt in `dist/azula-shopify-theme.zip`.
Der Quellcode des Themes ist im Ordner `shopify-theme/`.

Das Theme holt Produkte, Preise, Warenkorb, Suche und Menüs direkt aus deinem Shop.
Deshalb musst du einmal die Inhalte in Shopify anlegen. Das dauert etwa 20 Minuten.

---

## 1. Theme hochladen

1. Shopify Admin → **Onlineshop → Themes**
2. Bei „Theme-Bibliothek“ auf **Theme hinzufügen → ZIP-Datei hochladen**
3. `azula-shopify-theme.zip` auswählen
4. Erst **Anpassen** (Vorschau prüfen), dann **Veröffentlichen**

---

## 2. Produkte anlegen

**Schnell:** Admin → **Produkte → Importieren** → `shopify-setup/products.csv`.
Das legt Shampoo, Conditioner und The Duo mit Text, Preis und Vergleichspreis an.
(Die Datei nutzt nur die klassischen Standard-Spalten von Shopify.
Falls der Import trotzdem meckert, lege die drei Produkte einfach von Hand an.)

**Wichtig – die Handles (URL-Namen) müssen so heißen:**

| Produkt     | Handle        | Preis  | Vergleichspreis | Tag      |
|-------------|---------------|--------|-----------------|----------|
| Shampoo     | `shampoo`     | 24,90 € | –              | –        |
| Conditioner | `conditioner` | 24,90 € | –              | –        |
| The Duo     | `the-duo`     | 44,90 € | 49,80 €        | `bundle` |

- **Fotos:** `shopify-setup/shampoo.jpg` und `conditioner.jpg` hochladen.
  Shampoo → shampoo.jpg, Conditioner → conditioner.jpg,
  The Duo → **beide** Fotos (erst Shampoo, dann Conditioner).
  Solange ein Produkt noch kein Foto hat, zeigt das Theme automatisch die Original-Fotos.
- **Tag `bundle`** sorgt dafür, dass The Duo beide Flaschen nebeneinander zeigt.
- **„Save €4.90“** erscheint automatisch, weil ein Vergleichspreis gesetzt ist.
- **Grundpreis (Pflicht in DE):** Im Produkt → Variante → „Grundpreis anzeigen“ → 500 ml / Grundeinheit 1 l.
  Das Theme zeigt ihn dann unter dem Preis (z. B. „€49.80 / l“).

---

## 3. Metafelder für die Produkttexte

Admin → **Einstellungen → Benutzerdefinierte Daten → Produkte → Definition hinzufügen**.
Lege diese fünf Definitionen an (Namespace und Key genau so):

| Name              | Namespace und Key            | Typ                     |
|-------------------|------------------------------|-------------------------|
| Tagline           | `custom.tagline`             | Einzeiliger Text        |
| Size              | `custom.size`                | Einzeiliger Text        |
| Short description | `custom.short_description`   | Mehrzeiliger Text       |
| How to use        | `custom.how_to_use`          | Rich Text               |
| Key ingredients   | `custom.key_ingredients`     | Rich Text               |

Dann in jedem Produkt unten bei „Metafelder“ ausfüllen (Texte von deiner bisherigen Seite):

**Shampoo**
- Tagline: `Strengthen · Nourish · Balance`
- Size: `500 ml`
- Short description: `A gentle, silicone-free cleanser with rosemary and aloe vera that strengthens from the root and brings the scalp back into balance.`
- How to use: 1. Massage a small amount into wet hair and scalp. 2. Take a moment – the scalp is where healthy hair begins. 3. Rinse thoroughly and follow with the AZULA Conditioner.
- Key ingredients: `Aloe Vera, Rosemary, Argan Oil.`

**Conditioner**
- Tagline: `Hydrate · Repair · Restore`
- Size: `500 ml`
- Short description: `Rich care with argan oil and aloe vera that restores moisture, smooths the lengths and leaves hair soft with natural shine.`
- How to use: 1. After shampooing, work through lengths and ends. 2. Leave on for two to three minutes. 3. Rinse with lukewarm water.
- Key ingredients: `Aloe Vera, Rosemary, Argan Oil.`

**The Duo**
- Tagline: `Shampoo & Conditioner`
- Size: `2 × 500 ml`
- Short description: `The complete AZULA ritual in one set – cleanse and care, made to work together for visibly healthier hair.`
- How to use: 1. Cleanse: massage the Shampoo into wet hair and scalp, then rinse. 2. Care: work the Conditioner through lengths and ends, leave on for two to three minutes. 3. Rinse with lukewarm water and enjoy the result.
- Key ingredients: `Aloe Vera, Rosemary, Argan Oil.`

Leere Metafelder sind kein Fehler – das jeweilige Element wird dann einfach nicht angezeigt.

---

## 4. Seiten anlegen

Admin → **Onlineshop → Seiten → Seite hinzufügen**:

| Titel          | Handle (URL)   | Vorlage (rechts unter „Theme-Vorlage“) |
|----------------|----------------|----------------------------------------|
| Our Philosophy | `philosophy`   | `page.philosophy`                      |
| Ingredients    | `ingredients`  | `page.ingredients`                     |

Der Inhalt der Seite kann leer bleiben – Texte und Bilder kommen aus der Vorlage
und sind im Theme-Editor bearbeitbar.

---

## 5. Magazin (Blog)

Admin → **Onlineshop → Blogbeiträge → Blogs verwalten → Blog hinzufügen**, Titel `Magazine`,
Handle `magazine`. Dann Beiträge schreiben.
- Der **erste Tag** eines Beitrags erscheint als Kategorie (z. B. „Scalp Care“) und als Filter-Chip.
- Die Lesezeit („4 min read“) wird automatisch berechnet.
- Der neueste Beitrag wird groß als „Featured“ gezeigt.

---

## 6. Menüs

Admin → **Onlineshop → Navigation**.

**Hauptmenü (`main-menu`)** – so sieht es wie bisher aus:
- Shop → `/collections/all`
  - Shampoo → Produkt Shampoo
  - Conditioner → Produkt Conditioner
  - All Products → `/collections/all`
- Haircare → `/collections/all#ritual`
- Our Philosophy → Seite Our Philosophy
- Magazine → Blog Magazine

**Footer** – drei Menüs mit genau diesen Handles anlegen, dann erscheinen sie automatisch:
- `footer-shop` (Shampoo, Conditioner, All Products)
- `footer-azula` (Our Philosophy, Ingredients, Magazine)
- `footer` (Contact, Shipping & Returns, FAQ – dieses Menü existiert schon)

Die Rechtslinks unten rechts (Impressum, Datenschutz, AGB …) kommen automatisch aus
**Einstellungen → Richtlinien**. Bitte dort Impressum, Datenschutz, AGB, Widerruf und Versand ausfüllen.

---

## 7. Bewertungen ⚠️

- **Sterne an den Produkten** kommen aus einer Bewertungs-App (z. B. „Judge.me“ oder „Product Reviews“).
  Ohne App werden keine Sterne angezeigt – es wird nichts erfunden.
- **Die laufenden Bewertungen auf der Startseite** (12 Stück, „4.9 / 739 reviews“) sind die Texte von der
  bisherigen Seite. **Diese sind ausgedachte Platzhalter.** Erfundene Kundenbewertungen sind in Deutschland/EU
  unzulässig (UWG). Bitte vor dem Livegang im Theme-Editor (Startseite → „Reviews carousel“) durch echte
  Bewertungen ersetzen oder den Abschnitt ausblenden.

---

## 8. Im Theme-Editor anpassen

Onlineshop → Themes → **Anpassen**. Bearbeitbar sind u. a.:
- Hero-Text, Buttons, Fotos und die vier Badges
- Bestseller (Kollektion wählbar), Zutaten-Kacheln, Philosophie-Text
- Statement und Kennzahlen, Bewertungen (Geschwindigkeit und Pause von 7 s einstellbar), Newsletter
- Produktseite: Reihenfolge der Blöcke, Express-Checkout-Buttons ein/aus
- Theme-Einstellungen: Logo-Bild, Farben, Verhalten des Warenkorbs (Slide-out / Seite / Hinweis)

Newsletter-Anmeldungen landen unter **Kunden** mit dem Tag `newsletter`.
