import { getCollection, type CollectionEntry } from 'astro:content';

export type Typ = 'veduci' | 'tim';

export const TYPY: Record<Typ, { nazov: string; kratky: string; popis: string; cesta: string }> = {
  veduci: {
    nazov: 'Stretnutia s vedúcim',
    kratky: 'S vedúcim',
    popis: 'Konzultácie s vedúcim projektu — zadanie, smerovanie, spätná väzba.',
    cesta: '/zapisnice/veduci/',
  },
  tim: {
    nazov: 'Tímové stretnutia',
    kratky: 'S tímom',
    popis: 'Interné stretnutia tímu — rozdelenie práce, priebežné výsledky, rozhodnutia.',
    cesta: '/zapisnice/tim/',
  },
};

export type Zapisnica = CollectionEntry<'zapisnice'> & { cislo: number };

/** Všetky zápisnice od najstaršej, s poradovým číslom v rámci svojho typu. */
export async function nacitajZapisnice(): Promise<Zapisnica[]> {
  const vsetky = (await getCollection('zapisnice')).sort((a, b) => a.data.datum.getTime() - b.data.datum.getTime());
  const pocitadlo: Record<string, number> = {};
  return vsetky.map((z) => {
    pocitadlo[z.data.typ] = (pocitadlo[z.data.typ] ?? 0) + 1;
    return { ...z, cislo: pocitadlo[z.data.typ] };
  });
}
