import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Zápisnice zo stretnutí: jeden súbor = jedno stretnutie, názov súboru = dátum (YYYY-MM-DD).
// Šablóna je v sablony/zapisnica.md (mimo kolekcie); súbory začínajúce podčiarkovníkom sa pre istotu ignorujú.
const zapisnice = defineCollection({
  loader: glob({ pattern: '[!_]*.md', base: './src/content/zapisnice' }),
  schema: z.object({
    typ: z.enum(['veduci', 'tim']).default('veduci'),
    datum: z.coerce.date(),
    cas: z.string().optional(),
    forma: z.string().optional(),
    pritomni: z.array(z.string()).default([]),
    zapisal: z.string().optional(),
    zhrnutie: z.string().optional(),
  }),
});

// Dokumenty: ponuka a ďalšie dokumenty, ktoré vzniknú počas projektu.
const dokumenty = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/dokumenty' }),
  schema: z.object({
    nazov: z.string(),
    popis: z.string().optional(),
    datum: z.coerce.date().optional(),
    pdf: z.string().optional(),
    poradie: z.number().default(100),
  }),
});

export const collections = { zapisnice, dokumenty };
