# Web tímového projektu — AI Governance

Webová stránka tímového projektu *Inteligentný systém pre automatizované hodnotenie bezpečnosti a governance AI systémov* (FEI STU, 2026/2027).

- Adresa: <https://ai-governance-tp.github.io>
- Postavené na [Astro](https://astro.build/), čisté CSS bez frameworkov
- Nasadzuje sa automaticky cez GitHub Actions pri každom pushi do `main` (`.github/workflows/deploy.yml`)

## Spustenie lokálne

Potrebuješ Node.js 22+ (odporúčané 24 LTS).

```bash
npm install
npm run dev
```

Stránka beží na <http://localhost:4321> a pri zmene súborov sa obnovuje automaticky.

Pred pushom over, že build prejde rovnako ako v CI:

```bash
npm run build
```

## Štruktúra

```
src/
  content/
    zapisnice/        # zápisnice – jeden .md súbor na stretnutie (názov = dátum)
    dokumenty/        # dokumenty – ponuka a ďalšie
  data/
    stav.json         # blok „Stav projektu“ na domovskej stránke
    tim.json          # vedúci, spolupráca, členovia tímu a ich role
  pages/              # stránky (domov, zadanie, tím, zápisnice, dokumentácia)
  layouts/, components/
  styles/global.css   # celý vzhľad webu, farby sú v tokenoch na začiatku
public/
  dokumentacia/ponuka.pdf
  logo.png, favicon.png
assets-src/icon.png   # zdrojová ikona vo veľkom rozlíšení
sablony/zapisnica.md  # šablóna zápisnice
```

## Ako pridať zápisnicu

1. Skopíruj `sablony/zapisnica.md` do nového súboru pomenovaného podľa dátumu stretnutia, napr. `src/content/zapisnice/2026-10-04.md`.
2. Vyplň hlavičku (frontmatter): `typ` (`veduci` = stretnutie s vedúcim, `tim` = tímové stretnutie), `datum`, `cas` (čas začiatku), `forma`, `pritomni`, `zapisal`, `zhrnutie`.
3. Doplň text: zhodnotenie úloh z minulého stretnutia, priebeh (tézovito), úlohy na ďalšie obdobie (zoznam).
4. `npm run build`, commit, push.

Zoznam zápisníc (všetky / s vedúcim / s tímom), číslovanie stretnutí v rámci typu a odkazy „predchádzajúca / nasledujúca“ sa generujú automaticky podľa dátumu. Nič ďalšie netreba upravovať.

## Ako aktualizovať „Stav projektu“

Raz týždenne uprav `src/data/stav.json`:

- `aktualizovane` – dátum aktualizácie,
- `hotove`, `robiSa`, `dalej` – zoznamy položiek v troch stĺpcoch (presuň hotové veci z „robí sa“ do „hotové“),
- `historia` – pridaj záznam `{ "datum": "...", "text": "..." }` (poradie nezáleží, zoradí sa automaticky).

## Ako doplniť role v tíme

V `src/data/tim.json` vyplň pole `rola` pri každom členovi. Prázdna rola sa zobrazí ako „Rola bude doplnená“.

## Ako pridať dokument

1. Vytvor `src/content/dokumenty/nazov.md` s hlavičkou `nazov`, `popis`, `datum`, voliteľne `pdf` (cesta v `public/`) a `poradie`.
2. Ak má dokument aj PDF, ulož ho do `public/dokumentacia/`.

Dokument sa automaticky objaví v zozname na stránke Dokumentácia.
