---
nazov: "Úlohy: prvá funkčná verzia systému"
popis: "Rozdelenie práce na prvú funkčnú verziu (MVP) do piatich úloh, slovník pojmov a spoločná databáza ako rozhranie medzi časťami."
datum: 2026-11-05
poradie: 2
---

## Rozdelenie úloh v tíme

Úlohy si členovia tímu rozdelili na tímovom stretnutí 5. 11. 2026.

| Úloha | Obsah | Zodpovedný |
|---|---|---|
| Úloha 1 | Platforma, databáza a spracovanie dokumentov | Dmytro Loiko |
| Úloha 2 | Zberač dokumentácie z internetu a dataset | Viacheslav Kolesnikov |
| Úloha 3 | Agenti profilu (extraktor, kritik, tvorca otázok) | Hlib Dorosh |
| Úloha 4 | Orchestrátor, skilly, príkazový riadok a report | Ivan Yachmenov |
| Úloha 5 | Požiadavky, riziká, testovanie modelu a meranie kvality | Ihor Shpetun |

## Cieľ týždňa

Za jeden týždeň poskladáme z existujúcich nástrojov prvú, hrubú, ale úplnú verziu systému a prejdeme ňou aspoň jeden AI model od vstupu až po hotový report. Nejde zatiaľ o kvalitu výsledkov, ale o to, aby celý reťazec fungoval od začiatku do konca. Potom ho budeme testovať a zlepšovať po častiach.

**Čo systém robí:** používateľ zadá model, ktorý je už stiahnutý na serveri, a jeho názov. Systém podľa názvu vyhľadá na povolených weboch dokumentáciu modelu (model card, článok, repozitár), uloží ju a vyberie z nej informácie. Zároveň preskúma súbory modelu na serveri a model otestuje. Z toho vyplní štruktúrovaný „dotazník“ o modeli (profil), pri každej odpovedi uvedie, odkiaľ ju má, posúdi riziká a splnenie požiadaviek (napr. EU AI Act) a vypíše report s odporúčaniami.

Z internetu sa berie **iba dokumentácia**. Samotné modely sú na serveri a testujeme tie, ktoré tam už sú.

---

## Slovník: čo znamenajú pojmy

- **Testovaný model** je AI model, ktorý hodnotíme (napr. Mistral-7B). Nie je to model, ktorý používa náš systém na prácu.
- **Jazykový model (LLM) systému** je lokálny model, ktorý náš systém používa na čítanie textu a odpovedanie. Beží v programe `llama-server` (z projektu llama.cpp) na našom serveri; žiadna platená služba na internete sa nevolá. Máme dva: **hlavný model** (väčší, plánuje) a **malý model** (rýchly, rieši drobné úlohy).
- **Prompt** je text, ktorý pošleme jazykovému modelu: inštrukcia, čo má urobiť, plus podklady.
- **JSON schéma** predpisuje presný tvar odpovede modelu, napr. `{"hodnota": text, "istota": číslo 0 až 1}`. Vďaka nej vieme odpoveď spracovať programom a nie je to voľný text.
- **Model card** je popis modelu od jeho autorov (README na Hugging Face): na čo je model určený, na čom bol trénovaný, aké má obmedzenia.
- **Profil** je výsledný „dotazník“ o testovanom modeli: približne 25 otázok (licencia, trénovacie dáta, formát súborov, bezpečnosť…) a odpovede na ne. Zoznam otázok vychádza z 21 atribútov v kapitole 6 dokumentácie.
- **Zdroj** je jeden podklad, z ktorého čerpáme: model card, PDF článok, súbor `config.json`, stránka z webu, odpoveď používateľa alebo výsledok testu.
- **Dôkaz** je krátky úryvok zo zdroja (niekoľko viet) spolu s presným miestom, odkiaľ pochádza: súbor alebo URL, sekcia, riadky. Celú dokumentáciu rozsekáme na takéto úryvky.
- **Tvrdenie** je jedna vyplnená odpoveď v profile: napr. „licencia = Apache-2.0“, k tomu stav (`uvedené` = priamo napísané, `odvodené` = vyvodené, `chýbajúce` = nenašlo sa, `rozporné` = zdroje si odporujú), istota (0 až 1) a odkaz na dôkaz, z ktorého vychádza.
- **Embedding** je zoznam čísel, ktorý vyjadruje význam úryvku textu. Texty s podobným významom majú podobné čísla. Vďaka tomu vieme k otázke „aká je licencia?“ rýchlo nájsť úryvky, ktoré o licencii hovoria, aj keď neobsahujú presne to isté slovo. Ukladáme ich do databázy PostgreSQL s rozšírením **pgvector**, ktoré vie takto vyhľadávať.
- **Agent** je malý program, ktorý rieši jeden druh úlohy (napr. „vyplň jednu otázku profilu“). Vo vnútri pripraví prompt, zavolá jazykový model a výsledok uloží do databázy.
- **Skill** je „recept“ pre agenta uložený ako súbor: opis, prompt (šablóna inštrukcie), JSON schéma odpovede a zoznam nástrojov, ktoré smie použiť. Ten istý agent s iným skillom robí inú prácu.
- **Orchestrátor** je riadiaci program. Pozrie sa, čo v profile chýba, nechá hlavný model naplánovať ďalšie kroky a rozdelí ich agentom.
- **Kontajner** je izolované prostredie (Docker alebo Podman), v ktorom beží jedna časť systému. Celý systém sa tak spustí jedným príkazom na ľubovoľnom počítači.
- **Statickí agenti** bežia stále (extraktor, kritik, hodnotiteľ, analytik rizík). **Dynamickí agenti** sa spúšťajú iba vtedy, keď sú potrební (zberač, tester, analytik artefaktov, tvorca otázok).
- **Whitelist** je zoznam povolených webov (huggingface.co, github.com, arxiv.org, nist.gov). Iné stránky systém neotvorí.

---

## Spoločná databáza (platí pre všetky úlohy)

Všetky časti systému si dáta odovzdávajú iba cez túto databázu. Každý píše a číta presne tieto tabuľky a stĺpce; zmenu treba ohlásiť celému tímu. Tabuľky vychádzajú z diagramu tried v kapitole 5 (obrázok 4). Tabuľky vytvorí úloha 1 hneď na začiatku týždňa.

| Tabuľka | Stĺpce | Čo obsahuje |
|---|---|---|
| `profil` | `id`, `model_nazov`, `model_cesta`, `vytvoreny`, `stav_auditu` (`bezi` / `caka_na_odpoved` / `hotovy`) | jeden audit jedného modelu |
| `zdroj` | `id`, `profil_id`, `typ` (`model_card` / `clanok` / `repozitar` / `subor_modelu` / `web` / `odpoved` / `test`), `adresa` (URL alebo cesta), `ziskane` (čas), `subor_cesta` (kde je uložená kópia) | jeden stiahnutý alebo nahratý podklad |
| `dokaz` | `id`, `zdroj_id`, `uryvok` (text), `poloha` (sekcia, riadky alebo strana), `embedding` (vektor pgvector) | úryvok zo zdroja |
| `otazka_profilu` | `kluc` (napr. `license_and_restrictions`), `nazov`, `oblast`, `typ_hodnoty`, `priorita`, `kde_hladat` (`dokumentacia` / `subory` / `test`) | zoznam ~25 otázok profilu, načítaný zo súboru `otazky_profilu.yaml` |
| `tvrdenie` | `id`, `profil_id`, `kluc` (→ `otazka_profilu`), `hodnota` (text alebo JSON), `stav` (`uvedene` / `odvodene` / `chybajuce` / `rozporne`), `istota` (0 až 1), `overene_kritikom` (áno/nie), `pokusy`, `dovod_zamietnutia` | odpoveď na jednu otázku profilu |
| `tvrdenie_dokaz` | `tvrdenie_id`, `dokaz_id` | ktoré úryvky dokladajú tvrdenie (jedno tvrdenie môže mať viac úryvkov a naopak) |
| `poziadavka` | `id`, `ramec` (`EU AI Act` / `FMTI` / …), `identifikator`, `znenie`, `potrebne_kluce` (zoznam otázok profilu) | katalóg požiadaviek |
| `hodnotenie` | `id`, `profil_id`, `poziadavka_id`, `vysledok` (`splnene` / `ciastocne` / `nesplnene` / `nedostatok_dokazov`), `istota`, `zdovodnenie`, `overene_kritikom` | posúdenie jednej požiadavky |
| `hodnotenie_tvrdenie` | `hodnotenie_id`, `tvrdenie_id` | o ktoré tvrdenia sa hodnotenie opiera |
| `riziko` | `id`, `profil_id`, `zdroj_taxonomie` (`OWASP` / `ATLAS`), `kategoria`, `opis`, `zavaznost` (`nizka` / `stredna` / `vysoka`), `odporucanie`, `overene_kritikom` | jedno riziko modelu |
| `riziko_dokaz` | `riziko_id`, `dokaz_id` | dôkazy k riziku |
| `otazka_pouzivatelovi` | `id`, `profil_id`, `kluc`, `text`, `odpoved`, `odpoved_zdroj_id` | doplňujúca otázka a odpoveď používateľa |
| `skill` | `nazov`, `opis`, `model` (`hlavny` / `maly`), `prompt`, `schema` (JSON), `nastroje`, `experimentalny` | register skillov, načítaný zo súborov v priečinku `skills/` |
| `uloha` | `id`, `profil_id`, `agent`, `skill`, `kluc`, `vstup` (JSON), `stav` (`nova` / `bezi` / `hotova` / `chyba`), `vystup` (JSON) | podúlohy, ktoré orchestrátor zadáva agentom |
| `log_llm` | `id`, `uloha_id`, `model`, `prompt`, `odpoved`, `cas`, `trvanie_ms` | každé volanie jazykového modelu (na ladenie) |

**Ako spolu časti komunikujú:** orchestrátor zapíše podúlohu do tabuľky `uloha` so stavom `nova`. Agent si ju vezme, nastaví `bezi`, urobí prácu, zapíše výsledky do príslušných tabuliek (napr. `tvrdenie` a `tvrdenie_dokaz`) a úlohu prepne na `hotova`. Kým niektorá časť nie je hotová, dá sa nahradiť jednoduchým skriptom, ktorý do týchto tabuliek zapíše vymyslené údaje v správnom tvare. Tak môže každý pracovať nezávisle.

---

## Úloha 1: Platforma, databáza a spracovanie dokumentov

**Prečo:** všetci ostatní potrebujú bežiacu databázu, jazykový model a úryvky dokumentácie. Táto úloha musí byť použiteľná ako prvá.

**Postup:**
1. Založiť repozitár kódu (napr. Python), dohodnúť štruktúru priečinkov (`agents/`, `skills/`, `db/`, `cli/`).
2. Napísať `compose` súbor, ktorý spustí PostgreSQL s pgvector (hotový obraz `pgvector/pgvector`), `llama-server` s hlavným a malým modelom z modelov na serveri, model na embeddingy a kontajner aplikácie. Overiť, že ide spustiť jedným príkazom.
3. Napísať SQL skript s tabuľkami podľa sekcie **Spoločná databáza** a malý modul s funkciami na zápis a čítanie (aby nikto nepísal SQL ručne inak).
4. Napísať spoločnú funkciu `zavolaj_model(model, prompt, schema)`: pošle požiadavku na `llama-server` (má rozhranie kompatibilné s OpenAI), obmedzí výstup na JSON schému, pri neplatnej odpovedi skúsi znova a zapíše všetko do `log_llm`.
5. Spracovanie dokumentov: funkcia, ktorá dostane zdroj, cez Docling ho rozdelí na úryvky po sekciách alebo odsekoch, ku každému vypočíta embedding a zapíše do `dokaz`. Model card treba spracovať aj s jej hlavičkou (YAML: licencia, jazyk, základný model).
6. Funkcia `najdi_uryvky(profil_id, otazka, k)`: vypočíta embedding otázky a cez pgvector vráti k najpodobnejších úryvkov daného profilu.
7. **Analytik artefaktov** (obyčajný program, bez jazykového modelu): prejde súbory modelu na serveri a zistí formát váh (podľa prípon a hlavičiek súborov), haše, údaje z `config.json` (architektúra, dĺžka kontextu, `auto_map` = vlastný kód) a z `tokenizer_config.json` (tokeny na volanie nástrojov). Spustí ModelScan na kontrolu škodlivého kódu v pickle súboroch. Každý nález zapíše ako zdroj typu `subor_modelu` a dôkaz; kde sa dá, rovno vytvorí tvrdenie so stavom `uvedene`. Beží bez prístupu na internet.

**Hotové je,** keď sa systém spustí jedným príkazom, pre model na serveri sú v databáze nálezy zo súborov a pre ľubovoľný dokument úryvky s polohou, a vyhľadanie k otázke „aká je licencia?“ vráti úryvok o licencii.

## Úloha 2: Zberač dokumentácie z internetu a dataset

**Prečo:** dokumentácia modelov je na webe, nie na serveri. Zberač ju podľa názvu modelu nájde na povolených weboch, uloží a odovzdá na spracovanie. Bez neho by sme mali iba súbory modelu.

**Postup:**
1. Nastaviť proxy (napr. Squid) ako jedinú cestu na internet, s povolenými doménami huggingface.co, github.com, arxiv.org a nist.gov. Overiť, že iná stránka sa neotvorí.
2. **Hugging Face:** podľa názvu modelu stiahnuť stránku modelu: model card (README), `config.json`, `tokenizer_config.json`, zoznam súborov a odkazy na článok a repozitár, ktoré sú v model card. Ak názov nie je presný, nájsť kandidátov a ponúknuť používateľovi tri na výber. Prednosť majú oficiálne účty vývojárov.
3. **GitHub:** ak model card odkazuje na repozitár, stiahnuť README a LICENSE.
4. **arXiv:** ak model card odkazuje na článok, stiahnuť jeho PDF.
5. Každý stiahnutý dokument uložiť ako súbor do lokálnej kópie (aby opakovaný audit nepotreboval internet), zapísať do tabuľky `zdroj` (typ, URL, čas) a zavolať spracovanie z úlohy 1, ktoré ho rozdelí na úryvky. Zdroje mimo oficiálneho účtu vývojára označiť ako neoverené.
6. **Cielené dohľadanie:** napísať skill pre malý model, ktorý pre chýbajúcu otázku profilu (napr. trénovacie dáta) navrhne, kde ešte hľadať (ďalšia sekcia, odkaz v článku, súbor v repozitári). Zberač to stiahne rovnakým postupom.
7. **Dataset:** zo zoznamu modelov, ktoré sú na serveri, vybrať tie, na ktorých budeme systém skúšať (s dobrou aj slabou dokumentáciou, rôzne formáty váh). Pre dva z nich ručne vyplniť profil podľa `otazky_profilu.yaml` (odpoveď a URL alebo súbor, kde sme ju našli) ako vzor na porovnanie.

**Hotové je,** keď pre model zadaný názvom sú v databáze jeho model card, súvisiaci článok a repozitár rozdelené na úryvky s URL, a dva vzorové profily sú hotové.

## Úloha 3: Agenti profilu (extraktor, kritik, tvorca otázok)

**Prečo:** toto je jadro systému. Z úryvkov dokumentácie a nálezov zo súborov vzniká profil, a každá odpoveď musí byť podložená, inak je report bezcenný.

**Postup:**
1. Napísať spolu s úlohou 1 súbor `otazky_profilu.yaml`: približne 25 otázok (základ je 21 atribútov z kapitoly 6), pri každej kľúč, zrozumiteľnú otázku, oblasť a kde ju hľadať.
2. Napísať **univerzálny program agenta**: vezme podúlohu z tabuľky `uloha`, načíta skill, doplní do šablóny promptu podklady, zavolá `zavolaj_model`, skontroluje výsledok a zapíše ho do databázy. Všetci agenti v systéme budú tento program s iným skillom.
3. **Skill extraktora** (`skills/extrakcia_pola.yaml`): prompt dostane jednu otázku profilu, 5 až 8 úryvkov z `najdi_uryvky` a nálezy analytika artefaktov. Pravidlá v prompte: odpovedaj iba z úryvkov; uveď ID úryvkov; ak odpoveď nie je, vráť `chybajuce`; ak si úryvky a súbory odporujú, platia súbory a stav je `rozporne`. Výsledok sa zapíše do `tvrdenie` a `tvrdenie_dokaz`.
4. **Skill kritika** (`skills/kontrola_tvrdenia.yaml`): prompt dostane tvrdenie a text citovaných úryvkov a odpovie `potvrdene` alebo `zamietnute` s dôvodom. Pri zamietnutí sa zvýši `pokusy` a extraktor dostane úlohu znova aj s dôvodom; po N pokusoch zostane tvrdenie neoverené.
5. **Skill tvorcu otázok** (`skills/otazka_pouzivatelovi.yaml`): pre tvrdenia `chybajuce` alebo `rozporne`, ktoré nedohľadal ani zberač, sformuluje zrozumiteľnú otázku do `otazka_pouzivatelovi`. Odpoveď používateľa sa uloží ako zdroj typu `odpoved` a extraktor otázku spracuje znova.
6. Ladiť prompty na jednom modeli a porovnávať so vzorovým profilom z úlohy 2. Verzie promptov držať v gite.

**Hotové je,** keď je pre jeden model vyplnený celý profil s odkazmi na úryvky a kritik zamietne aspoň niekoľko zámerne nesprávnych odpovedí, ktoré mu podstrčíme.

## Úloha 4: Orchestrátor, skilly, príkazový riadok a report

**Prečo:** orchestrátor spája všetky časti do jedného auditu. Rozhoduje, čo sa má urobiť ďalej a ktorý agent to urobí, a na konci vytvorí report.

**Postup:**
1. **Príkazový riadok:** `audit --model <cesta na serveri> --name <názov>` vytvorí riadok v `profil` a spustí audit; `answer` umožní odpovedať na otázky z `otazka_pouzivatelovi`; `report` vypíše report.
2. **Register skillov:** pri štarte načítať všetky súbory z `skills/` do tabuľky `skill`.
3. **Cyklus orchestrátora:**
   - zistiť stav profilu: ktoré otázky sú vyplnené a overené, ktoré chýbajú a ktoré kritik zamietol;
   - poslať hlavnému modelu prompt so stavom profilu a opismi skillov; model vráti plán v JSON, zoznam podúloh `{agent, skill, kluc}`, prípadne „spusti zberača“, „spusti testera“, „opýtaj sa používateľa“;
   - plán skontrolovať (existuje taký agent a skill?) a podúlohy zapísať do tabuľky `uloha`;
   - počkať, kým agenti úlohy dokončia, a opakovať;
   - skončiť, keď je profil úplný alebo sa minie limit pokusov, kôl alebo čas čakania na používateľa.

   Ako základ sa dá použiť knižnica smolagents (vie pracovať s `llama-server`) alebo jednoduchý vlastný cyklus.
4. Na začiatku auditu vždy spustiť zberača a analytika artefaktov, aby mal orchestrátor z čoho plánovať.
5. **Správca kontajnerov:** dynamických agentov (zberač, tester) spúšťať a zastavovať cez Docker alebo Podman, keď ich plán potrebuje. Statickí agenti môžu tento týždeň bežať ako funkcie v jednom procese.
6. **Generátor skillov (experiment):** ak hlavný model povie, že žiadny skill nevyhovuje, nechať ho napísať nový (opis, prompt, schému), vyskúšať ho na jednom príklade a ak výsledok prejde schémou a kritikom, uložiť ho. Dá sa vypnúť, aby sme porovnali výsledky s ním aj bez neho.
7. **Report** (Markdown):
   - profil s citáciou úryvku a URL alebo súborom ku každej odpovedi;
   - chýbajúce a rozporné údaje;
   - otvorené otázky;
   - riziká;
   - hodnotenie požiadaviek;
   - odporúčania, čo by mal autor modelu doplniť v dokumentácii a ktoré riziká zmierniť.
8. Kým ostatní agenti nie sú hotoví, pracovať s jednoduchými náhradami, ktoré do databázy zapíšu vymyslené údaje v správnom tvare.

**Hotové je,** keď jeden príkaz `audit` prevedie model celým postupom so skutočnými agentmi a vznikne report.

## Úloha 5: Požiadavky, riziká, testovanie modelu a meranie kvality

**Prečo:** samotný profil nestačí. Treba z neho vyvodiť, či model spĺňa požiadavky a aké má riziká, niektoré vlastnosti overiť testom priamo na modeli a vedieť zmerať, ako dobre systém funguje.

**Postup:**
1. **Katalóg požiadaviek:** z EU AI Act (príloha XI a článok 53, čo musí obsahovať dokumentácia AI modelu) a z indikátorov FMTI (index transparentnosti modelov) vybrať 10 až 20 požiadaviek; inšpirovať sa dá rámcom COMPL-AI. Zapísať ich do tabuľky `poziadavka` aj s tým, ktoré otázky profilu sú na posúdenie potrebné.
2. **Skill hodnotiteľa kritérií:** prompt dostane znenie požiadavky a príslušné tvrdenia z profilu a vráti `splnene` / `ciastocne` / `nesplnene` / `nedostatok_dokazov` so zdôvodnením. Výsledok do `hodnotenie` a `hodnotenie_tvrdenie`.
3. **Skill analytika rizík:** prompt dostane profil a skrátený zoznam rizík z OWASP Top 10 for LLM a MITRE ATLAS (verejné katalógy hrozieb pre AI) a vráti riziká so závažnosťou, odkazom na dôkaz a odporúčaním. Výsledok do `riziko` a `riziko_dokaz`.
4. **Tester:** spustí testovaný model zo servera v izolovanom kontajneri bez internetu (napr. cez `llama-server`) a pustí naň nástroj garak, ktorý skúša prompt injection, jailbreak a únik dát; neskôr prípadne PyRIT alebo Inspect AI. Súhrn výsledkov uloží ako zdroj typu `test` a dôkazy a vytvorí tvrdenia k otázkam profilu, ktoré v kapitole 6 vyžadujú test.
5. **Meranie kvality:** skript porovná profil od systému so vzorovými profilmi z úlohy 2 a vypočíta, koľko odpovedí je správnych, koľko odkazov na úryvky naozaj sedí a koľko odpovedí nemá oporu v dokumentácii (vymyslené). Bez týchto čísel nebudeme vedieť, či zmeny systém zlepšujú.

**Hotové je,** keď má jeden model vyhodnotený celý katalóg požiadaviek, zoznam rizík, výsledok testu nástrojom garak uložený ako dôkaz a tabuľku porovnania so vzorovým profilom.
