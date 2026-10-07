const MESIACE = [
  'januára', 'februára', 'marca', 'apríla', 'mája', 'júna',
  'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra',
];

/** 2026-09-27 → „27. septembra 2026" (dátumy z YAML sú v UTC, preto getUTC*) */
export function datumSk(d: Date): string {
  return `${d.getUTCDate()}. ${MESIACE[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** 2026-09-27 → „2026-09-27" */
export function datumIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
